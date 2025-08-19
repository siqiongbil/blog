import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// 环境变量配置说明：
// 创建 .env.development 文件并设置：
// VITE_API_BASE_URL=/api
// VITE_STATIC_BASE_URL=https://admin.siqiongbiluo.love

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://admin.siqiongbiluo.love',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/static': {
        target: 'https://admin.siqiongbiluo.love',
        changeOrigin: true,
        secure: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('静态文件代理错误:', err)
          })
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('静态文件代理请求:', req.url)
          })
        },
      },
    },
  },
})
