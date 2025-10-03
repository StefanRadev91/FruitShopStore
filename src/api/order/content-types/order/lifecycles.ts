export default {
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