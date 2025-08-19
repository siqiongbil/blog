<template>
  <div class="settings-view">
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
        </div>
      </template>

      <!-- API健康检查 -->
      <el-card class="mb-4">
        <template #header>
          <div class="flex justify-between items-center">
            <span>API健康检查</span>
            <el-button size="small" @click="checkApiStatus" :loading="checkingStatus">
              刷新状态
            </el-button>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-statistic title="API健康状态" :value="apiHealth.status" :value-style="getHealthStatusStyle()" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="API版本" :value="apiHealth.version || 'Unknown'" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="最后检查时间" :value="apiHealth.lastCheck ? formatDate(apiHealth.lastCheck) : '未检查'" />


          </el-col>
        </el-row>

        <!-- <div v-if="apiHealth.environment" class="mt-4">
          <el-tag :type="apiHealth.environment === 'production' ? 'danger' : 'warning'">
            环境: {{ apiHealth.environment }}
          </el-tag>
        </div> -->
      </el-card>

      <!-- 用户管理功能测试 -->
      <el-card class="mb-4">
        <template #header>
          <span>用户API测试</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-button @click="testGetMe" :loading="testingApi">测试获取当前用户(/users/me)</el-button>
          </el-col>
          <el-col :span="12">
            <el-button @click="testChangePassword" :loading="testingApi">测试修改密码接口</el-button>
          </el-col>
        </el-row>

        <div v-if="userTestResult" class="mt-4">
          <el-alert :title="userTestResult.title" :type="userTestResult.type" :description="userTestResult.message" />
        </div>
      </el-card>

      <!-- 分类管理功能测试 -->
      <el-card class="mb-4">
        <template #header>
          <span>分类API测试</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-button @click="testCategorySelectOptions" :loading="testingApi">
              测试分类选择项
            </el-button>
          </el-col>
          <el-col :span="8">
            <el-button @click="testCheckSlug" :loading="testingApi">
              测试别名检查
            </el-button>
          </el-col>
          <el-col :span="8">
            <el-button @click="testGetBySlug" :loading="testingApi">
              测试别名查询
            </el-button>
          </el-col>
        </el-row>

        <div v-if="categoryTestResult" class="mt-4">
          <el-alert :title="categoryTestResult.title" :type="categoryTestResult.type"
            :description="categoryTestResult.message" />
        </div>
      </el-card>

      <!-- IndexNow 设置 -->
      <IndexNowSettings />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { configAPI, systemAPI, authAPI, categoryAPI } from '@/utils/api'
import IndexNowSettings from '@/components/IndexNowSettings.vue'

const authStore = useAuthStore()

// 响应式数据
const activeTab = ref('basic')
const saving = ref(false)
const basicFormRef = ref<FormInstance>()
const profileFormRef = ref<FormInstance>()

const checkingStatus = ref(false)
const testingApi = ref(false)

const apiHealth = ref({
  status: 'unknown',
  version: '',
  environment: '',
  lastCheck: null as Date | null
})

const userTestResult = ref<{ title: string, type: string, message: string } | null>(null)
const categoryTestResult = ref<{ title: string, type: string, message: string } | null>(null)

// 基本设置
const basicSettings = reactive({
  site_name: '思琼碧落的博客',
  site_description: '个人技术博客，分享编程经验和生活感悟',
  site_keywords: 'Vue,JavaScript,Node.js,编程,技术,博客',
  site_logo: '',
  icp_number: ''
})

// 个人信息设置
const profileSettings = reactive({
  nickname: '',
  email: '',
  avatar: '',
  bio: '',
  website: '',
  github: ''
})

// 加载设置
const loadSettings = async () => {
  try {
    // 加载系统配置
    const configResponse = await configAPI.getList()
    if (configResponse && Array.isArray(configResponse)) {
      const config = configResponse
      // 假设配置是键值对形式
      config.forEach((item: any) => {
        if (basicSettings.hasOwnProperty(item.config_key)) {
          basicSettings[item.config_key as keyof typeof basicSettings] = item.config_value
        }
      })
    }

    // 加载用户信息
    if (authStore.user) {
      profileSettings.nickname = authStore.user.nickname || ''
      profileSettings.email = authStore.user.email || ''
      profileSettings.avatar = authStore.user.avatar || ''
      profileSettings.bio = authStore.user.bio || ''
      profileSettings.website = authStore.user.website || ''
      profileSettings.github = authStore.user.github || ''
    }
  } catch (error) {
    console.error('Load settings error:', error)
  }
}

// 保存基本设置
const saveBasicSettings = async () => {
  try {
    saving.value = true

    // 将设置转换为键值对格式
    const configs = Object.entries(basicSettings).map(([key, value]) => ({
      key: key,
      value: String(value)
    }))

    const response = await configAPI.batchSet({ configs })

    if (response) {
      ElMessage.success('基本设置保存成功')
    } else {
      throw new Error('保存失败')
    }
  } catch (error: any) {
    console.error('Save basic settings error:', error)
    ElMessage.error(error.message || '保存基本设置失败')
  } finally {
    saving.value = false
  }
}

// 保存个人信息
const saveProfileSettings = async () => {
  try {
    saving.value = true

    const result = await authStore.updateProfile(profileSettings)

    if (result.success) {
      ElMessage.success('个人信息保存成功')
    } else {
      throw new Error(result.message || '保存失败')
    }
  } catch (error: any) {
    console.error('Save profile settings error:', error)
    ElMessage.error(error.message || '保存个人信息失败')
  } finally {
    saving.value = false
  }
}

