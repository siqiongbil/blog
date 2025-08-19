<template>
  <div class="music-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>音乐管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showUploadDialog">
              <el-icon>
                <Upload />
              </el-icon>
              上传音乐
            </el-button>
            <el-button type="success" @click="showBatchUploadDialog">
              <el-icon>
                <Upload />
              </el-icon>
              批量上传
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select v-model="filters.status" placeholder="选择状态" clearable @change="loadMusicList">
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-input v-model="filters.keyword" placeholder="搜索文件名" clearable @keyup.enter="loadMusicList">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-button @click="loadMusicList">搜索</el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 批量操作工具栏 -->
      <div v-if="selectedRows.length > 0" class="batch-actions">
        <el-alert :title="`已选择 ${selectedRows.length} 项`" type="info" show-icon>
          <template #default>
            <el-button size="small" @click="batchEnable">批量启用</el-button>
            <el-button size="small" @click="batchDisable">批量禁用</el-button>
            <el-button size="small" @click="batchValidate">批量验证</el-button>
            <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
          </template>
        </el-alert>
      </div>

      <!-- 音乐列表 -->
      <el-table v-loading="loading" :data="musicList" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <el-image v-if="row.cover_url" :src="getStaticUrl(row.cover_url)"
              :preview-src-list="[getStaticUrl(row.cover_url)]" fit="cover"
              style="width: 50px; height: 50px; border-radius: 4px;" />
            <div v-else class="no-cover">🎵</div>
          </template>
        </el-table-column>
        <el-table-column label="音乐信息" min-width="250">
          <template #default="{ row }">
            <div class="music-info">
              <div class="title">{{ row.title || row.original_name || row.file_name }}</div>
              <div class="meta">
                <span v-if="row.artist">{{ row.artist }}</span>
                <span v-if="row.album"> - {{ row.album }}</span>
                <span v-if="row.year"> ({{ row.year }})</span>
              </div>
              <div v-if="row.tags && row.tags.length" class="tags">
                <el-tag v-for="tag in row.tags" :key="tag" size="small" style="margin-right: 4px;">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时长" width="80">
          <template #default="{ row }">
            {{ formatDuration(row.duration) }}
          </template>
        </el-table-column>
        <el-table-column label="大小" width="90">
          <template #default="{ row }">
            {{ formatFileSize(row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column label="播放" width="70">
          <template #default="{ row }">
            {{ row.play_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上传时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="playMusic(row)">试听</el-button>
            <el-button size="small" @click="viewMusicDetail(row)">详情</el-button>
            <el-dropdown trigger="click">
              <el-button size="small">
                更多<el-icon><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="toggleStatus(row)">
                    {{ row.status === 1 ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="validateMusic(row)">验证文件</el-dropdown-item>
                  <el-dropdown-item @click="refreshMetadata(row)">刷新元数据</el-dropdown-item>
                  <el-dropdown-item @click="deleteMusic(row)" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadMusicList" @current-change="loadMusicList" />
      </div>
    </el-card>

    <!-- 音乐播放器 -->
    <div v-if="currentMusic" class="music-player">
      <el-card>
        <div class="player-content">
          <div class="music-info">
            <h4>{{ currentMusic.file_name }}</h4>
            <p>正在播放</p>
          </div>
          <audio ref="audioRef" :src="getMusicUrl(currentMusic)" controls @ended="stopMusic" />
          <el-button @click="stopMusic">停止</el-button>
        </div>
      </el-card>
    </div>

    <!-- 单个上传对话框 -->
    <el-dialog v-model="showUpload" title="上传音乐" width="500px">
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="100px">
        <el-form-item label="选择音乐" prop="file">
          <el-upload v-model:file-list="fileList" action="" :before-upload="() => false" :on-change="handleFileChange"
            :limit="1" accept="audio/*" drag>
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽音乐文件到此处或 <em>点击选择文件</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 MP3/WAV/FLAC/M4A/AAC 格式，文件大小不超过 50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="文件名">
          <el-input v-model="uploadForm.file_name" placeholder="可选，不填则使用原文件名" />
        </el-form-item>

        <el-form-item label="标题">
          <el-input v-model="uploadForm.title" placeholder="可选" />
        </el-form-item>

        <el-form-item label="艺术家">
          <el-input v-model="uploadForm.artist" placeholder="可选" />
        </el-form-item>

        <el-form-item label="专辑">
          <el-input v-model="uploadForm.album" placeholder="可选" />
        </el-form-item>

        <el-form-item label="类型">
          <el-input v-model="uploadForm.genre" placeholder="可选" />
        </el-form-item>

        <el-form-item label="年份">
          <el-input v-model="uploadForm.year" placeholder="可选" type="number" />
        </el-form-item>

        <el-form-item label="封面URL">
          <el-input v-model="uploadForm.cover_url" placeholder="可选" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" placeholder="可选" type="textarea" />
        </el-form-item>

        <el-form-item label="标签">
          <el-input v-model="uploadForm.tags" placeholder="多个标签用逗号分隔" />
        </el-form-item>
      </el-form>

      <!-- 上传进度 -->
      <div v-if="uploading" class="upload-progress">
        <div style="margin-bottom: 10px;">上传进度：{{ uploadProgress }}%</div>
        <el-progress :percentage="uploadProgress" :stroke-width="8" />
      </div>

      <template #footer>
        <el-button @click="showUpload = false" :disabled="uploading">取消</el-button>
        <el-button type="primary" @click="handleSingleUpload" :loading="uploading">
          <el-icon>
            <Upload />
          </el-icon>
          {{ uploading ? `上传中 ${uploadProgress}%` : '上传音乐' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量上传对话框 -->
    <el-dialog v-model="showBatchUpload" title="批量上传音乐" width="600px">
      <el-form ref="batchUploadFormRef" :model="batchUploadForm" label-width="100px">
        <el-form-item label="选择音乐">
          <el-upload v-model:file-list="batchFileList" action="" :before-upload="() => false"
            :on-change="handleBatchFileChange" :limit="5" accept="audio/*" multiple drag>
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽音乐文件到此处或 <em>点击选择文件</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 MP3/WAV/FLAC/M4A/AAC 格式，每个文件不超过 50MB，最多选择 5 个文件
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <!-- 公共字段（应用于所有文件） -->
        <el-divider content-position="left">公共信息（应用于所有文件）</el-divider>

        <el-form-item label="艺术家">
          <el-input v-model="batchUploadForm.artist" placeholder="可选，应用于所有文件" />
        </el-form-item>

        <el-form-item label="专辑">
          <el-input v-model="batchUploadForm.album" placeholder="可选，应用于所有文件" />
        </el-form-item>

        <el-form-item label="类型">
          <el-input v-model="batchUploadForm.genre" placeholder="可选，应用于所有文件" />
        </el-form-item>

        <el-form-item label="年份">
          <el-input v-model="batchUploadForm.year" placeholder="可选，应用于所有文件" type="number" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="batchUploadForm.description" placeholder="可选，应用于所有文件" type="textarea" />
        </el-form-item>

        <el-form-item label="标签">
          <el-input v-model="batchUploadForm.tags" placeholder="多个标签用逗号分隔，应用于所有文件" />
        </el-form-item>
      </el-form>

      <!-- 批量上传进度 -->
      <div v-if="batchUploading" class="upload-progress">
        <div style="margin-bottom: 10px;">批量上传进度：{{ batchUploadProgress }}%</div>
        <el-progress :percentage="batchUploadProgress" :stroke-width="8" />
      </div>

      <template #footer>
        <el-button @click="showBatchUpload = false" :disabled="batchUploading">取消</el-button>
        <el-button type="primary" @click="handleBatchUpload" :loading="batchUploading">
          <el-icon>
            <Upload />
          </el-icon>
          {{ batchUploading ? `批量上传中 ${batchUploadProgress}%` : '批量上传' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 音乐详情对话框 -->
    <el-dialog v-model="showDetail" title="音乐详情" width="600px">
      <div v-if="selectedMusic">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题" v-if="selectedMusic.title">
            {{ selectedMusic.title }}
          </el-descriptions-item>
          <el-descriptions-item label="艺术家" v-if="selectedMusic.artist">
            {{ selectedMusic.artist }}
          </el-descriptions-item>
          <el-descriptions-item label="专辑" v-if="selectedMusic.album">
            {{ selectedMusic.album }}
          </el-descriptions-item>
          <el-descriptions-item label="类型" v-if="selectedMusic.genre">
            {{ selectedMusic.genre }}
          </el-descriptions-item>
          <el-descriptions-item label="年份" v-if="selectedMusic.year">
            {{ selectedMusic.year }}
          </el-descriptions-item>
          <el-descriptions-item label="时长" v-if="selectedMusic.duration">
            {{ formatDuration(selectedMusic.duration) }}
          </el-descriptions-item>
          <el-descriptions-item label="文件名">{{ selectedMusic.file_name }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatFileSize(selectedMusic.file_size) }}</el-descriptions-item>
          <el-descriptions-item label="播放次数">{{ selectedMusic.play_count || 0 }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedMusic.status === 1 ? 'success' : 'danger'" size="small">
              {{ selectedMusic.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedMusic.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(selectedMusic.updated_at) }}</el-descriptions-item>
          <el-descriptions-item label="描述" v-if="selectedMusic.description" :span="2">
            {{ selectedMusic.description }}
          </el-descriptions-item>
          <el-descriptions-item label="标签" v-if="selectedMusic.tags && selectedMusic.tags.length" :span="2">
            <el-tag v-for="tag in selectedMusic.tags" :key="tag" size="small" style="margin-right: 4px;">
              {{ tag }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="文件路径" :span="2">
            <el-input :value="selectedMusic.file_path" readonly>
              <template #append>
                <el-button @click="copyMusicPath(selectedMusic)">复制</el-button>
              </template>
            </el-input>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 封面图片显示 -->
        <div v-if="selectedMusic.cover_url" class="cover-preview" style="margin-top: 20px;">
          <h4>专辑封面</h4>
          <el-image :src="getStaticUrl(selectedMusic.cover_url)"
            :preview-src-list="[getStaticUrl(selectedMusic.cover_url)]"
            fit="contain"
            style="max-width: 200px; max-height: 200px;" />
        </div>

        <!-- 音频预览 -->
        <div class="music-preview" style="margin-top: 20px;">
          <h4>音频预览</h4>
          <audio :src="getMusicUrl(selectedMusic)" controls style="width: 100%;" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { musicAPI, getStaticUrl } from '@/utils/api'

// 响应式数据
const loading = ref(false)
const uploading = ref(false)
const batchUploading = ref(false)
const uploadProgress = ref(0)
const batchUploadProgress = ref(0)
const showUpload = ref(false)
const showBatchUpload = ref(false)
const showDetail = ref(false)
const musicList = ref<any[]>([])
const currentMusic = ref<any>(null)
const selectedMusic = ref<any>(null)
const audioRef = ref<HTMLAudioElement>()
const uploadFormRef = ref<FormInstance>()
const batchUploadFormRef = ref<FormInstance>()
const fileList = ref<any[]>([])
const batchFileList = ref<any[]>([])
const selectedRows = ref<any[]>([])

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 筛选条件
const filters = reactive({
  status: undefined as number | undefined,
  keyword: ''
})

// 上传表单数据
const uploadForm = reactive({
  file: null as File | null,
  file_name: '',
  title: '',
  artist: '',
  album: '',
  genre: '',
  year: undefined as number | undefined,
  cover_url: '',
  description: '',
  tags: ''
})

// 批量上传表单数据
const batchUploadForm = reactive({
  artist: '',
  album: '',
  genre: '',
  year: undefined as number | undefined,
  description: '',
  tags: ''
})

// 表单验证规则
const uploadRules = {
  file: [
    { required: true, message: '请选择要上传的音乐文件', trigger: 'change' }
  ]
}

// 加载音乐列表
const loadMusicList = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters
    }

    const response = await musicAPI.getList(params)

    if (response.success && response.data) {
      musicList.value = response.data.music || response.data
      // 处理分页信息
      if (response.data.pagination) {
        pagination.total = response.data.pagination.total || 0
      } else {
        pagination.total = response.total || 0
      }
    }
  } catch (error: any) {
    console.error('Load music list error:', error)
    // 如果是401错误（未授权），不显示错误信息，因为拦截器会处理
    if (error.response?.status !== 401) {
      ElMessage.error('加载音乐列表失败')
    }
  } finally {
    loading.value = false
  }
}

// 显示上传对话框
const showUploadDialog = () => {
  uploadForm.file = null
  uploadForm.file_name = ''
  uploadForm.title = ''
  uploadForm.artist = ''
  uploadForm.album = ''
  uploadForm.genre = ''
  uploadForm.year = undefined
  uploadForm.cover_url = ''
  uploadForm.description = ''
  uploadForm.tags = ''
  fileList.value = []
  showUpload.value = true
}

// 显示批量上传对话框
const showBatchUploadDialog = () => {
  batchFileList.value = []
  batchUploadForm.artist = ''
  batchUploadForm.album = ''
  batchUploadForm.genre = ''
  batchUploadForm.year = undefined
  batchUploadForm.description = ''
  batchUploadForm.tags = ''
  showBatchUpload.value = true
}

// 处理文件选择
const handleFileChange = (file: any) => {
  if (file.raw) {
    uploadForm.file = file.raw
    // 如果没有指定文件名，使用原文件名（去掉扩展名）
    if (!uploadForm.file_name) {
      const fileName = file.name
      const lastDotIndex = fileName.lastIndexOf('.')
      uploadForm.file_name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName
    }
  }
}

// 处理批量文件选择
const handleBatchFileChange = (file: any) => {
  // 验证文件类型和大小
  if (file.raw) {
    if (!file.raw.type.startsWith('audio/')) {
      ElMessage.error(`文件 ${file.name} 不是音频文件`)
      return
    }
    if (file.raw.size > 50 * 1024 * 1024) {
      ElMessage.error(`文件 ${file.name} 大小超过50MB`)
      return
    }
  }
}

// 单个上传
const handleSingleUpload = async () => {
  if (!uploadFormRef.value) return

  try {
    const valid = await uploadFormRef.value.validate()
    if (!valid) return

    if (!uploadForm.file) {
      ElMessage.error('请选择要上传的音乐文件')
      return
    }

    // 检查文件类型
    if (!uploadForm.file.type.startsWith('audio/')) {
      ElMessage.error('请选择音频文件')
      return
    }

    // 检查文件大小（50MB限制）
    if (uploadForm.file.size > 50 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过50MB')
      return
    }

    uploading.value = true
    uploadProgress.value = 0

    const formData = new FormData()
    formData.append('music', uploadForm.file)

    // 添加可选字段
    if (uploadForm.file_name) {
      formData.append('file_name', uploadForm.file_name)
    }
    if (uploadForm.title) {
      formData.append('title', uploadForm.title)
    }
    if (uploadForm.artist) {
      formData.append('artist', uploadForm.artist)
    }
    if (uploadForm.album) {
      formData.append('album', uploadForm.album)
    }
    if (uploadForm.genre) {
      formData.append('genre', uploadForm.genre)
    }
    if (uploadForm.year) {
      formData.append('year', uploadForm.year.toString())
    }
    if (uploadForm.cover_url) {
      formData.append('cover_url', uploadForm.cover_url)
    }
    if (uploadForm.description) {
      formData.append('description', uploadForm.description)
    }
    if (uploadForm.tags) {
      // 将逗号分隔的字符串转换为数组，然后转为JSON
      const tagsArray = uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      if (tagsArray.length > 0) {
        formData.append('tags', JSON.stringify(tagsArray))
      }
    }

    // 使用进度回调
    const response = await musicAPI.uploadSingle(formData, (progress) => {
      uploadProgress.value = progress
    })

    if (response.success) {
      ElMessage.success('音乐上传成功')
      showUpload.value = false
      loadMusicList()
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error: any) {
    console.error('Upload music error:', error)
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

// 批量上传
const handleBatchUpload = async () => {
  try {
    if (batchFileList.value.length === 0) {
      ElMessage.error('请选择要上传的音乐文件')
      return
    }

    batchUploading.value = true
    batchUploadProgress.value = 0

    const formData = new FormData()

    // 添加所有文件到FormData
    batchFileList.value.forEach((fileItem) => {
      if (fileItem.raw) {
        formData.append('music', fileItem.raw)
      }
    })

    // 添加公共字段（如果有值）
    if (batchUploadForm.artist) {
      formData.append('artist', batchUploadForm.artist)
    }
    if (batchUploadForm.album) {
      formData.append('album', batchUploadForm.album)
    }
    if (batchUploadForm.genre) {
      formData.append('genre', batchUploadForm.genre)
    }
    if (batchUploadForm.year) {
      formData.append('year', batchUploadForm.year.toString())
    }
    if (batchUploadForm.description) {
      formData.append('description', batchUploadForm.description)
    }
    if (batchUploadForm.tags) {
      // 将逗号分隔的字符串转换为数组，然后转为JSON
      const tagsArray = batchUploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      if (tagsArray.length > 0) {
        formData.append('tags', JSON.stringify(tagsArray))
      }
    }

    // 使用进度回调
    const response = await musicAPI.uploadMultiple(formData, (progress) => {
      batchUploadProgress.value = progress
    })

    if (response.success) {
      const { successCount, failureCount, total } = response.data
      ElMessage.success(
        `批量上传完成。成功：${successCount}个，失败：${failureCount}个，总计：${total}个`
      )
      showBatchUpload.value = false
      loadMusicList()
    } else {
      throw new Error(response.message || '批量上传失败')
    }
  } catch (error: any) {
    console.error('Batch upload music error:', error)
    ElMessage.error(error.message || '批量上传失败')
  } finally {
    batchUploading.value = false
  }
}

// 切换状态
const toggleStatus = async (music: any) => {
  try {
    await musicAPI.toggleStatus(music.id)
    ElMessage.success(music.status === 1 ? '音乐已禁用' : '音乐已启用')
    loadMusicList()
  } catch (error: any) {
    console.error('Toggle music status error:', error)
    ElMessage.error(error.message || '操作失败')
  }
}

// 播放音乐
const playMusic = (music: any) => {
  currentMusic.value = music
  // 等待DOM更新后播放
  setTimeout(() => {
    if (audioRef.value) {
      audioRef.value.play()
    }
  }, 100)
}

// 停止播放
const stopMusic = () => {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
  }
  currentMusic.value = null
}

// 删除音乐
const deleteMusic = async (music: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除音乐"${music.file_name}"吗？删除后无法恢复！`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const response = await musicAPI.delete(music.id)
    if (response.success) {
      ElMessage.success('音乐删除成功')

      // 如果正在播放被删除的音乐，停止播放
      if (currentMusic.value?.id === music.id) {
        stopMusic()
      }

      loadMusicList()
    } else {
      throw new Error(response.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete music error:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 处理音乐文件URL
const getMusicUrl = (music: any) => {
  // 优先使用 file_url 字段（如果存在）
  const fileUrl = music.file_url || music.file_path

  if (!fileUrl) return ''

  // 如果已经是完整的URL，直接返回
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl
  }

  // 始终使用 getStaticUrl 函数处理静态资源URL
  return getStaticUrl(fileUrl)
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化音乐时长
const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '--'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 查看音乐详情
const viewMusicDetail = (music: any) => {
  selectedMusic.value = music
  showDetail.value = true
}

// 复制音乐路径
const copyMusicPath = async (music: any) => {
  try {
    await navigator.clipboard.writeText(music.file_path)
    ElMessage.success('音乐路径已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 处理表格选择
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

// 批量启用
const batchEnable = async () => {
  if (selectedRows.value.length === 0) return

  try {
    const ids = selectedRows.value.map(item => item.id)
    await musicAPI.batchUpdateStatus({ ids, status: 1 })
    ElMessage.success('批量启用成功')
    loadMusicList()
    selectedRows.value = []
  } catch (error: any) {
    ElMessage.error(error.message || '批量启用失败')
  }
}

// 批量禁用
const batchDisable = async () => {
  if (selectedRows.value.length === 0) return

  try {
    const ids = selectedRows.value.map(item => item.id)
    await musicAPI.batchUpdateStatus({ ids, status: 0 })
    ElMessage.success('批量禁用成功')
    loadMusicList()
    selectedRows.value = []
  } catch (error: any) {
    ElMessage.error(error.message || '批量禁用失败')
  }
}

// 批量验证
const batchValidate = async () => {
  if (selectedRows.value.length === 0) return

  try {
    const ids = selectedRows.value.map(item => item.id)
    await musicAPI.batchValidate(ids)
    ElMessage.success('批量验证已开始')
    loadMusicList()
  } catch (error: any) {
    ElMessage.error(error.message || '批量验证失败')
  }
}

// 批量删除
const batchDelete = async () => {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个音乐文件吗？删除后无法恢复！`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    // 逐个删除（假设没有批量删除接口）
    for (const music of selectedRows.value) {
      await musicAPI.delete(music.id)
    }

    ElMessage.success('批量删除成功')
    loadMusicList()
    selectedRows.value = []
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

// 验证音乐文件
const validateMusic = async (music: any) => {
  try {
    await musicAPI.validate(music.id)
    ElMessage.success('验证已开始')
    loadMusicList()
  } catch (error: any) {
    ElMessage.error(error.message || '验证失败')
  }
}

// 刷新音乐元数据
const refreshMetadata = async (music: any) => {
  try {
    await musicAPI.refresh(music.id)
    ElMessage.success('元数据刷新成功')
    loadMusicList()
  } catch (error: any) {
    ElMessage.error(error.message || '刷新失败')
  }
}

onMounted(() => {
  loadMusicList()
})
</script>

<style scoped>
.music-view {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-container {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.music-player {
  margin-top: 20px;
  position: sticky;
  bottom: 20px;
  z-index: 100;
}

.player-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.music-info h4 {
  margin: 0 0 4px 0;
  color: #303133;
}

.music-info p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

audio {
  flex: 1;
  max-width: 300px;
}

.batch-actions {
  margin-bottom: 16px;
}

.music-info .title {
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.music-info .meta {
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}

.music-info .tags {
  margin-top: 4px;
}

.no-cover {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 20px;
  color: #909399;
}

.upload-progress {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.upload-progress div:first-child {
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}
</style>
