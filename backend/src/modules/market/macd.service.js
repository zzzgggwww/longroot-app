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

export function evaluateSignal({ latestIndicators, positionValue, takeProfitAmount, buyAmountPerOrder, sellDivisor, positionQty, currentPrice }) {
  if (!latestIndicators || latestIndicators.length < 3) {
    return { action: 'HOLD', amount: 0, reason: '指标不足 3 个周期，暂不触发信号' };
  }

  const recent = latestIndicators.slice(-3);
  const current = recent[recent.length - 1];
  const maxDif = Math.max(...recent.map((item) => item.dif));
  const maxDea = Math.max(...recent.map((item) => item.dea));

  if (positionValue > takeProfitAmount && current.dif === maxDif) {
    const amount = Number((positionQty / Math.max(sellDivisor, 1)).toFixed(8));
    return { action: 'SELL', amount, reason: '持仓市值超过限红金额，且当前 DIF 为最近 3 个周期最大值' };
  }

  if (current.dif === maxDif && positionValue <= takeProfitAmount) {
    return { action: 'BUY', amount: buyAmountPerOrder, reason: '当前 DIF 为最近 3 个周期最大值，且持仓市值未超过限红金额' };
  }

  if (current.dea < maxDea) {
    const amount = Number(((positionQty || 0) / Math.max(sellDivisor, 1)).toFixed(8));
    return { action: 'SELL', amount, reason: '当前 DEA 小于最近 3 个周期 DEA 最大值' };
  }

  return { action: 'HOLD', amount: 0, reason: `信号未触发，现价 ${currentPrice}` };
}
