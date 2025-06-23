import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // 实际后端服务地址5320->3000
            target: 'http://localhost:3000/api',
            ws: true,
          },
        },
      },
    },
  };
});
