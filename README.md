Вот полностью оформленная, красивая и наглядная документация для вашего проекта, выполненная строго в таком же стиле:
UniWise 🎓

    UniWise — это современный веб-сервис для абитуриентов, помогающий в подборе канадских университетов, оценке шансов на поступление, отслеживании дедлайнов и получении консультаций от встроенного ИИ-ассистента.

🚀 Основной функционал

    👤 Авторизация и сессии: Регистрация, вход и защита маршрутов с помощью JWT-токенов и хеширования паролей (bcrypt).

    📋 Персональная анкета: Автоматическое сохранение результатов тестирования, показателей (GPA, IELTS) и подборок вузов в PostgreSQL.

    🤖 ИИ-Консультант: Интерактивный чат на базе Google Gemini API для ответов на вопросы по поступающим документам, визам и стипендиям.

    🎴 Умный генератор карточек: Автоматическое формирование профилей и требований университетов по текстовому запросу.

    📊 Интерактивный дашборд: Синхронизация состояния интерфейса между клиентом и сервером в реальном времени.

🛠️ Технологический стек
Frontend

    Языки и технологии: HTML5, CSS3, JavaScript (ES6+ Vanilla JS)

    Взаимодействие с API: Fetch API, localStorage

Backend

    Сервер: Node.js, Express.js

    База данных: PostgreSQL (pg Connection Pool)

    Интеграция ИИ: Google Generative AI SDK (gemini-1.5-flash)

    Безопасность: bcrypt / bcryptjs, jsonwebtoken (JWT), cors, dotenv

Инфраструктура

    Хостинг фронтенда: GitHub Pages

    Хостинг бэкенда и СУБД: Render Web Service + Render PostgreSQL (EU Central, SSL-encrypted)

🗄️ Структура базы данных
SQL

-- Пользователи
CREATE TABLE users (
id SERIAL PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(255) UNIQUE NOT NULL,
password_hash VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Анкета и результаты подбора
CREATE TABLE user_assessments (
id SERIAL PRIMARY KEY,
user_id INT REFERENCES users(id) ON DELETE CASCADE,
gpa VARCHAR(50),
ielts VARCHAR(50),
budget VARCHAR(100),
interests TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

🛡️ Меры безопасности

    🔑 Хеширование паролей: Безопасное хранение паролей с использованием соли (bcrypt / 10 раундов).

    🔒 Шифрование данных: Подключение к PostgreSQL по TLS/SSL (ssl: { rejectUnauthorized: false }).

    🛡️ Защита от SQL-инъекций: Использование исключительного параметризованных запросов ($1, $2).

    🌐 CORS Настройка: Ограничение доступа к API только с разрешенных доменов (GitHub Pages / Localhost).

    🔐 Безопасность ключей: Изоляция чувствительных данных (GEMINI_API_KEY, JWT_SECRET, DATABASE_URL) в переменных окружения.

💻 Быстрый запуск
1. Клонирование и установка зависимостей
   Bash

# Клонируй репозиторий
git clone https://github.com/your-username/uniwise.git

# Перейди в папку проекта и установи пакеты
cd uniwise
npm install

2. Настройка переменных окружения

Создай файл .env в корневой папке сервера и добавь следующие параметры:
Фрагмент кода

PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/uniwise_db
JWT_SECRET=super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
CORS_ORIGINS=http://localhost:5500,https://your-username.github.io

3. Запуск сервера
   Bash

# Локальный запуск
npm start