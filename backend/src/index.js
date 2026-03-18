/**
 * 模块说明：后端启动入口：装配中间件、路由、错误处理、管理员种子账号和定时任务。
 */
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

// 注册全局中间件：跨域、JSON 解析、请求日志、业务路由与错误处理。
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', router);
app.use(notFoundHandler);
app.use(errorHandler);

// 启动顺序：先保证管理员存在，再启动定时任务，最后监听端口。
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
