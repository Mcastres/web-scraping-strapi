module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', '45b9d0178466a62012d348819ac2c1d3'),
    },
  },
  cron: {
    enabled: true,
  }
});
