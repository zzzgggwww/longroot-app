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
