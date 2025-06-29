// src/api/orders/content-types/order/lifecycles.ts

export default {
  async afterCreate(event: any) {
    const { result } = event;

    // Skip drafts (not published yet)
    if (!result.publishedAt) {
      strapi.log.info(`⏭️ Skip email for draft order #${result.id}`);
      return;
    }

    const {
      id,
      customerName,
      phone,
      address,
      email: customerEmail,
      products,
      notes,
      createdAt,
    } = result;

    // Calculate total amount
    const total = products.reduce((sum: number, p: any) => sum + p.qty * p.price, 0);

    // Generate HTML rows for each product
    const productsRows = products
      .map((p: any) => `
        <tr>
          <td style=\"padding: 8px; border: 1px solid #ddd;\">${p.name}</td>
          <td style=\"padding: 8px; border: 1px solid #ddd; text-align:center;\">${p.qty}</td>
          <td style=\"padding: 8px; border: 1px solid #ddd; text-align:right;\">${p.price.toFixed(2)} лв.</td>
          <td style=\"padding: 8px; border: 1px solid #ddd; text-align:right;\">${(p.qty * p.price).toFixed(2)} лв.</td>
        </tr>
      `)
      .join('');

    // Build the HTML template
    const html = `
      <div style=\"font-family: Arial, sans-serif; color: #333;\">
        <h2 style=\"border-bottom: 2px solid #4CAF50; padding-bottom: 4px;\">Нова поръчка #${id}</h2>
        <p><strong>Дата:</strong> ${new Date(createdAt).toLocaleString('bg-BG')}</p>
        <h3>Детайли за клиент</h3>
        <p>
          Име: ${customerName}<br>
          Телефон: ${phone}<br>
          Адрес: ${address}<br>
          Email: ${customerEmail}
        </p>
        <h3>Продукти</h3>
        <table style=\"width:100%; border-collapse: collapse; margin-bottom:16px;\">
          <thead>
            <tr style=\"background-color: #f5f5f5;\">
              <th style=\"padding: 8px; border: 1px solid #ddd; text-align:left;\">Продукт</th>
              <th style=\"padding: 8px; border: 1px solid #ddd; text-align:center;\">Кол-во</th>
              <th style=\"padding: 8px; border: 1px solid #ddd; text-align:right;\">Ед. цена</th>
              <th style=\"padding: 8px; border: 1px solid #ddd; text-align:right;\">Сума</th>
            </tr>
          </thead>
          <tbody>
            ${productsRows}
            <tr>
              <td colspan=\"3\" style=\"padding: 8px; border: 1px solid #ddd; text-align:right;\"><strong>Общо:</strong></td>
              <td style=\"padding: 8px; border: 1px solid #ddd; text-align:right;\"><strong>${total.toFixed(2)} лв.</strong></td>
            </tr>
          </tbody>
        </table>
        ${notes ? `<h3>Бележки</h3><p>${notes}</p>` : ''}
        <p style=\"font-size:0.9em; color:#777;\">Това е автоматично генериран имейл — моля не отговаряйте директно на него.</p>
      </div>
    `;

    try {
      await strapi.plugin('email').service('email').send({
        to: process.env.SMTP_USER,
        replyTo: customerEmail,
        subject: `Нова поръчка #${id}`,
        html,
      });
      strapi.log.info(`✅ Email sent for order #${id}`);
    } catch (error) {
      strapi.log.error(`❌ Failed to send email for order #${id}:`, error);
    }
  },
};