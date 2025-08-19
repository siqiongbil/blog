import type { App } from 'vue'
import { getPerformanceConfig, performanceMonitor } from './performance'

/**
 * Vue性能优化插件
 */
export const performancePlugin = {
  install(app: App) {
    // 获取性能配置
    const config = getPerformanceConfig()

    // 全局性能配置
    app.config.globalProperties.$performanceConfig = config

    // 性能监控
    app.config.globalProperties.$performanceMonitor = performanceMonitor

    // 全局错误处理
    app.config.errorHandler = (err, instance, info) => {
      console.error('Vue Error:', err)
      console.error('Component:', instance)
      console.error('Info:', info)

      // 记录性能错误
      performanceMonitor.measure('vue-error', 'app-start')
    }

    // 全局警告处理
    app.config.warnHandler = (msg, instance, trace) => {
      console.warn('Vue Warning:', msg)
      console.warn('Component:', instance)
      console.warn('Trace:', trace)
    }

    // 优化Element Plus组件
    optimizeElementPlus(app)

    // 优化路由性能
    optimizeRouter(app)

    // 优化响应式性能
    optimizeReactivity(app)

    console.log('性能优化插件已启用，配置:', config)
  }
}

/**
 * 优化Element Plus组件
 */
function optimizeElementPlus(app: App) {
  // 延迟加载图标
  const iconComponents = [
    'Odometer',
    'Document',
    'Collection',
    'PriceTag',
    'Headset',
    'Folder',
    'Setting',
    'ArrowDown',
    'TrendCharts',
    'Plus',
    'Search',
    'EditPen',
    'List',
    'DataAnalysis',
    'Upload',
    'Refresh',
    'Delete'
  ]

  // 预加载常用图标
  iconComponents.forEach(iconName => {
    // 这里可以预加载图标资源
    console.log(`预加载图标: ${iconName}`)
  })
}

/**
 * 优化路由性能
 */
function optimizeRouter(app: App) {
  const router = app.config.globalProperties.$router

  if (router) {
    // 路由懒加载优化
    router.beforeEach((to, from, next) => {
      performanceMonitor.mark(`route-${to.name}-start`)
      next()
    })

    router.afterEach((to) => {
      performanceMonitor.measure(`route-${to.name}`, `route-${to.name}-start`)
    })
  }
}

/**
 * 优化响应式性能
 */
function optimizeReactivity(app: App) {
  // 设置响应式深度限制
  const originalReactive = app.config.globalProperties.$reactive

  if (originalReactive) {
    app.config.globalProperties.$reactive = (obj: any, maxDepth = 3) => {
      return createShallowReactive(obj, maxDepth)
    }
  }
}

/**
 * 创建浅层响应式对象
 */
function createShallowReactive(obj: any, maxDepth: number, currentDepth = 0): any {
  if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => createShallowReactive(item, maxDepth, currentDepth + 1))
  }

  const reactiveObj: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      reactiveObj[key] = createShallowReactive(obj[key], maxDepth, currentDepth + 1)
    }
  }

  return reactiveObj
}

/**
 * 性能优化指令
 */
export const performanceDirectives = {
  // 懒加载指令
  lazy: {
    mounted(el: HTMLElement, binding: any) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (binding.value) {
              el.src = binding.value
            }
            observer.unobserve(el)
          }
        })
      })

      observer.observe(el)
    }
  },

  // 防抖指令
  debounce: {
    mounted(el: HTMLElement, binding: any) {
      const { value, arg = 300 } = binding

      let timer: number | null = null

      el.addEventListener('click', () => {
        if (timer) {
          clearTimeout(timer)
        }

        timer = window.setTimeout(() => {
          if (typeof value === 'function') {
            value()
          }
        }, parseInt(arg))
      })
    }
  },

  // 节流指令
  throttle: {
    mounted(el: HTMLElement, binding: any) {
      const { value, arg = 300 } = binding

      let inThrottle = false

      el.addEventListener('click', () => {
        if (!inThrottle) {
          if (typeof value === 'function') {
            value()
          }
          inThrottle = true
          setTimeout(() => {
            inThrottle = false
          }, parseInt(arg))
        }
      })
    }
  }
}

/**
 * 性能优化混入
 */
export const performanceMixin = {
  data() {
    return {
      $performanceConfig: getPerformanceConfig(),
      $performanceMonitor: performanceMonitor
    }
  },

  methods: {
    // 防抖方法
    $debounce(func: Function, wait: number) {
      let timeout: number | null = null
      return function executedFunction(...args: any[]) {
        const later = () => {
          timeout = null
          func.apply(this, args)
        }
        if (timeout) clearTimeout(timeout)
        timeout = window.setTimeout(later, wait)
      }
    },

    // 节流方法
    $throttle(func: Function, limit: number) {
      let inThrottle: boolean
      return function executedFunction(...args: any[]) {
        if (!inThrottle) {
          func.apply(this, args)
          inThrottle = true
          setTimeout(() => inThrottle = false, limit)
        }
      }
    },

    // 性能监控
    $mark(name: string) {
      this.$performanceMonitor.mark(name)
    },

    $measure(name: string, startMark: string, endMark?: string) {
      this.$performanceMonitor.measure(name, startMark, endMark)
    }
  }
}

/**
 * 组件性能优化装饰器
 */
export function optimizeComponent(target: any) {
  // 添加性能监控
  const originalMounted = target.mounted
  const originalBeforeUnmount = target.beforeUnmount

  target.mounted = function(...args: any[]) {
    this.$mark(`${this.$options.name || 'component'}-mounted-start`)

    if (originalMounted) {
      originalMounted.apply(this, args)
    }

    this.$measure(`${this.$options.name || 'component'}-mounted`, `${this.$options.name || 'component'}-mounted-start`)
  }

  target.beforeUnmount = function(...args: any[]) {
    this.$mark(`${this.$options.name || 'component'}-unmount-start`)

    if (originalBeforeUnmount) {
      originalBeforeUnmount.apply(this, args)
    }

    this.$measure(`${this.$options.name || 'component'}-unmount`, `${this.$options.name || 'component'}-unmount-start`)
  }

  return target
}
