<template>
  <div class="analytics-container">
    <div class="page-header">
      <h1>访问统计分析</h1>
      <div class="header-actions">
        <el-button @click="testAPI" type="info" size="small">
          <el-icon><Refresh /></el-icon>
          测试API
        </el-button>
        <el-select v-model="selectedDays" @change="refreshData" style="width: 120px">
          <el-option label="7天" :value="7" />
          <el-option label="30天" :value="30" />
          <el-option label="90天" :value="90" />
        </el-select>
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-label">总访问量</div>
          <div class="stat-value">{{ overviewStats.totalVisits.toLocaleString() }}</div>
          <div class="stat-change positive">
            <el-icon><TrendCharts /></el-icon>
            +{{ overviewStats.todayVisits }}（今日）
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-label">独立访客</div>
          <div class="stat-value">{{ overviewStats.uniqueVisitors.toLocaleString() }}</div>
          <div class="stat-change positive">
            <el-icon><User /></el-icon>
            UV率: {{ uvRate }}%
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-label">热门文章</div>
          <div class="stat-value">{{ hotArticles.length }}</div>
          <div class="stat-change">
            <el-icon><DocumentCopy /></el-icon>
            活跃文章数
          </div>
        </div>
      </el-card>

      <el-card class="stat-card">
        <div class="stat-item">
          <div class="stat-label">平均访问时长</div>
          <div class="stat-value">{{ avgDuration }}s</div>
          <div class="stat-change">
            <el-icon><Timer /></el-icon>
            用户粘性
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 访问趋势图 -->
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>访问趋势</span>
                <el-radio-group v-model="trendType" size="small">
                  <el-radio-button label="visits">访问量</el-radio-button>
                  <el-radio-button label="unique">独立访客</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div ref="trendChart" style="height: 300px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <!-- 热门文章 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>热门文章 TOP 10</span>
            </template>
            <div class="hot-articles">
              <div
                v-for="(article, index) in (hotArticles || []).slice(0, 10)"
                :key="article.article_id"
                class="hot-article-item"
              >
                <div class="rank">{{ index + 1 }}</div>
                <div class="article-info">
                  <div class="title" :title="article.article_title">
                    {{ article.article_title }}
                  </div>
                  <div class="stats">
                    {{ article.visit_count }} 次访问 · {{ article.unique_visitors }} 独立访客
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 设备统计 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>设备类型分布</span>
            </template>
            <div ref="deviceChart" style="height: 300px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <!-- 访问来源 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>访问来源</span>
            </template>
            <div class="referer-stats">
              <div
                v-for="source in (refererStats || []).slice(0, 8)"
                :key="source.source"
                class="referer-item"
              >
                <div class="source-name">{{ source.source }}</div>
                <div class="progress-bar">
                  <el-progress
                    :percentage="(source.visit_count / maxRefererCount) * 100"
                    :show-text="false"
                    stroke-width="8"
                  />
                  <span class="count">{{ source.visit_count }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 访问时段 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>访问时段分布</span>
            </template>
            <div ref="hourlyChart" style="height: 300px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <!-- 地理位置统计 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>地理位置分布</span>
                <el-radio-group v-model="locationType" size="small" @change="refreshLocationData">
                  <el-radio-button label="country">国家</el-radio-button>
                  <el-radio-button label="city">城市</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div ref="locationChart" style="height: 300px"></div>
          </el-card>
        </el-col>

        <!-- 地理位置详情 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>地理位置详情</span>
            </template>
            <div class="location-stats">
              <div
                v-for="location in (locationStats || []).slice(0, 10)"
                :key="`${location.country}-${location.city}`"
                class="location-item"
              >
                <div class="location-info">
                  <div class="location-name">
                    <el-icon><Location /></el-icon>
                    {{ location.country === '未知' ? '未知地区' : location.country }}
                    <span v-if="location.city && location.city !== '未知'" class="city-name">
                      - {{ location.city }}
                    </span>
                  </div>
                  <div class="location-stats-detail">
                    {{ location.visit_count }} 次访问 · {{ location.unique_visitors }} 独立访客
                    <span class="percentage">({{ location.percentage }}%)</span>
                  </div>
                </div>
                <div class="progress-bar">
                  <el-progress
                    :percentage="location.percentage"
                    :show-text="false"
                    stroke-width="6"
                    :color="getLocationColor(location.percentage)"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, TrendCharts, User, DocumentCopy, Timer, Location } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { articleAPI } from '@/utils/api'

