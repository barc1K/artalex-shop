// ==================== БУРГЕР-МЕНЮ ==================== 
// Файл: burger-menu.js
// Используется на: всех страницах

class BurgerMenu {
    constructor() {
        this.burgerMenu = document.querySelector('.burger-menu');
        this.mobileNav = document.querySelector('.mobile-nav');
        this.overlay = document.querySelector('.overlay');
        this.burgerSpans = document.querySelectorAll('.burger-menu span');
        
        this.init();
    }
    
    init() {
        if (!this.burgerMenu || !this.mobileNav || !this.overlay) {
            console.warn('Элементы бургер-меню не найдены на странице');
            return;
        }
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Обработчик клика по бургер-меню
        this.burgerMenu.addEventListener('click', () => this.toggleMenu());
        
        // Закрытие меню при клике на оверлей
        this.overlay.addEventListener('click', () => this.closeMenu());
        
        // Закрытие меню при клике на любую ссылку внутри него
        const mobileNavLinks = document.querySelectorAll('.mobile-nav a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });
        
        // Закрытие меню при изменении размера окна (для адаптивности)
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.mobileNav.classList.contains('active')) {
                this.closeMenu();
            }
        });
    }
    
    toggleMenu() {
        this.mobileNav.classList.toggle('active');
        this.overlay.classList.toggle('active');
        this.burgerMenu.classList.toggle('active');
        
        // Анимация иконки бургера в "крестик"
        if (this.burgerMenu.classList.contains('active')) {
            if (this.burgerSpans.length >= 3) {
                this.burgerSpans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                this.burgerSpans[1].style.opacity = '0';
                this.burgerSpans[2].style.transform = 'rotate(-45deg) translate(7px, -8px)';
            }
        } else {
            if (this.burgerSpans.length >= 3) {
                this.burgerSpans[0].style.transform = 'none';
                this.burgerSpans[1].style.opacity = '1';
                this.burgerSpans[2].style.transform = 'none';
            }
        }
        
        // Блокировка скролла при открытом меню
        document.body.style.overflow = this.mobileNav.classList.contains('active') ? 'hidden' : '';
    }
    
    openMenu() {
        if (!this.mobileNav.classList.contains('active')) {
            this.toggleMenu();
        }
    }
    
    closeMenu() {
        if (this.mobileNav.classList.contains('active')) {
            this.toggleMenu();
        }
    }
    
    isOpen() {
        return this.mobileNav.classList.contains('active');
    }
}

// Инициализация бургер-меню при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.burgerMenu = new BurgerMenu();
});

// Экспорт класса для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BurgerMenu;
}