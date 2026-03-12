// ==================== ЗАГРУЗКА ДЕТАЛЬНОЙ ИНФОРМАЦИИ О ТОВАРЕ ====================
// Функция для загрузки детальной информации о товаре на странице product.html
async function loadProduct(productId) {
    const productDetailContainer = document.getElementById('CardProduct'); // id productDetail в html

    if (!productDetailContainer) return;
    
    try {
        // Получаем информацию о товаре
        const product = await fetchProductById(productId);

        // Используем заглушку для изображения, если оно не указано
        const imageUrl = product.photos?.split(/[;,] ?/)[0]?.trim() || '';

        // Устанавливаем data-атрибуты для корзины
        productDetailContainer.setAttribute('data-product-id', product.id_product);
        productDetailContainer.setAttribute('data-product-name', product.first_name);
        productDetailContainer.setAttribute('data-product-price', product.price); 
        productDetailContainer.setAttribute('data-product-image', imageUrl);

        // Разделяем строку с фото на массив
        const photoArray = product.photos ? product.photos.split(/[;,] ?/).map(photo => photo.trim()) : [];

        //Общее количество остатков по городу
        const mystocks = (product.stocks || 0);

        //Общее количество остатков по городу
        const totalStock = (product.stocks_yard || 0) + (product.stocks_yadot || 0);
        
        // Генерация HTML для страницы товара
        productDetailContainer.innerHTML = `
            <div class="product-gallery">
                <div class="main-image-container">
                    <img id="mainImage" class="main-image" src="${imageUrl}" alt="${product.first_name}" onclick="openFullscreen()">
                </div>
                <div class="thumbnail-wrapper">
                    <button class="thumb-nav thumb-prev" onclick="scrollThumbnails(-1)">❮</button>
                    <div class="thumbnail-container" id="thumbnailContainer">
                        
                    </div>
                    <button class="thumb-nav thumb-next" onclick="scrollThumbnails(1)">❯</button>
                </div>
            </div>
            <div class="product-info">
                <h1 class="product-title">${product.first_name}</h1>
                <h2 class="product-subtitle">${product.second_name}</h2>
                <div class="product-price">
                    ${product.price && parseFloat(product.price) > 0 ? parseFloat(product.price) + ' ₽' : 'Цена по запросу'}
                </div>
                <div class="product-stock">
                    <p>Остаток на складе: <strong>${mystocks + ' шт.' || 'Уточняйте'}</strong></p>
                    <p>На приеме г. Ярославль: <strong>${totalStock + ' шт.'|| 'Уточняйте'}</strong></p>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id_product})"
                data-product-id="${product.id_product}"
                data-product-name="${product.first_name}"
                data-product-price="${product.price}"
                data-product-image="${imageUrl}">
                    <i class="fas fa-shopping-cart"></i> Добавить в корзину
                </button>
                <div class="product-attributes">
                    <div class="attribute"><span class="attribute-name">Артикул:</span> <span class="attribute-value">${product.article}</span></div>
                    <div class="attribute"><span class="attribute-name">Вес:</span> <span class="attribute-value">${product.weight} кг</span></div>
                    <div class="attribute"><span class="attribute-name">Длина:</span> <span class="attribute-value">${product.length} мм</span></div>
                    <div class="attribute"><span class="attribute-name">Ширина:</span> <span class="attribute-value">${product.width} мм</span></div>
                    <div class="attribute"><span class="attribute-name">Высота:</span> <span class="attribute-value">${product.height} мм</span></div>
                    <div class="attribute"><span class="attribute-name">Производитель:</span> <span class="attribute-value">${product.manufacturer}</span></div>
                </div>
            </div>
            
            <!-- Fullscreen режим для просмотра изображений -->
            <div id="fullscreenViewer" class="fullscreen-viewer" style="display: none;">
                <div class="fullscreen-header">
                    <span class="image-counter" id="imageCounter"></span>
                    <span class="fullscreen-close" onclick="closeFullscreen()">&times;</span>
                </div>
                <div class="fullscreen-content">
                    <img id="fullscreenImage" class="fullscreen-img" src="" alt="">
                </div>
                <div class="fullscreen-thumbnails" id="fullscreenThumbnails"></div>
            </div>
        `;

        // Динамически добавляем миниатюры
        const thumbnailContainer = document.getElementById('thumbnailContainer');

        photoArray.forEach((photo, index) => {
            const img = document.createElement('img');
            img.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            img.src = photo;
            img.alt = `${product.first_name} - фото ${index + 1}`;
            img.dataset.index = index; // Сохраняем индекс
            img.onclick = () => changeMainImage(img, index);
            thumbnailContainer.appendChild(img);
        });
        
        // Сохраняем массив фотографий глобально для использования в fullscreen
        window.productPhotos = photoArray;
        // Инициализируем текущий индекс
        window.currentImageIndex = 0;
        
    } catch (error) {
        productDetailContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
}