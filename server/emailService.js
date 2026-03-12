// server/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Создаем транспорт для отправки почты
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // true для порта 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Функция для отправки email с заказом
async function sendOrderEmail(orderData) {
    try {
        // Рассчитываем общую сумму
        let totalPrice = 0;
        let hasPrices = false;
        let totalItems = 0;
        
        if (orderData.cart && orderData.cart.length > 0) {
            orderData.cart.forEach(item => {
                totalItems += item.quantity;
                if (item.price && item.price > 0) {
                    totalPrice += item.price * item.quantity;
                    hasPrices = true;
                }
            });
        }
        
        // Формируем HTML таблицу с товарами
let itemsHtml = '';
if (orderData.cart && orderData.cart.length > 0) {
    itemsHtml = `
<div style="margin: 20px 0;">
    <h3 style="color: #444; margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 5px;">
        🛒 Состав заказа (${orderData.cart.length} позиций, ${totalItems} шт.)
    </h3>
    <div style="overflow-x: auto; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <table cellpadding="12" cellspacing="0" style="width: 100%; border-collapse: collapse;">
            <colgroup>
                <col style="width: 5%;">   <!-- № -->
                <col style="width: 50%;">  <!-- Товар -->
                <col style="width: 10%;">  <!-- Кол-во -->
                <col style="width: 15%;">  <!-- Цена -->
                <col style="width: 20%;">  <!-- Сумма -->
            </colgroup>
            <thead>
                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <th style="padding: 12px 15px; text-align: left; border-bottom: 2px solid #ddd;">#</th>
                    <th style="padding: 12px 15px; text-align: left; border-bottom: 2px solid #ddd;">Товар</th>
                    <th style="padding: 12px 15px; text-align: center; border-bottom: 2px solid #ddd;">Кол-во</th>
                    <th style="padding: 12px 15px; text-align: right; border-bottom: 2px solid #ddd;">Цена</th>
                    <th style="padding: 12px 15px; text-align: right; border-bottom: 2px solid #ddd;">Сумма</th>
                </tr>
            </thead>
            <tbody>
                ${orderData.cart.map((item, index) => {
                    const itemTotal = item.price && item.price > 0 ? item.price * item.quantity : 0;
                    const itemPriceDisplay = item.price && item.price > 0 ? `${item.price} ₽` : 'по запросу';
                    const itemTotalDisplay = item.price && item.price > 0 ? `${itemTotal} ₽` : '—';
                    
                    return `
                    <tr style="${index % 2 === 0 ? 'background-color: #f8f9fa;' : 'background-color: white;'}">
                        <td style="padding: 10px 15px; border-bottom: 1px solid #eee; vertical-align: top;">${index + 1}</td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #eee; vertical-align: top; word-break: break-word;">
                            <strong>${item.name}</strong>
                        </td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #eee; text-align: center; vertical-align: top;">
                            <span style="display: inline-block; background-color: #e9ecef; padding: 3px 8px; border-radius: 4px;">
                                ${item.quantity} шт
                            </span>
                        </td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top;">
                            ${itemPriceDisplay}
                        </td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top; font-weight: bold;">
                            ${itemTotalDisplay}
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
            ${hasPrices ? `
            <tfoot>
                <tr style="background-color: #f8f9fa; font-weight: bold; border-top: 2px solid #007bff;">
                    <td colspan="4" style="padding: 15px; text-align: left; font-size: 25px;">Итого:</td>
                    <td style="padding: 15px; text-align: right; color: #e53935; font-size: 25px;">
                        ${totalPrice} ₽
                    </td>
                </tr>
            </tfoot>
            ` : ''}
        </table>
    </div>
</div>
`;
}

        // Текст письма
        const mailOptions = {
            from: `"АРТАЛЕКС ГАЗ" <${process.env.EMAIL_FROM}>`,
            to: process.env.EMAIL_TO,
            subject: `✅ Новый заказ от ${orderData.name || 'Клиента'} ${hasPrices ? `на сумму ${totalPrice} ₽` : ''}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 800px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0;">НОВЫЙ ЗАКАЗ С САЙТА</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9;">${orderData.date}</p>
                    </div>
                    
                    <div style="padding: 20px;">
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #007bff;">
                            <h3 style="color: #444; margin-top: 0;">👤 Контактная информация</h3>
                            <table style="width: 100%;">
                                <tr>
                                    <td style="padding: 5px 0; width: 150px;"><strong>Имя:</strong></td>
                                    <td style="padding: 5px 0;">${orderData.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0;"><strong>Телефон:</strong></td>
                                    <td style="padding: 5px 0;">${orderData.phone}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0;"><strong>Email:</strong></td>
                                    <td style="padding: 5px 0;">${orderData.email || 'Не указан'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0;"><strong>Город:</strong></td>
                                    <td style="padding: 5px 0;">${orderData.city || 'Не указан'}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            ${itemsHtml || '<p>Нет товаров в заказе</p>'}
                        </div>
                        
                        ${orderData.message ? `
                        <div style="background-color: #fff8e1; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                            <h3 style="color: #f57c00; margin-top: 0;">💬 Комментарий клиента:</h3>
                            <p style="font-style: italic;">${orderData.message}</p>
                        </div>
                        ` : ''}
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            Это письмо сгенерировано автоматически. Пожалуйста, не отвечайте на него.
                        </p>
                    </div>
                </div>
            `
        };

        // Отправляем письмо
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email отправлен:', info.messageId);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('❌ Ошибка отправки email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { sendOrderEmail };