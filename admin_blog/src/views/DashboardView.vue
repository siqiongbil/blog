<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon article">
              <el-icon>
                <Document />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ displayStats.articles }}</div>
              <div class="stat-label">文章总数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon category">
              <el-icon>
                <Collection />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ displayStats.categories }}</div>
              <div class="stat-label">分类数量</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon tag">
              <el-icon>
                <PriceTag />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ displayStats.tags }}</div>
              <div class="stat-label">标签数量</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon view">
              <el-icon>
                <View />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ displayStats.totalViews }}</div>
              <div class="stat-label">总浏览量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <!-- 最近文章 -->
      <el-col :span="12">
        <el-card class="recent-articles">
          <template #header>
            <div class="card-header">
              <span>最近文章</span>
              <el-button type="primary" size="small" @click="$router.push('/articles')">
                查看全部
              </el-button>
            </div>
          </template>

          <div v-loading="loading" class="article-list">
            <div v-for="article in recentArticles" :key="article.id" class="article-item"
              @click="$router.push(`/articles/edit/${article.id}`)">
              <div class="article-title">{{ article.title }}</div>
              <div class="article-meta">
                <span class="article-status" :class="getStatusClass(article.status)">
                  {{ getStatusText(article.status) }}
                </span>
                <span class="article-date">{{ formatDate(article.created_at) }}</span>
                <span class="article-views">{{ article.view_count }} 次浏览</span>
              </div>
            </div>

            <div v-if="!loading && recentArticles.length === 0" class="empty-state">
              <el-icon>
                <Document />
              </el-icon>
              <p>暂无文章</p>
              <el-button type="primary" @click="$router.push('/articles/create')">
                写第一篇文章
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 快捷操作 -->
      <el-col :span="12">
        <el-card class="quick-actions">
          <template #header>
            <span>快捷操作</span>
          </template>

          <div class="action-grid">
            <div class="action-item" @click="$router.push('/articles/create')">
              <el-icon>
                <EditPen />
              </el-icon>
              <span>写文章</span>
            </div>

            <div class="action-item" @click="$router.push('/categories')">
              <el-icon>
                <Collection />
              </el-icon>
              <span>管理分类</span>
            </div>

            <div class="action-item" @click="$router.push('/tags')">
              <el-icon>
                <PriceTag />
              </el-icon>
              <span>管理标签</span>
            </div>

            <div class="action-item" @click="$router.push('/music')">
              <el-icon>
                <Headset />
              </el-icon>
              <span>音乐管理</span>
            </div>

            <div class="action-item" @click="$router.push('/settings')">
              <el-icon>
                <Setting />
              </el-icon>
              <span>系统设置</span>
            </div>

            <div class="action-item" @click="$router.push('/articles')">
              <el-icon>
                <List />
              </el-icon>
              <span>文章列表</span>
            </div>
          </div>
        </el-card>

        <!-- 系统信息 -->
        <el-card class="system-info" style="margin-top: 20px;">
          <template #header>
            <span>系统信息</span>
          </template>

          <div class="info-list">
            <div class="info-item">
              <span class="info-label">博客名称：</span>
              <span class="info-value">{{ systemInfo.siteName || '思琼碧落的博客' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前用户：</span>
              <span class="info-value">{{ authStore.user?.nickname || authStore.user?.username }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">用户角色：</span>
              <span class="info-value">{{ authStore.user?.role === 1 ? '管理员' : '普通用户' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最后登录：</span>
              <span class="info-value">{{ formatDate(new Date()) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { articleAPI, categoryAPI, tagAPI, systemAPI, indexNowAPI } from '@/utils/api'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const loading = ref(true)
const stats = ref({
  articles: 0,
  categories: 0,
  tags: 0,
  totalViews: 0
})
const recentArticles = ref<any[]>([])
const systemInfo = ref({
  siteName: '思琼碧落的博客'
})
const apiStatus = ref({
  health: 'unknown',
  version: '',
  lastCheck: null as Date | null
})

const indexNowStatus = ref({
  enabled: false,
  configured: false,
  lastSubmission: null as Date | null
})

// 计算属性确保数据响应式
const displayStats = computed(() => ({
  articles: stats.value.articles || 0,
  categories: stats.value.categories || 0,
  tags: stats.value.tags || 0,
  totalViews: stats.value.totalViews || 0
}))

// 获取仪表盘数据
const loadDashboardData = async () => {
  try {
    loading.value = true
    console.log('🔍 开始加载仪表盘数据...')

    // 并行请求各种数据
    const [articlesRes, categoriesRes, tagsRes, visitTrendsRes] = await Promise.all([
      articleAPI.getList({ page: 1, pageSize: 5, orderBy: 'created_at', order: 'DESC' }),
      categoryAPI.getList(),
      tagAPI.getList(),
      articleAPI.getVisitTrends({ days: 90 }).catch((error) => {
        console.log('访问统计API调用失败:', error.message)
        return { success: false, data: [] }
      })
    ])

    console.log('📊 API响应结果:')
    console.log('文章数据:', articlesRes)
    console.log('分类数据:', categoriesRes)
    console.log('标签数据:', tagsRes)
    console.log('访问统计:', visitTrendsRes)

    // 处理文章数据
    if (articlesRes.success && articlesRes.data) {
      recentArticles.value = articlesRes.data.articles || []
      stats.value.articles = articlesRes.data.pagination?.total || recentArticles.value.length
    }

    // 处理分类数据
    if (categoriesRes.success && categoriesRes.data) {
      const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data.categories || [])
      stats.value.categories = categories.length
      console.log('分类数据:', categories)
    }

    // 处理标签数据
    if (tagsRes.success && tagsRes.data) {
      const tags = Array.isArray(tagsRes.data) ? tagsRes.data : (tagsRes.data.tags || [])
      stats.value.tags = tags.length
      console.log('标签数据:', tags)
    }

    // 处理访问统计数据
    if (visitTrendsRes.success && visitTrendsRes.data && Array.isArray(visitTrendsRes.data)) {
      // 计算总访问量
      stats.value.totalViews = visitTrendsRes.data.reduce((total, day) => {
        return total + (day.total_visits || 0)
      }, 0)
      console.log('✅ 使用访问统计数据计算总浏览量:', stats.value.totalViews)
    } else {
      // 如果访问统计API失败，回退到文章浏览量计算
      stats.value.totalViews = recentArticles.value.reduce((total, article) => {
        return total + (article.view_count || 0)
      }, 0)
      console.log('⚠️  使用文章浏览量计算总浏览量:', stats.value.totalViews)
    }

    console.log('📊 最终统计数据:', stats.value)
    console.log('📊 响应式数据检查:')
    console.log('  - stats.value.articles:', stats.value.articles)
    console.log('  - stats.value.categories:', stats.value.categories)
    console.log('  - stats.value.tags:', stats.value.tags)
    console.log('  - stats.value.totalViews:', stats.value.totalViews)

    // 强制更新DOM
    await nextTick()
    console.log('🔄 DOM已更新，当前显示值:')
    console.log('  - 文章数:', stats.value.articles)
    console.log('  - 分类数:', stats.value.categories)
    console.log('  - 标签数:', stats.value.tags)
    console.log('  - 浏览量:', stats.value.totalViews)

  } catch (error) {
    console.error('Load dashboard data error:', error)
    // 错误时使用默认值，但保留已获取的数据
    if (!stats.value.articles) stats.value.articles = 0
    if (!stats.value.categories) stats.value.categories = 0
    if (!stats.value.tags) stats.value.tags = 0
    if (!stats.value.totalViews) stats.value.totalViews = 0
  } finally {
    loading.value = false
  }
}

// 检查IndexNow状态
const checkIndexNowStatus = () => {
  try {
    const config = indexNowAPI.config
    const status = indexNowAPI.checkConfig()

    indexNowStatus.value = {
      enabled: config.enabled,
      configured: status.valid,
      lastSubmission: null // 可以从本地存储或API获取
    }
  } catch (error) {
    console.warn('IndexNow状态检查失败:', error)
    indexNowStatus.value = {
      enabled: false,
      configured: false,
      lastSubmission: null
    }
  }
}

// 检查API健康状态
const checkApiHealth = async () => {
  try {
    const healthResponse = await systemAPI.getHealth()
    const infoResponse = await systemAPI.getApiInfo()

    apiStatus.value = {
      health: healthResponse.success ? 'healthy' : 'error',
      version: infoResponse.data?.version || 'unknown',
      lastCheck: new Date()
    }
  } catch (error) {
    apiStatus.value = {
      health: 'error',
      version: 'unknown',
      lastCheck: new Date()
    }
    console.error('API health check failed:', error)
  }
}

// 格式化日期
const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取文章状态文本
const getStatusText = (status: number) => {
  const statusMap = {
    0: '草稿',
    1: '已发布',
    2: '已删除'
  }
  return statusMap[status as keyof typeof statusMap] || '未知'
}

// 获取文章状态样式类
const getStatusClass = (status: number) => {
  const classMap = {
    0: 'draft',
    1: 'published',
    2: 'deleted'
  }
  return classMap[status as keyof typeof classMap] || ''
}

onMounted(() => {
  loadDashboardData()
  checkApiHealth()
  checkIndexNowStatus()

  // 测试数据绑定
  setTimeout(() => {
    console.log('🧪 测试数据绑定:')
    console.log('  - stats:', stats.value)
    console.log('  - displayStats:', displayStats.value)
  }, 2000)
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: #fff;
}

.stat-icon.article {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.category {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.tag {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.view {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.content-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-list {
  min-height: 300px;
}

.article-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.article-item:hover {
  background-color: #f8f9fa;
  margin: 0 -16px;
  padding-left: 16px;
  padding-right: 16px;
}

.article-item:last-child {
  border-bottom: none;
}

.article-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.article-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.article-status.draft {
  background-color: #f4f4f5;
  color: #909399;
}

.article-status.published {
  background-color: #e1f3d8;
  color: #67c23a;
}

.article-status.deleted {
  background-color: #fde2e2;
  color: #f56c6c;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 16px 0;
  font-size: 14px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 10px 0;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.action-item:hover {
  background-color: #e3f2fd;
  border-color: #409eff;
  transform: translateY(-2px);
}

.action-item .el-icon {
  font-size: 24px;
  color: #409eff;
  margin-bottom: 8px;
}

.action-item span {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.info-list {
  padding: 10px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}
</style>
