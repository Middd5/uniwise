// ===== Бургер-меню для мобильных =====

function toggleMobileMenu() {
    const navbar = document.querySelector('.navbar');
    const burgerBtn = document.getElementById('burger-btn');
    if (!navbar) return;

    const isOpen = navbar.classList.toggle('menu-open');
    if (burgerBtn) burgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Закрываем меню при клике на любую ссылку внутри него
    navbar.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => navbar.classList.remove('menu-open'));
    });

    // Закрываем меню при клике вне шапки
    document.addEventListener('click', (e) => {
        if (navbar.classList.contains('menu-open') && !navbar.contains(e.target)) {
            navbar.classList.remove('menu-open');
        }
    });
});
