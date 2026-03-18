/**
 * 模块说明：前端常量模块：统一管理 API 地址、本地存储 key 和项目默认值。
 */
export const defaultApiBase = `${window.location.protocol}//${window.location.hostname}:3000/api`;
export const API_BASE = import.meta.env.VITE_API_BASE || defaultApiBase;
export const TOKEN_KEY = 'longroot_token';
export const USER_KEY = 'longroot_user';

export function defaultProjectForm() {
  return {
    symbol: 'BTCUSDT',
    period: 'H',
    buyAmountPerOrder: 100,
    takeProfitMultiple: 2,
    sellDivisor: 4,
    status: 1
  };
}
