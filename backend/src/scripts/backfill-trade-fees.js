import { pool, query } from '../db/pool.js';
import { env } from '../config/env.js';

function round(value, digits = 8) {
  return Number(Number(value || 0).toFixed(digits));
}

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

    let totalInvested = 0;
    let totalRealized = 0;
    let totalFees = 0;
    let positionQty = 0;
    let lastPrice = 0;
    let maxExposure = 0;
    let maxLoss = 0;

    for (const signal of signals) {
      const action = signal.action;
      const amount = Number(signal.amount || 0);
      const price = Number(signal.price || 0);
      lastPrice = price || lastPrice;

      let qty = 0;
      let fee = 0;
      let netAmount = 0;

      if (action === 'BUY' && amount > 0 && price > 0) {
        fee = round(amount * feeRate);
        netAmount = round(amount + fee);
        qty = round((amount - fee) / price, 12);

        totalInvested = round(totalInvested + netAmount);
        totalFees = round(totalFees + fee);
        positionQty = round(positionQty + qty, 12);
      } else if (action === 'SELL' && amount > 0 && price > 0) {
        qty = round(Math.min(positionQty, amount), 12);
        const grossAmount = round(qty * price);
        fee = round(grossAmount * feeRate);
        netAmount = round(grossAmount - fee);

        totalRealized = round(totalRealized + netAmount);
        totalFees = round(totalFees + fee);
        positionQty = round(positionQty - qty, 12);
      }

      const positionValue = round(positionQty * lastPrice);
      maxExposure = Math.max(maxExposure, round(totalInvested - totalRealized));
      maxLoss = Math.max(maxLoss, round(totalInvested - totalRealized - positionValue));

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

    const positionValue = round(positionQty * lastPrice);

    await query(
      `UPDATE positions
          SET total_invested = :totalInvested,
              total_realized = :totalRealized,
              total_fees = :totalFees,
              position_qty = :positionQty,
              position_value = :positionValue,
              max_exposure = :maxExposure,
              max_loss = :maxLoss
        WHERE project_id = :projectId`,
      {
        projectId: project.id,
        totalInvested,
        totalRealized,
        totalFees,
        positionQty,
        positionValue,
        maxExposure,
        maxLoss
      }
    );

    console.log(`Backfilled project ${project.id}: fees=${totalFees}, invested=${totalInvested}, realized=${totalRealized}, qty=${positionQty}`);
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
