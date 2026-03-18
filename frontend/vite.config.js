/**
 * 模块说明：Vite 构建配置：管理开发服务器、构建拆包和 chunk 提示阈值。
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['trade.l9q.xyz', 'raypenclaw.gate-iwato.ts.net']
  },
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'react-core';
          return undefined;
        }
      }
    }
  }
});
