let isRegisterMode = true;

// 1. Открытие / Закрытие модалки
window.openAuth = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
};

window.closeAuth = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
};

// 2. Выпадающее меню пользователя
window.toggleUserDropdown = function(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        const isHidden = dropdown.style.display === 'none' || dropdown.classList.contains('hidden');
        dropdown.style.display = isHidden ? 'block' : 'none';
        dropdown.classList.toggle('hidden', !isHidden);
    }
};

// 3. Выход из аккаунта
window.logout = function() {
    const isConfirmed = confirm('Вы точно хотите выйти с аккаунта?');
    if (!isConfirmed) return;

    localStorage.removeItem('token');
    localStorage.removeItem('uniwise_user');

    const userChip = document.getElementById('user-chip');
    const authBtn = document.getElementById('auth-btn');
    const dropdown = document.getElementById('user-dropdown');

    if (userChip) {
        userChip.classList.add('hidden');
        userChip.style.display = 'none';
    }
    if (authBtn) {
        authBtn.classList.remove('hidden');
        authBtn.style.display = 'inline-block';
    }
    if (dropdown) {
        dropdown.style.display = 'none';
        dropdown.classList.add('hidden');
    }
};

// 4. Переключение режимов Регистрация <-> Вход
window.toggleAuthMode = function(event) {
    if (event) event.preventDefault();
    isRegisterMode = !isRegisterMode;

    const title = document.getElementById('modal-title');
    const nameGroup = document.getElementById('name-group');
    const submitBtn = document.getElementById('auth-submit-btn');
    const switchText = document.getElementById('auth-switch-text');
    const switchLink = document.getElementById('auth-switch-link');

    if (isRegisterMode) {
        if (title) title.textContent = 'Создай аккаунт UniWise';
        if (nameGroup) nameGroup.style.display = 'block';
        if (submitBtn) submitBtn.textContent = 'Зарегистрироваться';
        if (switchText) switchText.textContent = 'Уже есть аккаунт?';
        if (switchLink) switchLink.textContent = 'Войти';
    } else {
        if (title) title.textContent = 'Вход в UniWise';
        if (nameGroup) nameGroup.style.display = 'none';
        if (submitBtn) submitBtn.textContent = 'Войти';
        if (switchText) switchText.textContent = 'Ещё нет аккаунта?';
        if (switchLink) switchLink.textContent = 'Зарегистрироваться';
    }
};

// 5. Отправка формы на бэкенд Node.js
window.handleAuthSubmit = async function(event) {
    event.preventDefault();

    const emailEl = document.getElementById('auth-email');
    const passwordEl = document.getElementById('auth-password');
    const nameEl = document.getElementById('auth-name');

    const email = emailEl ? emailEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value.trim() : '';

    if (isRegisterMode && (!nameEl || !nameEl.value.trim())) {
        alert('Пожалуйста, введите ваше имя');
        return;
    }

    const bodyData = { email, password };
    if (isRegisterMode && nameEl) {
        bodyData.name = nameEl.value.trim();
    }

    const endpoint = isRegisterMode ? '/api/register' : '/api/login';

    try {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('uniwise_user', JSON.stringify(data.user));

            updateUIForAuth(data.user);
            event.target.reset();
            window.closeAuth();
        } else {
            alert(data.error || 'Ошибка авторизации');
        }
    } catch (err) {
        console.error('Ошибка сети:', err);
        alert('Сервер недоступен. Проверь, запущен ли node server.js');
    }
};

// 6. Обновление UI
function updateUIForAuth(user) {
    const userChip = document.getElementById('user-chip');
    const authBtn = document.getElementById('auth-btn');

    if (userChip && authBtn) {
        userChip.textContent = user.name || user.email;
        userChip.classList.remove('hidden');
        userChip.style.display = 'inline-block';
        authBtn.classList.add('hidden');
        authBtn.style.display = 'none';
    }
}

// 7. Инициализация и слушатели кликов
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('uniwise_user');
    if (savedUser) {
        try {
            updateUIForAuth(JSON.parse(savedUser));
        } catch (e) {
            console.error('Ошибка сессии', e);
        }
    }

    // Закрытие выпадающего меню и модалки при клике мимо
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('auth-modal');
        const dropdown = document.getElementById('user-dropdown');
        const userChip = document.getElementById('user-chip');

        if (modal && e.target === modal) {
            window.closeAuth();
        }
        if (dropdown && !dropdown.contains(e.target) && e.target !== userChip) {
            dropdown.style.display = 'none';
            dropdown.classList.add('hidden');
        }
    });
});