<template>
  <div class="indexnow-settings">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>IndexNow 搜索引擎通知设置</span>
          <el-tag :type="configStatus.valid ? 'success' : 'warning'">
            {{ configStatus.message }}
          </el-tag>
        </div>
      </template>

      <!-- 功能说明 -->
      <el-alert
        title="关于 IndexNow"
        type="info"
        :closable="false"
        show-icon
        class="info-alert"
      >
        <p>
          IndexNow 是微软Bing等搜索引擎提供的快速索引通知协议。启用后，当文章发布或更新时，
          系统会自动通知搜索引擎更新 <strong>{{ targetHost }}</strong> 的索引，加快收录速度。
        </p>
      </el-alert>

      <!-- 配置表单 -->
      <el-form :model="settings" label-width="120px" class="settings-form">
        <el-form-item label="启用状态">
          <el-switch
            v-model="settings.enabled"
            active-text="已启用"
            inactive-text="已禁用"
            @change="handleEnabledChange"
          />
        </el-form-item>

        <el-form-item label="目标网站" v-if="settings.enabled">
          <el-input
            v-model="settings.targetHost"
            placeholder="例如: siqiongbiluo.love"
            :disabled="true"
          >
            <template #prepend>https://</template>
          </el-input>
          <div class="form-tip">
            这是将要通知搜索引擎更新索引的目标网站
          </div>
        </el-form-item>

        <el-form-item label="API密钥" v-if="settings.enabled">
          <el-input
            v-model="settings.apiKey"
            type="password"
            placeholder="输入 IndexNow API 密钥"
            show-password
            maxlength="128"
          >
            <template #append>
              <el-button @click="generateNewKey" :loading="generating">
                生成新密钥
              </el-button>
            </template>
          </el-input>
          <div class="form-tip">
            API密钥需要8-128个字符，只能包含字母、数字和连字符。
            <el-link type="primary" href="https://www.bing.com/indexnow" target="_blank">
              在 Bing 生成密钥
            </el-link>
          </div>
        </el-form-item>

        <el-form-item label="搜索引擎端点" v-if="settings.enabled">
          <el-select v-model="settings.primaryEndpoint" placeholder="选择主要端点">
            <el-option
              v-for="endpoint in availableEndpoints"
              :key="endpoint.value"
              :label="endpoint.label"
              :value="endpoint.value"
            />
          </el-select>
          <div class="form-tip">
            将使用此端点提交URL更新通知
          </div>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="saveSettings" :loading="saving">
          保存设置
        </el-button>
        <el-button @click="testConnection" :loading="testing" v-if="settings.enabled && settings.apiKey">
          测试连接
        </el-button>
        <el-button @click="submitCurrentSite" :loading="submitting" v-if="configStatus.valid">
          立即提交网站首页
        </el-button>
      </div>

      <!-- 使用统计 -->
      <el-divider>使用统计</el-divider>
      <el-row :gutter="20" class="stats-row">
        <el-col :span="8">
          <el-statistic title="今日提交次数" :value="stats.todaySubmissions" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="本月提交次数" :value="stats.monthSubmissions" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="总提交次数" :value="stats.totalSubmissions" />
        </el-col>
      </el-row>

      <!-- 最近提交记录 -->
      <el-divider>最近提交记录</el-divider>
      <el-table :data="recentSubmissions" size="small" max-height="300">
        <el-table-column prop="time" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="url" label="URL" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="响应" show-overflow-tooltip />
      </el-table>

      <div v-if="recentSubmissions.length === 0" class="empty-submissions">
        <el-empty description="暂无提交记录" />
      </div>
    </el-card>

    <!-- 密钥验证说明弹窗 -->
    <el-dialog v-model="showKeyDialog" title="IndexNow 密钥验证" width="600px">
      <el-alert type="warning" :closable="false" show-icon class="mb-4">
        <p><strong>重要提示：</strong></p>
        <p>为了使用 IndexNow 功能，您需要在目标网站 <code>{{ targetHost }}</code> 的根目录下放置一个密钥验证文件。</p>
      </el-alert>

      <div class="key-instructions">
        <h4>验证步骤：</h4>
        <ol>
          <li>
            在网站根目录创建文件：
            <el-input
              :value="`${settings.apiKey}.txt`"
              readonly
              class="file-name-input"
            >
              <template #append>
                <el-button @click="copyFileName">复制文件名</el-button>
              </template>
            </el-input>
          </li>
          <li>
            文件内容应该是：
            <el-input
              :value="settings.apiKey"
              readonly
              class="file-content-input"
            >
              <template #append>
                <el-button @click="copyFileContent">复制内容</el-button>
              </template>
            </el-input>
          </li>
          <li>
            确保文件可以通过以下URL访问：
            <el-link
              :href="`https://${targetHost}/${settings.apiKey}.txt`"
              target="_blank"
              type="primary"
            >
              https://{{ targetHost }}/{{ settings.apiKey }}.txt
            </el-link>
          </li>
        </ol>
      </div>

      <template #footer>
        <el-button @click="showKeyDialog = false">我知道了</el-button>
        <el-button type="primary" @click="verifyKeyFile">验证密钥文件</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { indexNowAPI } from '@/utils/api'

