// server/telegramService.js
const axios = require('axios');
require('dotenv').config();

// Получаем список chat_id из переменных окружения
const getChatIds = () => {
    const chatIds = [];
    
    // Основной chat_id
    if (process.env.TELEGRAM_CHAT_ID) {
        chatIds.push(process.env.TELEGRAM_CHAT_ID);
    }
    
    // Второй chat_id
    if (process.env.TELEGRAM_CHAT_ID_2) {
        chatIds.push(process.env.TELEGRAM_CHAT_ID_2);
    }
    
    // Третий chat_id
    if (process.env.TELEGRAM_CHAT_ID_3) {
        chatIds.push(process.env.TELEGRAM_CHAT_ID_3);
    }
    
    return chatIds.filter(id => id); // Убираем пустые значения
};

// Функция для отправки заказа в Telegram всем пользователям
// Функция для отправки заказа в Telegram всем пользователям
async function sendOrderToTelegram(orderData) {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatIds = getChatIds();
        
        if (!token || chatIds.length === 0) {
            console.warn('⚠️ Telegram токен или Chat ID не настроены');
            return { success: false, message: 'Telegram не настроен' };
        }
        
        // Рассчитываем общую сумму
        let totalPrice = 0;
        let hasPrices = false;
        
        if (orderData.cart && orderData.cart.length > 0) {
            orderData.cart.forEach(item => {
                if (item.price && item.price > 0) {
                    totalPrice += item.price * item.quantity;
                    hasPrices = true;
                }
            });
        }
        
        // Формируем сообщение для Telegram
        let message = `🛒 *НОВЫЙ ЗАКАЗ С САЙТА*\n`;
        message += `📅 *Дата:* ${orderData.date}\n`;
        message += `👤 *Клиент:* ${orderData.name}\n`;
        message += `📞 *Телефон:* ${orderData.phone}\n`;
        
        if (orderData.email) {
            message += `📧 *Email:* ${orderData.email}\n`;
        }

        if (orderData.city) {
            message += `📍 *Город:* ${orderData.city}\n`;
        }
        
        message += `\n*📦 СОСТАВ ЗАКАЗА:*\n`;
        message += `\`\`\`\n`;
        
        let totalItems = 0;
        if (orderData.cart && orderData.cart.length > 0) {
            orderData.cart.forEach((item, index) => {
                totalItems += item.quantity;
                message += `${index + 1}. ${item.name}\n`;
                message += `   Количество: ${item.quantity}\n`;
                if (item.price && item.price > 0) {
                    message += `   Цена: ${item.price} ₽\n`;
                    message += `   Сумма: ${item.price * item.quantity} ₽\n`;
                } else {
                    message += `   Цена: по запросу\n`;
                }
                if (index < orderData.cart.length - 1) message += `\n`;
            });
        }
        
        message += `\`\`\`\n`;
        message += `📊 *Итого товаров:* ${totalItems} шт.\n`;
        
        // Добавляем общую сумму если есть цены
        if (hasPrices) {
            message += `💰 *Общая сумма:* ${totalPrice} ₽\n`;
        } else if (orderData.cart && orderData.cart.length > 0) {
            message += `💰 *Общая сумма:* Цена по запросу\n`;
        }
        
        if (orderData.message) {
            message += `\n💬 *КОММЕНТАРИЙ КЛИЕНТА:*\n`;
            message += `${orderData.message}\n`;
        }
        
        // Отправляем сообщение всем пользователям
        const results = [];
        for (const chatId of chatIds) {
            try {
                const response = await axios.post(
                    `https://api.telegram.org/bot${token}/sendMessage`,
                    {
                        chat_id: chatId,
                        text: message,
                        parse_mode: 'Markdown',
                        disable_web_page_preview: true
                    }
                );
                results.push({ chatId, success: true, messageId: response.data.result.message_id });
                console.log(`✅ Сообщение отправлено в Telegram для chat_id: ${chatId}`);
            } catch (error) {
                console.error(`❌ Ошибка отправки для chat_id ${chatId}:`, error.message);
                results.push({ chatId, success: false, error: error.message });
            }
        }
        
        // Проверяем, были ли успешные отправки
        const successfulSends = results.filter(r => r.success);
        return { 
            success: successfulSends.length > 0, 
            results: results,
            message: successfulSends.length === chatIds.length 
                ? 'Все сообщения отправлены' 
                : `Отправлено ${successfulSends.length} из ${chatIds.length} сообщений`
        };
        
    } catch (error) {
        console.error('❌ Ошибка отправки в Telegram:', error.response?.data || error.message);
        return { 
            success: false, 
            error: error.response?.data?.description || error.message 
        };
    }
}

// Функция для отправки уведомления всем пользователям
async function sendTelegramNotification(text) {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatIds = getChatIds();
        
        if (!token || chatIds.length === 0) {
            return { success: false, message: 'Telegram не настроен' };
        }
        
        // Отправляем всем пользователям
        const results = [];
        for (const chatId of chatIds) {
            try {
                await axios.post(
                    `https://api.telegram.org/bot${token}/sendMessage`,
                    {
                        chat_id: chatId,
                        text: text,
                        parse_mode: 'HTML'
                    }
                );
                results.push({ chatId, success: true });
            } catch (error) {
                results.push({ chatId, success: false, error: error.message });
            }
        }
        
        const successfulSends = results.filter(r => r.success);
        return { 
            success: successfulSends.length > 0, 
            results: results
        };
        
    } catch (error) {
        console.error('Ошибка отправки уведомления в Telegram:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { 
    sendOrderToTelegram,
    sendTelegramNotification 
};