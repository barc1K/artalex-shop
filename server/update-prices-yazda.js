// update-prices.js
const { Pool } = require('pg');

async function updatePrices() {
    console.log('🚀 Запуск обновления прайсов ЯЗДА...');
    
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'shop_db',
        password: 'Ra123456',
        port: 5432,
    });
    
    const client = await pool.connect();
    
    try {
        console.log('🔄 Начало обновления прайсов ЯЗДА...');
        
        await client.query('BEGIN');
        
        // 1. Очищаем старые данные прайсов
        console.log('🗑️ Очищаем старые данные...');
        await client.query('TRUNCATE TABLE yazda_price CASCADE');
        
        // 2. Загружаем данные из CSV
        console.log('📥 Загружаем данные...');
        await client.query(`
            COPY yazda_price (article, price_with_nds)
            FROM 'D:/Aartalex/price/Price_YAZDA/yazda.csv'
            DELIMITER ';'
            CSV HEADER
            ENCODING 'UTF8'
        `);
        
        // 4. Обновляем цены в products
        console.log('💰 Обновляем цены товаров...');
        
        // Сначала сбрасываем цены у всех товаров
        await client.query(`
            UPDATE products 
            SET price_yazda = NULL 
        `);
        
        // Обновляем цены
        await client.query(`
            UPDATE products p
            SET price_yazda = t.price_with_nds
            FROM yazda_price t
            WHERE 
                regexp_replace(p.article, '[\\\\.\\\\-\\\\s]', '', 'g') = 
                regexp_replace(t.article, '[\\\\.\\\\-\\\\s]', '', 'g')
            RETURNING p.id_product
        `);

        // 5. Устанавливаем основную цену (price) - ТМЗ - ЯМЗ - ЯЗДА
        await client.query(`
            UPDATE products 
            SET price = COALESCE(price_tmz, price_yamz, price_yazda)
        `);
        
        await client.query('COMMIT');
        
        // 6. Получаем статистику
        const stats = await getUpdateStats(client);
        
        console.log('✅ Обновление завершено!');
        console.log('📊 Статистика:');
        console.log(`   - Запчастей ЯЗДА: ${stats.zapch}`);
        
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
            (SELECT COUNT(*) FROM yazda_price) as zapch
    `);
    return result.rows[0];
}

// Запускаем обновление
updatePrices().catch(err => {
    console.error('❌ Критическая ошибка:', err);
    process.exit(1);
});