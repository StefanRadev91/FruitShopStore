// src/api/orders/content-types/order/lifecycles.ts

export default {
  async afterCreate(event: any) {
    const { result } = event;

    // Изпрати email само ако записът е published (не е draft)
    if (!result.publishedAt) {
      strapi.log.info(`⏭️ Skipping email for draft order #${result.id}`);
      return;
    }

    // Създаваме HTML таблица с продуктите
    let productsHtml = '<p><strong>Продукти:</strong> Няма</p>';
    
    if (result.products && Array.isArray(result.products) && result.products.length > 0) {
      const productsRows = result.products.map(product => {
        // Почистваме цената от текст и валута
        const cleanPriceStr = product.price 
          ? String(product.price).replace(/[^\d.,]/g, '').replace(',', '.')
          : 'N/A';
        
        let priceDisplay = cleanPriceStr;
        if (cleanPriceStr !== 'N/A' && !isNaN(parseFloat(cleanPriceStr))) {
          const priceBGN = parseFloat(cleanPriceStr);
          const priceEUR = (priceBGN * 0.5113).toFixed(2);
          priceDisplay = `${cleanPriceStr} лв. (${priceEUR} €)`;
        }
        
        return `<tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${product.name || 'N/A'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.qty || 0}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${priceDisplay}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.weight || 'N/A'}</td>
        </tr>`;
      }).join('');
      
      productsHtml = `
        <p><strong>Продукти:</strong></p>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Продукт</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Кол.</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Цена</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Тегло</th>
            </tr>
          </thead>
          <tbody>
            ${productsRows}
          </tbody>
        </table>
      `;
    }

    try {
      await strapi.plugin('email').service('email').send({
        to: process.env.SMTP_USER,
        subject: `Нова поръчка #${result.id} - ${result.customerName || 'N/A'}`,
        html: `
          <h2>Нова поръчка #${result.id}</h2>
          <p><strong>Клиент:</strong> ${result.customerName || 'N/A'}</p>
          <p><strong>Телефон:</strong> ${result.phone || 'N/A'}</p>
          <p><strong>Email:</strong> ${result.email || 'N/A'}</p>
          <p><strong>Адрес:</strong> ${result.address || 'N/A'}</p>
          ${productsHtml}
          ${result.notes ? `<p><strong>Бележки:</strong> ${result.notes}</p>` : ''}
          <p><strong>Дата:</strong> ${new Date().toLocaleString('bg-BG')}</p>
        `,
      });
      strapi.log.info(`✅ Email sent for order #${result.id}`);
    } catch (err) {
      strapi.log.error(`❌ Email error for order #${result.id}`, err);
      // Не хвърляме грешката, за да не спира поръчката
    }
  },
};