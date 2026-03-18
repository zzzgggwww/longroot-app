/**
 * 模块说明：行情同步控制器：暴露全量同步和单项目同步接口。
 */
import { asyncHandler } from '../../utils/async-handler.js';
import { query } from '../../db/pool.js';
import { setProjectSyncStatus, syncAllProjectsMarket, syncProjectMarket } from './market.service.js';
import { httpError } from '../../utils/http-error.js';

export const postSyncAll = asyncHandler(async (req, res) => {
  res.json({ results: await syncAllProjectsMarket() });
});

export const postSyncProject = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await query('SELECT * FROM projects WHERE id = :id LIMIT 1', { id });
  if (!rows.length) throw httpError(404, '项目不存在');

  try {
    res.json(await syncProjectMarket(rows[0]));
  } catch (error) {
    await setProjectSyncStatus(id, {
      latestSyncAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      latestBackfilledCandles: 0,
      latestSyncError: error.message
    });
    throw error;
  }
});
