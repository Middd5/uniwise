const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // npm i @google/generative-ai
require('dotenv').config();

const app = express();

// ---------- CORS ----------
// В деве можно оставить open cors(), но для продакшена лучше явно
// перечислить адреса фронтенда, которые могут стучаться к API.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,http://localhost:63342')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: function (origin, callback) {
        // разрешаем запросы без Origin (например, curl/Postman) и из списка
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// ---------- Gemini ----------
// КЛЮЧ ЖИВЁТ ТОЛЬКО ЗДЕСЬ, В .env НА СЕРВЕРЕ. Никогда не передавай его во фронтенд.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chatModel = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

// Регистрация
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email;';
        const result = await pool.query(query, [name, email, passwordHash]);

        const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, user: result.rows[0], token });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Email уже зарегистрирован' });
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Авторизация (Вход)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'Неверный email или пароль' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Неверный email или пароль' });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email }, token });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Проверка сессии (Данные пользователя)
app.get('/api/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Нет доступа' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.userId]);
        res.json(result.rows[0]);
    } catch {
        res.status(403).json({ error: 'Невалидный токен' });
    }
});

// ---------- ИИ-чат ----------
app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    }

    try {
        // Системный промпт: задаём роль ассистента по поступлению
        const systemInstruction = `Ты — ИИ-ассистент UniWise, помогаешь абитуриентам с поступлением в
университеты Канады: шансы на поступление, стипендии, визовые вопросы, эссе.
Отвечай кратко, по делу, на русском языке.`;

        // Переводим историю в формат Gemini (role: 'user' | 'model')
        const formattedHistory = Array.isArray(history)
            ? history.map(h => ({
                role: h.role === 'model' ? 'model' : 'user',
                parts: [{ text: h.text }]
            }))
            : [];

        const chat = chatModel.startChat({
            history: formattedHistory,
            systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
        });

        const result = await chat.sendMessage(message);
        const reply = result.response.text();

        res.json({ success: true, reply });
    } catch (err) {
        console.error('Ошибка Gemini API (chat):', err);
        res.status(500).json({ error: 'Не удалось получить ответ от ИИ. Попробуйте позже.' });
    }
});

// ---------- Генерация карточки университета ----------
app.post('/api/university-card', async (req, res) => {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Не указан запрос для подбора университета' });
    }

    try {
        const prompt = `Подбери один подходящий университет в Канаде под запрос: "${query}".
Верни ТОЛЬКО валидный JSON без markdown-разметки и без пояснений, строго в формате:
{
  "name": "Название университета",
  "rank": "Краткий рейтинг, например '#1 в Канаде'",
  "image": "URL картинки (можно с unsplash.com)",
  "desc": "Описание в 1-2 предложения",
  "majors": ["cs" | "biz" | "eng"],
  "stats": { "ielts": "6.5+", "gpa": "3.5 / 4.0", "tuition": "$30k - $45k" },
  "details": { "docs": "какие документы нужны", "activities": "какие активности ценятся" },
  "deadline": "дата дедлайна",
  "link": "официальный сайт университета"
}`;

        const result = await chatModel.generateContent(prompt);
        let rawText = result.response.text().trim();

        // На случай если модель всё же обернёт ответ в ```json ... ```
        rawText = rawText.replace(/^```json\s*|```$/g, '').trim();

        let uniData;
        try {
            uniData = JSON.parse(rawText);
        } catch (parseErr) {
            console.error('Не удалось распарсить JSON от Gemini:', rawText);
            return res.status(502).json({ error: 'ИИ вернул некорректный формат данных' });
        }

        res.json(uniData);
    } catch (err) {
        console.error('Ошибка Gemini API (university-card):', err);
        res.status(500).json({ error: 'Не удалось сгенерировать карточку университета' });
    }
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
