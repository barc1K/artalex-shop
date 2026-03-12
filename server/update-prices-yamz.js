const { Pool } = require('pg');

async function updatePrices() {
    console.log('🚀 Запуск обновления прайсов ЯМЗ...');
    
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'shop_db',
        password: 'Ra123456',
        port: 5432,
    });
    
    const client = await pool.connect();
    
    try {
        console.log('🔄 Начало обновления прайсов ЯМЗ...');
        
        await client.query('BEGIN');
        
        // 1. Очищаем старые данные прайсов ЯЗМ
        console.log('🗑️ Очищаем старые данные...');
        await client.query('TRUNCATE TABLE yamz_zapch_price, yamz_zapch_530_price, yamz_zapch_650_price, yamz_zapch_zip_price, yamz_dvig_ryd_price, yamz_dvig_v_price CASCADE');
        
        // 2. Загружаем данные запчастей ЯМЗ из CSV
        console.log('📥 Загружаем запчасти...');
        await client.query(`
            COPY yamz_zapch_price (article, price_with_nds)
            FROM 'D:/Aartalex/price/Price_YAMZ/zapch/zapch.csv'
            DELIMITER ';'
            CSV HEADER
            ENCODING 'UTF8'
        `);
        
        // 3. Загружаем данные запчастей 530 ЯМЗ из CSV
        console.log('📥 Загружаем запчасти 530...');
        await client.query(`
            COPY yamz_zapch_530_price (article, price_with_nds)
            FROM 'D:/Aartalex/price/Price_YAMZ/zapch/530.csv'
            DELIMITER ';'
            CSV HEADER
            ENCODING 'UTF8'
        `);

        // 4. Загружаем данные запчастей 650 ЯМЗ из CSV
        console.log('📥 Загружаем запчасти 650...');
        await client.query(`
            COPY yamz_zapch_650_price (article, price_with_nds)
            FROM 'D:/Aartalex/price/Price_YAMZ/zapch/650.csv'
            DELIMITER ';'
            CSV HEADER
            ENCODING 'UTF8'
        `);

        // 5. Загружаем данные запчастей ЗиП ЯМЗ из CSV
        console.log('📥 Загружаем запчасти ЗиП...');
        await client.query(`
            COPY yamz_zapch_zip_price (article, price_with_nds)
            FROM 'D:/Aartalex/price/Price_YAMZ/zapch/zip.csv'
            DELIMITER ';'
            CSV HEADER
            ENCODING 'UTF8'
        `);

        // 6. Загружаем данные двигатели V-образные ЯМЗ из CSV
        console.log('📥 Загружаем Двигатели V-образные...');
        await client.query(`
            COPY yamz_dvig_v_price (article, price_with_nds)
            FROM 'D:/Aartalex/price/Price_YAMZ/dvig/V.csv'
            DELIMITER ';'
            CSV HEADER
            ENCODING 'UTF8'
        `);

        // 7. Загружаем данные двигатели рядные ЯМЗ из CSV
        console.log('📥 Загружаем Двигатели рядные...');
        await client.query(`
            COPY yamz_dvig_ryd_price (article, price_with_nds)
            FROM 'D:/Aartalex/price/Price_YAMZ/dvig/ryd.csv'
            DELIMITER ';'
            CSV HEADER
            ENCODING 'UTF8'
        `);
        
        // 8. Обновляем цены в products
        console.log('💰 Обновляем цены товаров...');
        
        // Сначала сбрасываем цены у всех товаров
        await client.query(`
            UPDATE products 
            SET price_yamz = NULL 
        `);
        
        // 9. Обновляем цены для Запчастей и Двигателей ЯМЗ
        await client.query(`
            UPDATE products p
            SET price_yamz = CAST(ROUND(t.price_with_nds * 1.10) AS INTEGER)
            FROM yamz_zapch_price t
            WHERE 
                regexp_replace(p.article, '[\\\\.\\\\-\\\\s]', '', 'g') = 
                regexp_replace(t.article, '[\\\\.\\\\-\\\\s]', '', 'g')
            RETURNING p.id_product
        `);
        
        // Обновляем цены для запчастей 530 ЯМЗ
        await client.query(`
            UPDATE products p
            SET price_yamz = CAST(ROUND(t.price_with_nds * 1.10) AS INTEGER)
            FROM yamz_zapch_530_price t
            WHERE 
                regexp_replace(p.article, '[\\\\.\\\\-\\\\s]', '', 'g') = 
                regexp_replace(t.article, '[\\\\.\\\\-\\\\s]', '', 'g')
            RETURNING p.id_product
        `);

        // Обновляем цены для запчастей 650 ЯМЗ
        await client.query(`
            UPDATE products p
            SET price_yamz = CAST(ROUND(t.price_with_nds * 1.10) AS INTEGER)
            FROM yamz_zapch_650_price t
            WHERE 
                regexp_replace(p.article, '[\\\\.\\\\-\\\\s]', '', 'g') = 
                regexp_replace(t.article, '[\\\\.\\\\-\\\\s]', '', 'g')
            RETURNING p.id_product
        `);

        // Обновляем цены для запчастей ЗиП ЯМЗ
        await client.query(`
            UPDATE products p
            SET price_yamz = CAST(ROUND(t.price_with_nds * 1.10) AS INTEGER)
            FROM yamz_zapch_zip_price t
            WHERE 
                regexp_replace(p.article, '[\\\\.\\\\-\\\\s]', '', 'g') = 
                regexp_replace(t.article, '[\\\\.\\\\-\\\\s]', '', 'g')
            RETURNING p.id_product
        `);

        // Обновляем цены для двигателей V-образные ЯМЗ
        await client.query(`
            UPDATE products p
            SET price_yamz = CAST(ROUND(t.price_with_nds * 1.10) AS INTEGER)
            FROM yamz_dvig_v_price t
            WHERE 
                regexp_replace(p.article, '[\\\\.\\\\-\\\\s]', '', 'g') = 
                regexp_replace(t.article, '[\\\\.\\\\-\\\\s]', '', 'g')
            RETURNING p.id_product
        `);

        // Обновляем цены для двигателей рядные ЯМЗ
        await client.query(`
            UPDATE products p
            SET price_yamz = CAST(ROUND(t.price_with_nds * 1.10) AS INTEGER)
            FROM yamz_dvig_ryd_price t
            WHERE 
                regexp_replace(p.article, '[\\\\.\\\\-\\\\s]', '', 'g') = 
                regexp_replace(t.article, '[\\\\.\\\\-\\\\s]', '', 'g')
            RETURNING p.id_product
        `);

        // Устанавливаем основную цену (price) - сначала TMZ, если нет то ЯМЗ
        await client.query(`
            UPDATE products 
            SET price = COALESCE(price_tmz, price_yamz)
        `);
        
        await client.query('COMMIT');
        
        // 10. Получаем статистику
        const stats = await getUpdateStats(client);
        
        console.log('✅ Обновление завершено!');
        console.log('📊 Статистика:');
        console.log(`   - Запчастей: ${stats.zapch_count}`);
        console.log(`   - Запчастей 530: ${stats.zapch_530_count}`);
        console.log(`   - Запчастей 650: ${stats.zapch_650_count}`);
        console.log(`   - Запчастей ЗиП: ${stats.zapch_zip_count}`);
        console.log(`   - Двигателей V-обрызных: ${stats.dvig_v_count}`);
        console.log(`   - Двигателей рядных: ${stats.dvig_ryd_count}`);
        
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
            (SELECT COUNT(*) FROM yamz_zapch_price) as zapch_count,
            (SELECT COUNT(*) FROM yamz_zapch_530_price) as zapch_530_count,
            (SELECT COUNT(*) FROM yamz_zapch_650_price) as zapch_650_count,
            (SELECT COUNT(*) FROM yamz_zapch_zip_price) as zapch_zip_count,
            (SELECT COUNT(*) FROM yamz_dvig_v_price) as dvig_v_count,
            (SELECT COUNT(*) FROM yamz_dvig_ryd_price) as dvig_ryd_count
    `);
    return result.rows[0];
}

// Запускаем обновление
updatePrices().catch(err => {
    console.error('❌ Критическая ошибка:', err);
    process.exit(1);
});