// 检查API状态
const checkApiStatus = async () => {
  checkingStatus.value = true
  try {
    // 只使用 /health 接口进行健康检查
    const healthResponse = await systemAPI.getHealth()
    console.log('Health check response:', healthResponse)
    console.log('Response timestamp:', healthResponse?.timestamp)
    console.log('Timestamp type:', typeof healthResponse?.timestamp)

    // 根据响应判断健康状态
    const isHealthy = healthResponse &&
      (healthResponse.status === 'ok' ||
        healthResponse.success === true ||
        healthResponse.message === 'OK' ||
        (typeof healthResponse === 'string' && healthResponse.toLowerCase() === 'ok'))

    // 处理时间戳
    let lastCheckTime = new Date()
    if (healthResponse?.timestamp) {
      try {
        lastCheckTime = new Date(healthResponse.timestamp)
        console.log('Parsed timestamp:', lastCheckTime)
      } catch (error) {
        console.error('Error parsing timestamp:', error)
        lastCheckTime = new Date()
      }
    }

    apiHealth.value = {
      status: isHealthy ? 'healthy' : 'error',
      version: healthResponse?.version || 'unknown',
      environment: healthResponse?.environment || 'unknown',
      lastCheck: lastCheckTime
    }

    console.log('Updated apiHealth.lastCheck:', apiHealth.value.lastCheck)
    console.log('Formatted time:', formatDate(lastCheckTime))

    if (isHealthy) {
      ElMessage.success('API健康检查通过')
    } else {
      ElMessage.warning('API健康检查返回异常状态')
    }
  } catch (error) {
    console.error('API health check error:', error)
    apiHealth.value = {
      status: 'error',
      version: 'unknown',
      environment: 'unknown',
      lastCheck: new Date() // 错误时使用当前时间
    }
    ElMessage.error('API健康检查失败，无法连接到服务器')
  } finally {
    checkingStatus.value = false
  }
}

// 测试用户API
const testGetMe = async () => {
  testingApi.value = true
  try {
    const response = await authAPI.getMe()
    console.log('Get me response:', response)

    userTestResult.value = {
      title: '用户API测试成功',
      type: 'success',
      message: `用户信息获取成功，用户名: ${response?.username || response?.data?.username || '未知'}`
    }
  } catch (error) {
    console.error('Get me test error:', error)
    userTestResult.value = {
      title: '用户API测试失败',
      type: 'error',
      message: '无法获取当前用户信息，可能是认证问题或API不可用'
    }
  } finally {
    testingApi.value = false
  }
}

const testChangePassword = async () => {
  userTestResult.value = {
    title: '密码修改API',
    type: 'info',
    message: '密码修改API (/users/me/password) 已集成，使用时需要提供当前密码和新密码'
  }
}

// 测试分类API
const testCategorySelectOptions = async () => {
  testingApi.value = true
  try {
    const response = await categoryAPI.getSelectOptions()
    console.log('Category select options response:', response)

    categoryTestResult.value = {
      title: '分类选择项API测试成功',
      type: 'success',
      message: `获取到 ${response?.data?.length || response?.length || 0} 个分类选择项`
    }
  } catch (error) {
    console.error('Category select options test error:', error)
    categoryTestResult.value = {
      title: '分类选择项API测试失败',
      type: 'error',
      message: '无法获取分类选择项，API可能不可用'
    }
  } finally {
    testingApi.value = false
  }
}

const testCheckSlug = async () => {
  testingApi.value = true
  try {
    const testSlug = 'test-slug-' + Date.now()
    const response = await categoryAPI.checkSlug(testSlug)
    console.log('Check slug response:', response)

    categoryTestResult.value = {
      title: '别名检查API测试成功',
      type: 'success',
      message: `测试别名 "${testSlug}" 的可用性检查完成`
    }
  } catch (error) {
    console.error('Check slug test error:', error)
    categoryTestResult.value = {
      title: '别名检查API测试失败',
      type: 'error',
      message: '别名检查API不可用'
    }
  } finally {
    testingApi.value = false
  }
}

const testGetBySlug = async () => {
  testingApi.value = true
  try {
    // 先获取一个存在的分类
    const categoriesResponse = await categoryAPI.getList({ pageSize: 1 })
    const categories = categoriesResponse?.data?.categories || categoriesResponse?.data || []

    if (categories.length > 0) {
      const firstCategory = categories[0]
      const response = await categoryAPI.getBySlug(firstCategory.slug)
      console.log('Get by slug response:', response)

      categoryTestResult.value = {
        title: '别名查询API测试成功',
        type: 'success',
        message: `成功通过别名 "${firstCategory.slug}" 获取分类信息`
      }
    } else {
      categoryTestResult.value = {
        title: '别名查询API测试',
        type: 'warning',
        message: '没有可用的分类进行测试'
      }
    }
  } catch (error) {
    console.error('Get by slug test error:', error)
    categoryTestResult.value = {
      title: '别名查询API测试失败',
      type: 'error',
      message: '别名查询API不可用'
    }
  } finally {
    testingApi.value = false
  }
}

// 工具函数
const getHealthStatusStyle = () => {
  switch (apiHealth.value.status) {
    case 'healthy':
      return { color: '#67C23A' }
    case 'error':
      return { color: '#F56C6C' }
    default:
      return { color: '#E6A23C' }
  }
}

const formatDate = (date: Date) => {
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadSettings()
  checkApiStatus()
})
</script>

<style scoped>
.settings-view {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
