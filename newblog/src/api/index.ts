import axios from '@/utils/axios'

// 通用API响应包装器
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

// 分页信息
export interface Pagination {
  current: number
  pageSize: number
  total: number
  pages: number
}

// 类型定义
export interface User {
  id: number
  username: string
  email: string
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Post {
  id: number
  title: string
  content: string
  summary?: string
  cover_image?: string
  category_id: number
  author_id: number
  status: 0 | 1 | 2 // 0-草稿，1-已发布，2-已删除
  view_count: number
  tags?: string
  content_type: 1 | 2 | 3 // 1-纯文本，2-Markdown，3-HTML
  created_at: string
  updated_at: string
  // 关联查询字段
  author_username?: string
  author_nickname?: string
  category_name?: string
  category_slug?: string
  // 标签详细信息
  tag_details?: Array<{
    id: number
    name: string
    slug: string
  }>
}

export interface Comment {
  id: number
  content: string
  post_id: number
  user_id: number
  created_at: string
  updated_at?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  sort_order: number
  image_url?: string
  parent_id?: number | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  slug: string
  description?: string
  color: string
  icon?: string
  article_count: number
  created_at: string
  updated_at: string
}

export interface Notification {
  id: number
  user_id: number
  type: string
  content: string
  is_read: boolean
  created_at: string
  updated_at?: string
}

export interface Music {
  id: number
  file_name: string
  original_name: string
  file_path: string
  file_url: string
  file_size: number
  mime_type: string
  duration: number | null
  title: string | null
  artist: string | null
  album: string | null
  genre: string | null
  year: number | null
  cover_url: string | null
  description: string | null
  tags: string[] | null
  play_count: number
  uploader_id: number
  uploader_username?: string
  status: 0 | 1
  created_at: string
  updated_at: string
}

// 用户相关接口
export const userApi = {
  // 用户注册
  register: (data: { username: string; email: string; password: string }) => {
    return axios.post<{ message: string; userId: number }>('/api/register', data)
  },

  // 用户登录
  login: (data: { username: string; password: string }) => {
    return axios.post<{ token: string; user: User }>('/api/login', data)
  },

  // 获取当前用户资料
  getProfile: () => {
    return axios.get<User>('/api/users/profile')
  },

  // 更新当前用户资料
  updateProfile: (data: Partial<User>) => {
    return axios.put<User>('/api/users/profile', data)
  },

  // 获取指定用户资料
  getUserById: (id: number) => {
    return axios.get<User>(`/api/users/${id}`)
  },
}

// 文章相关接口
export const postApi = {
  // 获取文章列表
  getPosts: (params?: {
    page?: number
    pageSize?: number
    category_id?: number
    tag_ids?: string
    tag_match_type?: 'any' | 'all'
    keyword?: string
    status?: number
    author_id?: number
  }) => {
    return axios.get<
      ApiResponse<{
        articles: Post[]
        pagination: { current: number; pageSize: number; total: number; pages: number }
      }>
    >('/api/articles', { params })
  },

  // 获取文章详情
  getPostById: (id: number) => {
    return axios.get<ApiResponse<Post>>(`/api/articles/${id}`)
  },

  // 创建文章
  createPost: (data: Partial<Post>) => {
    return axios.post<ApiResponse<Post>>('/api/articles', data)
  },

  // 更新文章
  updatePost: (id: number, data: Partial<Post>) => {
    return axios.put<ApiResponse<null>>(`/api/articles/${id}`, data)
  },

  // 删除文章
  deletePost: (id: number) => {
    return axios.delete<ApiResponse<null>>(`/api/articles/${id}`)
  },
}

// 评论相关接口
export const commentApi = {
  // 获取文章评论
  getComments: (postId: number) => {
    return axios.get<Comment[]>(`/api/posts/${postId}/comments`)
  },

  // 添加评论
  addComment: (postId: number, data: { content: string }) => {
    return axios.post<Comment>(`/api/posts/${postId}/comments`, data)
  },

  // 删除评论
  deleteComment: (commentId: number) => {
    return axios.delete(`/api/comments/${commentId}`)
  },
}

// 分类相关接口
export const categoryApi = {
  // 获取分类列表
  getCategories: () => {
    return axios.get<ApiResponse<{ categories: Category[] }>>('/api/categories')
  },

  // 创建分类
  createCategory: (data: Partial<Category>) => {
    return axios.post<ApiResponse<Category>>('/api/categories', data)
  },

  // 更新分类
  updateCategory: (id: number, data: Partial<Category>) => {
    return axios.put<ApiResponse<Category>>(`/api/categories/${id}`, data)
  },

  // 删除分类
  deleteCategory: (id: number) => {
    return axios.delete<ApiResponse<null>>(`/api/categories/${id}`)
  },
}

// 标签相关接口
export const tagApi = {
  // 获取标签列表
  getTags: (params?: { page?: number; pageSize?: number; orderBy?: string; order?: string }) => {
    return axios.get<
      ApiResponse<{
        tags: Tag[]
        pagination?: { current: number; pageSize: number; total: number; pages: number }
      }>
    >('/api/tags', { params })
  },

  // 获取标签选择项
  getTagsSelect: () => {
    return axios.get<ApiResponse<Tag[]>>('/api/tags/select')
  },

  // 根据标签ID获取文章列表
  getArticlesByTag: (tagId: number, params?: { page?: number; pageSize?: number }) => {
    return axios.get<
      ApiResponse<{
        tag: Tag
        articles: Post[]
        pagination: { current: number; pageSize: number; total: number; pages: number }
      }>
    >(`/api/tags/${tagId}/articles`, { params })
  },

  // 创建标签
  createTag: (data: Partial<Tag>) => {
    return axios.post<ApiResponse<Tag>>('/api/tags', data)
  },

  // 更新标签
  updateTag: (id: number, data: Partial<Tag>) => {
    return axios.put<ApiResponse<null>>(`/api/tags/${id}`, data)
  },

  // 删除标签
  deleteTag: (id: number) => {
    return axios.delete<ApiResponse<null>>(`/api/tags/${id}`)
  },
}

// 通知相关接口
export const notificationApi = {
  // 获取用户通知
  getNotifications: () => {
    return axios.get<Notification[]>('/api/notifications')
  },

  // 标记通知为已读
  markAsRead: (id: number) => {
    return axios.put<Notification>(`/api/notifications/${id}/read`)
  },

  // 删除通知
  deleteNotification: (id: number) => {
    return axios.delete(`/api/notifications/${id}`)
  },
}

// 音乐相关接口
export const musicApi = {
  // 获取启用的音乐列表（公开接口）
  getEnabledMusic: () => {
    return axios.get<ApiResponse<Music[]>>('/api/music/enabled')
  },

  // 随机获取音乐
  getRandomMusic: (count: number = 1) => {
    return axios.get<ApiResponse<Music[]>>('/api/music/random', {
      params: { count },
    })
  },

  // 获取音乐详情
  getMusicById: (id: number) => {
    return axios.get<ApiResponse<Music>>(`/api/music/${id}`)
  },

  // 按艺术家获取音乐
  getMusicByArtist: (artist: string, params?: { page?: number; pageSize?: number }) => {
    return axios.get<ApiResponse<{ music: Music[]; pagination: Pagination }>>(
      `/api/music/artist/${encodeURIComponent(artist)}`,
      { params },
    )
  },

  // 按专辑获取音乐
  getMusicByAlbum: (album: string, params?: { page?: number; pageSize?: number }) => {
    return axios.get<ApiResponse<{ music: Music[]; pagination: Pagination }>>(
      `/api/music/album/${encodeURIComponent(album)}`,
      { params },
    )
  },

  // 按类型获取音乐
  getMusicByGenre: (genre: string, params?: { page?: number; pageSize?: number }) => {
    return axios.get<ApiResponse<{ music: Music[]; pagination: Pagination }>>(
      `/api/music/genre/${encodeURIComponent(genre)}`,
      { params },
    )
  },

  // 获取热门音乐
  getPopularMusic: (params?: { limit?: number }) => {
    return axios.get<ApiResponse<Music[]>>('/api/music/popular', { params })
  },

  // 获取音乐统计信息
  getMusicStatistics: () => {
    return axios.get<
      ApiResponse<{
        total: number
        enabled: number
        disabled: number
        totalSize: number
        totalDuration: number
        topArtists: Array<{ artist: string; count: number }>
        topGenres: Array<{ genre: string; count: number }>
      }>
    >('/api/music/statistics')
  },

  // 管理员接口：获取音乐列表
  getMusic: (params?: { page?: number; pageSize?: number; status?: 0 | 1; keyword?: string }) => {
    return axios.get<ApiResponse<{ music: Music[]; pagination: Pagination }>>('/api/music', {
      params,
    })
  },

  // 管理员接口：更新音乐信息
  updateMusic: (
    id: number,
    data: {
      status?: 0 | 1
      title?: string
      artist?: string
      album?: string
      description?: string
    },
  ) => {
    return axios.put<ApiResponse<null>>(`/api/music/${id}`, data)
  },

  // 管理员接口：删除音乐
  deleteMusic: (id: number) => {
    return axios.delete<ApiResponse<null>>(`/api/music/${id}`)
  },

  // 管理员接口：切换音乐状态
  toggleMusicStatus: (id: number) => {
    return axios.patch<ApiResponse<{ id: number; status: number }>>(`/api/music/${id}/toggle`)
  },
}

export default {
  user: userApi,
  post: postApi,
  comment: commentApi,
  category: categoryApi,
  tag: tagApi,
  notification: notificationApi,
  music: musicApi,
}
