// ==================== ПЛАВНАЯ ПРОКРУТКА ====================
// Файл: smooth-scroll.js

function initSmoothScroll() {
    // Находим все якорные ссылки
    const anchorLinks = document.querySelectorAll('a[href*="#"]');
    
    if (anchorLinks.length === 0) return;
    
    anchorLinks.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Если это ссылка на другую страницу с якорем (например, index.html#price-section)
            if (href.includes('.html#')) {
                e.preventDefault();
                
                // Разделяем путь к странице и якорь
                const [pagePath, hash] = href.split('#');
                
                if (pagePath === window.location.pathname.split('/').pop() || 
                    pagePath === '' || 
                    (pagePath === 'index.html' && window.location.pathname.endsWith('/')) ||
                    (pagePath === 'index.html' && window.location.pathname.endsWith('index.html'))) {
                    // Мы уже на нужной странице - просто скроллим без изменения URL
                    if (hash) {
                        scrollToHash(hash, false); // false = не добавлять hash в URL
                    }
                } else {
                    // Переходим на другую страницу и сохраняем якорь для скролла после загрузки
                    if (hash) {
                        sessionStorage.setItem('scrollToHash', hash);
                        sessionStorage.setItem('scrollToPage', pagePath);
                    }
                    // Переходим без hash в URL
                    window.location.href = pagePath;
                }
            } 
            // Если это якорь на текущей странице
            else if (href.startsWith('#')) {
                e.preventDefault();
                
                const targetId = href;
                if (targetId === '#') return;
                
                scrollToHash(targetId.substring(1), false); // false = не добавлять hash в URL
            }
        });
    });
    
    // Функция прокрутки к якорю
    function scrollToHash(hash, updateUrl = false) {
        const targetElement = document.getElementById(hash) || document.querySelector(`[name="${hash}"]`);
        
        if (targetElement) {
            const header = document.getElementById('header');
            const searchBar = document.querySelector('.search-container');
            
            const headerHeight = header ? header.offsetHeight : 0;
            const searchBarHeight = searchBar ? searchBar.offsetHeight : 0;
            const totalOffset = headerHeight + searchBarHeight;
            
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - totalOffset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Добавляем hash в URL только если явно указано
            if (updateUrl && history.pushState) {
                history.pushState(null, null, '#' + hash);
            }
        }
    }
    
    // Проверяем, нужно ли выполнить скролл после загрузки страницы
    function checkInitialScroll() {
        // Проверяем сохраненный hash из sessionStorage (для переходов между страницами)
        const savedHash = sessionStorage.getItem('scrollToHash');
        const savedPage = sessionStorage.getItem('scrollToPage');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (savedHash && savedPage === currentPage) {
            setTimeout(() => {
                scrollToHash(savedHash, false);
                // Очищаем после использования
                sessionStorage.removeItem('scrollToHash');
                sessionStorage.removeItem('scrollToPage');
            }, 300);
        }
        
        // Если есть hash в URL при загрузке, скроллим и удаляем его из истории
        if (window.location.hash) {
            const hash = window.location.hash.substring(1);
            setTimeout(() => {
                scrollToHash(hash, false);
                // Удаляем hash из URL без перезагрузки
                if (history.replaceState) {
                    history.replaceState(null, null, window.location.pathname + window.location.search);
                }
            }, 100);
        }
    }
    
    // Проверяем при загрузке
    checkInitialScroll();
    
    // Также проверяем при переходе назад/вперед
    window.addEventListener('popstate', () => {
        setTimeout(() => {
            checkInitialScroll();
        }, 50);
    });
    
    return {
        scrollTo: (hash) => scrollToHash(hash, false)
    };
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.smoothScroll = initSmoothScroll();
});

// Функция для ручного вызова
function smoothScrollTo(hash) {
    if (window.smoothScroll) {
        window.smoothScroll.scrollTo(hash);
    }
}