// 响应式数据
const loading = ref(false)
const selectedDays = ref(90) // 改为90天，确保能获取到所有数据
const trendType = ref('visits')
const locationType = ref('country')

// 图表实例
const trendChart = ref()
const deviceChart = ref()
const hourlyChart = ref()
const locationChart = ref()
let trendChartInstance: echarts.ECharts
let deviceChartInstance: echarts.ECharts
let hourlyChartInstance: echarts.ECharts
let locationChartInstance: echarts.ECharts

// 统计数据
const overviewStats = reactive({
  totalVisits: 0,
  uniqueVisitors: 0,
  todayVisits: 0
})

const visitTrends = ref([])
const hotArticles = ref([])
const deviceStats = ref([])
const refererStats = ref([])
const hourlyStats = ref([])
const locationStats = ref([])

// 计算属性
const uvRate = computed(() => {
  if (overviewStats.totalVisits === 0) return 0
  return ((overviewStats.uniqueVisitors / overviewStats.totalVisits) * 100).toFixed(1)
})

const avgDuration = computed(() => {
  // 这里可以从后端获取平均访问时长数据
  return '45'
})

const maxRefererCount = computed(() => {
  if (!Array.isArray(refererStats.value) || refererStats.value.length === 0) {
    return 1
  }
  return Math.max(...refererStats.value.map(item => item.visit_count || 0), 1)
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    console.log('🔍 开始获取访问统计数据...')
    console.log('📅 查询时间范围:', selectedDays.value, '天')

    const [trendsRes, hotRes, deviceRes, refererRes, hourlyRes, locationRes] = await Promise.all([
      articleAPI.getVisitTrends({ days: selectedDays.value }),
      articleAPI.getHotArticles({ limit: 20, days: selectedDays.value }),
      articleAPI.getDeviceStats({ days: selectedDays.value }),
      articleAPI.getRefererStats({ days: selectedDays.value }),
      articleAPI.getHourlyStats({ days: selectedDays.value }),
      articleAPI.getLocationStats({ days: selectedDays.value })
    ])

    console.log('📊 API响应结果:')
    console.log('趋势数据:', trendsRes)
    console.log('热门文章:', hotRes)
    console.log('设备统计:', deviceRes)
    console.log('来源统计:', refererRes)
    console.log('时段统计:', hourlyRes)
    console.log('地理位置:', locationRes)

    // 安全地设置数据，确保是数组
    visitTrends.value = Array.isArray(trendsRes.data) ? trendsRes.data : []
    hotArticles.value = Array.isArray(hotRes.data) ? hotRes.data : []
    deviceStats.value = Array.isArray(deviceRes.data) ? deviceRes.data : []
    refererStats.value = Array.isArray(refererRes.data) ? refererRes.data : []
    hourlyStats.value = Array.isArray(hourlyRes.data) ? hourlyRes.data : []
    locationStats.value = Array.isArray(locationRes.data) ? locationRes.data : []

    console.log('📈 处理后的数据:')
    console.log('访问趋势:', visitTrends.value)
    console.log('热门文章:', hotArticles.value)
    console.log('设备统计:', deviceStats.value)

    // 计算总览统计
    const totalVisits = visitTrends.value.reduce((sum, item) => sum + (item.total_visits || 0), 0)
    const totalUnique = visitTrends.value.reduce((sum, item) => sum + (item.unique_visitors || 0), 0)
    const todayData = visitTrends.value[0] || { total_visits: 0 }

    overviewStats.totalVisits = totalVisits
    overviewStats.uniqueVisitors = totalUnique
    overviewStats.todayVisits = todayData.total_visits || 0

    console.log('📊 总览统计:', overviewStats)

    await nextTick()
    initCharts()
  } catch (error) {
    console.error('❌ 获取统计数据失败:', error)
    console.error('错误详情:', error.response?.data || error.message)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  initTrendChart()
  initDeviceChart()
  initHourlyChart()
  initLocationChart()
}

// 趋势图
const initTrendChart = () => {
  if (trendChartInstance) {
    trendChartInstance.dispose()
  }

  if (!visitTrends.value || visitTrends.value.length === 0) {
    return
  }

  trendChartInstance = echarts.init(trendChart.value)

  const dates = visitTrends.value.map(item => item.date || '').reverse()
  const visits = visitTrends.value.map(item => item.total_visits || 0).reverse()
  const unique = visitTrends.value.map(item => item.unique_visitors || 0).reverse()

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['访问量', '独立访客']
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '访问量',
        type: 'line',
        smooth: true,
        data: visits,
        itemStyle: { color: '#409eff' }
      },
      {
        name: '独立访客',
        type: 'line',
        smooth: true,
        data: unique,
        itemStyle: { color: '#67c23a' }
      }
    ]
  }

  trendChartInstance.setOption(option)
}

