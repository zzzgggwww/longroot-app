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
