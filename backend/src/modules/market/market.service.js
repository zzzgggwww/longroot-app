/**
 * 模块说明：行情同步服务：串联行情获取、指标计算、仓位更新、信号落库。
 */
import { query } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { fetchKlines, fetchTickerPrice, getPeriodIntervalMs } from './binance.service.js';
import { calculateMacdSeries, evaluateSignal } from './macd.service.js';
import { applyBuy, applySell, createEmptyPosition, finalizePositionSnapshot } from './pnl.service.js';

function roundAmount(value, digits = 8) {
  return Number(Number(value || 0).toFixed(digits));
}

function toSqlDateTime(date) {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

export async function setProjectSyncStatus(projectId, payload = {}) {
  await query(
    `UPDATE projects
     SET latest_sync_at = :latestSyncAt,
         latest_backfilled_candles = :latestBackfilledCandles,
         latest_sync_error = :latestSyncError
     WHERE id = :projectId`,
    {
      projectId,
      latestSyncAt: payload.latestSyncAt ?? null,
      latestBackfilledCandles: Number(payload.latestBackfilledCandles || 0),
      latestSyncError: payload.latestSyncError ?? null
    }
  );
}

async function getLastSyncedCandleTime(projectId) {
  const rows = await query(
    'SELECT candle_time FROM price_indicators WHERE project_id = :projectId ORDER BY candle_time DESC LIMIT 1',
    { projectId }
  );
  return rows[0]?.candle_time ? new Date(rows[0].candle_time) : null;
}

async function loadPosition(projectId) {
  const positionRows = await query('SELECT * FROM positions WHERE project_id = :projectId LIMIT 1', {
    projectId
  });
  return createEmptyPosition(positionRows[0] || {});
}

async function upsertIndicator(project, indicator) {
  await query(
    `INSERT INTO price_indicators (project_id, symbol, period, candle_time, price, dif, dea)
     VALUES (:projectId, :symbol, :period, :candleTime, :price, :dif, :dea)
     ON DUPLICATE KEY UPDATE price = VALUES(price), dif = VALUES(dif), dea = VALUES(dea)`,
    {
      projectId: project.id,
      symbol: project.symbol,
      period: project.period,
      candleTime: toSqlDateTime(indicator.openTime),
      price: indicator.close,
      dif: indicator.dif,
      dea: indicator.dea
    }
  );
}

async function upsertSignal(projectId, candleTime, signal, currentPrice, tradeQty, tradeFee, netAmount) {
  const signalTime = toSqlDateTime(candleTime);
  const existing = await query(
    'SELECT id FROM trade_signals WHERE project_id = :projectId AND signal_time = :signalTime LIMIT 1',
    { projectId, signalTime }
  );

  const payload = {
    projectId,
    signalTime,
    action: signal.action,
    amount: roundAmount(Number(signal.amount || 0)),
    qty: tradeQty,
    fee: tradeFee,
    netAmount,
    price: currentPrice,
    reason: signal.reason
  };

  if (existing.length) {
    await query(
      `UPDATE trade_signals
       SET action = :action,
           amount = :amount,
           qty = :qty,
           fee = :fee,
           net_amount = :netAmount,
           price = :price,
           reason = :reason
       WHERE id = :id`,
      {
        ...payload,
        id: existing[0].id
      }
    );
    return;
  }

  await query(
    `INSERT INTO trade_signals (project_id, signal_time, action, amount, qty, fee, net_amount, price, reason)
     VALUES (:projectId, :signalTime, :action, :amount, :qty, :fee, :netAmount, :price, :reason)`,
    payload
  );
}

async function savePosition(projectId, position) {
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
      projectId,
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
}

async function buildIndicatorSeries(project, lastSyncedAt) {
  const intervalMs = getPeriodIntervalMs(project.period);
  const bootstrapCandles = Math.max(Number(env.marketBootstrapCandles || 120), 60);

  if (!lastSyncedAt) {
    return fetchKlines(project.symbol, project.period, { limit: bootstrapCandles });
  }

  const preloadStart = new Date(lastSyncedAt.getTime() - intervalMs * Math.min(bootstrapCandles, 120));
  return fetchKlines(project.symbol, project.period, {
    startTime: preloadStart.getTime(),
    limit: 1000
  });
}

// 同步单个项目的市场数据：如果中间有停机缺口，会按 candle 顺序自动回填缺失区间。
export async function syncProjectMarket(project) {
  const lastSyncedAt = await getLastSyncedCandleTime(project.id);
  const klines = await buildIndicatorSeries(project, lastSyncedAt);
  const closes = klines.map((item) => item.closePrice);
  const macdSeries = calculateMacdSeries(closes);
  const merged = klines.map((kline, index) => ({ ...kline, ...macdSeries[index] }));
  const latest = merged[merged.length - 1];
  const currentPrice = latest?.close ?? await fetchTickerPrice(project.symbol);
  const position = await loadPosition(project.id);
  const feeRate = Number(env.binanceSpotTradingFeeRate || 0.001);

  const candlesToReplay = lastSyncedAt
    ? merged.filter((item) => item.openTime.getTime() > lastSyncedAt.getTime())
    : (latest ? [latest] : []);

  let lastSignal = null;

  for (const candle of candlesToReplay) {
    await upsertIndicator(project, candle);

    const currentIndex = merged.findIndex((item) => item.openTime.getTime() === candle.openTime.getTime());
    const signal = evaluateSignal({
      latestIndicators: merged.slice(0, currentIndex + 1),
      positionValue: Number(position.position_value || 0),
      takeProfitAmount: Number(project.take_profit_amount || 0),
      buyAmountPerOrder: Number(project.buy_amount_per_order || 0),
      sellDivisor: Number(project.sell_divisor || 1),
      positionQty: Number(position.position_qty || 0),
      currentPrice: candle.close
    });

    let tradeQty = 0;
    let tradeFee = 0;
    let netAmount = 0;

    if (signal.action === 'BUY' && candle.close > 0) {
      ({ qty: tradeQty, fee: tradeFee, netAmount } = applyBuy(position, {
        amount: Number(signal.amount || 0),
        price: candle.close,
        feeRate
      }));
    }

    if (signal.action === 'SELL' && signal.amount > 0 && candle.close > 0) {
      ({ qty: tradeQty, fee: tradeFee, netAmount } = applySell(position, {
        qty: Number(signal.amount || 0),
        price: candle.close,
        feeRate
      }));
    }

    finalizePositionSnapshot(position, candle.close);
    await upsertSignal(project.id, candle.openTime, signal, candle.close, tradeQty, tradeFee, netAmount);
    lastSignal = { ...signal, currentPrice: candle.close, feeRate, fee: tradeFee, qty: tradeQty, netAmount, latestIndicator: candle };
  }

  if (!candlesToReplay.length && latest) {
    await upsertIndicator(project, latest);
    finalizePositionSnapshot(position, currentPrice);
    lastSignal = {
      action: 'HOLD',
      amount: 0,
      reason: '当前无缺失 candle，本次仅刷新最新指标与持仓快照',
      currentPrice,
      feeRate,
      fee: 0,
      qty: 0,
      netAmount: 0,
      latestIndicator: latest
    };
  }

  await savePosition(project.id, position);

  const result = {
    ...(lastSignal || {
      action: 'HOLD',
      amount: 0,
      reason: '未获取到可用行情数据',
      currentPrice,
      feeRate,
      fee: 0,
      qty: 0,
      netAmount: 0,
      latestIndicator: latest || null
    }),
    backfilledCandles: candlesToReplay.length,
    lastSyncedAt: lastSyncedAt ? toSqlDateTime(lastSyncedAt) : null,
    latestSyncAt: toSqlDateTime(new Date()),
    latestSyncError: null
  };

  await setProjectSyncStatus(project.id, {
    latestSyncAt: result.latestSyncAt,
    latestBackfilledCandles: result.backfilledCandles,
    latestSyncError: null
  });

  return result;
}

export async function syncAllProjectsMarket() {
  const projects = await query('SELECT * FROM projects WHERE status = 1 ORDER BY id ASC');
  const results = [];

  for (const project of projects) {
    try {
      const result = await syncProjectMarket(project);
      results.push({ projectId: project.id, projectCode: project.project_code, ok: true, result });
    } catch (error) {
      const latestSyncAt = toSqlDateTime(new Date());
      await setProjectSyncStatus(project.id, {
        latestSyncAt,
        latestBackfilledCandles: 0,
        latestSyncError: error.message
      });
      results.push({
        projectId: project.id,
        projectCode: project.project_code,
        ok: false,
        error: error.message,
        result: {
          latestSyncAt,
          latestBackfilledCandles: 0,
          latestSyncError: error.message
        }
      });
    }
  }

  return results;
}
