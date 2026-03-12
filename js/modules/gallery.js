// ==================== ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ ==================== 
// Файл: gallery.js
// Используется на: product.html

// Функция для смены основного изображения при клике на миниатюру
function changeMainImage(thumbnail, index) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = thumbnail.src;
        mainImage.alt = thumbnail.alt;
    }
    
    // Убираем активный класс у всех миниатюр и добавляем его к текущей
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnail.classList.add('active');
    
    // Обновляем глобальный индекс текущего изображения
    if (typeof window.currentImageIndex !== 'undefined') {
        window.currentImageIndex = index;
    }
}

// Функция горизонтальной прокрутки миниатюр
function scrollThumbnails(direction) {
    const container = document.querySelector('.thumbnail-container');
    if (container) {
        const scrollAmount = 100;
        container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    }
}

// Экспорт функций для использования в других модулях (если нужно)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        changeMainImage,
        scrollThumbnails
    };
}