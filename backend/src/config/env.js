import dotenv from 'dotenv';

dotenv.config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: required('JWT_SECRET', 'change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  adminSeedUsername: process.env.ADMIN_SEED_USERNAME ?? 'admin',
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD ?? 'Admin123456',
  db: {
    host: required('DB_HOST', '127.0.0.1'),
    port: Number(process.env.DB_PORT ?? 3306),
    name: required('DB_NAME', 'longroot'),
    user: required('DB_USER', 'root'),
    password: process.env.DB_PASSWORD ?? ''
  },
  binanceBaseUrl: process.env.BINANCE_BASE_URL ?? 'https://api.binance.com',
  marketSyncCron: process.env.MARKET_SYNC_CRON ?? '5 * * * *',
  marketBootstrapCandles: Number(process.env.MARKET_BOOTSTRAP_CANDLES ?? 120)
};
