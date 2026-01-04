export default () => ({
  environment: process.env.NODE_ENV,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
  },
});
