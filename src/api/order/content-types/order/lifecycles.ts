export default {
  /**
   * beforeCreate hook - Автоматично коригира цените преди записване
   * Ако продуктът има активна промоция (promo === true и promo_price),
   * използва promo_price вместо оригиналната price
   */
  async beforeCreate(event: any) {
    const { data } = event.params;

    // Проверяваме дали има продукти в поръчката
    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
      strapi.log.info('⏭️ No products in order, skipping price validation');
      return;
    }

    strapi.log.info(`🔍 Checking prices for ${data.products.length} products...`);

    // За всеки продукт в поръчката
    for (let i = 0; i < data.products.length; i++) {
      const orderProduct = data.products[i];

      // Ако продуктът няма ID, не можем да го проверим
      if (!orderProduct.id) {
        strapi.log.warn(`⚠️ Product at index ${i} has no ID, skipping price check`);
        continue;
      }

      try {
        // Зареждаме продукта от базата данни (Railway)
        const product = await strapi.entityService.findOne(
          'api::product.product',
          orderProduct.id,
          {
            fields: ['id', 'name', 'price', 'promo_price', 'promo'],
          }
        );

        if (!product) {
          strapi.log.warn(`⚠️ Product #${orderProduct.id} not found in database`);
          continue;
        }

        // Проверяваме дали има активна промоция с попълнена промо цена
        if (product.promo && product.promo_price && product.promo_price.trim() !== '') {
          const oldPrice = orderProduct.price;
          const newPrice = product.promo_price;

          // Заменяме цената с промо цената
          data.products[i].price = newPrice;

          strapi.log.info(
            `✅ Product "${product.name}" (ID: ${orderProduct.id}): ` +
            `Changed price from "${oldPrice}" to "${newPrice}" (promo)`
          );
        } else {
          strapi.log.info(
            `ℹ️ Product "${product.name}" (ID: ${orderProduct.id}): ` +
            `No active promo, keeping original price "${orderProduct.price}"`
          );
        }
      } catch (error: any) {
        strapi.log.error(
          `❌ Error loading product #${orderProduct.id} for price validation: ${error?.message}`
        );
        // Продължаваме с оригиналната цена при грешка
      }
    }

    strapi.log.info('✅ Price validation completed');
  },

  async afterCreate(event: any) {
    const { result } = event;

    // Пращаме имейл **само** ако е published
    if (!result.publishedAt) {
      strapi.log.info(`⏭️ Skipping email for draft order #${result.id}`);
      return;
    }

    // --- HTML за продуктите (твоят код, без промени) ---
    let productsHtml = '<p><strong>Продукти:</strong> Няма</p>';
    if (result.products && Array.isArray(result.products) && result.products.length > 0) {
      const rows = result.products.map((product: any) => {
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
          <td style="padding:8px;border:1px solid #ddd;">${product.name || 'N/A'}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${product.qty || 0}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;">${priceDisplay}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center;">${product.weight || 'N/A'}</td>
        </tr>`;
      }).join('');

      productsHtml = `
        <p><strong>Продукти:</strong></p>
        <table style="width:100%;border-collapse:collapse;margin:10px 0;">
          <thead>
            <tr style="background-color:#f5f5f5;">
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Продукт</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center;">Кол.</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center;">Цена</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:center;">Тегло</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }
    // --- /HTML за продуктите ---

    // --- Изпращане през Resend (HTTPS API) ---
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      const EMAIL_FROM = process.env.EMAIL_FROM || 'orders@darotzemqta.bg';
      const EMAIL_TO = process.env.EMAIL_TO || process.env.SMTP_USER;

      if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
      if (!EMAIL_FROM) throw new Error('Missing EMAIL_FROM');
      if (!EMAIL_TO) throw new Error('Missing EMAIL_TO');

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: EMAIL_TO,
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
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Resend ${res.status}: ${txt}`);
      }
      strapi.log.info(`✅ Email sent via Resend for order #${result.id}`);
    } catch (err: any) {
      strapi.log.error(`❌ Email (Resend) error for order #${result.id}: ${err?.message}`);
      // не хвърляме грешка, за да не спираме поръчката
    }
  },
};