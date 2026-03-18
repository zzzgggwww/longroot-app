/**
 * 模块说明：轻量图标模块：用本地图形组件替代页面级图标依赖。
 */
import React from 'react';

export function BrandMark({ className = '' }) {
  return <span className={`brand-glyph ${className}`.trim()} aria-hidden="true">◈</span>;
}

export function RefreshGlyph() {
  return <span aria-hidden="true">↻</span>;
}

export function SyncGlyph() {
  return <span aria-hidden="true">⇅</span>;
}

export function AddGlyph() {
  return <span aria-hidden="true">＋</span>;
}

export function PauseGlyph() {
  return <span aria-hidden="true">⏸</span>;
}

export function PlayGlyph() {
  return <span aria-hidden="true">▶</span>;
}

export function UserGlyph() {
  return <span aria-hidden="true">◉</span>;
}
