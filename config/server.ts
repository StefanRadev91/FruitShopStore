module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('RENDER_EXTERNAL_URL'), // за да работи публично в Render
  app: {
    keys: env.array('APP_KEYS'),
  },
});