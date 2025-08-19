/**
 * 性能优化工具函数
 */

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @param immediate 是否立即执行
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: number | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)
    timeout = window.setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param limit 限制时间（毫秒）
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 请求动画帧节流
 * @param func 要节流的函数
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let ticking = false

  return function executedFunction(...args: Parameters<T>) {
    if (!ticking) {
      requestAnimationFrame(() => {
        func(...args)
        ticking = false
      })
      ticking = true
    }
  }
}

/**
 * 缓存函数结果
 * @param func 要缓存的函数
 * @param resolver 缓存键解析器
 */
export function memoize<T extends (...args: any[]) => any, K = string>(
  func: T,
  resolver?: (...args: Parameters<T>) => K
): T {
  const cache = new Map<K, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args) as K

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * 懒加载图片
 * @param img 图片元素
 * @param src 图片源
 */
export function lazyLoadImage(img: HTMLImageElement, src: string): void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        img.src = src
        observer.unobserve(img)
      }
    })
  })

  observer.observe(img)
}

/**
 * 虚拟滚动工具
 */
export class VirtualScroller {
  private container: HTMLElement
  private itemHeight: number
  private totalItems: number
  private visibleItems: number
  private scrollTop: number = 0

  constructor(
    container: HTMLElement,
    itemHeight: number,
    totalItems: number,
    visibleItems: number
  ) {
    this.container = container
    this.itemHeight = itemHeight
    this.totalItems = totalItems
    this.visibleItems = visibleItems

    this.init()
  }

  private init(): void {
    this.container.style.height = `${this.totalItems * this.itemHeight}px`
    this.container.style.position = 'relative'

    this.container.addEventListener('scroll', this.handleScroll.bind(this))
  }

  private handleScroll(): void {
    this.scrollTop = this.container.scrollTop
    this.updateVisibleItems()
  }

  private updateVisibleItems(): void {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight)
    const endIndex = Math.min(startIndex + this.visibleItems, this.totalItems)

    // 触发更新事件
    this.container.dispatchEvent(new CustomEvent('virtual-scroll-update', {
      detail: { startIndex, endIndex }
    }))
  }

  public destroy(): void {
    this.container.removeEventListener('scroll', this.handleScroll.bind(this))
  }
}

/**
 * 性能监控
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number> = new Map()

  /**
   * 开始计时
   */
  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * 结束计时并测量
   */
  measure(name: string, startMark: string, endMark?: string): void {
    const start = this.marks.get(startMark)
    const end = endMark ? this.marks.get(endMark) : performance.now()

    if (start && end) {
      this.measures.set(name, end - start)
    }
  }

  /**
   * 获取测量结果
   */
  getMeasure(name: string): number | undefined {
    return this.measures.get(name)
  }

  /**
   * 清除所有标记和测量
   */
  clear(): void {
    this.marks.clear()
    this.measures.clear()
  }

  /**
   * 打印性能报告
   */
  printReport(): void {
    console.group('性能报告')
    this.measures.forEach((value, key) => {
      console.log(`${key}: ${value.toFixed(2)}ms`)
    })
    console.groupEnd()
  }
}

/**
 * 全局性能监控实例
 */
export const performanceMonitor = new PerformanceMonitor()

/**
 * 批量DOM操作优化
 */
export class BatchDOM {
  private operations: (() => void)[] = []
  private scheduled = false

  /**
   * 添加DOM操作
   */
  add(operation: () => void): void {
    this.operations.push(operation)
    this.schedule()
  }

  /**
   * 调度执行
   */
  private schedule(): void {
    if (!this.scheduled) {
      this.scheduled = true
      requestAnimationFrame(() => {
        this.execute()
      })
    }
  }

  /**
   * 执行所有操作
   */
  private execute(): void {
    const operations = [...this.operations]
    this.operations = []
    this.scheduled = false

    operations.forEach(operation => operation())
  }
}

/**
 * 全局批量DOM操作实例
 */
export const batchDOM = new BatchDOM()

/**
 * 图片预加载
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      img.src = url
    })
  })

  return Promise.all(promises)
}

/**
 * 资源预加载
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image'): Promise<void> {
  return new Promise((resolve, reject) => {
    let element: HTMLElement

    switch (type) {
      case 'script':
        element = document.createElement('script')
        element.src = url
        break
      case 'style':
        element = document.createElement('link')
        element.setAttribute('rel', 'stylesheet')
        element.setAttribute('href', url)
        break
      case 'image':
        element = document.createElement('img')
        element.src = url
        break
    }

    element.onload = () => resolve()
    element.onerror = () => reject(new Error(`Failed to load resource: ${url}`))

    document.head.appendChild(element)
  })
}

/**
 * 检测设备性能
 */
export function detectDevicePerformance(): 'low' | 'medium' | 'high' {
  const memory = (performance as any).memory
  const cores = navigator.hardwareConcurrency || 1

  if (memory) {
    const totalMemory = memory.totalJSHeapSize
    const usedMemory = memory.usedJSHeapSize

    if (totalMemory < 50 * 1024 * 1024 || cores < 2) {
      return 'low'
    } else if (totalMemory < 200 * 1024 * 1024 || cores < 4) {
      return 'medium'
    } else {
      return 'high'
    }
  }

  // 基于核心数判断
  if (cores < 2) return 'low'
  if (cores < 4) return 'medium'
  return 'high'
}

/**
 * 根据设备性能调整配置
 */
export function getPerformanceConfig() {
  const performance = detectDevicePerformance()

  switch (performance) {
    case 'low':
      return {
        debounceDelay: 500,
        throttleDelay: 200,
        pageSize: 10,
        enableVirtualScroll: true,
        enableLazyLoad: true
      }
    case 'medium':
      return {
        debounceDelay: 300,
        throttleDelay: 100,
        pageSize: 20,
        enableVirtualScroll: false,
        enableLazyLoad: true
      }
    case 'high':
      return {
        debounceDelay: 200,
        throttleDelay: 50,
        pageSize: 50,
        enableVirtualScroll: false,
        enableLazyLoad: false
      }
  }
}
