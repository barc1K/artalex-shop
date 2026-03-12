// Сервер на Node.js и Express.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// ДОБАВЛЯЕМ НОВЫЕ ЗАВИСИМОСТИ (вместе с существующими)
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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

// ============ НОВЫЙ КОД ДЛЯ ОБНОВЛЕНИЯ ПРАЙСОВ ============

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        // Создаем папку, если её нет
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Сохраняем файлы с оригинальными именами
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Проверяем расширение файла
        if (file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Только CSV файлы разрешены'));
        }
    }
});

// Маршрут для отображения страницы обновления цен
app.get('/admin/update-prices', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/update-prices.html'));
});

// Маршрут для загрузки файлов и обновления цен
app.post('/api/update-prices', upload.fields([
    { name: 'dvigFile', maxCount: 1 },
    { name: 'zapchFile', maxCount: 1 }
]), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Проверяем наличие хотя бы одного файла
        if (!req.files || (!req.files.dvigFile && !req.files.zapchFile)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Загрузите хотя бы один файл: для двигателей или для запчастей' 
            });
        }

        console.log('📁 Получены файлы:');
        if (req.files.dvigFile) {
            const dvigFile = req.files.dvigFile[0];
            console.log(`   - Двигатели: ${dvigFile.originalname} (${(dvigFile.size / 1024).toFixed(2)} KB)`);
        }
        if (req.files.zapchFile) {
            const zapchFile = req.files.zapchFile[0];
            console.log(`   - Запчасти: ${zapchFile.originalname} (${(zapchFile.size / 1024).toFixed(2)} KB)`);
        }

        console.log('⚙️ Запуск обновления цен...');
        
        // Используем существующее подключение к БД
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Если загружены оба файла или только один - очищаем соответствующие таблицы
            if (req.files.dvigFile || req.files.zapchFile) {
                console.log('🗑️ Очищаем старые данные...');
                
                // Очищаем только те таблицы, для которых загружены файлы
                const tablesToTruncate = [];
                if (req.files.dvigFile) tablesToTruncate.push('tmz_dvig_price');
                if (req.files.zapchFile) tablesToTruncate.push('tmz_zapch_price');
                
                if (tablesToTruncate.length > 0) {
                    await client.query(`TRUNCATE TABLE ${tablesToTruncate.join(', ')} CASCADE`);
                }
            }
            
            // Загружаем двигатели, если файл предоставлен
            if (req.files.dvigFile) {
                console.log('📥 Загружаем двигатели...');
                const dvigFile = req.files.dvigFile[0];
                const dvigQuery = `
                    COPY tmz_dvig_price (article, price_with_nds)
                    FROM '${dvigFile.path.replace(/\\/g, '/')}'
                    DELIMITER ';'
                    CSV HEADER
                    ENCODING 'UTF8'
                `;
                await client.query(dvigQuery);
                console.log(`✅ Загружено двигателей из файла: ${dvigFile.originalname}`);
            }
            
            // Загружаем запчасти, если файл предоставлен
            if (req.files.zapchFile) {
                console.log('📥 Загружаем запчасти...');
                const zapchFile = req.files.zapchFile[0];
                const zapchQuery = `
                    COPY tmz_zapch_price (part_name, price_with_nds)
                    FROM '${zapchFile.path.replace(/\\/g, '/')}'
                    DELIMITER ';'
                    CSV HEADER
                    ENCODING 'UTF8'
                `;
                await client.query(zapchQuery);
                console.log(`✅ Загружено запчастей из файла: ${zapchFile.originalname}`);
            }
            
            // Обновляем цены товаров
            console.log('💰 Обновляем цены товаров...');
            
            // Сбрасываем цены только для тех категорий, которые обновлялись
            if (req.files.dvigFile || req.files.zapchFile) {
                // Если обновляются двигатели - сбрасываем цены только у двигателей
                // Если обновляются запчасти - сбрасываем цены только у запчастей
                // Для простоты пока сбрасываем все цены TMZ
                await client.query('UPDATE products SET price_tmz = NULL');
            }
            
            // Обновляем цены для двигателей, если файл был загружен
            if (req.files.dvigFile) {
                console.log('🔄 Обновляем цены двигателей...');
                await client.query(`
                    UPDATE products p
                    SET price_tmz = t.price_with_nds
                    FROM tmz_dvig_price t
                    WHERE p.article = t.article 
                       OR p.first_name ILIKE '%' || t.article || '%'
                `);
            }
            
            // Обновляем цены для запчастей, если файл был загружен
            if (req.files.zapchFile) {
                console.log('🔄 Обновляем цены запчастей...');
                await client.query(`
                    UPDATE products p
                    SET price_tmz = t.price_with_nds
                    FROM tmz_zapch_price t
                    WHERE t.part_name ILIKE '%' || p.article || '%'
                `);
            }
            
            // Устанавливаем основную цену
            console.log('💰 Устанавливаем основные цены...');
            await client.query('UPDATE products SET price = COALESCE(price_tmz, price_yamz)');
            
            // Получаем статистику
            console.log('📊 Получаем статистику...');
            const statsResult = await client.query(`
                SELECT 
                    (SELECT COUNT(*) FROM tmz_dvig_price) as dvig,
                    (SELECT COUNT(*) FROM tmz_zapch_price) as zapch,
                    (SELECT COUNT(*) FROM products WHERE price_tmz IS NOT NULL) as products_with_price,
                    (SELECT COUNT(*) FROM products) as total_products
            `);
            
            await client.query('COMMIT');
            
            const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✅ Обновление завершено за ${timeElapsed} сек`);
            
            // Формируем сообщение о том, что было обновлено
            const updatedParts = [];
            if (req.files.dvigFile) updatedParts.push('двигатели');
            if (req.files.zapchFile) updatedParts.push('запчасти');
            
            res.json({
                success: true,
                message: `Цены успешно обновлены (${updatedParts.join(' и ')})`,
                stats: statsResult.rows[0],
                timeElapsed,
                updated: {
                    dvig: !!req.files.dvigFile,
                    zapch: !!req.files.zapchFile
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Ошибка обновления:', error);
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Ошибка обновления:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.toString()
        });
    }
});

// Маршрут для получения статуса последнего обновления
app.get('/api/update-status', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM tmz_dvig_price) as dvig_count,
                (SELECT COUNT(*) FROM tmz_zapch_price) as zapch_count,
                (SELECT COUNT(*) FROM products WHERE price_tmz IS NOT NULL) as products_with_tmz,
                (SELECT COUNT(*) FROM products) as total_products
        `);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка получения статуса:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршрут для удаления загруженных файлов
app.delete('/api/cleanup-uploads', (req, res) => {
    try {
        const uploadDir = path.join(__dirname, '../uploads');
        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(uploadDir, file));
            });
            console.log('🧹 Папка uploads очищена');
        }
        res.json({ success: true, message: 'Файлы удалены' });
    } catch (error) {
        console.error('Ошибка очистки:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ============ КОНЕЦ НОВОГО КОДА ============

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 Каталог доступен по адресу: http://localhost:${PORT}/catalog.html`);
    console.log(`📊 Админ-панель доступна по адресу: http://localhost:${PORT}/admin/update-prices`);
});