// 状态变量
const saving = ref(false)
const testing = ref(false)
const submitting = ref(false)
const generating = ref(false)
const showKeyDialog = ref(false)

// 设置数据
const settings = reactive({
  enabled: true,
  apiKey: '',
  targetHost: 'siqiongbiluo.love',
  primaryEndpoint: 'https://api.indexnow.org/indexnow'
})

// 可用端点
const availableEndpoints = [
  { label: 'IndexNow (通用)', value: 'https://api.indexnow.org/indexnow' },
  { label: 'Microsoft Bing', value: 'https://www.bing.com/indexnow' },
  { label: 'Yandex', value: 'https://yandex.com/indexnow' }
]

// 统计数据
const stats = reactive({
  todaySubmissions: 0,
  monthSubmissions: 0,
  totalSubmissions: 0
})

// 最近提交记录
const recentSubmissions = ref<any[]>([])

// 计算属性
const targetHost = computed(() => settings.targetHost)
const configStatus = computed(() => {
  if (!settings.enabled) {
    return { valid: false, message: '功能已禁用' }
  }
  return indexNowAPI.checkConfig()
})

// 加载设置
const loadSettings = () => {
  const config = indexNowAPI.config
  settings.enabled = config.enabled
  settings.apiKey = config.apiKey
  settings.targetHost = config.targetHost
  settings.primaryEndpoint = config.endpoints[0]
}

// 保存设置
const saveSettings = async () => {
  try {
    saving.value = true

    // 验证设置
    if (settings.enabled && !settings.apiKey) {
      ElMessage.error('请输入 API 密钥')
      return
    }

    // 先保存配置，再验证
    indexNowAPI.updateConfig({
      enabled: settings.enabled,
      apiKey: settings.apiKey,
      targetHost: settings.targetHost,
      endpoints: [settings.primaryEndpoint, ...availableEndpoints.map(e => e.value).filter(e => e !== settings.primaryEndpoint)]
    })

    if (settings.enabled && settings.apiKey) {
      const validation = indexNowAPI.checkConfig()
      if (!validation.valid) {
        ElMessage.error(validation.message)
        return
      }
    }

    ElMessage.success('设置保存成功')

    // 如果首次配置密钥，显示验证说明
    if (settings.enabled && settings.apiKey && !localStorage.getItem('indexnow_key_shown')) {
      showKeyDialog.value = true
      localStorage.setItem('indexnow_key_shown', 'true')
    }

  } catch (error: any) {
    console.error('Save settings error:', error)
    ElMessage.error('保存设置失败')
  } finally {
    saving.value = false
  }
}

