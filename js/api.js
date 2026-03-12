// Файл для работы с API (запросы к серверу)
const API_BASE_URL = 'http://localhost:3000'; // Базовый URL нашего сервера

// Функция для получения 6 товаров на index.html
async function fetchSixProducts() {
    try {
        //console.log('Запрашиваем товары с сервера...');
        const response = await fetch(`${API_BASE_URL}/api/productslimit`);
        
        if (!response.ok) {
            throw new Error('Ошибка при получении товаров');
        }
        
        const products = await response.json();
        //console.log('Товары получены:', products);
        return products;
    } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
        throw error;
    }
}

// Функция для получения одного товара по ID
async function fetchProductById(productId) {
    try {
        //console.log(`Запрашиваем товар с ID: ${productId}`);
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Товар не найден');
            }
            throw new Error('Ошибка при получении товара');
        }
        
        const product = await response.json();
        //console.log('Товар получен:', product);
        return product;
    } catch (error) {
        console.error('Ошибка при загрузке товара:', error);
        throw error;
    }
}

// ==================== ОСНОВНЫЕ ФУНКЦИИ ЗАГРУЗКИ КАТАЛОГА ====================
async function loadProductsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentPage = parseInt(urlParams.get('page')) || 1;
    currentCategory = urlParams.get('category') || '';
    currentSearch = urlParams.get('search') || '';
    
    initSearchFromURL();
    
    await Promise.all([
        loadCategories(),
        loadProducts()
    ]);
}

async function loadCategories() {
    try {
        const categoriesList = document.getElementById('categoriesList');
        if (!categoriesList) return;
        
        const categories = await fetchCategories();
        
        let categoriesHTML = `
            <div class="category-section">
                <div class="category-item ${currentCategory === '' ? 'active' : ''}" 
                    onclick="window.location.href='products.html'">
                    Все товары
                </div>
            </div>
            <div class="category-section">
                <div class="category-section-title" onclick="toggleCategorySection(this)">
                    <span>ТМЗ</span>
                    <i class="fas fa-chevron-down category-arrow"></i>
                </div>
                <div class="category-subitems" style="display: none;">
        `;
        
        categories.forEach(category => {
            const isActive = currentCategory === category.group_code;
            categoriesHTML += `
                <div class="category-subitem ${isActive ? 'active' : ''}" 
                    onclick="window.location.href='products.html?category=${category.group_code}'">
                    ${escapeHtml(category.group_name)}
                </div>
            `;
        });
        
        categoriesHTML += `
                </div>
            </div>
        `;
        
        categoriesList.innerHTML = categoriesHTML;
        
        if (currentCategory) {
            loadCategoryName(currentCategory);
        } else {
            document.getElementById('selectedCategoryName').textContent = 'Наши товары';
        }
        
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        document.getElementById('categoriesList').innerHTML = '<p class="error">Ошибка загрузки категорий</p>';
    }
}

async function loadProducts() {
    try {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        productsGrid.innerHTML = '<div class="loading">Загрузка товаров...</div>';
        
        const data = await fetchProducts();
        
        totalProducts = data.totalProducts || 0;
        totalPages = Math.ceil(totalProducts / itemsPerPage);
        
        document.getElementById('totalProducts').textContent = totalProducts;
        
        displayProducts(data.products || []);
        
        updatePagination();
        
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        document.getElementById('productsGrid').innerHTML = `
            <div class="error">
                <h3>Ошибка загрузки товаров</h3>
                <p>Пожалуйста, попробуйте позже</p>
            </div>
        `;
    }
}

function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>Товары не найдены</h3>
                <p>Попробуйте изменить параметры поиска или выбрать другую категорию</p>
            </div>
        `;
        return;
    }
    
    let productsHTML = '';
    const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0xMDAgMTAwQzEwOC4yODQgMTAwIDExNSA5My4yODQzIDExNSA4NUMxMTUgNzYuNzE1NyAxMDguMjg0IDcwIDEwMCA3MEM5MS43MTU3IDcwIDg1IDc2LjcxNTcgODUgODVDODUgOTMuMjg0MyA5MS43MTU3IDEwMCAxMDAgMTAwWk0xMDAgMTEwQzgwLjY1IDExMCA2NC45OTk5IDEyMS4zNSA2MCAxMzYuMjVWNjVIMTQwVjEzNi4yNUMxMzUuMDEgMTIxLjM1IDExOS4zNSAxMTAgMTAwIDExMFoiIGZpbGw9IiNENkQ2RDYiLz4KPC9zdmc+';
    
    products.forEach(product => {
        const photos = product.photos ? product.photos.split(/[,;\s]+/).map(p => p.trim()).filter(p => p) : [];
        let photoPath = photos.length > 0 && photos[0] ? photos[0] : '';
        
        productsHTML += `
            <div class="product-block" onclick="window.location.href='product.html?id=${product.id_product}'">
                <img class="product-image" 
                    src="${photoPath || placeholderImage}" 
                    alt="${escapeHtml(product.first_name)}" 
                    onerror="this.src='${placeholderImage}'">
                <div class="product-name">${escapeHtml(product.first_name)}</div>
                ${product.article ? `<div class="product-article">Арт: ${escapeHtml(product.article)}</div>` : ''}
            </div>
        `;
    });
    
    productsGrid.innerHTML = productsHTML;
}

async function fetchCategories() {
    try {
        const response = await fetch('http://localhost:3000/api/categories');
        if (!response.ok) throw new Error('Ошибка загрузки категорий');
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        throw error;
    }
}

async function fetchProducts() {
    try {
        let url = `http://localhost:3000/api/products?page=${currentPage}&limit=${itemsPerPage}`;
        
        if (currentCategory) {
            url += `&category=${encodeURIComponent(currentCategory)}`;
        }
        
        if (currentSearch) {
            url += `&search=${encodeURIComponent(currentSearch)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка загрузки товаров');
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        throw error;
    }
}

async function loadCategoryName(categoryCode) {
    try {
        const response = await fetch(`http://localhost:3000/api/categories/${categoryCode}`);
        if (response.ok) {
            const category = await response.json();
            document.getElementById('selectedCategoryName').textContent = 
                escapeHtml(category.group_name) || 'Наши товары';
        }
    } catch (error) {
        console.error('Ошибка загрузки названия категории:', error);
        document.getElementById('selectedCategoryName').textContent = 'Наши товары';
    }
}