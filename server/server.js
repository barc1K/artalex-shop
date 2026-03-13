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

console.log('🔥🔥🔥 СЕРВЕР ЗАПУСКАЕТСЯ 🔥🔥🔥');
console.log('Текущая директория:', process.cwd());
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL задан:', !!process.env.DATABASE_URL);

// И сразу после создания pool добавьте:
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

console.log('✅ Pool создан, пытаемся подключиться...');

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ ОШИБКА подключения к БД:', err.message);
        console.error('Полная ошибка:', err);
    } else {
        console.log('✅ УСПЕШНОЕ подключение к БД');
        release();
    }
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

// Функция для очистки артикула от лишних символов
function cleanArticle(article) {
    return article.replace(/[.\-\s]/g, '');
}

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
    { name: 'tmzFiles', maxCount: 20 },
    { name: 'yamzFiles', maxCount: 20 },
    { name: 'yazdaFiles', maxCount: 20 }
]), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Проверяем наличие хотя бы одного файла
        if (!req.files || (!req.files.tmzFiles && !req.files.yamzFiles && !req.files.yazdaFiles)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Загрузите хотя бы один файл' 
            });
        }

        console.log('📁 Получены файлы:');
        if (req.files.tmzFiles) {
            console.log(`   - ТМЗ: ${req.files.tmzFiles.length} файлов`);
            req.files.tmzFiles.forEach((file, index) => {
                console.log(`     ${index + 1}. ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
            });
        }
        if (req.files.yamzFiles) {
            console.log(`   - ЯМЗ: ${req.files.yamzFiles.length} файлов`);
            req.files.yamzFiles.forEach((file, index) => {
                console.log(`     ${index + 1}. ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
            });
        }
        if (req.files.yazdaFiles) {
            console.log(`   - ЯЗДА: ${req.files.yazdaFiles.length} файлов`);
            req.files.yazdaFiles.forEach((file, index) => {
                console.log(`     ${index + 1}. ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
            });
        }

        console.log('⚙️ Запуск обновления цен...');
        
        // Используем существующее подключение к БД
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Очищаем только соответствующие таблицы, если загружены файлы
            if (req.files.tmzFiles) {
                console.log('🗑️ Очищаем таблицы ТМЗ...');
                await client.query('TRUNCATE TABLE tmz_dvig_price, tmz_zapch_price RESTART IDENTITY CASCADE');
                // Сбрасываем только цены ТМЗ в products
                await client.query('UPDATE products SET price_tmz = NULL');
            }
            
            if (req.files.yamzFiles) {
                console.log('🗑️ Очищаем таблицы ЯМЗ...');
                await client.query('TRUNCATE TABLE yamz_price RESTART IDENTITY CASCADE');
                // Сбрасываем только цены ЯМЗ в products
                await client.query('UPDATE products SET price_yamz = NULL');
            }
            
            if (req.files.yazdaFiles) {
                console.log('🗑️ Очищаем таблицу ЯЗДА...');
                await client.query('TRUNCATE TABLE yazda_price RESTART IDENTITY CASCADE');
                // Сбрасываем только цены ЯЗДА в products
                await client.query('UPDATE products SET price_yazda = NULL');
            }
            
            // Загружаем ТМЗ, если файлы предоставлены
            if (req.files.tmzFiles) {
                console.log('📥 Загружаем ТМЗ...');
                
                for (const file of req.files.tmzFiles) {
                    const fileName = file.originalname.toLowerCase();
                    
                    if (fileName.includes('dvig') || fileName.includes('engine') || fileName.includes('двиг')) {
                        // Файл двигателей
                        await client.query(`
                            COPY tmz_dvig_price (article, price_with_nds)
                            FROM '${file.path.replace(/\\/g, '/')}'
                            DELIMITER ';'
                            CSV HEADER
                            ENCODING 'UTF8'
                        `);
                        console.log(`   ✅ Загружены двигатели ТМЗ из ${file.originalname}`);
                    } else {
                        // Файл запчастей
                        await client.query(`
                            COPY tmz_zapch_price (part_name, price_with_nds)
                            FROM '${file.path.replace(/\\/g, '/')}'
                            DELIMITER ';'
                            CSV HEADER
                            ENCODING 'UTF8'
                        `);
                        console.log(`   ✅ Загружены запчасти ТМЗ из ${file.originalname}`);
                    }
                }
            }

            // Загружаем ЯМЗ, если файлы предоставлены
            if (req.files.yamzFiles) {
                console.log('📥 Загружаем ЯМЗ...');
                
                for (const file of req.files.yamzFiles) {
                    await client.query(`
                        COPY yamz_price (article, price_with_nds)
                        FROM '${file.path.replace(/\\/g, '/')}'
                        DELIMITER ';'
                        CSV HEADER
                        ENCODING 'UTF8'
                    `);
                    console.log(`   ✅ Загружено ЯМЗ из ${file.originalname}`);
                }
            }
            
            // Загружаем ЯЗДА, если файлы предоставлены
            if (req.files.yazdaFiles) {
                console.log('📥 Загружаем ЯЗДА...');
                
                for (const file of req.files.yazdaFiles) {
                    await client.query(`
                        COPY yazda_price (article, price_with_nds)
                        FROM '${file.path.replace(/\\/g, '/')}'
                        DELIMITER ';'
                        CSV HEADER
                        ENCODING 'UTF8'
                    `);
                    console.log(`   ✅ Загружено ЯЗДА из ${file.originalname}`);
                }
            }
            
            // Обновляем цены ТМЗ, если были загружены файлы
            if (req.files.tmzFiles) {
                console.log('🔄 Обновляем цены ТМЗ...');
                
                // Обновляем по артикулу для двигателей
                await client.query(`
                    UPDATE products p
                    SET price_tmz = t.price_with_nds
                    FROM tmz_dvig_price t
                    WHERE regexp_replace(p.article, '[.\\-\\s]', '', 'g') = 
                          regexp_replace(t.article, '[.\\-\\s]', '', 'g')
                `);
                
                // Обновляем по названию для запчастей
                await client.query(`
                    UPDATE products p
                    SET price_tmz = t.price_with_nds
                    FROM tmz_zapch_price t
                    WHERE t.part_name ILIKE '%' || p.article || '%'
                       OR p.first_name ILIKE '%' || t.part_name || '%'
                `);
            }

            // Обновляем цены ЯМЗ с наценкой 10%, если были загружены файлы
            if (req.files.yamzFiles) {
                console.log('🔄 Обновляем цены ЯМЗ...');
                
                await client.query(`
                    UPDATE products p
                    SET price_yamz = CAST(ROUND(t.price_with_nds * 1.10) AS INTEGER)
                    FROM yamz_price t
                    WHERE regexp_replace(p.article, '[.\\-\\s]', '', 'g') = 
                          regexp_replace(t.article, '[.\\-\\s]', '', 'g')
                `);
            }
            
            // Обновляем цены ЯЗДА, если были загружены файлы
            if (req.files.yazdaFiles) {
                console.log('🔄 Обновляем цены ЯЗДА...');
                
                await client.query(`
                    UPDATE products p
                    SET price_yazda = t.price_with_nds
                    FROM yazda_price t
                    WHERE regexp_replace(p.article, '[.\\-\\s]', '', 'g') = 
                          regexp_replace(t.article, '[.\\-\\s]', '', 'g')
                `);
            }
            
            // Устанавливаем основную цену (приоритет: ТМЗ -> ЯМЗ -> ЯЗДА)
            console.log('💰 Устанавливаем основные цены...');
            await client.query(`
                UPDATE products 
                SET price = COALESCE(price_tmz, price_yamz, price_yazda)
            `);
            
            // Получаем статистику
            console.log('📊 Получаем статистику...');
            const statsResult = await client.query(`
                SELECT 
                    (SELECT COUNT(*) FROM tmz_dvig_price) + (SELECT COUNT(*) FROM tmz_zapch_price) as tmz_count,
                    (SELECT COUNT(*) FROM yamz_price) as yamz_count,
                    (SELECT COUNT(*) FROM yazda_price) as yazda_count,
                    (SELECT COUNT(*) FROM products WHERE price_tmz IS NOT NULL OR price_yamz IS NOT NULL OR price_yazda IS NOT NULL) as products_with_price,
                    (SELECT COUNT(*) FROM products) as total_products
            `);
            
            await client.query('COMMIT');
            
            const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✅ Обновление завершено за ${timeElapsed} сек`);
            
            // Формируем сообщение о том, что было обновлено
            const updatedParts = [];
            if (req.files.tmzFiles) updatedParts.push('ТМЗ');
            if (req.files.yamzFiles) updatedParts.push('ЯМЗ');
            if (req.files.yazdaFiles) updatedParts.push('ЯЗДА');
            
            res.json({
                success: true,
                message: `Цены успешно обновлены (${updatedParts.join(', ')})`,
                stats: statsResult.rows[0],
                timeElapsed,
                updated: {
                    tmz: !!req.files.tmzFiles,
                    yamz: !!req.files.yamzFiles,
                    yazda: !!req.files.yazdaFiles
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
                (SELECT COUNT(*) FROM tmz_dvig_price) + (SELECT COUNT(*) FROM tmz_zapch_price) as tmz_count,
                (SELECT COUNT(*) FROM yamz_price) as yamz_count,
                (SELECT COUNT(*) FROM yazda_price) as yazda_count,
                (SELECT COUNT(*) FROM products WHERE price_tmz IS NOT NULL OR price_yamz IS NOT NULL OR price_yazda IS NOT NULL) as products_with_price,
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

// Маршрут для очистки отдельного бренда
app.delete('/api/cleanup-brand/:brand', async (req, res) => {
    const { brand } = req.params;
    
    try {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            let message = '';
            
            switch(brand) {
                case 'tmz':
                    console.log('🧹 Очистка данных ТМЗ...');
                    await client.query('TRUNCATE TABLE tmz_dvig_price, tmz_zapch_price RESTART IDENTITY CASCADE');
                    await client.query('UPDATE products SET price_tmz = NULL, price = NULL');
                    message = 'Данные ТМЗ успешно очищены';
                    break;
                    
                case 'yamz':
                    console.log('🧹 Очистка данных ЯМЗ...');
                    await client.query('TRUNCATE TABLE yamz_price RESTART IDENTITY CASCADE');
                    await client.query('UPDATE products SET price_yamz = NULL, price = NULL');
                    message = 'Данные ЯМЗ успешно очищены';
                    break;
                    
                case 'yazda':
                    console.log('🧹 Очистка данных ЯЗДА...');
                    await client.query('TRUNCATE TABLE yazda_price RESTART IDENTITY CASCADE');
                    await client.query('UPDATE products SET price_yazda = NULL, price = NULL');
                    message = 'Данные ЯЗДА успешно очищены';
                    break;
                    
                default:
                    throw new Error('Неизвестный бренд');
            }
            
            await client.query('COMMIT');
            
            console.log(`✅ ${message}`);
            res.json({ 
                success: true, 
                message 
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error(`❌ Ошибка очистки ${brand}:`, error);
        res.status(500).json({ 
            success: false, 
            message: `Ошибка при очистке данных: ${error.message}` 
        });
    }
});

// Маршрут для очистки всех брендов сразу
app.delete('/api/cleanup-all-brands', async (req, res) => {
    try {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            console.log('🧹 Полная очистка всех данных...');
            
            // Очищаем все таблицы
            await client.query('TRUNCATE TABLE tmz_dvig_price, tmz_zapch_price RESTART IDENTITY CASCADE');
            await client.query('TRUNCATE TABLE yamz_price RESTART IDENTITY CASCADE');
            await client.query('TRUNCATE TABLE yazda_price RESTART IDENTITY CASCADE');
            
            // Обнуляем все цены в products
            await client.query('UPDATE products SET price_tmz = NULL, price_yamz = NULL, price_yazda = NULL');
            
            // Обновляем основную цену
            await client.query('UPDATE products SET price = NULL');
            
            await client.query('COMMIT');
            
            console.log('✅ Все данные успешно очищены');
            res.json({ 
                success: true, 
                message: 'Все данные успешно очищены' 
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Ошибка полной очистки:', error);
        res.status(500).json({ 
            success: false, 
            message: `Ошибка при полной очистке: ${error.message}` 
        });
    }
});

// ============ МАРШРУТЫ ДЛЯ ОСТАТКОВ ============

// Маршрут для получения статуса остатков
app.get('/api/stocks-status', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM stocks_my) as my_count,
                (SELECT COUNT(*) FROM stocks_yadot) as yadot_count,
                (SELECT COUNT(*) FROM stocks_yard) as yard_count,
                (SELECT COUNT(*) FROM products WHERE stocks IS NOT NULL OR stocks_yadot IS NOT NULL OR stocks_yard IS NOT NULL) as products_with_stocks,
                (SELECT COUNT(*) FROM products) as total_products
        `);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка получения статуса остатков:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршрут для обновления остатков
app.post('/api/update-stocks', upload.fields([
    { name: 'myFiles', maxCount: 20 },
    { name: 'yadotFiles', maxCount: 20 },
    { name: 'yardFiles', maxCount: 20 }
]), async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Проверяем наличие хотя бы одного файла
        if (!req.files || (!req.files.myFiles && !req.files.yadotFiles && !req.files.yardFiles)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Загрузите хотя бы один файл' 
            });
        }

        console.log('📁 Получены файлы остатков:');
        if (req.files.myFiles) {
            console.log(`   - MY: ${req.files.myFiles.length} файлов`);
        }
        if (req.files.yadotFiles) {
            console.log(`   - YADOT: ${req.files.yadotFiles.length} файлов`);
        }
        if (req.files.yardFiles) {
            console.log(`   - YARD: ${req.files.yardFiles.length} файлов`);
        }

        console.log('⚙️ Запуск обновления остатков...');
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Очищаем соответствующие таблицы и обнуляем остатки в products
            if (req.files.myFiles) {
                console.log('🗑️ Очищаем таблицу Наши остатки...');
                await client.query('TRUNCATE TABLE stocks_my RESTART IDENTITY CASCADE');
                await client.query('UPDATE products SET stocks = NULL');
            }
            
            if (req.files.yadotFiles) {
                console.log('🗑️ Очищаем таблицу YADOT...');
                await client.query('TRUNCATE TABLE stocks_yadot RESTART IDENTITY CASCADE');
                await client.query('UPDATE products SET stocks_yadot = NULL');
            }
            
            if (req.files.yardFiles) {
                console.log('🗑️ Очищаем таблицу YARD...');
                await client.query('TRUNCATE TABLE stocks_yard RESTART IDENTITY CASCADE');
                await client.query('UPDATE products SET stocks_yard = NULL');
            }
            
            // Загружаем MY остатки
            if (req.files.myFiles) {
                console.log('📥 Загружаем Наши остатки...');
                
                for (const file of req.files.myFiles) {
                    await client.query(`
                        COPY stocks_my (article_name, stock)
                        FROM '${file.path.replace(/\\/g, '/')}'
                        DELIMITER ';'
                        CSV HEADER
                        ENCODING 'UTF8'
                    `);
                    console.log(`   ✅ Загружены Наши остатки из ${file.originalname}`);
                }
            }
            
            // Загружаем YADOT остатки
            if (req.files.yadotFiles) {
                console.log('📥 Загружаем остатки ЯДОТ...');
                
                for (const file of req.files.yadotFiles) {
                    await client.query(`
                        COPY stocks_yadot (article, stock)
                        FROM '${file.path.replace(/\\/g, '/')}'
                        DELIMITER ';'
                        CSV HEADER
                        ENCODING 'UTF8'
                    `);
                    console.log(`   ✅ Загружены остатки ЯДОТ из ${file.originalname}`);
                }
            }
            
            // Загружаем YARD остатки
            if (req.files.yardFiles) {
                console.log('📥 Загружаем остатки ЯРД...');
                
                for (const file of req.files.yardFiles) {
                    await client.query(`
                        COPY stocks_yard (article, stock)
                        FROM '${file.path.replace(/\\/g, '/')}'
                        DELIMITER ';'
                        CSV HEADER
                        ENCODING 'UTF8'
                    `);
                    console.log(`   ✅ Загружены остатки ЯРД из ${file.originalname}`);
                }
            }
            
            // Обновляем остатки в products
            console.log('📦 Обновляем остатки в товарах...');
            
            if (req.files.myFiles) {
                // MY - сопоставление по article_name
                await client.query(`
                    UPDATE products p
                    SET stocks = s.stock
                    FROM stocks_my s
                    WHERE p.article = s.article_name 
                       OR p.first_name ILIKE '%' || s.article_name || '%'
                `);
            }
            
            if (req.files.yadotFiles) {
                // YADOT - сопоставление по article
                await client.query(`
                    UPDATE products p
                    SET stocks_yadot = s.stock
                    FROM stocks_yadot s
                    WHERE regexp_replace(p.article, '[.\\-\\s]', '', 'g') = 
                          regexp_replace(s.article, '[.\\-\\s]', '', 'g')
                `);
            }
            
            if (req.files.yardFiles) {
                // YARD - сопоставление по article
                await client.query(`
                    UPDATE products p
                    SET stocks_yard = s.stock
                    FROM stocks_yard s
                    WHERE regexp_replace(p.article, '[.\\-\\s]', '', 'g') = 
                          regexp_replace(s.article, '[.\\-\\s]', '', 'g')
                `);
            }
            
            // Получаем статистику
            const statsResult = await client.query(`
                SELECT 
                    (SELECT COUNT(*) FROM stocks_my) as my_count,
                    (SELECT COUNT(*) FROM stocks_yadot) as yadot_count,
                    (SELECT COUNT(*) FROM stocks_yard) as yard_count,
                    (SELECT COUNT(*) FROM products WHERE stocks IS NOT NULL OR stocks_yadot IS NOT NULL OR stocks_yard IS NOT NULL) as products_with_stocks,
                    (SELECT COUNT(*) FROM products) as total_products
            `);
            
            await client.query('COMMIT');
            
            const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✅ Обновление остатков завершено за ${timeElapsed} сек`);
            
            const updatedParts = [];
            if (req.files.myFiles) updatedParts.push('Наши');
            if (req.files.yadotFiles) updatedParts.push('ЯДОТ');
            if (req.files.yardFiles) updatedParts.push('ЯРД');
            
            res.json({
                success: true,
                message: `Остатки успешно обновлены (${updatedParts.join(', ')})`,
                stats: statsResult.rows[0],
                timeElapsed,
                updated: {
                    my: !!req.files.myFiles,
                    yadot: !!req.files.yadotFiles,
                    yard: !!req.files.yardFiles
                }
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Ошибка обновления остатков:', error);
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Ошибка обновления остатков:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            error: error.toString()
        });
    }
});

// Маршрут для очистки отдельного бренда остатков
app.delete('/api/cleanup-stocks-brand/:brand', async (req, res) => {
    const { brand } = req.params;
    
    try {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            let message = '';
            
            switch(brand) {
                case 'my':
                    console.log('🧹 Очистка Наши остатки...');
                    await client.query('TRUNCATE TABLE stocks_my RESTART IDENTITY CASCADE');
                    await client.query('UPDATE products SET stocks = NULL');
                    message = 'Наши остатки успешно очищены';
                    break;
                    
                case 'yadot':
                    console.log('🧹 Очистка остатков ЯДОТ...');
                    await client.query('TRUNCATE TABLE stocks_yadot RESTART IDENTITY CASCADE');
                    await client.query('UPDATE products SET stocks_yadot = NULL');
                    message = 'Остатки ЯДОТ успешно очищены';
                    break;
                    
                case 'yard':
                    console.log('🧹 Очистка остатков ЯРД...');
                    await client.query('TRUNCATE TABLE stocks_yard RESTART IDENTITY CASCADE');
                    await client.query('UPDATE products SET stocks_yard = NULL');
                    message = 'Остатки ЯРД успешно очищены';
                    break;
                    
                default:
                    throw new Error('Неизвестный бренд');
            }
            
            await client.query('COMMIT');
            
            console.log(`✅ ${message}`);
            res.json({ 
                success: true, 
                message 
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error(`❌ Ошибка очистки ${brand}:`, error);
        res.status(500).json({ 
            success: false, 
            message: `Ошибка при очистке данных: ${error.message}` 
        });
    }
});

// Маршрут для очистки всех брендов остатков сразу
app.delete('/api/cleanup-all-stocks-brands', async (req, res) => {
    try {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            console.log('🧹 Полная очистка всех остатков...');
            
            // Очищаем все таблицы
            await client.query('TRUNCATE TABLE stocks_my RESTART IDENTITY CASCADE');
            await client.query('TRUNCATE TABLE stocks_yadot RESTART IDENTITY CASCADE');
            await client.query('TRUNCATE TABLE stocks_yard RESTART IDENTITY CASCADE');
            
            // Обнуляем все остатки в products
            await client.query('UPDATE products SET stocks = NULL, stocks_yadot = NULL, stocks_yard = NULL');
            
            await client.query('COMMIT');
            
            console.log('✅ Все остатки успешно очищены');
            res.json({ 
                success: true, 
                message: 'Все остатки успешно очищены' 
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Ошибка полной очистки остатков:', error);
        res.status(500).json({ 
            success: false, 
            message: `Ошибка при полной очистке: ${error.message}` 
        });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 Каталог доступен по адресу: http://localhost:${PORT}/catalog.html`);
    console.log(`📊 Админ-панель доступна по адресу: http://localhost:${PORT}/admin/update-prices`);
});
