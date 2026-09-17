// Fixed кнопка ИИ
// Переключение отображения окна чата
function toggleAiChat() {
    const windowEl = document.getElementById('ai-window');
    windowEl.classList.toggle('hidden');

    // Автофокус на поле ввода при открытии
    if (!windowEl.classList.contains('hidden')) {
        document.getElementById('ai-input').focus();
    }
}

// Добавление сообщения в контейнер чата
function appendMessage(text, sender) {
    const messagesContainer = document.getElementById('ai-messages');

    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-msg', sender);
    msgDiv.textContent = text;

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Отправка сообщения пользователем
function sendAiMessage(event) {
    event.preventDefault();

    const input = document.getElementById('ai-input');
    const userText = input.value.trim();

    if (!userText) return;
    appendMessage(userText, 'user');
    input.value = '';

    // Имитация ответа от бота (здесь потом подключается API)
    setTimeout(() => {
        appendMessage('Спасибо за вопрос! Скоро я подготовлю для вас ответ.', 'bot');
    }, 800);
}