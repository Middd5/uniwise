const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_uniwise';

// ---------- CORS ----------
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,http://localhost:63342,https://uniwise-d94v.onrender.com,https://middd5.github.io/uniwise')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''));

app.use(cors());
// app.use(cors({
//     origin: function (origin, callback) {
//         if (!origin) return callback(null, true);
//         const cleanOrigin = origin.replace(/\/$/, '');
//         if (allowedOrigins.includes(cleanOrigin) || process.env.NODE_ENV !== 'production') {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     }
// }));

app.use(express.json());

// ---------- Подключение к PostgreSQL ----------
// Поддержка подключения как по переменным DB_*, так и через DATABASE_URL от Render
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Обязательно для подключения к базы данных на Render
    }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'uniwise_db',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

// ---------- Автоматическое создание таблиц ----------
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_assessments (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                gpa VARCHAR(50),
                ielts VARCHAR(50),
                budget VARCHAR(100),
                interests TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Таблицы users и user_assessments готовы.');
    } catch (err) {
        console.error('❌ Ошибка инициализации PostgreSQL:', err);
    }
}
initDatabase();

// Сохранение анкеты текущего пользователя
app.post('/api/assessment', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { gpa, ielts, budget, interests } = req.body;

        const query = `
            INSERT INTO user_assessments (user_id, gpa, ielts, budget, interests)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const result = await pool.query(query, [decoded.userId, gpa, ielts, budget, interests]);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Ошибка сохранения анкеты:', err);
        res.status(403).json({ error: 'Невалидный токен или ошибка БД' });
    }
});

// Получение последней анкеты пользователя
app.get('/api/assessment', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Необходима авторизация' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const result = await pool.query(
            'SELECT * FROM user_assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.json({ hasAssessment: false });
        }

        res.json({ hasAssessment: true, assessment: result.rows[0] });
    } catch (err) {
        res.status(403).json({ error: 'Невалидный токен' });
    }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const chatModel = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

// ---------- Авторизация & Регистрация ----------

// Регистрация
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email;';
        const result = await pool.query(query, [name, email, passwordHash]);

        const token = jwt.sign({ userId: result.rows[0].id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, user: result.rows[0], token });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Email уже зарегистрирован' });
        console.error('Ошибка регистрации:', err);
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

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email }, token });
    } catch (err) {
        console.error('Ошибка авторизации:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Проверка сессии (Данные пользователя)
app.get('/api/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Нет доступа' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
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
        const systemInstruction = `Ты — ИИ-ассистент UniWise, помогаешь абитуриентам с поступлением в университеты Канады: шансы на поступление, стипендии, визовые вопросы, эссе. Отвечай кратко, по делу, на русском языке.`;

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
  "majors": ["cs", "biz", "eng"],
  "stats": { "ielts": "6.5+", "gpa": "3.5 / 4.0", "tuition": "$30k - $45k" },
  "details": { "docs": "какие документы нужны", "activities": "какие активности ценятся" },
  "deadline": "дата дедлайна",
  "link": "официальный сайт университета"
}`;

        const result = await chatModel.generateContent(prompt);
        let rawText = result.response.text().trim();

        // Очищаем результат от markdown блоков ```json ... ```
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

// Корневой эндпоинт для проверки статуса
app.get('/', (req, res) => {
    res.send('UniWise Backend Service is running');
});

// Запуск сервера
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));