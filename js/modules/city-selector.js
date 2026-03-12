// ==================== ВЫБОР ГОРОДА ==================== 
// Файл: city-selector.js
// Используется на: всех страницах

class CitySelector {
    constructor(options = {}) {
        // Настройки по умолчанию
        this.defaults = {
            storageKey: 'selectedCity',
            desktopSelectorId: 'citySelect',
            mobileSelectorId: 'citySelectMobile',
            defaultCity: 'Москва',
            cities: [
                { value: 'Москва', label: 'Москва' },
                { value: 'Санкт-Петербург', label: 'Санкт-Петербург' },
                { value: 'Екатеринбург', label: 'Екатеринбург' },
                { value: 'Новосибирск', label: 'Новосибирск' },
                { value: 'Казань', label: 'Казань' },
                { value: 'Нижний Новгород', label: 'Нижний Новгород' },
                { value: 'Краснодар', label: 'Краснодар' },
                { value: 'Владивосток', label: 'Владивосток' }
            ],
            onCityChange: null // callback функция при изменении города
        };
        
        // Объединение настроек
        this.settings = { ...this.defaults, ...options };
        
        // Элементы
        this.desktopSelect = document.getElementById(this.settings.desktopSelectorId);
        this.mobileSelect = document.getElementById(this.settings.mobileSelectorId);
        
        // Флаги и состояния
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        // Инициализация селектов, если они существуют на странице
        this.initializeSelects();
        
        // Восстановление выбранного города
        this.restoreSelectedCity();
        
        // Привязка обработчиков событий
        this.bindEvents();
        
        // Инициализация выпадающих списков (если нужно динамически)
        this.populateSelects();
        
        this.isInitialized = true;
    }
    
    initializeSelects() {
        // Создаем динамически:
        if (!this.desktopSelect && document.querySelector('.city-selector-container')) {
            this.createDesktopSelect();
        }
        
        if (!this.mobileSelect && document.querySelector('.mobile-city-selector')) {
            this.createMobileSelect();
        }
    }
    
    populateSelects() {
        // Динамическое заполнение селектов (если они пустые)
        if (this.desktopSelect && this.desktopSelect.children.length === 0) {
            this.fillSelect(this.desktopSelect);
        }
        
        if (this.mobileSelect && this.mobileSelect.children.length === 0) {
            this.fillSelect(this.mobileSelect);
        }
    }
    
    fillSelect(selectElement) {
        // Очищаем селект
        selectElement.innerHTML = '';
        
        // Добавляем опции городов
        this.settings.cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.value;
            option.textContent = city.label;
            selectElement.appendChild(option);
        });
    }
    
    bindEvents() {
        // Обработка изменения города в десктопной версии
        if (this.desktopSelect) {
            this.desktopSelect.addEventListener('change', (e) => {
                this.saveCity(e.target.value);
            });
        }
        
        // Обработка изменения города в мобильной версии
        if (this.mobileSelect) {
            this.mobileSelect.addEventListener('change', (e) => {
                this.saveCity(e.target.value);
            });
            
            // Для мобильных устройств может потребоваться click вместо change
            this.mobileSelect.addEventListener('click', (e) => {
                // Сохраняем текущее значение
                this.saveCity(e.target.value);
            });
        }
        
        // Синхронизация при изменении через другие элементы
        this.syncSelects();
        
        // Обработка события возврата на страницу (назад/вперед)
        this.bindPageShowEvent();
    }
    
    bindPageShowEvent() {
        // Обработка события pageshow (срабатывает при показе страницы, включая навигацию назад)
        window.addEventListener('pageshow', (event) => {
            // event.persisted = true, если страница загружена из кеша
            if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
                console.log('Страница загружена из кеша (навигация назад), обновляем город');
                this.refreshCitySelection();
            }
        });
        
        // Дополнительно: обновление при видимости страницы
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Страница стала видимой
                setTimeout(() => {
                    this.refreshCitySelection();
                }, 100);
            }
        });
    }
    
    refreshCitySelection() {
        // Принудительное обновление выбора города из localStorage
        const currentCity = this.getSelectedCity();
        console.log('Обновление выбора города на:', currentCity);
        this.syncSelects(currentCity);
    }
    
    saveCity(city) {
        // Сохраняем в localStorage
        localStorage.setItem(this.settings.storageKey, city);
        
        // Синхронизируем оба селекта
        this.syncSelects(city);
        
        // Вызываем callback функцию, если она задана
        if (typeof this.settings.onCityChange === 'function') {
            this.settings.onCityChange(city);
        }
        
        // Можно добавить дополнительные действия при смене города
        this.onCityChanged(city);
    }
    
    syncSelects(city = null) {
        const selectedCity = city || this.getSelectedCity();
        
        // Синхронизация десктопного селекта
        if (this.desktopSelect && this.desktopSelect.value !== selectedCity) {
            this.desktopSelect.value = selectedCity;
        }
        
        // Синхронизация мобильного селекта
        if (this.mobileSelect && this.mobileSelect.value !== selectedCity) {
            this.mobileSelect.value = selectedCity;
        }
    }
    
    restoreSelectedCity() {
        const savedCity = localStorage.getItem(this.settings.storageKey);
        
        if (savedCity) {
            this.syncSelects(savedCity);
        } else {
            // Устанавливаем город по умолчанию
            this.saveCity(this.settings.defaultCity);
        }
    }
    
    getSelectedCity() {
        const savedCity = localStorage.getItem(this.settings.storageKey);
        return savedCity || this.settings.defaultCity;
    }
    
    onCityChanged(city) {
        // Дополнительные действия при смене города
        console.log(`Город изменен на: ${city}`);
        
        // Пример: обновление контента в зависимости от города
        // this.updateContentForCity(city);
        
        // Пример: отправка события для других модулей
        document.dispatchEvent(new CustomEvent('cityChanged', {
            detail: { city }
        }));
    }
    
    // Публичные методы для внешнего использования
    setCity(city) {
        if (this.isValidCity(city)) {
            this.saveCity(city);
            return true;
        }
        return false;
    }
    
    isValidCity(city) {
        return this.settings.cities.some(c => c.value === city);
    }
    
    getAvailableCities() {
        return [...this.settings.cities];
    }
    
    addCity(cityData) {
        // Добавление нового города в список
        if (!this.settings.cities.find(c => c.value === cityData.value)) {
            this.settings.cities.push(cityData);
            
            // Обновляем селекты
            this.populateSelects();
            this.syncSelects();
            
            return true;
        }
        return false;
    }
    
    removeCity(cityValue) {
        // Удаление города из списка (кроме города по умолчанию)
        if (cityValue !== this.settings.defaultCity) {
            const index = this.settings.cities.findIndex(c => c.value === cityValue);
            if (index !== -1) {
                this.settings.cities.splice(index, 1);
                
                // Обновляем селекты
                this.populateSelects();
                
                // Если удаленный город был выбран, выбираем город по умолчанию
                if (this.getSelectedCity() === cityValue) {
                    this.saveCity(this.settings.defaultCity);
                }
                
                return true;
            }
        }
        return false;
    }
    
    // Метод для интеграции с другими модулями
    static getCurrentCity() {
        return localStorage.getItem('selectedCity') || 'Москва';
    }
    
    // Метод для принудительного обновления на других страницах
    static refreshOnAllPages() {
        // Отправляем сообщение другим вкладкам
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('city_channel');
            channel.postMessage({
                type: 'city_changed',
                city: CitySelector.getCurrentCity()
            });
            
            // Закрываем канал после отправки
            setTimeout(() => channel.close(), 1000);
        }
        
        // Сохраняем timestamp последнего изменения
        localStorage.setItem('city_last_updated', Date.now().toString());
    }
}

