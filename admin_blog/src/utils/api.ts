import axios from 'axios'
import { ElMessage } from 'element-plus'

// API响应类型定义
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  total?: number
  timestamp?: string
  version?: string
  environment?: string
  error?: string
}

export interface PaginatedApiResponse<T = unknown> {
  success: boolean
  message?: string
  data: {
    pagination?: {
      current: number
      pageSize: number
      total: number
      pages: number
    }
  } & {
    [key: string]: T[] | unknown
  }
  total?: number
}

// API基础URL配置
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api' // 使用代理，不需要完整URL

// 静态资源基础URL配置
const STATIC_BASE_URL = import.meta.env.VITE_STATIC_BASE_URL || 'https://admin.siqiongbiluo.love'

console.log('API Base URL:', BASE_URL)
console.log('Static Base URL:', STATIC_BASE_URL)
console.log('Environment VITE_STATIC_BASE_URL:', import.meta.env.VITE_STATIC_BASE_URL)
console.log('Current hostname:', window.location.hostname)
console.log('Development mode:', import.meta.env.DEV)

// 获取完整的静态资源URL
export const getStaticUrl = (path: string): string => {
  if (!path) return ''
  if (path.startsWith('http')) return path

  // 始终使用环境变量中配置的静态资源基础URL
  return `${STATIC_BASE_URL}${path.startsWith('/') ? path : '/' + path}`
}

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 文件上传专用配置
const uploadConfig = {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 300000, // 5分钟超时，适合大文件上传
}

// 创建带进度回调的上传配置
const createUploadConfigWithProgress = (onProgress?: (progress: number) => void) => ({
  ...uploadConfig,
  onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
    if (onProgress && progressEvent.total) {
      const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      onProgress(progress)
    }
  },
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    console.log(
      'Making request to:',
      (config.baseURL || '') + (config.url || ''),
      'Method:',
      config.method,
    )
    const token = localStorage.getItem('blog_admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败'

    // 只在非401错误时显示错误消息，避免重复提示
    if (error.response?.status !== 401) {
      ElMessage.error(message)
    }

    // token过期处理 - 只在特定情况下跳转
    if (error.response?.status === 401) {
      // 检查当前是否已经在登录页面，避免重复跳转
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('blog_admin_token')
        localStorage.removeItem('blog_admin_user')

        // 提示用户登录状态过期
        ElMessage.warning('登录状态已过期，请重新登录')

        // 使用更优雅的方式跳转，避免硬刷新
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }, 1000)
      }
    }

    return Promise.reject(error)
  },
)

// 系统信息API
export const systemAPI = {
  // 获取API基本信息
  getInfo: (): Promise<ApiResponse> => api.get('/'),

  // API健康检查
  getHealth: (): Promise<ApiResponse> => api.get('/health'),

  // 获取API详细信息
  getApiInfo: (): Promise<ApiResponse> => api.get('/info'),
}

// 用户认证和管理API
export const authAPI = {
  // 用户登录
  login: (data: { username: string; password: string }): Promise<ApiResponse> =>
    api.post('/users/login', data),

  // 获取用户信息
  getProfile: (): Promise<ApiResponse> => api.get('/users/profile'),

  // 获取当前用户信息（与getProfile相同）
  getMe: (): Promise<ApiResponse> => api.get('/users/me'),

  // 更新用户信息
  updateProfile: (data: {
    nickname?: string
    email?: string
    avatar?: string
    bio?: string
    website?: string
    github?: string
  }): Promise<ApiResponse> => api.put('/users/profile', data),

  // 修改密码
  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> =>
    api.put('/users/change-password', data),

  // 修改当前用户密码（与changePassword相同）
  changeMyPassword: (data: {
    currentPassword: string
    newPassword: string
  }): Promise<ApiResponse> => api.put('/users/me/password', data),
}

// 用户管理API（管理员功能）
export const userAPI = {
  // 获取指定用户信息
  getById: (id: number) => api.get(`/users/${id}`),

  // 更新指定用户信息
  updateById: (
    id: number,
    data: {
      nickname?: string
      email?: string
      avatar?: string
      bio?: string
      website?: string
      github?: string
      role?: 1 | 2 | 3
    },
  ) => api.put(`/users/${id}`, data),

  // 修改指定用户密码
  changePasswordById: (id: number, data: { newPassword: string }) =>
    api.put(`/users/${id}/password`, data),
}

