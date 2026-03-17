import { query } from '../../db/pool.js';
import { httpError } from '../../utils/http-error.js';

const PERIOD_MAP = { H: 'H', D: 'D', W: 'W' };

function validateProjectInput(input, partial = false) {
  const data = {
    symbol: input.symbol?.toUpperCase(),
    period: input.period?.toUpperCase(),
    buyAmountPerOrder: input.buyAmountPerOrder,
    takeProfitMultiple: input.takeProfitMultiple,
    sellDivisor: input.sellDivisor,
    status: input.status
  };

  if (!partial || data.symbol !== undefined) {
    if (!data.symbol) throw httpError(400, 'symbol 必填');
  }
  if (!partial || data.period !== undefined) {
    if (!PERIOD_MAP[data.period]) throw httpError(400, 'period 仅支持 H/D/W');
  }

  return data;
}

function normalizeLimit(limit, fallback = 20, max = 200) {
  const value = Number(limit);
  if (!Number.isInteger(value) || value <= 0) return fallback;
  return Math.min(value, max);
}

async function generateProjectCode(symbol, period) {
  const prefix = `${symbol}-${period}-`;
  const rows = await query(
    'SELECT COUNT(*) AS count FROM projects WHERE project_code LIKE :prefix',
    { prefix: `${prefix}%` }
  );
  const next = String((rows[0]?.count || 0) + 1).padStart(3, '0');
  return `${prefix}${next}`;
}

export async function listProjects() {
  return query(
    `SELECT p.*, pos.total_invested, pos.total_realized, pos.total_fees, pos.position_qty, pos.position_value,
            pos.max_exposure, pos.max_loss,
            ts.action AS latest_signal_action, ts.reason AS latest_signal_reason, ts.signal_time AS latest_signal_time
     FROM projects p
     LEFT JOIN positions pos ON pos.project_id = p.id
     LEFT JOIN (
       SELECT t1.* FROM trade_signals t1
       INNER JOIN (
         SELECT project_id, MAX(signal_time) AS max_signal_time
         FROM trade_signals GROUP BY project_id
       ) t2 ON t1.project_id = t2.project_id AND t1.signal_time = t2.max_signal_time
     ) ts ON ts.project_id = p.id
     ORDER BY p.id DESC`
  );
}

export async function getProjectById(id) {
  const rows = await query(
    `SELECT p.*, pos.total_invested, pos.total_realized, pos.total_fees, pos.position_qty, pos.position_value,
            pos.max_exposure, pos.max_loss
     FROM projects p
     LEFT JOIN positions pos ON pos.project_id = p.id
     WHERE p.id = :id LIMIT 1`,
    { id }
  );
  if (!rows.length) throw httpError(404, '项目不存在');
  return rows[0];
}

export async function listProjectSignals(id, limit = 20) {
  await getProjectById(id);
  const safeLimit = normalizeLimit(limit);
  return query(
    `SELECT id, project_id, signal_time, action, amount, qty, fee, net_amount, price, reason, created_at
     FROM trade_signals
     WHERE project_id = :id
     ORDER BY signal_time DESC, id DESC
     LIMIT ${safeLimit}`,
    { id }
  );
}

export async function listProjectIndicators(id, limit = 20) {
  await getProjectById(id);
  const safeLimit = normalizeLimit(limit);
  return query(
    `SELECT id, project_id, candle_time, price, dif, dea, created_at
     FROM price_indicators
     WHERE project_id = :id
     ORDER BY candle_time DESC, id DESC
     LIMIT ${safeLimit}`,
    { id }
  );
}

export async function createProject(payload) {
  const data = validateProjectInput(payload);
  const projectCode = await generateProjectCode(data.symbol, data.period);
  const buyAmount = Number(payload.buyAmountPerOrder ?? 0);
  const multiple = Number(payload.takeProfitMultiple ?? 0);
  const sellDivisor = Number(payload.sellDivisor ?? 1);
  const takeProfitAmount = buyAmount * multiple;

  const result = await query(
    `INSERT INTO projects (
      project_code, symbol, period, buy_amount_per_order, take_profit_multiple,
      take_profit_amount, sell_divisor, status
    ) VALUES (
      :projectCode, :symbol, :period, :buyAmount, :multiple,
      :takeProfitAmount, :sellDivisor, :status
    )`,
    {
      projectCode,
      symbol: data.symbol,
      period: data.period,
      buyAmount,
      multiple,
      takeProfitAmount,
      sellDivisor,
      status: Number(payload.status ?? 1)
    }
  );

  await query('INSERT INTO positions (project_id) VALUES (:projectId)', {
    projectId: result.insertId
  });

  return getProjectById(result.insertId);
}

export async function updateProject(id, payload) {
  const current = await getProjectById(id);
  const data = validateProjectInput({
    symbol: current.symbol,
    period: current.period,
    ...payload
  }, true);

  const symbol = data.symbol ?? current.symbol;
  const period = data.period ?? current.period;
  const buyAmount = Number(payload.buyAmountPerOrder ?? current.buy_amount_per_order ?? 0);
  const multiple = Number(payload.takeProfitMultiple ?? current.take_profit_multiple ?? 0);
  const sellDivisor = Number(payload.sellDivisor ?? current.sell_divisor ?? 1);
  const takeProfitAmount = buyAmount * multiple;

  await query(
    `UPDATE projects
     SET symbol = :symbol,
         period = :period,
         buy_amount_per_order = :buyAmount,
         take_profit_multiple = :multiple,
         take_profit_amount = :takeProfitAmount,
         sell_divisor = :sellDivisor,
         status = :status
     WHERE id = :id`,
    {
      id,
      symbol,
      period,
      buyAmount,
      multiple,
      takeProfitAmount,
      sellDivisor,
      status: Number(payload.status ?? current.status ?? 1)
    }
  );

  return getProjectById(id);
}

export async function deleteProject(id) {
  await getProjectById(id);
  await query('DELETE FROM trade_signals WHERE project_id = :id', { id });
  await query('DELETE FROM price_indicators WHERE project_id = :id', { id });
  await query('DELETE FROM positions WHERE project_id = :id', { id });
  await query('DELETE FROM projects WHERE id = :id', { id });
  return { success: true };
}
