// ./config/plugins.js
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
    },
  },

  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: Number(env('SMTP_PORT', 587)),
        secure: false, // ако ползваш порт 465 → смени на true
        auth: {
          user: env('SMTP_USER'),
          pass: env('SMTP_PASS'),
        },
        // ↓ По-кратки таймаути, за да не чака дълго при проблем
        connectionTimeout: 5000,  // 5s до установяване на TCP
        greetingTimeout: 5000,    // 5s до SMTP greeting
        socketTimeout: 8000,      // 8s общ socket idle
      },
      settings: {
        defaultFrom: env('SMTP_USER'),
        defaultReplyTo: env('SMTP_USER'),
      },
    },
  },
});