import { query } from '../../db/pool.js';
import { fetchKlines, fetchTickerPrice } from './binance.service.js';
import { calculateMacdSeries, evaluateSignal } from './macd.service.js';

export async function syncProjectMarket(project) {
  const klines = await fetchKlines(project.symbol, project.period);
  const closes = klines.map((item) => item.closePrice);
  const macdSeries = calculateMacdSeries(closes);
  const merged = klines.map((kline, index) => ({ ...kline, ...macdSeries[index] }));
  const latest = merged[merged.length - 1];
  const currentPrice = latest?.close ?? await fetchTickerPrice(project.symbol);

  if (latest) {
    await query(
      `INSERT INTO price_indicators (project_id, symbol, period, candle_time, price, dif, dea)
       VALUES (:projectId, :symbol, :period, :candleTime, :price, :dif, :dea)
       ON DUPLICATE KEY UPDATE price = VALUES(price), dif = VALUES(dif), dea = VALUES(dea)`,
      {
        projectId: project.id,
        symbol: project.symbol,
        period: project.period,
        candleTime: latest.openTime.toISOString().slice(0, 19).replace('T', ' '),
        price: latest.close,
        dif: latest.dif,
        dea: latest.dea
      }
    );
  }

  const positionRows = await query('SELECT * FROM positions WHERE project_id = :projectId LIMIT 1', {
    projectId: project.id
  });
  const position = positionRows[0] || {
    total_invested: 0,
    total_realized: 0,
    position_qty: 0,
    position_value: 0,
    max_exposure: 0,
    max_loss: 0
  };

  const signal = evaluateSignal({
    latestIndicators: merged,
    positionValue: Number(position.position_value || 0),
    takeProfitAmount: Number(project.take_profit_amount || 0),
    buyAmountPerOrder: Number(project.buy_amount_per_order || 0),
    sellDivisor: Number(project.sell_divisor || 1),
    positionQty: Number(position.position_qty || 0),
    currentPrice
  });

  if (signal.action === 'BUY' && currentPrice > 0) {
    const qty = Number((signal.amount / currentPrice).toFixed(12));
    position.total_invested = Number(position.total_invested || 0) + signal.amount;
    position.position_qty = Number(position.position_qty || 0) + qty;
  }

  if (signal.action === 'SELL' && signal.amount > 0 && currentPrice > 0) {
    const sellQty = Math.min(Number(position.position_qty || 0), Number(signal.amount || 0));
    const realized = Number((sellQty * currentPrice).toFixed(8));
    position.total_realized = Number(position.total_realized || 0) + realized;
    position.position_qty = Number(position.position_qty || 0) - sellQty;
  }

  position.position_value = Number((Number(position.position_qty || 0) * currentPrice).toFixed(8));
  position.max_exposure = Math.max(Number(position.max_exposure || 0), Number(position.total_invested || 0) - Number(position.total_realized || 0));
  position.max_loss = Math.max(Number(position.max_loss || 0), Number(position.total_invested || 0) - Number(position.total_realized || 0) - position.position_value);

  await query(
    `UPDATE positions
     SET total_invested = :totalInvested,
         total_realized = :totalRealized,
         position_qty = :positionQty,
         position_value = :positionValue,
         max_exposure = :maxExposure,
         max_loss = :maxLoss
     WHERE project_id = :projectId`,
    {
      projectId: project.id,
      totalInvested: Number(position.total_invested || 0),
      totalRealized: Number(position.total_realized || 0),
      positionQty: Number(position.position_qty || 0),
      positionValue: Number(position.position_value || 0),
      maxExposure: Number(position.max_exposure || 0),
      maxLoss: Number(position.max_loss || 0)
    }
  );

  await query(
    `INSERT INTO trade_signals (project_id, signal_time, action, amount, price, reason)
     VALUES (:projectId, NOW(), :action, :amount, :price, :reason)`,
    {
      projectId: project.id,
      action: signal.action,
      amount: Number(signal.amount || 0),
      price: currentPrice,
      reason: signal.reason
    }
  );

  return { ...signal, currentPrice, latestIndicator: latest || null };
}

export async function syncAllProjectsMarket() {
  const projects = await query('SELECT * FROM projects WHERE status = 1 ORDER BY id ASC');
  const results = [];

  for (const project of projects) {
    try {
      const result = await syncProjectMarket(project);
      results.push({ projectId: project.id, projectCode: project.project_code, ok: true, result });
    } catch (error) {
      results.push({ projectId: project.id, projectCode: project.project_code, ok: false, error: error.message });
    }
  }

  return results;
}
