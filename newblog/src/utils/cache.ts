/**
 * 数据缓存工具
 * 用于预加载和缓存文章列表数据
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class Cache {
  private storage = new Map<string, CacheItem<any>>()

  // 设置缓存
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.storage.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.storage.get(key)
    if (!item) return null

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.storage.delete(key)
      return null
    }

    return item.data
  }

  // 删除缓存
  delete(key: string): void {
    this.storage.delete(key)
  }

  // 清空所有缓存
  clear(): void {
    this.storage.clear()
  }

  // 获取缓存键
  private getCacheKey(type: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    return `${type}:${sortedParams}`
  }

  // 缓存文章列表
  cachePosts(params: Record<string, any>, data: any): void {
    const key = this.getCacheKey('posts', params)
    this.set(key, data, 2 * 60 * 1000) // 2分钟缓存
  }

  // 获取缓存的文章列表
  getCachedPosts(params: Record<string, any>): any | null {
    const key = this.getCacheKey('posts', params)
    return this.get(key)
  }

  // 缓存标签列表
  cacheTags(data: any): void {
    this.set('tags', data, 10 * 60 * 1000) // 10分钟缓存
  }

  // 获取缓存的标签列表
  getCachedTags(): any | null {
    return this.get('tags')
  }

  // 缓存分类列表
  cacheCategories(data: any): void {
    this.set('categories', data, 10 * 60 * 1000) // 10分钟缓存
  }

  // 获取缓存的分类列表
  getCachedCategories(): any | null {
    return this.get('categories')
  }

  // 预加载下一页数据
  preloadNextPage(currentParams: Record<string, any>): void {
    const nextParams = { ...currentParams }
    nextParams.page = (Number(nextParams.page) || 1) + 1

    // 这里可以触发预加载请求
    // 实际实现中需要调用API
    console.log('预加载下一页数据:', nextParams)
  }

  // 预加载相关数据
  preloadRelatedData(params: Record<string, any>): void {
    // 预加载标签数据
    if (!this.getCachedTags()) {
      console.log('预加载标签数据')
    }

    // 预加载分类数据
    if (!this.getCachedCategories()) {
      console.log('预加载分类数据')
    }

    // 预加载下一页
    this.preloadNextPage(params)
  }
}

// 创建全局缓存实例
export const cache = new Cache()

// 导出缓存工具函数
export default cache
