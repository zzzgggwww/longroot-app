/**
 * 模块说明：定时任务模块：按配置周期自动执行市场同步。
 */
import cron from 'node-cron';
import { env } from '../../config/env.js';
import { syncAllProjectsMarket } from '../market/market.service.js';

let task;

export function startScheduler() {
  if (task) return task;

  task = cron.schedule(env.marketSyncCron, async () => {
    console.log(`[scheduler] market sync started at ${new Date().toISOString()}`);
    const results = await syncAllProjectsMarket();
    console.log('[scheduler] market sync finished', results);
  });

  return task;
}
