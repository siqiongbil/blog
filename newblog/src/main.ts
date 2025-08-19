import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'

import App from './App'
import router from './router'
import i18n from './i18n'
import { initPerformanceOptimizations } from './utils/performance'

// 初始化性能优化
initPerformanceOptimizations()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(naive)

app.mount('#app')
