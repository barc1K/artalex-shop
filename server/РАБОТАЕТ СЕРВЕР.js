// Сервер на Node.js и Express.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Разрешаем запросы с других доменов
app.use(express.json()); // Для обработки JSON данных

// Настройка подключения к PostgreSQL
const pool = new Pool({
    user: 'postgres', // Ваше имя пользователя
    host: 'localhost',
    database: 'shop_db', // Имя вашей базы данных
    password: 'Ra123456', // Ваш пароль от PostgreSQL
    port: 5432, // Порт PostgreSQL (по умолчанию 5432)
});

// Проверка подключения к базе данных
pool.connect((err, client, release) => {
    if (err) {
        console.error('Ошибка подключения к PostgreSQL:', err);
    } else {
        console.log('✅ Успешное подключение к PostgreSQL');
        release();
    }
});

// Маршрут для получения 6 товаров
app.get('/api/productslimit', async (req, res) => {
    try {
        //console.log('Получаем все товары...');
        const result = await pool.query('SELECT id_product, first_name, photos FROM products ORDER BY RANDOM() LIMIT 6');
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении товаров:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршрут для получения одного товара по ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        //console.log(`Получаем товар с ID: ${id}`);
        
        const result = await pool.query('SELECT * FROM products WHERE id_product = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при получении товара:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршрут для получения всех категорий
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT group_code, group_name FROM part_groups_tmz ORDER BY group_name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении категорий:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршрут для получения категории по коду
app.get('/api/categories/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const result = await pool.query(
            'SELECT group_code, group_name FROM part_groups_tmz WHERE group_code = $1',
            [code]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при получении категории:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршрут для получения товаров с фильтрацией и пагинацией
app.get('/api/products', async (req, res) => {
    try {
        const { page = 1, limit = 12, category, search } = req.query;
        const offset = (page - 1) * limit;
        
        let query = 'SELECT * FROM products WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';
        const params = [];
        
        // Фильтр по категории
        if (category) {
            query += ' AND group_code = $' + (params.length + 1);
            countQuery += ' AND group_code = $' + (params.length + 1);
            params.push(category);
        }
        
        // Поиск
        if (search) {
            const searchTerm = '%' + search + '%';
            query += ' AND (first_name ILIKE $' + (params.length + 1) + 
                     ' OR second_name ILIKE $' + (params.length + 2) + 
                     ' OR article ILIKE $' + (params.length + 3) + ')';
            countQuery += ' AND (first_name ILIKE $' + (params.length + 1) + 
                         ' OR second_name ILIKE $' + (params.length + 2) + 
                         ' OR article ILIKE $' + (params.length + 3) + ')';
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        // Сортировка и пагинация
        query += ' ORDER BY first_name LIMIT $' + (params.length + 1) + 
                 ' OFFSET $' + (params.length + 2);
        params.push(parseInt(limit), offset);
        
        // Выполняем оба запроса
        const [productsResult, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, params.slice(0, -2)) // Убираем LIMIT и OFFSET
        ]);
        
        res.json({
            products: productsResult.rows,
            totalProducts: parseInt(countResult.rows[0].count),
            currentPage: parseInt(page),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        });
        
    } catch (err) {
        console.error('Ошибка при получении товаров:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршрут для автодополнения поиска
app.get('/api/search/autocomplete', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json([]);
        }
        
        const searchTerm = '%' + q + '%';
        const result = await pool.query(
            `SELECT id_product, first_name, article 
             FROM products 
             WHERE first_name ILIKE $1 
                OR second_name ILIKE $1 
                OR article ILIKE $1 
             ORDER BY first_name 
             LIMIT 10`,
            [searchTerm]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при поиске автодополнения:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршрут для статических файлов (HTML, CSS, JS)
app.use(express.static('..')); // Поднимаемся на уровень выше папки server

// Подключаем сервис отправки email
// Подключаем сервисы
const { sendOrderEmail } = require('./emailService');
const { sendOrderToTelegram } = require('./telegramService');

// Маршрут для обработки заказов
app.post('/api/order', async (req, res) => {
    try {
        const orderData = req.body;
        
        console.log('📦 Получен новый заказ:');
        console.log('- Имя:', orderData.name);
        console.log('- Телефон:', orderData.phone);
        console.log('- Email:', orderData.email || 'не указан');
        console.log('- Город:', orderData.city || 'не указан');
        console.log('- Товаров в корзине:', orderData.cart?.length || 0);
        
        // Валидация данных
        if (!orderData.name || !orderData.phone) {
            return res.status(400).json({ 
                success: false, 
                message: 'Имя и телефон обязательны' 
            });
        }
        
        if (!orderData.cart || orderData.cart.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Корзина пуста' 
            });
        }
        
        // Отправляем email
        const emailResult = await sendOrderEmail(orderData);
        
        // Отправляем в Telegram
        const telegramResult = await sendOrderToTelegram(orderData);
        
        // Формируем ответ на основе результатов отправки
        const allSuccess = emailResult.success;
        const telegramStatus = telegramResult.success ? 'успешно' : 'не отправлено';
        
        console.log(`📊 Итоги отправки:`);
        console.log(`- Email: ${emailResult.success ? '✅ отправлен' : '❌ ошибка'}`);
        console.log(`- Telegram: ${telegramStatus}`);
        
        if (emailResult.success) {
            res.json({ 
                success: true, 
                message: 'Заказ успешно отправлен',
                orderId: Date.now(),
                notifications: {
                    email: emailResult.success,
                    telegram: telegramResult.success
                }
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Ошибка при отправке заказа',
                error: emailResult.error,
                notifications: {
                    email: emailResult.success,
                    telegram: telegramResult.success
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Ошибка обработки заказа:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Внутренняя ошибка сервера',
            error: error.message 
        });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 Каталог доступен по адресу: http://localhost:${PORT}/catalog.html`);
});