// ==================== ЗАГРУЗКА ТОВАРОВ ====================
// Функция для загрузки и отображения 6 товаров на главной странице
async function loadSixCatalog() {
    const catalogContainer = document.getElementById('SixProducts'); // id products в html
    
    if (!catalogContainer) return; // Если элемента нет на странице
    
    try {
        // Получаем товары с сервера
        const products = await fetchSixProducts();
        
        // Очищаем контейнер
        catalogContainer.innerHTML = '';
        
        // Если товаров нет
        if (!products || products.length === 0) {
            catalogContainer.innerHTML = '<p class="error">Товары не найдены</p>';
            return;
        }
        
        // Создаем карточки для каждого товара
        products.forEach(product => {
            const productCard = createProductCard(product);
            catalogContainer.appendChild(productCard);
        });
        
    } catch (error) {
        catalogContainer.innerHTML = `<p class="error">Ошибка: ${error.message}</p>`;
    }
}

// Функция для создания карточки товара для index.html
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-block';
    
    // Используем заглушку для изображения, если оно не указано
    const imageUrl = product.photos?.split(/[;,] ?/)[0]?.trim() || '';
    const productUrl = `product.html?id=${product.id_product}`;
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${product.first_name}" class="product-image">
        <div class="product-name">${product.first_name}</h3>
    `;
    
    // Обработчик клика для перехода на страницу товара
    card.addEventListener('click', () => {window.location.href = productUrl})
    return card;
}

// ==================== ЭФФЕКТ ПРИ ПРОКРУТКЕ ШАПКИ ====================
// Добавление/удаление класса при прокрутке страницы
window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});