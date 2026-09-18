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

// 2. Dropdown выбора направлении
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown-options');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Закрытие списка при клике в любую другую область экрана
document.addEventListener('click', function(event) {
    const select = document.querySelector('.custom-multiselect');
    if (select && !select.contains(event.target)) {
        const dropdown = document.getElementById('dropdown-options');
        if (dropdown) dropdown.classList.remove('show');
    }
});

// Обновление текста и запись значений в hidden input
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

    // Сохраняем значения в скрытом поле для отправки формы
    if (hiddenInput) {
        hiddenInput.value = selectedValues.join(', ');
    }
}

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