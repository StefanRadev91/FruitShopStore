console.log('>>> SMTP_USER', process.env.SMTP_USER);
console.log('>>> SMTP_PASS length', process.env.SMTP_PASS?.length);
export default {
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
      },
    },
  },
  // Добави тази секция за email:
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host:   process.env.SMTP_HOST,
        port:   Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      settings: {
        defaultFrom: process.env.SMTP_USER,
      },
    },
  },
};