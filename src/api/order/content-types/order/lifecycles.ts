// src/api/orders/content-types/order/lifecycles.ts

export default {
  async afterCreate(event: any) {
    const { result } = event;

    // Изпрати email само ако записът е published (не е draft)
    if (!result.publishedAt) {
      strapi.log.info(`⏭️ Skipping email for draft order #${result.id}`);
      return;
    }

    // Минимален, сигурен email без сложна логика
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
          <p><strong>Продукти:</strong> ${result.products ? result.products.length + ' продукта' : 'N/A'}</p>
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