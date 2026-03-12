// ==================== ПОИСК ====================
function initSearchFromURL() {
    const searchInput = document.getElementById('mainSearchInput');
    const searchButton = document.querySelector('.search-button');
    
    if (searchButton) {
        searchButton.addEventListener('click', () => performSearch());
    }
}

function performSearch() {
    const searchInput = document.getElementById('mainSearchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    const urlParams = new URLSearchParams(window.location.search);
    
    if (query) {
        urlParams.set('search', query);
    } else {
        urlParams.delete('search');
    }
    
    urlParams.delete('page');
    window.location.href = `products.html?${urlParams.toString()}`;
}

// ==================== АВТОДОПОЛНЕНИЕ ПОИСКА ====================
function initSearchAutocomplete() {
    const searchInput = document.getElementById('mainSearchInput');
    
    if (!searchInput) return;
    
    // Получаем текущий поисковый запрос из URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentSearch = urlParams.get('search');
    if (currentSearch) {
        searchInput.value = decodeURIComponent(currentSearch);
    }
    
    const searchResults = document.createElement('div');
    searchResults.className = 'search-autocomplete';
    searchResults.style.cssText = `
        position: absolute;
        top: 100%;
        left: 6%;
        right: 6%;
        background: white;
        border: 1px solid #ddd;
        border-radius: 0 0 10px 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
    `;
    
    searchInput.parentNode.style.position = 'relative';
    searchInput.parentNode.appendChild(searchResults);

    // Стили для элементов автодополнения (уже есть в CSS)
    // Функция для выполнения поиска
    async function performAutocompleteSearch(query) {
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/search/autocomplete?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            
            displaySearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            searchResults.style.display = 'none';
        }
    }

    // Функция для отображения результатов
    function displaySearchResults(results) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'search-autocomplete-empty';
            emptyItem.textContent = 'Товары не найдены';
            searchResults.appendChild(emptyItem);
        } else {
            results.forEach(product => {
                const item = document.createElement('div');
                item.className = 'search-autocomplete-item';
                item.innerHTML = `
                    <span class="search-product-name">${escapeHtml(product.first_name)}</span>
                    ${product.article ? `<span class="search-product-article">${escapeHtml(product.article)}</span>` : ''}
                `;
                
                item.addEventListener('click', () => {
                    window.location.href = `product.html?id=${product.id_product}`;
                });
                
                searchResults.appendChild(item);
            });
        }
        
        searchResults.style.display = 'block';
    }

    // Функция для экранирования HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Обработчики событий для поиска
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => performAutocompleteSearch(query), 300);
        } else {
            searchResults.style.display = 'none';
        }
    });

    // Закрытие результатов при клике вне поиска
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Обработка Enter для перехода на search.html или products.html с параметром поиска
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query) {
                // Переходим на products.html с параметром поиска
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('search', query);
                urlParams.delete('page'); // Сбрасываем страницу при новом поиске
                window.location.href = `products.html?${urlParams.toString()}`;
            }
        }
    });
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
// Общая функция инициализации поиска
function initSearch() {
    initSearchFromURL();
    initSearchAutocomplete();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initSearch();
});