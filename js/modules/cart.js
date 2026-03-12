// ==================== КОРЗИНА ==================== 
// Файл: cart.js
// Используется на: всех страницах

class ShoppingCart {
    constructor(options = {}) {
        // Настройки по умолчанию
        this.defaults = {
            storageKey: 'cart',
            notificationId: 'cartNotification',
            modalId: 'cartModal',
            cartItemsId: 'cartItems',
            cartFormId: 'cartForm',
            cartCountId: 'cartCount',
            mobileCartCountId: 'mobileCartCount',
            apiEndpoint: 'http://localhost:3000/api/order',
            notificationDuration: 2500 // 2.5 секунды
        };
        
        // Объединение настроек
        this.settings = { ...this.defaults, ...options };
        
        // Элементы
        this.modal = document.getElementById(this.settings.modalId);
        this.cartItemsContainer = document.getElementById(this.settings.cartItemsId);
        this.cartForm = document.getElementById(this.settings.cartFormId);
        this.notification = document.getElementById(this.settings.notificationId);
        
        this.init();
    }
    
    init() {
        // Инициализация корзины в localStorage
        this.initializeStorage();
        
        // Обновление счетчика при загрузке
        this.updateCartCount();
        
        // Инициализация обработчиков событий
        this.bindEvents();
        
        // Обработка отправки формы
        if (this.cartForm) {
            this.initFormSubmit();
        }
    }
    
    initializeStorage() {
        if (!localStorage.getItem(this.settings.storageKey)) {
            localStorage.setItem(this.settings.storageKey, JSON.stringify([]));
        }
    }
    