// 分类管理API
export const categoryAPI = {
  // 获取分类列表（支持分页和排序）
  getList: (params?: {
    page?: number
    pageSize?: number
    orderBy?: 'sort_order' | 'created_at' | 'name'
    order?: 'ASC' | 'DESC'
  }) => api.get('/categories', { params }),

  // 获取分类详情
  getDetail: (id: number) => api.get(`/categories/${id}`),

  // 根据别名获取分类详情
  getBySlug: (slug: string) => api.get(`/categories/slug/${slug}`),

  // 获取分类文章统计
  getArticleStats: () => api.get('/categories/stats/article-count'),

  // 获取分类选择项
  getSelectOptions: () => api.get('/categories/options/select'),

  // 检查分类别名可用性
  checkSlug: (slug: string) => api.get(`/categories/check/slug/${slug}`),

  // 创建分类
  create: (data: {
    name: string
    slug: string
    description?: string
    sort_order?: number
    image_url?: string
  }) => api.post('/categories', data),

  // 更新分类
  update: (
    id: number,
    data: {
      name?: string
      slug?: string
      description?: string
      sort_order?: number
      image_url?: string
    },
  ) => api.put(`/categories/${id}`, data),

  // 删除分类
  delete: (id: number) => api.delete(`/categories/${id}`),

  // 批量排序分类
  batchSort: (data: { categories: Array<{ id: number; sort_order: number }> }) =>
    api.put('/categories/batch/sort', data),

  // 批量删除分类
  batchDelete: (data: { ids: number[] }) => api.delete('/categories/batch/delete', { data }),

  // 上传分类图片
  uploadImage: (data: FormData) => api.post('/categories/upload/image', data, uploadConfig),

  // 删除分类图片
  deleteImage: (id: number) => api.delete(`/categories/${id}/image`),
}

// 文章管理API
export const articleAPI = {
  // 获取文章列表（支持高级筛选和分页）
  getList: (params?: {
    page?: number
    pageSize?: number
    keyword?: string
    category_id?: number
    author_id?: number
    status?: 0 | 1 | 2
    tag_ids?: string
    tag_match_type?: 'any' | 'all'
    orderBy?: 'created_at' | 'updated_at' | 'view_count'
    order?: 'ASC' | 'DESC'
  }) => api.get('/articles', { params }),

  // 获取热门文章
  getPopular: (params?: { limit?: number; category_id?: number; days?: number }) =>
    api.get('/articles/popular', { params }),

  // 获取最新文章
  getLatest: (params?: { limit?: number; category_id?: number; status?: number }) =>
    api.get('/articles/latest', { params }),

  // 获取文章统计信息
  getStatistics: () => api.get('/articles/statistics'),

  // 根据分类别名获取文章
  getByCategory: (
    slug: string,
    params?: {
      page?: number
      pageSize?: number
      orderBy?: 'created_at' | 'updated_at' | 'view_count'
      order?: 'ASC' | 'DESC'
    },
  ) => api.get(`/articles/category/${slug}`, { params }),

  // 根据标签获取文章（GET方式）
  getByTags: (
    tagIds: string,
    params?: {
      page?: number
      pageSize?: number
      matchType?: 'any' | 'all'
      category_id?: number
      author_id?: number
      keyword?: string
    },
  ) => api.get(`/articles/tags/${tagIds}`, { params }),

  // 根据标签获取文章（POST方式）
  getByTagsPost: (
    data: { tagIds: number[] },
    params?: {
      page?: number
      pageSize?: number
      matchType?: 'any' | 'all'
      category_id?: number
      author_id?: number
      keyword?: string
    },
  ) => api.post('/articles/by-tags', data, { params }),

  // 获取文章详情
  getDetail: (id: number) => api.get(`/articles/${id}`),

  // 获取相关文章
  getRelated: (id: number, params?: { limit?: number }) =>
    api.get(`/articles/${id}/related`, { params }),

  // 创建文章
  create: (data: {
    title: string
    content: string
    summary?: string
    cover_image?: string
    category_id: number
    status?: 0 | 1
    tags?: string[] | number[]
  }) => api.post('/articles', data),

  // 更新文章
  update: (
    id: number,
    data: {
      title?: string
      content?: string
      summary?: string
      cover_image?: string
      category_id?: number
      status?: 0 | 1
      tags?: string[] | number[]
    },
  ) => api.put(`/articles/${id}`, data),

  // 删除文章
  delete: (id: number) => api.delete(`/articles/${id}`),

  // 永久删除文章
  permanentDelete: (id: number) => api.delete(`/articles/${id}/permanent`),

  // 批量更新文章状态
  batchUpdateStatus: (data: { ids: number[]; status: 0 | 1 | 2 }) =>
    api.put('/articles/batch/status', data),

  // 获取文章的标签
  getTags: (id: number) => api.get(`/articles/${id}/tags`),

  // 为文章添加标签
  addTags: (id: number, data: { tags: string[] | number[] }) =>
    api.post(`/articles/${id}/tags`, data),

  // 设置文章标签（替换所有现有标签）
  setTags: (id: number, data: { tags: string[] | number[] }) =>
    api.put(`/articles/${id}/tags`, data),

  // 从文章移除标签
  removeTags: (id: number, data: { tagIds: number[] }) =>
    api.delete(`/articles/${id}/tags`, { data }),

  // 访问统计相关API
  // 获取文章访问统计
  getVisitStats: (id: number) => api.get(`/articles/${id}/visit-stats`),

  // 获取文章访问明细
  getVisitDetails: (id: number, params?: { page?: number; pageSize?: number }) =>
    api.get(`/articles/${id}/visit-details`, { params }),

  // 获取访问趋势
  getVisitTrends: (params?: { days?: number }) => api.get('/articles/analytics/trends', { params }),

  // 获取热门文章排行
  getHotArticles: (params?: { limit?: number; days?: number }) =>
    api.get('/articles/analytics/hot', { params }),

  // 获取访问来源统计
  getRefererStats: (params?: { days?: number }) => api.get('/articles/analytics/referer', { params }),

  // 获取设备类型统计
  getDeviceStats: (params?: { days?: number }) => api.get('/articles/analytics/device', { params }),

  // 获取访问时段统计
  getHourlyStats: (params?: { days?: number }) => api.get('/articles/analytics/hourly', { params }),

  // 地理位置统计相关API
  // 获取地理位置统计
  getLocationStats: (params?: { days?: number }) => api.get('/articles/analytics/location', { params }),

  // 获取国家统计
  getCountryStats: (params?: { days?: number }) => api.get('/articles/analytics/country', { params }),

  // 数据清理相关API
  // 清理访问数据
  cleanupVisitData: (data: { months: number; dryRun?: boolean }) =>
    api.post('/articles/analytics/cleanup', data),

  // 获取清理统计信息
  getCleanupStats: () => api.get('/articles/analytics/cleanup-stats'),
}

