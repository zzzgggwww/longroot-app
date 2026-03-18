/**
 * 模块说明：数据修复脚本：回填历史交易手续费并修正关联持仓数据。
 */
import { pool, query } from '../db/pool.js';
import { env } from '../config/env.js';
import { applyBuy, applySell, createEmptyPosition, finalizePositionSnapshot } from '../modules/market/pnl.service.js';

async function main() {
  const feeRate = Number(env.binanceSpotTradingFeeRate || 0.001);
  const projects = await query('SELECT id FROM projects ORDER BY id ASC');

  for (const project of projects) {
    const signals = await query(
      `SELECT id, action, amount, price, signal_time
         FROM trade_signals
        WHERE project_id = :projectId
        ORDER BY signal_time ASC, id ASC`,
      { projectId: project.id }
    );

    const position = createEmptyPosition();
    let lastPrice = 0;

    for (const signal of signals) {
      const action = signal.action;
      const amount = Number(signal.amount || 0);
      const price = Number(signal.price || 0);
      lastPrice = price || lastPrice;

      let qty = 0;
      let fee = 0;
      let netAmount = 0;

      if (action === 'BUY' && amount > 0 && price > 0) {
        ({ qty, fee, netAmount } = applyBuy(position, { amount, price, feeRate }));
      } else if (action === 'SELL' && amount > 0 && price > 0) {
        ({ qty, fee, netAmount } = applySell(position, { qty: amount, price, feeRate }));
      }

      finalizePositionSnapshot(position, lastPrice);

      await query(
        `UPDATE trade_signals
            SET qty = :qty,
                fee = :fee,
                net_amount = :netAmount
          WHERE id = :id`,
        {
          id: signal.id,
          qty,
          fee,
          netAmount
        }
      );
    }

    finalizePositionSnapshot(position, lastPrice);

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
        totalInvested: position.total_invested,
        totalRealized: position.total_realized,
        totalFees: position.total_fees,
        positionQty: position.position_qty,
        positionValue: position.position_value,
        positionCost: position.position_cost,
        avgCostPrice: position.avg_cost_price,
        realizedProfit: position.realized_profit,
        maxExposure: position.max_exposure,
        maxLoss: position.max_loss
      }
    );

    console.log(
      `Backfilled project ${project.id}: invested=${position.total_invested}, realized=${position.total_realized}, qty=${position.position_qty}, cost=${position.position_cost}, realizedProfit=${position.realized_profit}`
    );
  }
}

main()
  .catch(async (error) => {
    console.error('Backfill failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
