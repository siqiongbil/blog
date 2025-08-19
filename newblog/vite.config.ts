import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false,
        // 可选：重写路径，如果后端不需要/api前缀，可以取消注释下面这行
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
  build: {
    commonjsOptions: {
      include: [/@codemirror\/.*/, /node_modules/],
    },
  },
  optimizeDeps: {
    include: [
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/commands',
      '@codemirror/lang-javascript',
      '@codemirror/theme-one-dark',
    ],
  },
})