// 标签管理API
export const tagAPI = {
  // 获取标签列表
  getList: (params?: {
    page?: number
    pageSize?: number
    orderBy?: 'article_count' | 'created_at' | 'name'
    order?: 'ASC' | 'DESC'
  }) => api.get('/tags', { params }),

  // 获取标签选择项（用于表单选择器）
  getSelectOptions: () => api.get('/tags/select'),

  // 根据别名获取标签详情
  getBySlug: (slug: string) => api.get(`/tags/slug/${slug}`),

  // 获取标签详情
  getDetail: (id: number) => api.get(`/tags/${id}`),

  // 获取标签的文章列表
  getArticles: (id: number, params?: { page?: number; pageSize?: number }) =>
    api.get(`/tags/${id}/articles`, { params }),

  // 创建标签
  create: (data: {
    name: string
    slug: string
    description?: string
    color?: string
    icon?: string
  }) => api.post('/tags', data),

  // 更新标签
  update: (
    id: number,
    data: {
      name?: string
      slug?: string
      description?: string
      color?: string
      icon?: string
    },
  ) => api.put(`/tags/${id}`, data),

  // 删除标签
  delete: (id: number) => api.delete(`/tags/${id}`),
}

// 图片管理API
export const imageAPI = {
  // 获取图片列表
  getList: (params?: {
    page?: number
    pageSize?: number
    upload_type?: 1 | 2 | 3 | 4
    uploader_id?: number
    keyword?: string
    orderBy?: 'created_at' | 'updated_at' | 'file_size' | 'file_name'
    order?: 'ASC' | 'DESC'
  }) => api.get('/images', { params }),

  // 上传图片
  upload: (data: FormData) => api.post('/images/upload', data, uploadConfig),

  // 获取图片详情
  getDetail: (id: number) => api.get(`/images/${id}`),

  // 更新图片信息
  update: (
    id: number,
    data: {
      alt_text?: string
      description?: string
      tags?: string[]
      upload_type?: 1 | 2 | 3 | 4
      related_id?: number
    },
  ) => api.put(`/images/${id}`, data),

  // 删除图片
  delete: (id: number, hardDelete = false) =>
    api.delete(`/images/${id}`, {
      params: { hardDelete },
    }),

  // 获取图片统计信息
  getStatistics: () => api.get('/images/stats/statistics'),

  // 根据类型和关联ID获取图片
  getByTypeAndRelated: (uploadType: number, relatedId: number) =>
    api.get(`/images/type/${uploadType}/related/${relatedId}`),
}

