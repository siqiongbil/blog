<template>
  <div class="data-cleanup-container">
    <div class="page-header">
      <h1>数据清理管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="refreshStats" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新统计
        </el-button>
      </div>
    </div>

    <!-- 数据概览 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalRecords?.toLocaleString() || 0 }}</div>
              <div class="stat-label">总记录数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon space">
              <el-icon><Folder /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ formatFileSize(stats.estimatedTotalSpace || 0) }}</div>
              <div class="stat-label">估算存储空间</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon earliest">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ formatDate(stats.earliestDate) }}</div>
              <div class="stat-label">最早记录</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon latest">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ formatDate(stats.latestDate) }}</div>
              <div class="stat-label">最新记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 清理操作区域 -->
    <el-card class="cleanup-section">
      <template #header>
        <span>数据清理操作</span>
      </template>

      <el-form :model="cleanupForm" label-width="120px">
        <el-form-item label="清理月份">
          <el-select v-model="cleanupForm.months" style="width: 200px">
            <el-option label="1个月前" :value="1" />
            <el-option label="2个月前" :value="2" />
            <el-option label="3个月前" :value="3" />
            <el-option label="6个月前" :value="6" />
            <el-option label="12个月前" :value="12" />
          </el-select>
          <span class="form-tip">将清理 {{ cleanupForm.months }} 个月前的访问数据</span>
        </el-form-item>

        <el-form-item>
          <el-button type="warning" @click="previewCleanup" :loading="previewLoading">
            <el-icon><View /></el-icon>
            预览清理效果
          </el-button>
          <el-button type="danger" @click="executeCleanup" :loading="cleanupLoading" :disabled="!previewResult">
            <el-icon><Delete /></el-icon>
            执行清理
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 预览结果 -->
      <div v-if="previewResult" class="preview-result">
        <el-alert
          title="预览结果"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="preview-details">
              <p><strong>将清理的数据：</strong></p>
              <ul>
                <li>记录数量：{{ previewResult.recordsToDelete?.toLocaleString() }} 条</li>
                <li>时间范围：{{ formatDate(previewResult.earliestDate) }} 至 {{ formatDate(previewResult.latestDate) }}</li>
                <li>预计节省空间：{{ formatFileSize(previewResult.estimatedSpaceSaved || 0) }}</li>
                <li>清理截止日期：{{ formatDate(previewResult.cutoffDate) }}</li>
              </ul>
            </div>
          </template>
        </el-alert>
      </div>
    </el-card>

    <!-- 月度统计表格 -->
    <el-card class="monthly-stats-section">
      <template #header>
        <span>月度数据统计</span>
      </template>

      <el-table :data="stats.cleanupSuggestions || []" style="width: 100%">
        <el-table-column prop="month" label="月份" width="120" />
        <el-table-column prop="count" label="记录数" width="120">
          <template #default="{ row }">
            {{ row.count?.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="monthsOld" label="距今月数" width="120">
          <template #default="{ row }">
            <el-tag :type="row.monthsOld >= 1 ? 'danger' : 'success'">
              {{ row.monthsOld }} 个月
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="estimatedSpace" label="估算空间" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.estimatedSpace || 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="canCleanup" label="可清理" width="100">
          <template #default="{ row }">
            <el-tag :type="row.canCleanup ? 'danger' : 'success'">
              {{ row.canCleanup ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              v-if="row.canCleanup"
              size="small"
              type="warning"
              @click="cleanupSpecificMonth(row.month)"
              :disabled="cleanupLoading"
            >
              清理此月
            </el-button>
            <span v-else class="text-muted">无需清理</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 清理历史 -->
    <el-card class="cleanup-history-section">
      <template #header>
        <span>清理历史</span>
      </template>

      <div v-if="cleanupHistory.length === 0" class="empty-history">
        <el-empty description="暂无清理历史" />
      </div>

      <el-timeline v-else>
        <el-timeline-item
          v-for="(item, index) in cleanupHistory"
          :key="index"
          :timestamp="formatDateTime(item.cleanupTime)"
          :type="item.success ? 'success' : 'danger'"
        >
          <div class="history-item">
            <h4>{{ item.success ? '清理成功' : '清理失败' }}</h4>
            <p>清理了 {{ item.months }} 个月前的数据，共删除 {{ item.recordsDeleted?.toLocaleString() }} 条记录</p>
            <p v-if="item.message" class="error-message">{{ item.message }}</p>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  DataAnalysis,
  Folder,
  Calendar,
  Clock,
  View,
  Delete
} from '@element-plus/icons-vue'
import { articleAPI } from '@/utils/api'

// 响应式数据
const loading = ref(false)
const previewLoading = ref(false)
const cleanupLoading = ref(false)

const stats = reactive({
  totalRecords: 0,
  estimatedTotalSpace: 0,
  earliestDate: null,
  latestDate: null,
  cleanupSuggestions: []
})

const cleanupForm = reactive({
  months: 1
})

const previewResult = ref(null)
const cleanupHistory = ref([])

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString: string): string => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (dateString: string): string => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取清理统计
const fetchCleanupStats = async () => {
  try {
    loading.value = true
    const response = await articleAPI.getCleanupStats()
    if (response.success) {
      Object.assign(stats, response.data)
    }
  } catch (error) {
    console.error('获取清理统计失败:', error)
    ElMessage.error('获取清理统计失败')
  } finally {
    loading.value = false
  }
}

// 预览清理效果
const previewCleanup = async () => {
  try {
    previewLoading.value = true
    const response = await articleAPI.cleanupVisitData({
      months: cleanupForm.months,
      dryRun: true
    })

    if (response.success) {
      previewResult.value = response.data
      ElMessage.success(response.message)
    }
  } catch (error) {
    console.error('预览清理失败:', error)
    ElMessage.error('预览清理失败')
  } finally {
    previewLoading.value = false
  }
}

// 执行清理
const executeCleanup = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要清理 ${cleanupForm.months} 个月前的访问数据吗？此操作不可恢复！`,
      '确认清理',
      {
        confirmButtonText: '确定清理',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    cleanupLoading.value = true
    const response = await articleAPI.cleanupVisitData({
      months: cleanupForm.months,
      dryRun: false
    })

    if (response.success) {
      ElMessage.success(response.message)

      // 添加到清理历史
      cleanupHistory.value.unshift({
        ...response.data,
        success: true,
        cleanupTime: new Date().toISOString()
      })

      // 清空预览结果
      previewResult.value = null

      // 刷新统计
      await fetchCleanupStats()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('执行清理失败:', error)
      ElMessage.error('执行清理失败')

      // 添加到清理历史（失败）
      cleanupHistory.value.unshift({
        months: cleanupForm.months,
        recordsDeleted: 0,
        success: false,
        message: error.message || '清理失败',
        cleanupTime: new Date().toISOString()
      })
    }
  } finally {
    cleanupLoading.value = false
  }
}

// 清理特定月份
const cleanupSpecificMonth = async (month: string) => {
  try {
    const [year, monthNum] = month.split('-')
    const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1)
    const now = new Date()
    const monthsDiff = (now.getFullYear() - monthDate.getFullYear()) * 12 +
                      (now.getMonth() - monthDate.getMonth())

    await ElMessageBox.confirm(
      `确定要清理 ${month} 月份的所有访问数据吗？此操作不可恢复！`,
      '确认清理',
      {
        confirmButtonText: '确定清理',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    cleanupLoading.value = true
    const response = await articleAPI.cleanupVisitData({
      months: monthsDiff,
      dryRun: false
    })

    if (response.success) {
      ElMessage.success(`成功清理 ${month} 月份的数据`)

      // 添加到清理历史
      cleanupHistory.value.unshift({
        ...response.data,
        success: true,
        cleanupTime: new Date().toISOString()
      })

      // 刷新统计
      await fetchCleanupStats()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清理特定月份失败:', error)
      ElMessage.error('清理特定月份失败')
    }
  } finally {
    cleanupLoading.value = false
  }
}

// 刷新统计
const refreshStats = () => {
  fetchCleanupStats()
}

onMounted(() => {
  fetchCleanupStats()
})
</script>

<style scoped>
.data-cleanup-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.space {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.earliest {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.latest {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.cleanup-section,
.monthly-stats-section,
.cleanup-history-section {
  margin-bottom: 20px;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 14px;
}

.preview-result {
  margin-top: 20px;
}

.preview-details ul {
  margin: 10px 0;
  padding-left: 20px;
}

.preview-details li {
  margin-bottom: 5px;
}

.empty-history {
  text-align: center;
  padding: 40px 0;
}

.history-item h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.history-item p {
  margin: 4px 0;
  color: #606266;
}

.error-message {
  color: #f56c6c !important;
  font-weight: 500;
}

.text-muted {
  color: #909399;
}
</style>
