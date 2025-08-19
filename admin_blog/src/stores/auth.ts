import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('blog_admin_token'))
  const user = ref<any>(JSON.parse(localStorage.getItem('blog_admin_user') || 'null'))
  const isLoading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)

  // 登录
  const login = async (credentials: { username: string; password: string }) => {
    try {
      isLoading.value = true
      const response = await authAPI.login(credentials)

      if (response.success) {
        token.value = response.data.token
        user.value = response.data.user
        localStorage.setItem('blog_admin_token', response.data.token)
        localStorage.setItem('blog_admin_user', JSON.stringify(response.data.user))
        return { success: true }
      } else {
        return { success: false, message: response.message || '登录失败' }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error.response?.data?.message || '登录失败，请检查网络连接',
      }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('blog_admin_token')
    localStorage.removeItem('blog_admin_user')
  }

  // 获取用户信息
  const fetchUserProfile = async () => {
    if (!token.value) return false

    try {
      const response = await authAPI.getProfile()
      if (response.success) {
        user.value = response.data
        localStorage.setItem('blog_admin_user', JSON.stringify(response.data))
        return true
      }
      return false
    } catch (error) {
      console.error('Fetch profile error:', error)
      // 如果获取用户信息失败，可能token已过期
      logout()
      return false
    }
  }

  // 更新用户信息
  const updateProfile = async (data: any) => {
    try {
      isLoading.value = true
      const response = await authAPI.updateProfile(data)

      if (response.success) {
        user.value = { ...user.value, ...data }
        localStorage.setItem('blog_admin_user', JSON.stringify(user.value))
        return { success: true, message: '更新成功' }
      } else {
        return { success: false, message: response.message || '更新失败' }
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '更新失败',
      }
    } finally {
      isLoading.value = false
    }
  }

  // 修改密码
  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      isLoading.value = true
      const response = await authAPI.changePassword(data)

      if (response.success) {
        return { success: true, message: '密码修改成功' }
      } else {
        return { success: false, message: response.message || '密码修改失败' }
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '密码修改失败',
      }
    } finally {
      isLoading.value = false
    }
  }

  // 验证token有效性
  const validateToken = async () => {
    if (!token.value) {
      return false
    }

    try {
      const success = await fetchUserProfile()
      return success
    } catch (error) {
      console.error('Token validation failed:', error)
      logout()
      return false
    }
  }

  // 初始化认证状态
  const initAuth = async () => {
    if (token.value) {
      // 如果有token但没有用户信息，验证token有效性
      if (!user.value) {
        const isValid = await validateToken()
        if (!isValid) {
          logout()
        }
      }
    }
  }

  return {
    // 状态
    token,
    user,
    isLoading,

    // 计算属性
    isLoggedIn,

    // 方法
    login,
    logout,
    fetchUserProfile,
    updateProfile,
    changePassword,
    validateToken,
    initAuth,
  }
})
