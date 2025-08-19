/**
 * 性能优化工具
 * 用于减少页面抖动和提升用户体验
 */

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 预加载图片
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// 预加载多个图片
export function preloadImages(sources: string[]): Promise<void[]> {
  return Promise.all(sources.map(preloadImage))
}

// 防止页面抖动
export function preventLayoutShift() {
  // 设置视口高度变量，防止移动端地址栏导致的布局抖动
  const setVH = () => {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }

  setVH()
  window.addEventListener('resize', debounce(setVH, 100))
  window.addEventListener('orientationchange', debounce(setVH, 100))
}

// 优化滚动性能
export function optimizeScroll() {
  // 使用 passive 监听器提升滚动性能
  const options = { passive: true }

  // 优化滚动事件
  window.addEventListener('scroll', () => {}, options)
  window.addEventListener('touchmove', () => {}, options)
  window.addEventListener('wheel', () => {}, options)
}

// 预加载关键资源
export function preloadCriticalResources() {
  // 预加载字体
  const font = document.createElement('link')
  font.rel = 'preload'
  font.as = 'font'
  font.type = 'font/woff2'
  font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
  document.head.appendChild(font)
}

// 优化图片加载
export function optimizeImageLoading() {
  // 使用 Intersection Observer 懒加载图片
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            imageObserver.unobserve(img)
          }
        }
      })
    })

    // 观察所有带有 data-src 属性的图片
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img)
    })
  }
}

// 初始化性能优化
export function initPerformanceOptimizations() {
  // 防止布局抖动
  preventLayoutShift()

  // 优化滚动性能
  optimizeScroll()

  // 预加载关键资源
  preloadCriticalResources()

  // 优化图片加载
  optimizeImageLoading()

        // 设置页面可见性API
  if ('hidden' in document) {
    let originalTitle = document.title
    let isHidden = false

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面隐藏时的优化
        if (!isHidden) {
          originalTitle = document.title
          document.title = '页面已隐藏'
          isHidden = true
        }
      } else {
        // 页面显示时的优化
        if (isHidden) {
          document.title = originalTitle
          isHidden = false
        }
      }
    })

    // 定期更新originalTitle，确保与当前标题同步
    setInterval(() => {
      if (!isHidden && document.title !== '页面已隐藏') {
        originalTitle = document.title
      }
    }, 1000)
  }
}

// 路由切换优化
export function optimizeRouteTransition() {
  // 预加载下一个可能的路由
  const preloadNextRoute = () => {
    // 这里可以根据用户行为预测下一个页面
    // 例如：如果用户在首页，预加载文章列表页
  }

  // 监听用户行为
  document.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'A') {
      const anchor = target as HTMLAnchorElement
      if (anchor.href) {
        // 预加载链接指向的页面
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = anchor.href
        document.head.appendChild(link)
      }
    }
  })
}

// 内存优化
export function optimizeMemory() {
  // 清理不需要的事件监听器
  const cleanupEventListeners = () => {
    // 在组件卸载时调用
  }

  // 清理定时器
  const cleanupTimers = () => {
    // 清理所有定时器
  }

  return {
    cleanupEventListeners,
    cleanupTimers
  }
}

// 导出所有优化函数
export default {
  debounce,
  throttle,
  preloadImage,
  preloadImages,
  preventLayoutShift,
  optimizeScroll,
  preloadCriticalResources,
  optimizeImageLoading,
  initPerformanceOptimizations,
  optimizeRouteTransition,
  optimizeMemory
}
