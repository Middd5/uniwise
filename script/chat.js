// ===== UniWise AI Chat =====
const API_BASE = 'http://localhost:3000';

// Храним историю переписки для контекста Gemini
let chatHistory = [];

// 1. Парсер Markdown в HTML (убирает артефакты *, ** и верстает списки)
function parseMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/(?:^|\n)[*|-]\s+(.*)/g, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        .replace(/\n/g, '<br>');
}

// 2. Открытие / закрытие окна чата
function toggleAiChat(event) {
    if (event) event.stopPropagation();
    const windowEl = document.getElementById('ai-window');
    if (!windowEl) return;

    windowEl.classList.toggle('hidden');

    if (!windowEl.classList.contains('hidden')) {
        const input = document.getElementById('ai-input');
        if (input) input.focus();
    }
}

// 3. Добавление сообщения в чат с поддержкой Markdown для бота
function appendMessage(text, sender) {
    const messagesContainer = document.getElementById('ai-messages');
    if (!messagesContainer) return null;

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-msg', sender);

    if (sender === 'bot') {
        msgDiv.innerHTML = parseMarkdown(text);
    } else {
        msgDiv.textContent = text;
    }

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgDiv;
}

// 4. Добавление индикатора "печатает..."
function appendLoadingMessage() {
    const messagesContainer = document.getElementById('ai-messages');
    if (!messagesContainer) return null;

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-msg', 'bot', 'chat-msg-loading');
    msgDiv.id = 'chat-loader';
    msgDiv.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
    `;

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgDiv;
}

// 5. Переключение состояния блокировки формы
function setChatLoading(isLoading) {
    const input = document.getElementById('ai-input');
    const form = document.querySelector('.ai-window-form');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

    if (input) input.disabled = isLoading;
    if (submitBtn) submitBtn.disabled = isLoading;
}

// 6. Отправка сообщения пользователем
async function sendAiMessage(event) {
    if (event) event.preventDefault();

    const input = document.getElementById('ai-input');
    if (!input) return;

    const userText = input.value.trim();
    if (!userText) return;

    // 1. Отображаем сообщение юзера
    appendMessage(userText, 'user');
    input.value = '';

    // 2. Блокируем форму и показываем индикатор загрузки
    setChatLoading(true);
    const loadingEl = appendLoadingMessage();

    try {
        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userText,
                history: chatHistory
            })
        });

        if (!response.ok) {
            let errorMessage = `Ошибка сервера (${response.status})`;
            try {
                const errData = await response.json();
                if (errData && errData.error) errorMessage = errData.error;
            } catch (_) {}
            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.reply) {
            throw new Error('Пустой ответ от ИИ');
        }

        // 3. Выводим распарсенный ответ
        if (loadingEl) loadingEl.remove();
        appendMessage(data.reply, 'bot');

        // Сохраняем историю переписки
        chatHistory.push({ role: 'user', text: userText });
        chatHistory.push({ role: 'model', text: data.reply });

    } catch (err) {
        console.error('Ошибка ИИ-чата:', err);
        if (loadingEl) loadingEl.remove();

        const isNetworkError = err instanceof TypeError;
        const message = isNetworkError
            ? 'Не удалось связаться с сервером. Проверь, запущен ли бэкенд (node server.js) и доступен ли он по адресу ' + API_BASE
            : (err.message || 'Что-то пошло не так. Попробуй ещё раз.');

        appendMessage(message, 'bot');
    } finally {
        setChatLoading(false);
        input.focus();
    }
}

// 7. Кнопки-подсказки (быстрые вопросы)
function askAi(questionText) {
    const input = document.getElementById('ai-input');
    if (!input) return;

    input.value = questionText;
    const form = document.querySelector('.ai-window-form');
    if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
}

// 8. Инициализация глобальных функций и событий DOM
window.toggleAiChat = toggleAiChat;
window.sendAiMessage = sendAiMessage;
window.askAi = askAi;

document.addEventListener('DOMContentLoaded', () => {
    // Привязываем события открытия/закрытия
    const fabBtn = document.getElementById('ai-fab') || document.querySelector('.ai-fab');
    const closeBtn = document.getElementById('ai-close') || document.querySelector('.ai-close');

    if (fabBtn) fabBtn.onclick = toggleAiChat;
    if (closeBtn) closeBtn.onclick = toggleAiChat;

    // Привязываем отправку формы
    const form = document.querySelector('.ai-window-form');
    if (form) {
        form.addEventListener('submit', sendAiMessage);
    }

    // Слушатель для быстрых подсказок
    const suggestionBtns = document.querySelectorAll('.ai-suggestions button');
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => askAi(btn.textContent.trim()));
    });
});