import React from 'react';
import { Tag } from 'antd';
import dayjs from 'dayjs';

export function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function money(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

export function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

export function signalTag(action) {
  if (action === 'BUY') return <Tag color="success">BUY</Tag>;
  if (action === 'SELL') return <Tag color="error">SELL</Tag>;
  if (action === 'HOLD') return <Tag color="processing">HOLD</Tag>;
  return <Tag>-</Tag>;
}

export function statusTag(value) {
  return Number(value) === 1 ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>;
}

export function signalTradeMetrics(signal) {
  const price = Number(signal?.price || 0);
  const amount = Number(signal?.amount || 0);
  const action = signal?.action;

  if (action === 'BUY') {
    return {
      amount,
      quantity: price > 0 ? amount / price : 0
    };
  }

  if (action === 'SELL') {
    return {
      amount: amount * price,
      quantity: amount
    };
  }

  return {
    amount: 0,
    quantity: 0
  };
}