// 启用状态变化处理
const handleEnabledChange = (enabled: boolean) => {
  if (!enabled) {
    ElMessageBox.confirm(
      '禁用 IndexNow 功能后，将不会自动通知搜索引擎更新索引。确定要禁用吗？',
      '确认禁用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).catch(() => {
      settings.enabled = true
    })
  }
}

// 生成新密钥
const generateNewKey = async () => {
  try {
    generating.value = true
    await new Promise(resolve => setTimeout(resolve, 500)) // 模拟生成时间
    settings.apiKey = indexNowAPI.generateApiKey()
    ElMessage.success('新密钥生成成功')
  } finally {
    generating.value = false
  }
}

// 测试连接
const testConnection = async () => {
  try {
    testing.value = true
    const result = await indexNowAPI.submitUrl('/', settings.apiKey)

    if (result.success) {
      ElMessage.success('连接测试成功')
      addSubmissionRecord('/', result.success, result.message)
    } else {
      ElMessage.error(`连接测试失败: ${result.message}`)
      addSubmissionRecord('/', result.success, result.message)
    }
  } catch (error: any) {
    ElMessage.error(`连接测试失败: ${error.message}`)
  } finally {
    testing.value = false
  }
}

// 立即提交当前网站
const submitCurrentSite = async () => {
  try {
    submitting.value = true
    const urls = ['/', '/posts', '/posts?category=1', '/posts?tag=1']
    const result = await indexNowAPI.submitUrls(urls, settings.apiKey)

    if (result.success) {
      ElMessage.success('网站提交成功')
      stats.todaySubmissions++
      stats.totalSubmissions++

      urls.forEach(url => {
        addSubmissionRecord(url, true, '批量提交成功')
      })
    } else {
      ElMessage.error(`网站提交失败: ${result.message}`)
    }
  } catch (error: any) {
    ElMessage.error(`网站提交失败: ${error.message}`)
  } finally {
    submitting.value = false
  }
}

// 复制文件名
const copyFileName = async () => {
  try {
    await navigator.clipboard.writeText(`${settings.apiKey}.txt`)
    ElMessage.success('文件名已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 复制文件内容
const copyFileContent = async () => {
  try {
    await navigator.clipboard.writeText(settings.apiKey)
    ElMessage.success('文件内容已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 验证密钥文件
const verifyKeyFile = async () => {
  try {
    const result = await indexNowAPI.verifyKeyFile(settings.apiKey, settings.targetHost)

    if (result.success) {
      ElMessage.success('密钥文件验证成功！')
      showKeyDialog.value = false
    } else {
      ElMessage.error(result.message || '密钥文件验证失败')
    }
  } catch (error) {
    ElMessage.error('验证失败，请检查网络连接和文件路径')
  }
}

// 添加提交记录
const addSubmissionRecord = (url: string, success: boolean, message: string) => {
  recentSubmissions.value.unshift({
    time: new Date(),
    url: url,
    success: success,
    message: message
  })

  // 只保留最近20条记录
  if (recentSubmissions.value.length > 20) {
    recentSubmissions.value = recentSubmissions.value.slice(0, 20)
  }
}

// 格式化时间
const formatTime = (time: Date) => {
  return time.toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  loadSettings()

  // 模拟加载统计数据
  stats.todaySubmissions = Math.floor(Math.random() * 10)
  stats.monthSubmissions = Math.floor(Math.random() * 100)
  stats.totalSubmissions = Math.floor(Math.random() * 500)
})
</script>

<style scoped>
.indexnow-settings {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-alert {
  margin-bottom: 20px;
}

.settings-form {
  margin: 20px 0;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.4;
}

.action-buttons {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

.stats-row {
  margin: 20px 0;
}

.empty-submissions {
  text-align: center;
  padding: 40px 0;
}

.key-instructions {
  margin: 20px 0;
}

.key-instructions h4 {
  margin-bottom: 15px;
  color: #303133;
}

.key-instructions ol {
  line-height: 2;
}

.key-instructions ol li {
  margin-bottom: 15px;
}

.file-name-input,
.file-content-input {
  margin: 8px 0;
  font-family: monospace;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