    bindEvents() {
        // Закрытие модального окна корзины при клике вне его области
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeCart();
            }
        });
        
        // Обновление счетчика при переходе по истории браузера
        window.addEventListener('pageshow', (event) => {
            if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
                this.updateCartCount();
            }
        });
    }
    
    initFormSubmit() {
        this.cartForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
    
    // ==================== РАБОТА С LOCALSTORAGE ====================
    
    getCart() {
        return JSON.parse(localStorage.getItem(this.settings.storageKey) || '[]');
    }
    
    saveCart(cart) {
        localStorage.setItem(this.settings.storageKey, JSON.stringify(cart));
        this.updateCartCount();
        
        // Обновляем отображение товаров, если модальное окно открыто
        if (this.modal && this.modal.style.display === 'block') {
            this.renderCartItems();
        }
    }
    
    // ==================== УПРАВЛЕНИЕ КОРЗИНОЙ ====================
    
    addToCart(productId, productData = {}) {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: productData.name || "",
                price: productData.price || 0,
                image: productData.image || "",
                quantity: 1
            });
        }
        
        this.saveCart(cart);
        this.showNotification();
    }
    
    removeFromCart(productId) {
        const cart = this.getCart().filter(item => item.id !== productId);
        this.saveCart(cart);
    }
    
    changeQuantity(productId, delta) {
        const cart = this.getCart();
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            const newQuantity = item.quantity + delta;
            if (newQuantity >= 1) {
                item.quantity = newQuantity;
                this.saveCart(cart);
            }
        }
    }
    
    updateQuantity(productId, newQuantity) {
        const quantity = parseInt(newQuantity);
        if (quantity >= 1) {
            const cart = this.getCart();
            const item = cart.find(item => item.id === productId);
            
            if (item) {
                item.quantity = quantity;
                this.saveCart(cart);
            }
        }
    }
    
    clearCart() {
        localStorage.removeItem(this.settings.storageKey);
        this.updateCartCount();
        
        if (this.modal && this.modal.style.display === 'block') {
            this.renderCartItems();
        }
    }
    
    getTotalItems() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    }
    
    getTotalPrice() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    // ==================== ОТОБРАЖЕНИЕ И ИНТЕРФЕЙС ====================
    
    updateCartCount() {
        const totalItems = this.getTotalItems();
        
        // Обновляем счетчик в десктопной версии
        const cartCountElement = document.getElementById(this.settings.cartCountId);
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
        
        // Обновляем счетчик в мобильной версии
        const mobileCartCountElement = document.getElementById(this.settings.mobileCartCountId);
        if (mobileCartCountElement) {
            mobileCartCountElement.textContent = totalItems;
        }
    }
    
    renderCartItems() {
        if (!this.cartItemsContainer) return;
        
        const cart = this.getCart();
        
        // Отображение пустой корзины
        if (cart.length === 0) {
            this.cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Ваша корзина пуста</p>
                </div>
            `;
            return;
        }
        
        // Генерация HTML для каждого товара в корзине
        this.cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik00MCA0MEM0My4zMTM3IDQwIDQ2IDM3LjMxMzcgNDYgMzRDNDYgMzAuNjg2MyA0My4zMTM3IDI4IDQwIDI4QzM2LjY4NjMgMjggMzQgMzAuNjg2MyAzNCAzNEMzNCAzNy4zMTM3IDM2LjY4NjMgNDAgNDAgNDBaTTQwIDQ0QzMyLjI2IDQ0IDI1LjQ2IDQ4LjM0IDIzIDU0LjVWMjZINTdWNTQuNUM1NC41NCA0OC4zNCA0Ny43NCA0NCA0MCA0NFoiIGZpbGw9IiNENkQ2RDYiLz4KPC9zdmc+'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    ${item.price > 0 ? 
                        `<div class="cart-item-price">
                            <span class="price-per-unit">${item.price} ₽ × ${item.quantity} = </span>
                            <span class="price-total">${item.price * item.quantity} ₽</span>
                        </div>` : 
                        '<div class="cart-item-price">Цена по запросу</div>'
                    }
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="window.cart.changeQuantity(${item.id}, -1)">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                               onchange="window.cart.updateQuantity(${item.id}, this.value)">
                        <button class="quantity-btn" onclick="window.cart.changeQuantity(${item.id}, 1)">+</button>
                        <button class="remove-item" onclick="window.cart.removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        // Добавляем общую сумму корзины
        if (cart.length > 0) {
            const totalPrice = this.getTotalPrice();
            const totalElement = document.createElement('div');
            totalElement.className = 'cart-total';
            totalElement.innerHTML = `
                <div class="total-line">
                    <span>Итого:</span>
                    <span class="total-price">${totalPrice} ₽</span>
                </div>
            `;
            this.cartItemsContainer.appendChild(totalElement);
        }
    }
    
    showNotification() {
        if (!this.notification) return;
        
        this.notification.style.display = 'block';
        
        // Автоматическое скрытие уведомления
        setTimeout(() => {
            this.notification.style.display = 'none';
        }, this.settings.notificationDuration);
    }
    
    // ==================== УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ ====================
    
    toggleCart() {
        if (this.modal.style.display === 'block') {
            this.closeCart();
        } else {
            this.openCart();
        }
    }
    
    openCart() {
        if (!this.modal) return;
        
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        this.renderCartItems();
    }
    
    closeCart() {
        if (!this.modal) return;
        
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // ==================== ОТПРАВКА ФОРМЫ ====================
    
    async handleFormSubmit(e) {
        e.preventDefault();
        
        // Проверка, что корзина не пуста
        const cart = this.getCart();
        if (cart.length === 0) {
            alert('Корзина пуста!');
            return;
        }
        
        // Сбор данных формы и корзины
        const formData = new FormData(this.cartForm);
        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            message: formData.get('message'),
            cart: cart,
            date: new Date().toLocaleString('ru-RU'),
            city: localStorage.getItem('selectedCity') || 'Ярославль'
        };
        
        // Показать индикатор загрузки
        const submitBtn = this.cartForm.querySelector('.submit-cart-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        submitBtn.disabled = true;
        
        try {
            // Отправка данных на сервер
            const response = await fetch(this.settings.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                let successMessage = '✅ Заказ успешно отправлен! Мы свяжемся с вами в ближайшее время.';
                
                // Добавляем информацию о способах отправки
                if (result.notifications) {
                    const notifications = [];
                    if (result.notifications.email) notifications.push('email');
                    if (result.notifications.telegram) notifications.push('Telegram');
                    
                    if (notifications.length > 0) {
                        successMessage += `\n\nУведомление отправлено: ${notifications.join(' и ')}`;
                    }
                }
                
                alert(successMessage);
                
                // Очищаем корзину после успешной отправки
                this.clearCart();
                this.closeCart();
                
                // Очищаем форму
                this.cartForm.reset();
                
            } else {
                let errorMessage = '❌ Ошибка при отправке заказа: ' + (result.message || 'неизвестная ошибка');
                
                // Добавляем информацию о том, что сработало
                if (result.notifications) {
                    const sent = [];
                    const failed = [];
                    
                    if (result.notifications.email) sent.push('email');
                    else failed.push('email');
                    
                    if (result.notifications.telegram) sent.push('Telegram');
                    else failed.push('Telegram');
                    
                    if (sent.length > 0) {
                        errorMessage += `\n\nЧастично отправлено: ${sent.join(', ')}`;
                    }
                }
                
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('⚠️ Произошла ошибка при отправке. Пожалуйста, попробуйте еще раз или свяжитесь с нами по телефону.');
        } finally {
            // Восстановление состояния кнопки
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================
    
    getCartItems() {
        return this.getCart();
    }
    
    isEmpty() {
        return this.getCart().length === 0;
    }
    
    // Метод для добавления товара с полными данными (используется в product.js)
    addProduct(productData) {
        this.addToCart(productData.id, {
            name: productData.name,
            price: productData.price,
            image: productData.image
        });
    }
}

// Простая функция для добавления товара в корзину (для использования в HTML onclick)
function addToCart(productId) {
    if (!window.cart) {
        console.error('Корзина не инициализирована');
        return;
    }
    
    // Получение данных товара из data-атрибутов
    let productName = "";
    let productImage = "";
    let productPrice = 0;
    
    const button = document.querySelector(`[data-product-id="${productId}"]`);
    const productContainer = document.getElementById('CardProduct');
    
    if (button) {
        productName = button.dataset.productName || "";
        productPrice = parseFloat((button.dataset.productPrice || "").replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        productImage = button.dataset.productImage || "";
    } else if (productContainer && productContainer.dataset.productId == productId) {
        productName = productContainer.dataset.productName || "";
        productPrice = parseFloat((productContainer.dataset.productPrice || "").replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        productImage = productContainer.dataset.productImage || "";
    }
    
    // Добавление товара в корзину
    window.cart.addToCart(productId, {
        name: productName,
        price: productPrice,
        image: productImage
    });
}

// Простые функции для использования в HTML (совместимость со старым кодом)
function toggleCart() {
    if (window.cart) {
        window.cart.toggleCart();
    }
}

function openCart() {
    if (window.cart) {
        window.cart.openCart();
    }
}

function closeCart() {
    if (window.cart) {
        window.cart.closeCart();
    }
}

function changeQuantity(productId, delta) {
    if (window.cart) {
        window.cart.changeQuantity(productId, delta);
    }
}

function updateQuantity(productId, newQuantity) {
    if (window.cart) {
        window.cart.updateQuantity(productId, newQuantity);
    }
}

function removeFromCart(productId) {
    if (window.cart) {
        window.cart.removeFromCart(productId);
    }
}

// Инициализация корзины при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ShoppingCart,
        addToCart,
        toggleCart,
        openCart,
        closeCart,
        changeQuantity,
        updateQuantity,
        removeFromCart
    };
}