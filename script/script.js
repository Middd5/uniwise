// Smooth scroll
document.addEventListener('DOMContentLoaded', () => {
    // Находим все ссылки, у которых href начинается с #
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // Игнорируем пустые ссылки типа href="#"
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Отменяем стандартное поведение (изменение URL в адресной строке)
                e.preventDefault();

                // Плавный скролл к нужному блоку
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// 1. Быстрый расчет шансов в форме первого экрана
document.getElementById('quick-calc-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const ielts = parseFloat(document.getElementById('calc-ielts').value);
    const gpa = parseFloat(document.getElementById('calc-gpa').value);
    const resultDiv = document.getElementById('quick-result');

    resultDiv.classList.remove('hidden');
    
    let chance = "Средний";
    if (ielts >= 7.0 && gpa >= 4.5) {
        chance = "Высокий (75-90%)";
    } else if (ielts < 6.5 || gpa < 3.8) {
        chance = "Требуется подтянуть баллы (30-50%)";
    } else {
        chance = "Хороший (60-75%)";
    }

    resultDiv.innerHTML = `<strong>Результат экспресс-анализа:</strong><br>Твой средний шанс поступления в Канаду: <span>${chance}</span>. Пройди полную анкету ниже.`;
});

// 2. Form
// Одиночный выбор (Single-select с radio)
function toggleSingleSelect(selectBoxElement) {
    const parentContainer = selectBoxElement.closest('.custom-select');

    // Закрываем все остальные открытые одиночные списки
    document.querySelectorAll('.custom-select.open').forEach(el => {
        if (el !== parentContainer) el.classList.remove('open');
    });

    // Закрываем мультиселект, если он открыт
    const multiselectDropdown = document.getElementById('dropdown-options');
    if (multiselectDropdown) multiselectDropdown.classList.remove('show');

    parentContainer.classList.toggle('open');
}

function handleRadioSelect(radioInput, hiddenInputId) {
    const parentContainer = radioInput.closest('.custom-select');
    const placeholderSpan = parentContainer.querySelector('.select-placeholder');
    const hiddenInput = document.getElementById(hiddenInputId);

    // Берем текст из data-label или из текста label
    const labelText = radioInput.dataset.label || radioInput.closest('label').textContent.trim();

    if (placeholderSpan) {
        placeholderSpan.textContent = labelText;
        placeholderSpan.style.color = '#1e293b';
    }

    if (hiddenInput) {
        hiddenInput.value = radioInput.value;
    }

    parentContainer.classList.remove('open');
}

// Множественный выбор (Multi-select с checkbox)
function toggleDropdown() {
    // Закрываем все открытые single-select перед открытием мультиселекта
    document.querySelectorAll('.custom-select.open').forEach(el => el.classList.remove('open'));

    const dropdown = document.getElementById('dropdown-options');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function updateSelection() {
    const checkboxes = document.querySelectorAll('#dropdown-options input[type="checkbox"]:checked');
    const selectedValues = Array.from(checkboxes).map(cb => cb.value);

    const placeholder = document.getElementById('select-placeholder');
    const hiddenInput = document.getElementById('form-activities');

    if (selectedValues.length === 0) {
        if (placeholder) {
            placeholder.textContent = 'Выберите направления...';
            placeholder.style.color = '#94a3b8';
        }
    } else {
        if (placeholder) {
            placeholder.textContent = selectedValues.join(', ');
            placeholder.style.color = '#1e293b';
        }
    }

    if (hiddenInput) {
        hiddenInput.value = selectedValues.join(', ');
    }
}

// Закрытие ВСЕХ списков при клике вне их области
document.addEventListener('click', function(event) {
    // Закрываем single-select
    if (!event.target.closest('.custom-select')) {
        document.querySelectorAll('.custom-select.open').forEach(el => el.classList.remove('open'));
    }

    // Закрываем multi-select
    const multiselect = event.target.closest('.custom-multiselect');
    if (!multiselect) {
        const dropdown = document.getElementById('dropdown-options');
        if (dropdown) dropdown.classList.remove('show');
    }
});

// 3. Симуляция генерации 3 университетов после заполнения анкеты
function generateRecommendations() {
    const recSection = document.getElementById('recommendations');
    recSection.classList.remove('hidden');
    
    // Плавный скролл к блоку рекомендаций
    recSection.scrollIntoView({ behavior: 'smooth' });
}

// Функция для кнопок-подсказок (отправляет вопрос сразу при клике)
function askAi(questionText) {
    const input = document.getElementById('ai-input');
    input.value = questionText;

    // Вызываем отправку формы
    const form = document.querySelector('.ai-window-form');
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

// 5. FAQ
function toggleFaq(button) {
    const currentItem = button.parentElement;
    const isOpen = currentItem.classList.contains('open');

    // Закрываем все открытые вопросы и сбрасываем атрибуты
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('open');
        const btn = item.querySelector('.faq-q');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    });

    // Если нажатый вопрос был закрыт — открываем его
    if (!isOpen) {
        currentItem.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
    }
}

// 6. Обработка отправки анкеты
document.addEventListener('DOMContentLoaded', () => {
    // Находим форму, в которой находится сама кнопка
    const submitBtn = document.querySelector('.form-submit-btn');
    const assessmentForm = submitBtn ? submitBtn.closest('form') : null;

    if (assessmentForm) {
        assessmentForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Жестко блокируем перезагрузку страницы

            // Показываем слайдер с рекомендациями
            generateRecommendations();

            // Сохраняем прогресс анкеты
            localStorage.setItem('uniwise_form_data', 'true');

            // Обновляем дашборд, если логика профиля подключена
            const savedUser = localStorage.getItem('uniwise_user');
            if (savedUser && typeof updateDashboardState === 'function') {
                updateDashboardState(true, true);
            }
        });
    }
});

