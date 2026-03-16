import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { env } from './config/env.js';
import { startScheduler } from './modules/tasks/scheduler.js';
import { ensureAdminSeedUser } from './modules/auth/auth.service.js';
import { pool } from './db/pool.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', router);
app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  await ensureAdminSeedUser();
  startScheduler();

  app.listen(env.port, () => {
    console.log(`LongRoot API listening on :${env.port}`);
  });
}

bootstrap().catch(async (error) => {
  console.error('Failed to bootstrap app', error);
  await pool.end();
  process.exit(1);
});
