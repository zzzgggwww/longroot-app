/**
 * 模块说明：格式化工具模块：统一处理金额、时间、标签和交易信号显示。
 */
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
  const qty = Number(signal?.qty || 0);
  const fee = Number(signal?.fee || 0);
  const netAmount = Number(signal?.net_amount ?? signal?.netAmount ?? 0);
  const action = signal?.action;

  if (qty > 0 || fee > 0 || netAmount > 0) {
    const grossAmount = action === 'SELL' ? netAmount + fee : amount;
    return {
      amount: grossAmount,
      quantity: qty,
      fee,
      netAmount: action === 'BUY' ? amount + fee : netAmount
    };
  }

  if (action === 'BUY') {
    return {
      amount,
      quantity: price > 0 ? amount / price : 0,
      fee: 0,
      netAmount: amount
    };
  }

  if (action === 'SELL') {
    return {
      amount: amount * price,
      quantity: amount,
      fee: 0,
      netAmount: amount * price
    };
  }

  return {
    amount: 0,
    quantity: 0,
    fee: 0,
    netAmount: 0
  };
}
