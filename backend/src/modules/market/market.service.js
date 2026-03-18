/**
 * 模块说明：行情同步服务：串联行情获取、指标计算、仓位更新、信号落库。
 */
import { query } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { fetchKlines, fetchTickerPrice } from './binance.service.js';
import { calculateMacdSeries, evaluateSignal } from './macd.service.js';
import { applyBuy, applySell, createEmptyPosition, finalizePositionSnapshot } from './pnl.service.js';

function roundAmount(value, digits = 8) {
  return Number(Number(value || 0).toFixed(digits));
}

// 同步单个项目的市场数据：拉行情、算指标、评估信号、更新仓位、记录信号。
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
  const position = createEmptyPosition(positionRows[0] || {});

  // 结合最新 MACD 指标与当前仓位，给出 BUY / SELL / HOLD 信号。
  const signal = evaluateSignal({
    latestIndicators: merged,
    positionValue: Number(position.position_value || 0),
    takeProfitAmount: Number(project.take_profit_amount || 0),
    buyAmountPerOrder: Number(project.buy_amount_per_order || 0),
    sellDivisor: Number(project.sell_divisor || 1),
    positionQty: Number(position.position_qty || 0),
    currentPrice
  });

  const feeRate = Number(env.binanceSpotTradingFeeRate || 0.001);
  let tradeQty = 0;
  let tradeFee = 0;
  let netAmount = 0;

  if (signal.action === 'BUY' && currentPrice > 0) {
    ({ qty: tradeQty, fee: tradeFee, netAmount } = applyBuy(position, {
      amount: Number(signal.amount || 0),
      price: currentPrice,
      feeRate
    }));
  }

  if (signal.action === 'SELL' && signal.amount > 0 && currentPrice > 0) {
    ({ qty: tradeQty, fee: tradeFee, netAmount } = applySell(position, {
      qty: Number(signal.amount || 0),
      price: currentPrice,
      feeRate
    }));
  }

  finalizePositionSnapshot(position, currentPrice);

  await query(
    `UPDATE positions
     SET total_invested = :totalInvested,
         total_realized = :totalRealized,
         total_fees = :totalFees,
         position_qty = :positionQty,
         position_value = :positionValue,
         position_cost = :positionCost,
         avg_cost_price = :avgCostPrice,
         realized_profit = :realizedProfit,
         max_exposure = :maxExposure,
         max_loss = :maxLoss
     WHERE project_id = :projectId`,
    {
      projectId: project.id,
      totalInvested: Number(position.total_invested || 0),
      totalRealized: Number(position.total_realized || 0),
      totalFees: Number(position.total_fees || 0),
      positionQty: Number(position.position_qty || 0),
      positionValue: Number(position.position_value || 0),
      positionCost: Number(position.position_cost || 0),
      avgCostPrice: Number(position.avg_cost_price || 0),
      realizedProfit: Number(position.realized_profit || 0),
      maxExposure: Number(position.max_exposure || 0),
      maxLoss: Number(position.max_loss || 0)
    }
  );

  await query(
    `INSERT INTO trade_signals (project_id, signal_time, action, amount, qty, fee, net_amount, price, reason)
     VALUES (:projectId, NOW(), :action, :amount, :qty, :fee, :netAmount, :price, :reason)`,
    {
      projectId: project.id,
      action: signal.action,
      amount: roundAmount(Number(signal.amount || 0)),
      qty: tradeQty,
      fee: tradeFee,
      netAmount,
      price: currentPrice,
      reason: signal.reason
    }
  );

  return { ...signal, currentPrice, feeRate, fee: tradeFee, qty: tradeQty, netAmount, latestIndicator: latest || null };
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
