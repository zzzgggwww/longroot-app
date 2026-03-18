/**
 * 模块说明：健康检查控制器：提供服务存活状态和基础运行信息。
 */
import { asyncHandler } from '../../utils/async-handler.js';
import { query } from '../../db/pool.js';

export const getHealth = asyncHandler(async (req, res) => {
  const rows = await query('SELECT 1 AS ok');
  res.json({
    name: 'LongRoot API',
    status: rows[0]?.ok === 1 ? 'ok' : 'degraded',
    time: new Date().toISOString()
  });
});
