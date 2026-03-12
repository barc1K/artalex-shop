// update-prices.js
const { Pool } = require('pg');

async function updatePrices() {
    console.log('🚀 Запуск обновления прайсов TMZ...');
    
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'shop_db',
        password: 'Ra123456',
        port: 5432,
    });
    
    const client = await pool.connect();
    
    try {
        console.log('🔄 Начало обновления прайсов TMZ...');
        
        await client.query('BEGIN');
        
        // 1. Очищаем старые данные прайсов
        console.log('🗑️ Очищаем старые данные...');
        await client.query('TRUNCATE TABLE tmz_dvig_price, tmz_zapch_price CASCADE');
        
        // 2. Загружаем данные двигателей из CSV
        console.log('📥 Загружаем двигатели...');
        await client.query(`
            COPY tmz_dvig_price (article, price_with_nds)
            FROM 'D:/Aartalex/price/Price_TMZ/dvig/dvig.csv'
            DELIMITER ';'
            CSV HEADER
            ENCODING 'UTF8'
        `);
        
        // 3. Загружаем данные запчастей из CSV
        console.log('📥 Загружаем запчасти...');
        await client.query(`
            COPY tmz_zapch_price (part_name, price_with_nds)
            FROM 'D:/Aartalex/price/Price_TMZ/zapch/zapch.csv'
            DELIMITER ';'
            CSV HEADER
            ENCODING 'UTF8'
        `);
        
        // 4. Обновляем цены в products
        console.log('💰 Обновляем цены товаров...');
        
        // Сначала сбрасываем цены у всех товаров
        await client.query(`
            UPDATE products 
            SET price_tmz = NULL 
        `);
        
        // Обновляем цены для двигателей
        await client.query(`
            UPDATE products p
            SET price_tmz = t.price_with_nds
            FROM tmz_dvig_price t
            WHERE p.article = t.article 
               OR p.first_name ILIKE '%' || t.article || '%'
            RETURNING p.id_product
        `);
        
        // Обновляем цены для запчастей
        await client.query(`
            UPDATE products p
            SET price_tmz = t.price_with_nds
            FROM tmz_zapch_price t
            WHERE t.part_name ILIKE '%' || p.article || '%'
            RETURNING p.id_product
        `);

        // 5. Устанавливаем основную цену (price) - сначала TMZ, если нет то ЯМЗ
        await client.query(`
            UPDATE products 
            SET price = COALESCE(price_tmz, price_yamz)
        `);
        
        await client.query('COMMIT');
        
        // 6. Получаем статистику
        const stats = await getUpdateStats(client);
        
        console.log('✅ Обновление завершено!');
        console.log('📊 Статистика:');
        console.log(`   - Двигателей: ${stats.dvig}`);
        console.log(`   - Запчастей: ${stats.zapch}`);
        console.log(`   - Товаров с ценами: ${stats.products_with_price}/${stats.total_products}`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка обновления прайсов:', error);
        throw error;
    } finally {
        client.release();
        pool.end();
    }
}

async function getUpdateStats(client) {
    const result = await client.query(`
        SELECT 
            (SELECT COUNT(*) FROM tmz_dvig_price) as dvig,
            (SELECT COUNT(*) FROM tmz_zapch_price) as zapch,
            (SELECT COUNT(*) FROM products WHERE price IS NOT NULL) as products_with_price,
            (SELECT COUNT(*) FROM products) as total_products
    `);
    return result.rows[0];
}

// Запускаем обновление
updatePrices().catch(err => {
    console.error('❌ Критическая ошибка:', err);
    process.exit(1);
});