// 设备分布饼图
const initDeviceChart = () => {
  if (deviceChartInstance) {
    deviceChartInstance.dispose()
  }

  if (!deviceStats.value || deviceStats.value.length === 0) {
    return
  }

  deviceChartInstance = echarts.init(deviceChart.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '设备类型',
        type: 'pie',
        radius: '50%',
        data: deviceStats.value.map(item => ({
          value: item.visit_count || 0,
          name: item.device || '未知'
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  deviceChartInstance.setOption(option)
}

// 时段分布柱状图
const initHourlyChart = () => {
  if (hourlyChartInstance) {
    hourlyChartInstance.dispose()
  }

  if (!hourlyStats.value || hourlyStats.value.length === 0) {
    return
  }

  hourlyChartInstance = echarts.init(hourlyChart.value)

  // 补充24小时数据
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hourData = hourlyStats.value.find(item => item.hour === i)
    return hourData ? (hourData.visit_count || 0) : 0
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}:00 访问量: {c}'
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => i)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '访问量',
        type: 'bar',
        data: hourlyData,
        itemStyle: { color: '#409eff' }
      }
    ]
  }

  hourlyChartInstance.setOption(option)
}

// 地理位置图表
const initLocationChart = () => {
  if (locationChartInstance) {
    locationChartInstance.dispose()
  }

  if (!locationStats.value || locationStats.value.length === 0) {
    return
  }

  locationChartInstance = echarts.init(locationChart.value)

  // 处理地理位置数据，显示更详细的信息
  const data = locationStats.value.slice(0, 10).map(item => {
    let name = item.country
    if (item.region && item.region !== item.city && item.region !== '未知') {
      name += ` - ${item.region}`
    }
    if (item.city && item.city !== '未知' && item.city !== item.region) {
      name += ` - ${item.city}`
    }

    return {
      name: name === '未知' ? '未知地区' : name,
      value: item.visit_count || 0,
      itemStyle: {
        color: getLocationColor(item.country_code)
      }
    }
  })

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const item = locationStats.value[params.dataIndex]
        let tooltip = `${params.name}<br/>访问量: ${params.value} (${params.percent}%)<br/>`
        tooltip += `独立访客: ${item.unique_visitors}<br/>`
        if (item.country_code) tooltip += `国家代码: ${item.country_code}<br/>`
        if (item.zip_code) tooltip += `邮编: ${item.zip_code}<br/>`
        if (item.mobile_visits > 0) tooltip += `移动访问: ${item.mobile_visits}<br/>`
        if (item.proxy_visits > 0) tooltip += `代理访问: ${item.proxy_visits}<br/>`
        if (item.hosting_visits > 0) tooltip += `托管访问: ${item.hosting_visits}<br/>`
        tooltip += `数据来源: ${item.location_source || 'unknown'}`
        return tooltip
      }
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 20,
      bottom: 20,
    },
    series: [
      {
        name: '地理位置',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  locationChartInstance.setOption(option)
}

// 获取地理位置颜色
const getLocationColor = (countryCode: string) => {
  const colors = {
    'CN': '#ff4d4f', // 中国 - 红色
    'US': '#1890ff', // 美国 - 蓝色
    'JP': '#faad14', // 日本 - 黄色
    'KR': '#52c41a', // 韩国 - 绿色
    'GB': '#722ed1', // 英国 - 紫色
    'DE': '#13c2c2', // 德国 - 青色
    'FR': '#eb2f96', // 法国 - 粉色
    'CA': '#fa8c16', // 加拿大 - 橙色
    'AU': '#a0d911', // 澳大利亚 - 青柠色
    'IN': '#f5222d'  // 印度 - 深红色
  }
  return colors[countryCode] || '#d9d9d9' // 默认灰色
}

// 刷新地理位置数据
const refreshLocationData = async () => {
  try {
    const api = locationType.value === 'country'
      ? articleAPI.getCountryStats
      : articleAPI.getLocationStats

    const response = await api({ days: selectedDays.value })
    locationStats.value = response.data.data
    initLocationChart()
  } catch (error) {
    console.error('获取地理位置数据失败:', error)
    ElMessage.error('获取地理位置数据失败')
  }
}

// 刷新数据
const refreshData = () => {
  fetchData()
}

// 监听趋势类型变化
const handleTrendTypeChange = () => {
  initTrendChart()
}

// 测试API
const testAPI = async () => {
  try {
    console.log('🧪 开始API测试...')

    // 测试访问趋势API
    console.log('测试访问趋势API...')
    const trendsTest = await articleAPI.getVisitTrends({ days: 90 })
    console.log('访问趋势测试结果:', trendsTest)
    console.log('访问趋势数据:', trendsTest.data)

    // 测试热门文章API
    console.log('测试热门文章API...')
    const hotTest = await articleAPI.getHotArticles({ limit: 5, days: 90 })
    console.log('热门文章测试结果:', hotTest)
    console.log('热门文章数据:', hotTest.data)

    // 测试设备统计API
    console.log('测试设备统计API...')
    const deviceTest = await articleAPI.getDeviceStats({ days: 90 })
    console.log('设备统计测试结果:', deviceTest)
    console.log('设备统计数据:', deviceTest.data)

    ElMessage.success('API测试完成！请查看控制台输出')
    console.log('✅ API测试完成！')
  } catch (error) {
    console.error('❌ API测试失败:', error)
    console.error('错误详情:', error.response?.data || error.message)
    ElMessage.error(`API测试失败: ${error.response?.data?.message || error.message}`)
  }
}

onMounted(() => {
  // 检查认证状态
  const token = localStorage.getItem('blog_admin_token')
  const user = localStorage.getItem('blog_admin_user')

  console.log('🔐 认证状态检查:')
  console.log('Token存在:', !!token)
  console.log('用户信息:', user ? JSON.parse(user) : '无')

  if (!token) {
    ElMessage.warning('未检测到登录状态，请先登录')
    console.warn('未检测到登录状态，统计数据可能无法正常加载')
  }

  fetchData()
})
</script>

<style scoped>
.analytics-container {
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-change {
  font-size: 12px;
  color: #67c23a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.stat-change.positive {
  color: #67c23a;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hot-articles {
  max-height: 300px;
  overflow-y: auto;
}

.hot-article-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.hot-article-item:last-child {
  border-bottom: none;
}

.rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  margin-right: 12px;
}

.rank:nth-child(1) {
  background: #f56c6c;
}

.rank:nth-child(2) {
  background: #e6a23c;
}

.rank:nth-child(3) {
  background: #67c23a;
}

.article-info {
  flex: 1;
}

.title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats {
  font-size: 12px;
  color: #909399;
}

.referer-stats {
  padding: 10px 0;
}

.referer-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.source-name {
  width: 100px;
  font-size: 12px;
  color: #606266;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.progress-bar {
  flex: 1;
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.progress-bar .el-progress {
  flex: 1;
  margin-right: 10px;
}

.count {
  font-size: 12px;
  color: #909399;
  min-width: 30px;
}

.location-stats {
  max-height: 300px;
  overflow-y: auto;
}

.location-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.location-item:last-child {
  border-bottom: none;
}

.location-info {
  flex: 1;
  margin-right: 10px;
}

.location-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.city-name {
  color: #909399;
  font-size: 12px;
}

.location-stats-detail {
  font-size: 12px;
  color: #606266;
}

.percentage {
  color: #409eff;
  font-weight: 500;
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .analytics-container {
    padding: 10px;
  }
}
</style>
