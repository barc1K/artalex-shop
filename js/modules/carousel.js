// ==================== КАРУСЕЛЬ ==================== 
// Файл: carousel.js
// Используется на: index.html

// Минималистичный вариант (как в оригинальном index.js)
function initCarousel() {
    let currentIndex = 0;
    const items = document.querySelectorAll('.carousel-item');
    const totalItems = items.length;
    const inner = document.querySelector('.carousel-inner');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    
    if (!inner || totalItems === 0) {
        console.warn('Элементы карусели не найдены на странице');
        return;
    }
    
    // Переменная для таймера автопрокрутки
    let autoScrollTimer = null;
    
    // Обновление позиции карусели
    function updateCarousel() {
        inner.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
    
    // Функция для перехода к следующему слайду
    function goToNextSlide() {
        currentIndex = (currentIndex + 1) % totalItems;
        updateCarousel();
    }
    
    // Функция для перехода к предыдущему слайду
    function goToPrevSlide() {
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        updateCarousel();
    }
    
    // Функция запуска автопрокрутки
    function startAutoScroll() {
        stopAutoScroll(); // Останавливаем предыдущий таймер, если был
        autoScrollTimer = setInterval(goToNextSlide, 10000); // 10 секунд
    }
    
    // Функция остановки автопрокрутки
    function stopAutoScroll() {
        if (autoScrollTimer) {
            clearInterval(autoScrollTimer);
            autoScrollTimer = null;
        }
    }
    
    // Обработчики для кнопок "вперед" и "назад"
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToNextSlide();
            startAutoScroll(); // Перезапускаем таймер после ручного переключения
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToPrevSlide();
            startAutoScroll(); // Перезапускаем таймер после ручного переключения
        });
    }
    
    // Начальное положение и запуск автопрокрутки
    updateCarousel();
    startAutoScroll();
    
    // Возвращаем публичные методы для внешнего использования
    return {
        next: goToNextSlide,
        prev: goToPrevSlide,
        goTo: (index) => {
            if (index >= 0 && index < totalItems) {
                currentIndex = index;
                updateCarousel();
                startAutoScroll();
            }
        },
        stopAutoScroll,
        startAutoScroll,
        getCurrentIndex: () => currentIndex,
        getTotalItems: () => totalItems
    };
}

// Альтернативный вариант с классом (для расширенного функционала)
class CarouselAdvanced {
    constructor(options = {}) {
        this.currentIndex = 0;
        this.items = document.querySelectorAll('.carousel-item');
        this.totalItems = this.items.length;
        this.inner = document.querySelector('.carousel-inner');
        this.prevBtn = document.querySelector('.prev');
        this.nextBtn = document.querySelector('.next');
        
        this.autoScrollTimer = null;
        this.autoScrollInterval = options.interval || 10000;
        this.isPaused = false;
        
        this.init();
    }
    
    init() {
        if (!this.inner || this.totalItems === 0) return;
        
        this.bindEvents();
        this.updateCarousel();
        this.startAutoScroll();
    }
    
    bindEvents() {
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.next());
        }
        
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prev());
        }
        
        const container = document.querySelector('.carousel');
        if (container) {
            container.addEventListener('mouseenter', () => this.pause());
            container.addEventListener('mouseleave', () => this.resume());
            
            container.addEventListener('touchstart', () => this.pause());
            container.addEventListener('touchend', () => {
                setTimeout(() => this.resume(), 3000);
            });
        }
    }
    
    updateCarousel() {
        this.inner.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    }
    
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.totalItems;
        this.updateCarousel();
        this.restartAutoScroll();
    }
    
    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.totalItems) % this.totalItems;
        this.updateCarousel();
        this.restartAutoScroll();
    }
    
    startAutoScroll() {
        if (this.isPaused) return;
        this.stopAutoScroll();
        this.autoScrollTimer = setInterval(() => this.next(), this.autoScrollInterval);
    }
    
    stopAutoScroll() {
        if (this.autoScrollTimer) {
            clearInterval(this.autoScrollTimer);
            this.autoScrollTimer = null;
        }
    }
    
    restartAutoScroll() {
        this.stopAutoScroll();
        this.startAutoScroll();
    }
    
    pause() {
        this.isPaused = true;
        this.stopAutoScroll();
    }
    
    resume() {
        this.isPaused = false;
        this.startAutoScroll();
    }
    
    destroy() {
        this.stopAutoScroll();
        // Удаление обработчиков событий
    }
}

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли на странице карусель
    const carouselContainer = document.querySelector('.carousel');
    if (carouselContainer) {
        // Используем минималистичный вариант
        window.carouselInstance = initCarousel();
        
        // Или расширенный вариант, если нужны дополнительные функции:
        // window.carouselInstance = new CarouselAdvanced({ interval: 10000 });
    }
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCarousel,
        CarouselAdvanced
    };
}