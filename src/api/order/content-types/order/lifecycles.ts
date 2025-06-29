// src/api/orders/content-types/order/lifecycles.ts

export default {
  async afterCreate(event: any) {
    const { result } = event;

    // Log that the hook fired and dump the entire result
    strapi.log.info(`🐞 afterCreate fired for order #${result.id}`, result);

    // Try sending a minimal email and throw any errors so they show up in the API response
    try {
      await strapi.plugin('email').service('email').send({
        to: process.env.SMTP_USER,
        subject: `Нова поръчка #${result.id}`,
        html: `<p>Order #${result.id}</p>`,
      });
      strapi.log.info(`✅ Email sent for order #${result.id}`);
    } catch (err) {
      strapi.log.error(`❌ Email error for order #${result.id}`, err);
      // re-throw so Postman (or the client) sees the full error details
      throw err;
    }
  },
};