// 音乐管理API
export const musicAPI = {
  // 获取音乐列表（管理员，支持分页和筛选）
  getList: (params?: {
    page?: number
    pageSize?: number
    status?: 0 | 1
    keyword?: string
  }): Promise<ApiResponse> => api.get('/music', { params }),

  // 获取启用的音乐列表（公开）
  getEnabledList: (): Promise<ApiResponse> => api.get('/music/enabled'),

  // 随机获取音乐（公开）
  getRandom: (params?: { count?: number }): Promise<ApiResponse> =>
    api.get('/music/random', { params }),

  // 获取音乐统计信息（公开）
  getStatistics: (): Promise<ApiResponse> => api.get('/music/statistics'),

  // 根据艺术家获取音乐
  getByArtist: (
    artist: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<ApiResponse> => api.get(`/music/artist/${encodeURIComponent(artist)}`, { params }),

  // 根据专辑获取音乐
  getByAlbum: (
    album: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<ApiResponse> => api.get(`/music/album/${encodeURIComponent(album)}`, { params }),

  // 根据流派获取音乐
  getByGenre: (
    genre: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<ApiResponse> => api.get(`/music/genre/${encodeURIComponent(genre)}`, { params }),

  // 获取最热门音乐
  getPopular: (params?: { limit?: number }): Promise<ApiResponse> =>
    api.get('/music/popular', { params }),

  // 根据上传者获取音乐
  getByUploader: (
    uploaderId: number,
    params?: { page?: number; pageSize?: number },
  ): Promise<ApiResponse> => api.get(`/music/uploader/${uploaderId}`, { params }),

  // 获取音乐详情
  getDetail: (id: number): Promise<ApiResponse> => api.get(`/music/${id}`),

  // 上传单个音乐文件
  upload: (data: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse> =>
    api.post('/music/upload', data, createUploadConfigWithProgress(onProgress)),

  // 上传单个音乐文件（专用接口）
  uploadSingle: (data: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse> =>
    api.post('/music/upload/single', data, createUploadConfigWithProgress(onProgress)),

  // 批量上传音乐文件
  uploadMultiple: (data: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse> =>
    api.post('/music/upload/multiple', data, createUploadConfigWithProgress(onProgress)),

  // 更新音乐信息
  update: (
    id: number,
    data: {
      status?: 0 | 1
      title?: string
      artist?: string
      album?: string
      description?: string
    },
  ): Promise<ApiResponse> => api.put(`/music/${id}`, data),

  // 删除音乐
  delete: (id: number): Promise<ApiResponse> => api.delete(`/music/${id}`),

  // 切换音乐状态
  toggleStatus: (id: number): Promise<ApiResponse> => api.patch(`/music/${id}/toggle`),

  // 验证音乐文件
  validate: (id: number): Promise<ApiResponse> => api.get(`/music/${id}/validate`),

  // 批量更新状态
  batchUpdateStatus: (data: { ids: number[]; status: 0 | 1 }): Promise<ApiResponse> =>
    api.put('/music/batch/status', data),

  // 批量导入音乐
  batchImport: (): Promise<ApiResponse> => api.post('/music/batch/import'),

  // 批量验证音乐
  batchValidate: (data?: { ids?: number[] }): Promise<ApiResponse> =>
    api.post('/music/batch/validate', data),

  // 刷新音乐表
  refresh: (): Promise<ApiResponse> => api.post('/music/refresh'),
}

// 文件管理API
export const fileAPI = {
  // 获取文件列表
  getList: (params?: {
    page?: number
    pageSize?: number
    file_type?: 'document' | 'video' | 'audio' | 'archive' | 'other'
    uploader_id?: number
    keyword?: string
    orderBy?: 'created_at' | 'updated_at' | 'file_size' | 'file_name'
    order?: 'ASC' | 'DESC'
  }) => api.get('/files', { params }),

  // 上传文件
  upload: (data: FormData) => api.post('/files/upload', data, uploadConfig),

  // 获取文件详情
  getDetail: (id: number) => api.get(`/files/${id}`),

  // 更新文件信息
  update: (
    id: number,
    data: {
      description?: string
      tags?: string[]
      related_id?: number
    },
  ) => api.put(`/files/${id}`, data),

  // 删除文件
  delete: (id: number, hardDelete = false) =>
    api.delete(`/files/${id}`, {
      params: { hardDelete },
    }),

  // 获取文件统计信息
  getStatistics: () => api.get('/files/stats/overview'),
}

// 系统配置API
export const configAPI = {
  // 获取系统配置列表
  getList: () => api.get('/config'),

  // 创建系统配置
  create: (data: {
    config_key: string
    config_value: string
    config_type?: 1 | 2 | 3 | 4
    description?: string
  }) => api.post('/config', data),

  // 获取博客基本设置
  getBlogSettings: () => api.get('/config/blog/settings'),

  // 保存博客设置
  saveBlogSettings: (data: {
    site_name?: string
    site_description?: string
    site_logo?: string
    site_author?: string
  }) => api.put('/config/blog/settings', data),

  // 获取指定配置值
  getValue: (key: string) => api.get(`/config/value/${key}`),

  // 批量获取配置值
  getValuesBatch: (data: { keys: string[] }) => api.post('/config/values/batch', data),

  // 获取配置统计
  getStatistics: () => api.get('/config/statistics'),

  // 根据ID获取配置项
  getById: (id: number) => api.get(`/config/${id}`),

  // 根据ID更新配置项
  updateById: (
    id: number,
    data: {
      config_value?: string
      description?: string
    },
  ) => api.put(`/config/${id}`, data),

  // 根据ID删除配置项
  deleteById: (id: number) => api.delete(`/config/${id}`),

  // 根据键名获取配置
  getByKey: (key: string) => api.get(`/config/key/${key}`),

  // 根据键名更新配置值
  updateByKey: (
    key: string,
    data: {
      config_value: string
      description?: string
    },
  ) => api.put(`/config/key/${key}`, data),

  // 根据键名删除配置项
  deleteByKey: (key: string) => api.delete(`/config/key/${key}`),

  // 检查配置键可用性
  checkKey: (key: string) => api.get(`/config/check/key/${key}`),

  // 根据类型获取配置项
  getByType: (type: 1 | 2 | 3 | 4) => api.get(`/config/type/${type}`),

  // 批量设置配置值
  batchSet: (data: { configs: Array<{ key: string; value: string }> }) =>
    api.post('/config/batch/set', data),

  // 重置配置到默认值
  resetDefaults: () => api.post('/config/reset/defaults'),
}

// IndexNow配置接口
interface IndexNowConfig {
  enabled: boolean
  apiKey: string
  targetHost: string
  endpoints: string[]
}

// IndexNow配置存储key
const INDEXNOW_CONFIG_KEY = 'indexnow_config'

// 默认IndexNow配置
const defaultIndexNowConfig: IndexNowConfig = {
  enabled: true,
  apiKey: '', // 需要在配置中设置
  targetHost: 'siqiongbiluo.love', // 目标网站
  endpoints: [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ],
}

// 从本地存储加载配置
const loadIndexNowConfig = (): IndexNowConfig => {
  try {
    const stored = localStorage.getItem(INDEXNOW_CONFIG_KEY)
    if (stored) {
      const parsedConfig = JSON.parse(stored)
      // 合并默认配置和存储的配置，确保所有字段都存在
      return { ...defaultIndexNowConfig, ...parsedConfig }
    }
  } catch (error) {
    console.warn('加载IndexNow配置失败:', error)
  }
  return { ...defaultIndexNowConfig }
}

// 保存配置到本地存储
const saveIndexNowConfig = (config: IndexNowConfig) => {
  try {
    localStorage.setItem(INDEXNOW_CONFIG_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('保存IndexNow配置失败:', error)
  }
}

// IndexNow配置
const indexNowConfig: IndexNowConfig = loadIndexNowConfig()

// IndexNow API
export const indexNowAPI = {
  // 获取配置
  get config() {
    return loadIndexNowConfig()
  },

  // 提交单个URL到IndexNow（通过后端代理）
  submitUrl: async (url: string, apiKey?: string): Promise<ApiResponse> => {
    try {
      const currentConfig = loadIndexNowConfig()

      // 检查IndexNow是否启用
      if (!currentConfig.enabled) {
        return { success: false, message: 'IndexNow功能已禁用' }
      }

      // 检查API密钥是否配置
      const keyToUse = apiKey || currentConfig.apiKey
      if (!keyToUse || keyToUse.trim() === '') {
        return { success: false, message: 'IndexNow API密钥未配置' }
      }

      const response = await api.post('/indexnow/submit-url', {
        url: url,
        apiKey: keyToUse,
        targetHost: currentConfig.targetHost,
      })

      return response.data || response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        message: `IndexNow提交失败: ${errorMessage}`,
        error: errorMessage,
      }
    }
  },

  // 批量提交URL到IndexNow（通过后端代理）
  submitUrls: async (urls: string[], apiKey?: string): Promise<ApiResponse> => {
    try {
      const currentConfig = loadIndexNowConfig()

      // 检查IndexNow是否启用
      if (!currentConfig.enabled) {
        return { success: false, message: 'IndexNow功能已禁用' }
      }

      // 检查API密钥是否配置
      const keyToUse = apiKey || currentConfig.apiKey
      if (!keyToUse || keyToUse.trim() === '') {
        return { success: false, message: 'IndexNow API密钥未配置' }
      }

      const response = await api.post('/indexnow/submit-urls', {
        urls: urls,
        apiKey: keyToUse,
        targetHost: currentConfig.targetHost,
      })

      return response.data || response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        message: `IndexNow批量提交失败: ${errorMessage}`,
        error: errorMessage,
      }
    }
  },

  // 提交文章URL（文章发布/更新时调用）
  submitArticle: async (
    articleId: number,
    action: 'create' | 'update' | 'delete' = 'update',
  ): Promise<ApiResponse> => {
    try {
      const currentConfig = loadIndexNowConfig()

      // 检查IndexNow是否启用
      if (!currentConfig.enabled) {
        return { success: true, message: 'IndexNow已禁用' }
      }

      // 检查API密钥是否配置
      if (!currentConfig.apiKey || currentConfig.apiKey.trim() === '') {
        return { success: false, message: 'IndexNow API密钥未配置，请在设置中配置API密钥' }
      }

      const urls = [
        `/`, // 首页
        `/article/${articleId}`, // 文章详情页
        `/posts`, // 文章列表页
      ]

      // 如果是删除操作，只提交首页和列表页
      const urlsToSubmit =
        action === 'delete' ? urls.filter((url) => url !== `/article/${articleId}`) : urls

      const result = await indexNowAPI.submitUrls(urlsToSubmit)

      return {
        ...result,
        message: `文章${action}操作的IndexNow通知: ${result.message}`,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        message: `文章IndexNow通知失败: ${errorMessage}`,
        error: errorMessage,
      }
    }
  },

  // 检测IndexNow配置状态
  checkConfig: (): { valid: boolean; message: string } => {
    // 重新加载最新配置
    const currentConfig = loadIndexNowConfig()

    if (!currentConfig.enabled) {
      return { valid: false, message: 'IndexNow功能已禁用' }
    }
    if (!currentConfig.apiKey) {
      return { valid: false, message: 'IndexNow API密钥未配置' }
    }
    if (currentConfig.apiKey.length < 8 || currentConfig.apiKey.length > 128) {
      return { valid: false, message: 'IndexNow API密钥长度应在8-128个字符之间' }
    }
    if (!/^[a-zA-Z0-9-]+$/.test(currentConfig.apiKey)) {
      return { valid: false, message: 'IndexNow API密钥只能包含字母、数字和连字符' }
    }
    return { valid: true, message: 'IndexNow配置有效' }
  },

  // 生成IndexNow API密钥
  generateApiKey: (): string => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // 验证密钥文件
  verifyKeyFile: async (apiKey: string, targetHost: string): Promise<ApiResponse> => {
    try {
      const response = await api.post('/indexnow/verify-key', {
        apiKey,
        targetHost,
      })

      return response.data || response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        message: `密钥文件验证失败: ${errorMessage}`,
        error: errorMessage,
      }
    }
  },

  // 更新配置
  updateConfig: (newConfig: Partial<IndexNowConfig>) => {
    Object.assign(indexNowConfig, newConfig)
    // 保存到本地存储
    saveIndexNowConfig(indexNowConfig)
  },
}

export default api
