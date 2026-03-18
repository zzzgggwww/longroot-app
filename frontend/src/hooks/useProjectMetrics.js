/**
 * 模块说明：项目指标计算 Hook：把项目列表聚合成首页展示所需的统计口径。
 */
import { useMemo } from 'react';

function num(value) {
  return Number(value || 0);
}

export function calcProjectRealizedProfit(item) {
  return num(item?.realized_profit);
}

export function calcProjectUnrealizedProfit(item) {
  return num(item?.position_value) - num(item?.position_cost);
}

export function calcProjectProfit(item) {
  return calcProjectRealizedProfit(item) + calcProjectUnrealizedProfit(item);
}

export function calcProjectNetProfit(item) {
  return num(item?.total_realized) + num(item?.position_value) - num(item?.total_invested);
}

export function calcProjectProfitRate(item) {
  const invested = num(item?.total_invested);
  if (invested <= 0) return 0;
  return calcProjectProfit(item) / invested;
}

// 把项目数组聚合成首页总览指标，避免在组件里散落重复计算逻辑。
export function useProjectMetrics(projects) {
  return useMemo(() => {
    const invested = projects.reduce((sum, item) => sum + num(item.total_invested), 0);
    const realized = projects.reduce((sum, item) => sum + num(item.total_realized), 0);
    const value = projects.reduce((sum, item) => sum + num(item.position_value), 0);
    const cost = projects.reduce((sum, item) => sum + num(item.position_cost), 0);
    const fees = projects.reduce((sum, item) => sum + num(item.total_fees), 0);
    const realizedProfit = projects.reduce((sum, item) => sum + calcProjectRealizedProfit(item), 0);
    const unrealizedProfit = projects.reduce((sum, item) => sum + calcProjectUnrealizedProfit(item), 0);
    const profit = realizedProfit + unrealizedProfit;
    const netProfit = projects.reduce((sum, item) => sum + calcProjectNetProfit(item), 0);
    const profitRate = invested > 0 ? profit / invested : 0;

    return {
      total: projects.length,
      enabled: projects.filter((item) => Number(item.status) === 1).length,
      invested,
      realized,
      value,
      cost,
      fees,
      realizedProfit,
      unrealizedProfit,
      profit,
      netProfit,
      profitRate
    };
  }, [projects]);
}
