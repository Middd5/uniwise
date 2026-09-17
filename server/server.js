const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

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

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));