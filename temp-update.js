
            const { Pool } = require('pg');
            
            async function updatePrices() {
                const pool = new Pool({
                    user: 'postgres',
                    host: 'localhost',
                    database: 'shop_db',
                    password: 'Ra123456',
                    port: 5432,
                });
                
                const client = await pool.connect();
                
                try {
                    await client.query('BEGIN');
                    
                    // Очищаем старые данные
                    await client.query('TRUNCATE TABLE tmz_dvig_price, tmz_zapch_price CASCADE');
                    
                    // Загружаем двигатели
                    await client.query(`
                        COPY tmz_dvig_price (article, price_with_nds)
                        FROM 'D:/Aartalex/uploads/zapch.csv'
                        DELIMITER ';'
                        CSV HEADER
                        ENCODING 'UTF8'
                    `);
                    
                    // Загружаем запчасти
                    await client.query(`
                        COPY tmz_zapch_price (part_name, price_with_nds)
                        FROM 'D:/Aartalex/uploads/zapch.csv'
                        DELIMITER ';'
                        CSV HEADER
                        ENCODING 'UTF8'
                    `);
                    
                    // Обновляем цены товаров
                    await client.query('UPDATE products SET price_tmz = NULL');
                    
                    await client.query(`
                        UPDATE products p
                        SET price_tmz = t.price_with_nds
                        FROM tmz_dvig_price t
                        WHERE p.article = t.article 
                           OR p.first_name ILIKE '%' || t.article || '%'
                    `);
                    
                    await client.query(`
                        UPDATE products p
                        SET price_tmz = t.price_with_nds
                        FROM tmz_zapch_price t
                        WHERE t.part_name ILIKE '%' || p.article || '%'
                    `);
                    
                    // Устанавливаем основную цену
                    await client.query('UPDATE products SET price = COALESCE(price_tmz, price_yamz)');
                    
                    // Получаем статистику
                    const stats = await client.query(`
                        SELECT 
                            (SELECT COUNT(*) FROM tmz_dvig_price) as dvig,
                            (SELECT COUNT(*) FROM tmz_zapch_price) as zapch,
                            (SELECT COUNT(*) FROM products WHERE price_tmz IS NOT NULL) as products_with_price,
                            (SELECT COUNT(*) FROM products) as total_products
                    `);
                    
                    await client.query('COMMIT');
                    
                    return stats.rows[0];
                    
                } catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                } finally {
                    client.release();
                    pool.end();
                }
            }
            
            updatePrices()
                .then(stats => console.log(JSON.stringify({ success: true, stats })))
                .catch(error => console.error(JSON.stringify({ success: false, error: error.message })));
        