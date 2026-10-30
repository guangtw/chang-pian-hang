import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // 开发时把 /api 代理到 miningqwqmusic 的 BFF，前端和后端同源，cookie 也能正常刷新
  const target = env.BFF_TARGET;
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5180,
      proxy: target ? { '/api': { target, changeOrigin: true, cookieDomainRewrite: '' } } : undefined,
    },
    preview: { host: '127.0.0.1', port: 5180 },
  };
});
