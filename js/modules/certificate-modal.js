// ==================== МОДАЛЬНОЕ ОКНО СЕРТИФИКАТА ==================== 
// Файл: certificate-modal.js
// Используется на: index.html

// Простой вариант инициализации
function initCertificateModalSimple() {
    const modal = document.getElementById('certificateModal');
    const img = document.getElementById('certificateImg');
    const modalImg = document.getElementById('modalCertificateImg');
    const span = document.getElementsByClassName('close')[0];
    
    if (!modal || !img || !modalImg) {
        console.warn('Элементы модального окна сертификата не найдены на странице');
        return null;
    }
    
    // Открытие модального окна при клике на изображение
    img.onclick = function() {
        modal.style.display = "block";
        modalImg.src = this.src;
        modalImg.alt = this.alt;
        
        // Блокировка скролла страницы
        document.body.style.overflow = "hidden";
    }
    
    // Закрытие модального окна при клике на крестик
    if (span) {
        span.onclick = function() {
            modal.style.display = "none";
            document.body.style.overflow = "";
        }
    }
    
    // Закрытие модального окна при клике вне его
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            document.body.style.overflow = "";
        }
    }
    
    // Закрытие модального окна при нажатии Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = "none";
            document.body.style.overflow = "";
        }
    });
    
    // Экспорт функций для внешнего использования
    return {
        open: () => {
            modal.style.display = "block";
            modalImg.src = img.src;
            modalImg.alt = img.alt;
            document.body.style.overflow = "hidden";
        },
        close: () => {
            modal.style.display = "none";
            document.body.style.overflow = "";
        },
        isOpen: () => modal.style.display === 'block'
    };
}

// Автоматическая инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли на странице элементы модального окна
    const triggerImg = document.getElementById('certificateImg');
    if (triggerImg) {
        // Используем простой вариант (как в оригинале)
        window.certificateModal = initCertificateModalSimple();
    }
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CertificateModal,
        initCertificateModalSimple
    };
}