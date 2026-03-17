import { useMemo } from 'react';

export function calcProjectProfit(item) {
  const invested = Number(item?.total_invested || 0);
  const realized = Number(item?.total_realized || 0);
  const value = Number(item?.position_value || 0);
  return realized + value - invested;
}

export function calcProjectProfitRate(item) {
  const invested = Number(item?.total_invested || 0);
  if (invested <= 0) return 0;
  return calcProjectProfit(item) / invested;
}

export function useProjectMetrics(projects) {
  return useMemo(() => {
    const invested = projects.reduce((sum, item) => sum + Number(item.total_invested || 0), 0);
    const value = projects.reduce((sum, item) => sum + Number(item.position_value || 0), 0);
    const profit = projects.reduce((sum, item) => sum + calcProjectProfit(item), 0);
    const profitRate = invested > 0 ? profit / invested : 0;
    return {
      total: projects.length,
      enabled: projects.filter((item) => Number(item.status) === 1).length,
      invested,
      value,
      profit,
      profitRate
    };
  }, [projects]);
}
