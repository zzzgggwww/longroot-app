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
