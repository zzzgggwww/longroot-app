/**
 * 模块说明：指标计算服务：负责 MACD 序列计算与买卖信号判定。
 */
export function calculateMacdSeries(closes, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  if (!Array.isArray(closes) || closes.length === 0) return [];

  const ema = (values, period) => {
    const multiplier = 2 / (period + 1);
    let current = values[0];
    return values.map((value, index) => {
      if (index === 0) {
        current = value;
      } else {
        current = (value - current) * multiplier + current;
      }
      return current;
    });
  };

  const shortEma = ema(closes, shortPeriod);
  const longEma = ema(closes, longPeriod);
  const difSeries = closes.map((_, index) => shortEma[index] - longEma[index]);
  const deaSeries = ema(difSeries, signalPeriod);

  return closes.map((close, index) => ({
    close,
    dif: Number(difSeries[index].toFixed(8)),
    dea: Number(deaSeries[index].toFixed(8)),
    macd: Number(((difSeries[index] - deaSeries[index]) * 2).toFixed(8))
  }));
}

function isPeak(value, values) {
  return value >= Math.max(...values);
}

export function evaluateSignal({ latestIndicators, positionValue, takeProfitAmount, buyAmountPerOrder, sellDivisor, positionQty, currentPrice }) {
  if (!latestIndicators || latestIndicators.length < 3) {
    return { action: 'HOLD', amount: 0, reason: '指标不足 3 个周期，暂不触发信号' };
  }

  const recent = latestIndicators.slice(-3);
  const current = recent[recent.length - 1];
  const previous = recent[recent.length - 2];
  const difValues = recent.map((item) => Number(item.dif || 0));
  const deaValues = recent.map((item) => Number(item.dea || 0));

  const difPeak = isPeak(Number(current.dif || 0), difValues);
  const deaFalling = Number(current.dea || 0) < Math.max(...deaValues);
  const priceUpMultiplier = current.close > Number(previous?.close || current.close) ? 1 : 2;
  const priceDownSellMultiplier = current.close > Number(previous?.close || current.close) ? 2 : 1;
  const underLimit = positionValue <= takeProfitAmount;
  const sellBaseQty = Number(((positionQty || 0) / Math.max(sellDivisor || 1, 1)).toFixed(8));
  const scaledSellQty = Number((sellBaseQty * priceDownSellMultiplier).toFixed(8));
  const scaledBuyAmount = Number((buyAmountPerOrder * priceUpMultiplier).toFixed(8));

  if (difPeak && underLimit) {
    return {
      action: 'BUY',
      amount: scaledBuyAmount,
      reason: `DIF 创近 3 周期新高，未触发限红，按价格因子 ${priceUpMultiplier} 放大买入金额`
    };
  }

  if (difPeak && !underLimit && scaledSellQty > 0) {
    return {
      action: 'SELL',
      amount: scaledSellQty,
      reason: `DIF 创近 3 周期新高，但持仓市值已超过限红金额，按价格因子 ${priceDownSellMultiplier} 触发限红卖出`
    };
  }

  if (deaFalling && scaledSellQty > 0) {
    return {
      action: 'SELL',
      amount: scaledSellQty,
      reason: `DEA 低于近 3 周期最高值，按价格因子 ${priceDownSellMultiplier} 缩放卖出数量`
    };
  }

  return {
    action: 'HOLD',
    amount: 0,
    reason: `信号未触发：DIF峰值=${difPeak ? '是' : '否'}，限红=${underLimit ? '未触发' : '已触发'}，DEA回落=${deaFalling ? '是' : '否'}，现价 ${currentPrice}`
  };
}
