// ==================== ПАРАМЕТРЫ ПАГИНАЦИИ ====================
let totalProducts = 0;
let currentCategory = '';
let currentSearch = '';

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function buildPageUrl(page) {
    const params = new URLSearchParams();
    
    if (currentCategory) params.set('category', currentCategory);
    if (currentSearch) params.set('search', currentSearch);
    if (page > 1) params.set('page', page);
    
    const queryString = params.toString();
    return queryString ? `products.html?${queryString}` : 'products.html';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleCategorySection(element) {
    const subitems = element.nextElementSibling;
    const arrow = element.querySelector('.category-arrow');
    
    if (subitems.style.display === 'none' || !subitems.style.display) {
        subitems.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
        element.style.background = '#dee2e6';
    } else {
        subitems.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
        element.style.background = '#e9ecef';
    }
}