let currentSlide = 0;
let autoSlideInterval = null;

function getSlideCount() {
    const track = document.getElementById('slider-track');
    return track ? track.children.length : 0;
}

function updateSlider() {
    const track = document.getElementById('slider-track');
    const counter = document.getElementById('slider-counter');
    const totalSlides = getSlideCount();

    if (!track || totalSlides === 0) return;

    // Сдвигаем трек на нужный слайд
    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    // Обновляем счетчик (например, "1 / 5")
    if (counter) {
        counter.textContent = `${currentSlide + 1} / ${totalSlides}`;
    }

    // Обновляем состояние точек-индикаторов
    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function nextSlide() {
    const totalSlides = getSlideCount();
    if (totalSlides === 0) return;
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlider();
    resetAutoSlide();
}

function prevSlide() {
    const totalSlides = getSlideCount();
    if (totalSlides === 0) return;
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlider();
    resetAutoSlide();
}

function goToSlide(index) {
    currentSlide = index;
    updateSlider();
    resetAutoSlide();
}

// Генерация точек-индикаторов под слайдером
function initSliderDots() {
    const dotsContainer = document.getElementById('slider-dots');
    const totalSlides = getSlideCount();

    if (!dotsContainer || totalSlides === 0) return;

    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Перейти к слайду ${i + 1}`);
        dot.onclick = () => goToSlide(i);
        dotsContainer.appendChild(dot);
    }
}

// Автоматическое перелистывание каждые 10 секунд
function startAutoSlide() {
    stopAutoSlide();
    autoSlideInterval = setInterval(() => {
        const totalSlides = getSlideCount();
        if (totalSlides > 0) {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlider();
        }
    }, 10000);
}

function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
    }
}

function resetAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
}

// Модифицируем generateRecommendations для инициализации слайдера при показе
const originalGenerateRecommendations = window.generateRecommendations;
window.generateRecommendations = function() {
    const recSection = document.getElementById('recommendations');
    if (recSection) {
        recSection.classList.remove('hidden');

        // Инициализируем слайдер
        currentSlide = 0;
        initSliderDots();
        updateSlider();
        startAutoSlide();

        recSection.scrollIntoView({ behavior: 'smooth' });
    }
};

async function saveAssessment() {
    const token = localStorage.getItem('uniwise_token');
    if (!token) return; // Если пользователь не вошел, сохраняем локально

    const formData = {
        gpa: document.getElementById('calc-gpa')?.value || '',
        ielts: document.getElementById('calc-ielts')?.value || '',
        budget: document.getElementById('form-budget')?.value || '',
        interests: document.getElementById('form-activities')?.value || ''
    };

    try {
        await fetch('https://uniwise-d94v.onrender.com/api/assessment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
    } catch (err) {
        console.error('Ошибка сохранения анкеты:', err);
    }
}

document.addEventListener('click', function(e) {
    const submitBtn = e.target.closest('.form-submit-btn');
    if (!submitBtn) return;

    const form = submitBtn.closest('form');
    if (form) e.preventDefault();

    generateRecommendations();
    saveAssessment(); // <--- Добавляем сохранение на сервер

    localStorage.setItem('uniwise_form_data', 'true');
});

async function loadUserAssessment() {
    const token = localStorage.getItem('uniwise_token');
    if (!token) return;

    try {
        const response = await fetch('https://uniwise-d94v.onrender.com/api/assessment', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.hasAssessment) {
            localStorage.setItem('uniwise_form_data', 'true');
            if (typeof generateRecommendations === 'function') {
                generateRecommendations();
            }
        }
    } catch (err) {
        console.error('Ошибка загрузки анкеты:', err);
    }
}

// Запускаем проверку при загрузке страницы
document.addEventListener('DOMContentLoaded', loadUserAssessment);