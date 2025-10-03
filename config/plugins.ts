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
        port: Number(env('SMTP_PORT') || 587),
        secure: false,          // 587 => STARTTLS
        requireTLS: true,       // изрично STARTTLS
        family: 4,              // форсира IPv4
        auth: {
          user: env('SMTP_USER'),
          pass: env('SMTP_PASS'), // 16-символен App Password
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
        logger: true,
        debug: true,
        tls: {
          servername: 'smtp.gmail.com',
          rejectUnauthorized: true,
        },
      },
      settings: {
        defaultFrom: env('SMTP_USER'),
        defaultReplyTo: env('SMTP_USER'),
      },
    },
  },
});