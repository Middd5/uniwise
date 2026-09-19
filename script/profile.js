function getSavedUser() {
    const raw = localStorage.getItem('uniwise_user');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function getDemoPlan() {
    return {
        ielts: '6.5',
        gpa: '3.7',
        major: 'Computer Science',
        country: 'Канада',
        progress: 45,
        gaps: ['Не хватает 1 рекомендации', 'IELTS ниже цели на 0.5'],
        steps: [
            { title: 'Анкета заполнена', done: true },
            { title: 'Подготовка документов', done: true },
            { title: 'Сдача IELTS', done: false },
            { title: 'Подача заявки', done: false },
            { title: 'Получение оффера', done: false }
        ],
        applicationDeadline: '2027-01-15',
        deadlineEvents: [
            { date: '15 ноя', title: 'Сдать IELTS', desc: 'Финальная попытка перед подачей заявок', highlight: false },
            { date: '20 дек', title: 'Собрать документы', desc: 'Транскрипт, рекомендации, эссе', highlight: false },
            { date: '15 янв', title: 'Подать заявку', desc: 'Дедлайн University of Toronto', highlight: true },
            { date: 'март', title: 'Получить оффер', desc: 'Ожидаемая дата решения', highlight: false }
        ]
    };
}

// Универсальное переключение состояний (включая трекер дедлайнов)
function updateDashboardState(isLoggedIn, hasFormFilled) {
    const loginPrompt = document.getElementById('dash-login-prompt');
    const dashEmpty = document.getElementById('dash-empty');
    const dashGrid = document.getElementById('dash-grid');
    const dashDeadlines = document.getElementById('dash-deadlines');

    if (loginPrompt) loginPrompt.classList.add('hidden');
    if (dashEmpty) dashEmpty.classList.add('hidden');
    if (dashGrid) dashGrid.classList.add('hidden');
    if (dashDeadlines) dashDeadlines.classList.add('hidden');

    if (!isLoggedIn) {
        if (loginPrompt) loginPrompt.classList.remove('hidden');
    } else if (!hasFormFilled) {
        if (dashEmpty) dashEmpty.classList.remove('hidden');
    } else {
        if (dashGrid) dashGrid.classList.remove('hidden');
        if (dashDeadlines) dashDeadlines.classList.remove('hidden');
    }
}

function renderPlan(user, plan) {
    updateDashboardState(true, true);

    const name = user.name || user.email || 'Студент';
    document.getElementById('dash-avatar').textContent = name.charAt(0).toUpperCase();
    document.getElementById('dash-name').textContent = name;
    document.getElementById('dash-email').textContent = user.email || '';

    document.getElementById('dash-ielts').textContent = plan.ielts;
    document.getElementById('dash-gpa').textContent = plan.gpa;
    document.getElementById('dash-major').textContent = plan.major;
    document.getElementById('dash-country').textContent = plan.country;

    document.getElementById('plan-progress-fill').style.width = plan.progress + '%';
    document.getElementById('plan-progress-label').textContent = plan.progress + '% готовности плана';

    const gapsContainer = document.getElementById('plan-gaps');
    if (gapsContainer) {
        gapsContainer.innerHTML = plan.gaps.map(g => `<span>${g}</span>`).join('');
    }

    const timelineContainer = document.getElementById('plan-timeline');
    if (timelineContainer) {
        timelineContainer.innerHTML = plan.steps.map(step => `
            <li style="${step.done ? 'color: var(--ink-45); text-decoration: line-through;' : ''}">${step.title}</li>
        `).join('');
    }

    // Обратный отсчёт
    const deadline = new Date(plan.applicationDeadline);
    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
    const countdownEl = document.getElementById('plan-countdown');
    if (countdownEl) countdownEl.textContent = daysLeft + ' дн.';

    renderDeadlineTimeline(plan.deadlineEvents);
}

function renderDeadlineTimeline(events) {
    const container = document.getElementById('deadline-timeline');
    if (!container) return;

    container.innerHTML = events.map(ev => `
        <div class="timeline-item ${ev.highlight ? 'highlight' : ''}">
            <div class="time-badge">${ev.date}</div>
            <div class="time-content">
                <h4>${ev.title}</h4>
                <p>${ev.desc}</p>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const user = getSavedUser();

    if (!user) {
        updateDashboardState(false, false);
        return;
    }

    const hasPlan = true; // Заменишь на реальную проверку наличия анкеты

    if (!hasPlan) {
        updateDashboardState(true, false);
        return;
    }

    renderPlan(user, getDemoPlan());
});