// ==================== FULLSCREEN РЕЖИМ ==================== 
// Файл: fullscreen.js
// Используется на: product.html

// Открытие fullscreen с текущим изображением
function openFullscreen() {
    const fullscreenViewer = document.getElementById('fullscreenViewer');
    const fullscreenImage = document.getElementById('fullscreenImage');
    
    if (!fullscreenViewer || !fullscreenImage || !window.productPhotos || window.productPhotos.length === 0) return;
    
    // Получаем индекс текущего активного изображения
    const activeThumbnail = document.querySelector('.thumbnail.active');
    let startIndex = 0;
    
    if (activeThumbnail && activeThumbnail.dataset.index) {
        startIndex = parseInt(activeThumbnail.dataset.index);
    } else if (typeof window.currentImageIndex !== 'undefined') {
        startIndex = window.currentImageIndex;
    }
    
    // Или получаем индекс из src основного изображения
    const mainImage = document.getElementById('mainImage');
    if (mainImage && mainImage.src && window.productPhotos) {
        const currentSrc = mainImage.src;
        const foundIndex = window.productPhotos.findIndex(photo => 
            photo === currentSrc || currentSrc.includes(photo)
        );
        if (foundIndex !== -1) {
            startIndex = foundIndex;
        }
    }
    
    window.currentFullscreenIndex = startIndex;
    fullscreenImage.src = window.productPhotos[startIndex];
    fullscreenViewer.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Обновляем счетчик
    updateImageCounter();
    
    // Обновляем миниатюры в fullscreen
    updateFullscreenThumbnails();
    
    // Добавляем класс для body
    document.body.classList.add('fullscreen-active');
}

// Закрытие fullscreen режима
function closeFullscreen() {
    const fullscreenViewer = document.getElementById('fullscreenViewer');
    if (fullscreenViewer) {
        fullscreenViewer.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.body.classList.remove('fullscreen-active');
    }
}


// Смена изображения в fullscreen режиме (навигация вперед/назад)
function changeFullscreenImage(direction) {
    if (!window.productPhotos || window.productPhotos.length === 0) return;
    
    if (typeof window.currentFullscreenIndex === 'undefined') {
        window.currentFullscreenIndex = 0;
    }
    
    window.currentFullscreenIndex += direction;
    
    // Циклическая навигация
    if (window.currentFullscreenIndex < 0) {
        window.currentFullscreenIndex = window.productPhotos.length - 1;
    } else if (window.currentFullscreenIndex >= window.productPhotos.length) {
        window.currentFullscreenIndex = 0;
    }
    
    const fullscreenImage = document.getElementById('fullscreenImage');
    if (fullscreenImage) {
        fullscreenImage.src = window.productPhotos[window.currentFullscreenIndex];
    }
    
    // Обновляем счетчик
    updateImageCounter();
    
    // Обновляем миниатюры в fullscreen
    updateFullscreenThumbnails();
}

// Обновление счетчика изображений в fullscreen режиме
function updateImageCounter() {
    const imageCounter = document.getElementById('imageCounter');
    if (imageCounter && window.productPhotos && typeof window.currentFullscreenIndex !== 'undefined') {
        imageCounter.textContent = `${window.currentFullscreenIndex + 1} / ${window.productPhotos.length}`;
    }
}

// Обновление миниатюр в fullscreen режиме
function updateFullscreenThumbnails() {
    const container = document.getElementById('fullscreenThumbnails');
    if (!container || !window.productPhotos) return;
    
    container.innerHTML = '';
    
    window.productPhotos.forEach((photo, index) => {
        const img = document.createElement('img');
        img.className = `fullscreen-thumbnail ${index === window.currentFullscreenIndex ? 'active' : ''}`;
        img.src = photo;
        img.alt = `Фото ${index + 1}`;
        img.onclick = () => {
            window.currentFullscreenIndex = index;
            const fullscreenImage = document.getElementById('fullscreenImage');
            if (fullscreenImage) {
                fullscreenImage.src = photo;
            }
            updateImageCounter();
            updateFullscreenThumbnails();
        };
        container.appendChild(img);
    });
}

// Инициализация обработчиков событий для fullscreen
function initFullscreen() {
    // Навигация с помощью клавиатуры в fullscreen режиме
    document.addEventListener('keydown', function(event) {
        const fullscreenViewer = document.getElementById('fullscreenViewer');
        if (fullscreenViewer && fullscreenViewer.style.display === 'block') {
            switch(event.key) {
                case 'Escape':
                    closeFullscreen();
                    break;
                case 'ArrowLeft':
                    changeFullscreenImage(-1);
                    break;
                case 'ArrowRight':
                    changeFullscreenImage(1);
                    break;
            }
        }
    });
    
    // Обработка свайпов на мобильных устройствах для навигации
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(event) {
        const fullscreenViewer = document.getElementById('fullscreenViewer');
        if (fullscreenViewer && fullscreenViewer.style.display === 'block') {
            touchStartX = event.changedTouches[0].screenX;
        }
    });
    
    document.addEventListener('touchend', function(event) {
        const fullscreenViewer = document.getElementById('fullscreenViewer');
        if (fullscreenViewer && fullscreenViewer.style.display === 'block') {
            touchEndX = event.changedTouches[0].screenX;
            handleSwipe();
        }
    });
    
    // Функция обработки свайпов
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Свайп влево - следующее изображение
                changeFullscreenImage(1);
            } else {
                // Свайп вправо - предыдущее изображение
                changeFullscreenImage(-1);
            }
        }
    }
}

// Инициализация fullscreen при загрузке DOM
document.addEventListener('DOMContentLoaded', initFullscreen);

// Экспорт функций для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openFullscreen,
        closeFullscreen,
        changeFullscreenImage,
        updateImageCounter,
        updateFullscreenThumbnails
    };
}