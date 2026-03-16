import { env } from '../../config/env.js';

const INTERVAL_MAP = { H: '1h', D: '1d', W: '1w' };

export async function fetchKlines(symbol, period, limit = env.marketBootstrapCandles) {
  const interval = INTERVAL_MAP[period];
  const url = new URL('/api/v3/klines', env.binanceBaseUrl);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance klines request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.map((item) => ({
    openTime: new Date(item[0]),
    closePrice: Number(item[4])
  }));
}

export async function fetchTickerPrice(symbol) {
  const url = new URL('/api/v3/ticker/price', env.binanceBaseUrl);
  url.searchParams.set('symbol', symbol);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance ticker request failed: ${response.status}`);
  }

  const data = await response.json();
  return Number(data.price);
}
