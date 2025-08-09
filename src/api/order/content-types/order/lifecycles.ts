// src/api/orders/content-types/order/lifecycles.ts

export default {
  async afterCreate(event: any) {
    const { result } = event;

    // Log that the hook fired and dump the entire result
    strapi.log.info(`🐞 afterCreate fired for order #${result.id}`, result);

    // Изпрати email само ако записът е published (не е draft)
    if (!result.publishedAt) {
      strapi.log.info(`⏭️ Skipping email for draft order #${result.id}`);
      return;
    }

    // Try sending a minimal email and throw any errors so they show up in the API response
    try {
      let productsHtml = '<p><strong>Продукти:</strong> Няма</p>';
      
      if (result.products && Array.isArray(result.products)) {
        const productsRows = result.products.map(product => 
          `<tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${product.name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.qty}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${product.price}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.weight}</td>
          </tr>`
        ).join('');
        
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

      await strapi.plugin('email').service('email').send({
        to: process.env.SMTP_USER,
        subject: `Нова поръчка #${result.id} - ${result.customerName}`,
        html: `
          <h2>Нова поръчка #${result.id}</h2>
          <p><strong>Клиент:</strong> ${result.customerName}</p>
          <p><strong>Телефон:</strong> ${result.phone}</p>
          <p><strong>Email:</strong> ${result.email}</p>
          <p><strong>Адрес:</strong> ${result.address}</p>
          ${productsHtml}
          ${result.notes ? `<p><strong>Бележки:</strong> ${result.notes}</p>` : ''}
          <p><strong>Дата:</strong> ${new Date(result.createdAt).toLocaleString('bg-BG')}</p>
        `,
      });
      strapi.log.info(`✅ Email sent for order #${result.id}`);
    } catch (err) {
      strapi.log.error(`❌ Email error for order #${result.id}`, err);
      // re-throw so Postman (or the client) sees the full error details
      throw err;
    }
  },
};