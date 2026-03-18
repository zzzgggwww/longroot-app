/**
 * 模块说明：盈亏计算服务：负责买入/卖出时的持仓、成本、收益和快照更新。
 */
function round(value, digits = 8) {
  return Number(Number(value || 0).toFixed(digits));
}

function roundQty(value, digits = 12) {
  return round(value, digits);
}

export function createEmptyPosition(position = {}) {
  return {
    total_invested: Number(position.total_invested || 0),
    total_realized: Number(position.total_realized || 0),
    total_fees: Number(position.total_fees || 0),
    position_qty: Number(position.position_qty || 0),
    position_value: Number(position.position_value || 0),
    position_cost: Number(position.position_cost || 0),
    avg_cost_price: Number(position.avg_cost_price || 0),
    realized_profit: Number(position.realized_profit || 0),
    max_exposure: Number(position.max_exposure || 0),
    max_loss: Number(position.max_loss || 0)
  };
}

export function applyBuy(position, { amount, price, feeRate }) {
  const grossAmount = Number(amount || 0);
  const tradeFee = round(grossAmount * Number(feeRate || 0));
  const netCashOutflow = round(grossAmount + tradeFee);
  const tradeQty = price > 0 ? roundQty((grossAmount - tradeFee) / price) : 0;

  position.total_invested = round(position.total_invested + netCashOutflow);
  position.total_fees = round(position.total_fees + tradeFee);
  position.position_qty = roundQty(position.position_qty + tradeQty);
  position.position_cost = round(position.position_cost + netCashOutflow);
  position.avg_cost_price = position.position_qty > 0 ? round(position.position_cost / position.position_qty) : 0;

  return {
    qty: tradeQty,
    fee: tradeFee,
    netAmount: netCashOutflow
  };
}

export function applySell(position, { qty, price, feeRate }) {
  const tradeQty = roundQty(Math.min(position.position_qty, Number(qty || 0)));
  const grossAmount = round(tradeQty * Number(price || 0));
  const tradeFee = round(grossAmount * Number(feeRate || 0));
  const netCashInflow = round(grossAmount - tradeFee);
  const avgCostPrice = position.position_qty > 0 ? position.position_cost / position.position_qty : 0;
  const soldCost = round(tradeQty * avgCostPrice);
  const realizedProfit = round(netCashInflow - soldCost);

  position.total_realized = round(position.total_realized + netCashInflow);
  position.total_fees = round(position.total_fees + tradeFee);
  position.position_qty = roundQty(position.position_qty - tradeQty);
  position.position_cost = round(Math.max(0, position.position_cost - soldCost));
  position.realized_profit = round(position.realized_profit + realizedProfit);
  position.avg_cost_price = position.position_qty > 0 ? round(position.position_cost / position.position_qty) : 0;

  return {
    qty: tradeQty,
    fee: tradeFee,
    netAmount: netCashInflow,
    realizedProfit,
    soldCost
  };
}

export function finalizePositionSnapshot(position, currentPrice) {
  const price = Number(currentPrice || 0);
  position.position_value = round(position.position_qty * price);
  position.avg_cost_price = position.position_qty > 0 ? round(position.position_cost / position.position_qty) : 0;
  position.max_exposure = Math.max(position.max_exposure, round(position.total_invested - position.total_realized));
  position.max_loss = Math.max(position.max_loss, round(position.total_invested - position.total_realized - position.position_value));

  const unrealizedProfit = round(position.position_value - position.position_cost);
  const totalProfit = round(position.realized_profit + unrealizedProfit);
  const netProfit = round(position.total_realized + position.position_value - position.total_invested);

  return {
    unrealizedProfit,
    totalProfit,
    netProfit
  };
}
