/**
 * 模块说明：行情服务：负责从 Binance 拉取 K 线与最新价格。
 */
import { env } from '../../config/env.js';

const INTERVAL_MAP = { H: '1h', D: '1d', W: '1w' };
const INTERVAL_MS_MAP = {
  H: 60 * 60 * 1000,
  D: 24 * 60 * 60 * 1000,
  W: 7 * 24 * 60 * 60 * 1000
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error) {
  const status = Number(error?.status || 0);
  if ([408, 429].includes(status)) return true;
  if (status >= 500) return true;
  if (error?.name === 'AbortError') return true;
  if (error?.isNetworkError) return true;
  return false;
}

async function fetchWithRetry(url, label) {
  const maxRetries = Math.max(Number(env.marketRequestRetryCount || 3), 0);
  const baseDelay = Math.max(Number(env.marketRequestRetryDelayMs || 500), 0);
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const error = new Error(`${label} request failed: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return response;
    } catch (error) {
      const wrappedError = error?.status
        ? error
        : Object.assign(new Error(`${label} network request failed: ${error.message}`), {
          cause: error,
          isNetworkError: true
        });

      lastError = wrappedError;
      if (attempt >= maxRetries || !shouldRetry(wrappedError)) {
        throw wrappedError;
      }

      const delay = baseDelay * (attempt + 1);
      await sleep(delay);
    }
  }

  throw lastError;
}

export function getPeriodIntervalMs(period) {
  return INTERVAL_MS_MAP[period] || INTERVAL_MS_MAP.H;
}

export async function fetchKlines(symbol, period, options = {}) {
  const interval = INTERVAL_MAP[period];
  const url = new URL('/api/v3/klines', env.binanceBaseUrl);
  const limit = Math.min(Number(options.limit ?? env.marketBootstrapCandles ?? 120), 1000);

  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('limit', String(limit));

  if (options.startTime) {
    url.searchParams.set('startTime', String(options.startTime));
  }
  if (options.endTime) {
    url.searchParams.set('endTime', String(options.endTime));
  }

  const response = await fetchWithRetry(url, 'Binance klines');
  const data = await response.json();
  return data.map((item) => ({
    openTime: new Date(item[0]),
    closePrice: Number(item[4])
  }));
}

export async function fetchTickerPrice(symbol) {
  const url = new URL('/api/v3/ticker/price', env.binanceBaseUrl);
  url.searchParams.set('symbol', symbol);

  const response = await fetchWithRetry(url, 'Binance ticker');
  const data = await response.json();
  return Number(data.price);
}
