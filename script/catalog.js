let allUniversities = [];

// 1. Загрузка данных из JSON
async function loadUniversities() {
    try {
        const response = await fetch('../data/universities.json'); // Проверь путь к файлу
        if (!response.ok) throw new Error('Ошибка загрузки JSON');

        allUniversities = await response.json();
        renderUniversities(allUniversities);
    } catch (error) {
        console.error('Не удалось загрузить каталог вузов:', error);
    }
}

// 2. Отрисовка карточек университетов
function renderUniversities(unis) {
    const container = document.getElementById('uni-grid');
    if (!container) return;

    container.innerHTML = unis.map(uni => `
        <div class="uni-card" data-major="${uni.majors.join(' ')}">
            <div class="uni-img-wrapper">
                <img src="${uni.image}" alt="${uni.name}">
                <span class="uni-rank">${uni.rank}</span>
            </div>
            <div class="uni-content">
                <h3>${uni.name}</h3>
                <p class="uni-desc">${uni.desc}</p>
                <div class="uni-stats">
                    <div><span>IELTS:</span> <strong>${uni.stats.ielts}</strong></div>
                    <div><span>GPA:</span> <strong>${uni.stats.gpa}</strong></div>
                    <div><span>Обучение:</span> <strong>${uni.stats.tuition}</strong></div>
                </div>
                <div class="uni-details">
                    <p><strong>Документы:</strong> ${uni.details.docs}</p>
                    <p><strong>Активности:</strong> ${uni.details.activities}</p>
                </div>
                <div class="uni-footer">
                    <span class="deadline-tag"><i class="fa-regular fa-clock"></i> Дедлайн: ${uni.deadline}</span>
                    <a href="${uni.link}" target="_blank" rel="noopener" class="link-btn">Оф. сайт ↗</a>
                </div>
            </div>
        </div>
    `).join('');
}

// 3. Исправленная фильтрация (передаем btn прямо из HTML: onclick="filterMajor('cs', this)")
function filterMajor(major, btn) {
    const cards = document.querySelectorAll('.uni-card');
    const buttons = document.querySelectorAll('.filter-btn');

    // Переключение активной кнопки
    buttons.forEach(b => b.classList.remove('active'));
    if (btn) {
        btn.classList.add('active');
    }

    // Фильтрация
    cards.forEach(card => {
        const majors = card.getAttribute('data-major') || '';
        // Используем split, чтобы избежать ложных срабатываний (например, 'cs' внутри 'biz_cs')
        const majorsArray = majors.split(' ');

        if (major === 'all' || majorsArray.includes(major)) {
            card.style.display = ''; // Сбрасываем к значению из CSS (flex/block)
        } else {
            card.style.display = 'none';
        }
    });
}

// Запуск подгрузки при загрузке страницы
document.addEventListener('DOMContentLoaded', loadUniversities);