// Простая функция для сохранения города (совместимость со старым кодом)
function saveCity(value) {
    if (window.citySelector) {
        window.citySelector.setCity(value);
    } else {
        // Резервный вариант
        localStorage.setItem('selectedCity', value);
        
        // Синхронизация селектов
        const citySelect = document.getElementById('citySelect');
        const citySelectMobile = document.getElementById('citySelectMobile');
        
        if (citySelect) citySelect.value = value;
        if (citySelectMobile) citySelectMobile.value = value;
    }
    
    // Уведомляем другие страницы об изменении
    CitySelector.refreshOnAllPages();
}

// Функция для проверки и обновления города при загрузке
function checkAndUpdateCity() {
    const lastUpdated = localStorage.getItem('city_last_updated');
    const currentTime = Date.now();
    
    // Если данные устарели (больше 1 секунды), обновляем
    if (!lastUpdated || (currentTime - parseInt(lastUpdated)) > 1000) {
        const currentCity = localStorage.getItem('selectedCity') || 'Москва';
        
        const citySelect = document.getElementById('citySelect');
        const citySelectMobile = document.getElementById('citySelectMobile');
        
        if (citySelect && citySelect.value !== currentCity) {
            citySelect.value = currentCity;
        }
        
        if (citySelectMobile && citySelectMobile.value !== currentCity) {
            citySelectMobile.value = currentCity;
        }
    }
}

// Инициализация выбора города при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли на странице элементы выбора города
    const citySelect = document.getElementById('citySelect');
    const citySelectMobile = document.getElementById('citySelectMobile');
    
    if (citySelect || citySelectMobile) {
        window.citySelector = new CitySelector();
    } else {
        // Если элементов нет, но нужно получить город в других модулях
        // Просто создаем статический метод для доступа
        window.getCurrentCity = CitySelector.getCurrentCity;
    }
    
    // Проверяем и обновляем город при каждой загрузке
    checkAndUpdateCity();
});

// Обработка BroadcastChannel для синхронизации между вкладками
if (typeof BroadcastChannel !== 'undefined') {
    const cityChannel = new BroadcastChannel('city_channel');
    
    cityChannel.addEventListener('message', (event) => {
        if (event.data.type === 'city_changed') {
            console.log('Получено уведомление об изменении города:', event.data.city);
            
            // Обновляем селекты на текущей странице
            const citySelect = document.getElementById('citySelect');
            const citySelectMobile = document.getElementById('citySelectMobile');
            
            if (citySelect) citySelect.value = event.data.city;
            if (citySelectMobile) citySelectMobile.value = event.data.city;
            
            // Обновляем localStorage
            localStorage.setItem('selectedCity', event.data.city);
            localStorage.setItem('city_last_updated', Date.now().toString());
        }
    });
    
    // Закрываем канал при выгрузке страницы
    window.addEventListener('beforeunload', () => {
        cityChannel.close();
    });
}

// Обработка события pageshow для всех страниц
window.addEventListener('pageshow', (event) => {
    // Обновляем город при возврате на страницу
    if (event.persisted) {
        console.log('Страница восстановлена из кеша, обновляю город');
        checkAndUpdateCity();
        
        // Если citySelector инициализирован, вызываем refresh
        if (window.citySelector && typeof window.citySelector.refreshCitySelection === 'function') {
            window.citySelector.refreshCitySelection();
        }
    }
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CitySelector,
        saveCity,
        checkAndUpdateCity
    };
}