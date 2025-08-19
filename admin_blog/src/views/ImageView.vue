<template>
  <div class="image-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>图片管理</span>
          <div class="header-actions">
            <el-button @click="loadStatistics">
              <el-icon>
                <DataAnalysis />
              </el-icon>
              统计信息
            </el-button>
            <el-button type="primary" @click="showUploadDialog">
              <el-icon>
                <Upload />
              </el-icon>
              上传图片
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select v-model="filters.upload_type" placeholder="选择类型" clearable @change="loadImages">
              <el-option label="分类图片" :value="1" />
              <el-option label="文章图片" :value="2" />
              <el-option label="用户头像" :value="3" />
              <el-option label="其他" :value="4" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input v-model="filters.keyword" placeholder="搜索文件名、描述" clearable @keyup.enter="loadImages">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.orderBy" @change="loadImages">
              <el-option label="按创建时间" value="created_at" />
              <el-option label="按更新时间" value="updated_at" />
              <el-option label="按文件大小" value="file_size" />
              <el-option label="按文件名" value="file_name" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.order" @change="loadImages">
              <el-option label="降序" value="DESC" />
              <el-option label="升序" value="ASC" />
            </el-select>
          </el-col>
        </el-row>
      </div>

      <!-- 图片网格 -->
      <div v-loading="loading" class="image-grid">
        <div v-for="image in images" :key="image.id" class="image-card" @click="showImageDetail(image)">
          <div class="image-container">
            <el-image :src="getImageUrl(image.file_url)" fit="cover" lazy @error="handleImageError(image)">
              <template #error>
                <div class="image-error">
                  <el-icon>
                    <Picture />
                  </el-icon>
                  <span>加载失败</span>
                  <small>{{ image.file_url }}</small>
                </div>
              </template>
            </el-image>
            <div class="image-overlay">
              <div class="image-actions">
                <el-button size="small" @click.stop="copyImageUrl(image)">
                  <el-icon>
                    <DocumentCopy />
                  </el-icon>
                </el-button>
                <el-button size="small" @click.stop="editImage(image)">
                  <el-icon>
                    <Edit />
                  </el-icon>
                </el-button>
                <el-button size="small" type="danger" @click.stop="deleteImage(image)">
                  <el-icon>
                    <Delete />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </div>
          <div class="image-info">
            <div class="image-name">{{ image.original_name }}</div>
            <div class="image-meta">
              <span class="image-size">{{ formatFileSize(image.file_size) }}</span>
              <span class="image-type">{{ getTypeLabel(image.upload_type) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[12, 24, 48, 96]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadImages" @current-change="loadImages" />
      </div>
    </el-card>

    <!-- 图片详情弹窗 -->
    <el-dialog v-model="showDetail" title="图片详情" width="800px">
      <div v-if="selectedImage" class="image-detail">
        <div class="detail-image">
          <el-image :src="getImageUrl(selectedImage.file_url)" fit="contain" @error="handleImageError(selectedImage)">
            <template #error>
              <div class="image-error">
                <el-icon>
                  <Picture />
                </el-icon>
                <span>图片加载失败</span>
                <small>{{ selectedImage.file_url }}</small>
              </div>
            </template>
          </el-image>
        </div>
        <div class="detail-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="文件名">{{ selectedImage.original_name }}</el-descriptions-item>
            <el-descriptions-item label="文件大小">{{ formatFileSize(selectedImage.file_size) }}</el-descriptions-item>
            <el-descriptions-item label="图片尺寸">{{ selectedImage.width }} × {{ selectedImage.height
              }}</el-descriptions-item>
            <el-descriptions-item label="MIME类型">{{ selectedImage.mime_type }}</el-descriptions-item>
            <el-descriptions-item label="上传类型">{{ getTypeLabel(selectedImage.upload_type) }}</el-descriptions-item>
            <el-descriptions-item label="上传时间">{{ formatDate(selectedImage.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="文件URL" :span="2">
              <el-input :value="selectedImage.file_url" readonly>
                <template #append>
                  <el-button @click="copyImageUrl(selectedImage)">复制</el-button>
                </template>
              </el-input>
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedImage.alt_text" label="替代文本" :span="2">
              {{ selectedImage.alt_text }}
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedImage.description" label="描述" :span="2">
              {{ selectedImage.description }}
            </el-descriptions-item>
            <el-descriptions-item v-if="selectedImage.tags && selectedImage.tags.length" label="标签" :span="2">
              <el-tag v-for="tag in selectedImage.tags" :key="tag" size="small" style="margin-right: 8px;">
                {{ tag }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑图片弹窗 -->
    <el-dialog v-model="showEdit" title="编辑图片信息" width="600px">
      <el-form ref="editFormRef" :model="editForm" label-width="100px">
        <el-form-item label="替代文本">
          <el-input v-model="editForm.alt_text" placeholder="请输入替代文本" maxlength="255" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入图片描述" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="editForm.tags" multiple filterable allow-create placeholder="选择或输入标签" style="width: 100%">
            <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传类型">
          <el-select v-model="editForm.upload_type" style="width: 100%">
            <el-option label="分类图片" :value="1" />
            <el-option label="文章图片" :value="2" />
            <el-option label="用户头像" :value="3" />
            <el-option label="其他" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联ID">
          <el-input-number v-model="editForm.related_id" :min="0" placeholder="相关联的ID（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="updateImage" :loading="updating">保存</el-button>
      </template>
    </el-dialog>

    <!-- 统计信息弹窗 -->
    <el-dialog v-model="showStats" title="图片统计信息" width="500px">
      <div v-if="statistics" class="statistics-container">
        <el-statistic title="图片总数" :value="statistics.total" />
        <el-divider />
        <div class="type-stats">
          <h4>按类型统计</h4>
          <div class="type-item" v-for="(count, type) in statistics.byType" :key="type">
            <span>{{ getTypeLabel(Number(type)) }}</span>
            <span>{{ count }} 张</span>
          </div>
        </div>
        <el-divider />
        <el-statistic title="总文件大小" :value="formatFileSize(statistics.totalSize)" />
        <el-statistic title="平均文件大小" :value="formatFileSize(statistics.averageSize)" />
      </div>
    </el-dialog>

    <!-- 上传图片弹窗 -->
    <el-dialog v-model="showUpload" title="上传图片" width="600px">
      <el-form ref="uploadFormRef" :model="uploadForm" :rules="uploadRules" label-width="100px">
        <el-form-item label="选择图片" prop="file">
          <el-upload v-model:file-list="fileList" action="" :before-upload="() => false" :on-change="handleFileChange"
            :limit="1" accept="image/*" drag>
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击选择文件</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 jpg/png/gif/webp 格式，文件大小不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="文件名" prop="file_name">
          <el-input v-model="uploadForm.file_name" placeholder="请输入文件名（可选，不填则使用原文件名）" />
        </el-form-item>

        <el-form-item label="上传类型" prop="upload_type">
          <el-select v-model="uploadForm.upload_type" style="width: 100%">
            <el-option label="分类图片" :value="1" />
            <el-option label="文章图片" :value="2" />
            <el-option label="用户头像" :value="3" />
            <el-option label="其他" :value="4" />
          </el-select>
        </el-form-item>

        <el-form-item label="替代文本">
          <el-input v-model="uploadForm.alt_text" placeholder="请输入替代文本（可选）" maxlength="255" />
        </el-form-item>

        <el-form-item label="图片描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="请输入图片描述（可选）" />
        </el-form-item>

        <el-form-item label="标签">
          <el-select v-model="uploadForm.tags" multiple filterable allow-create placeholder="选择或输入标签（可选）"
            style="width: 100%">
            <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>

        <el-form-item label="关联ID">
          <el-input-number v-model="uploadForm.related_id" :min="0" placeholder="相关联的ID（可选）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showUpload = false">取消</el-button>
        <el-button type="primary" @click="handleUploadConfirm" :loading="uploading">
          <el-icon>
            <Upload />
          </el-icon>
          上传图片
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { imageAPI, getStaticUrl } from '@/utils/api'

// 响应式数据
const loading = ref(false)
const updating = ref(false)
const uploading = ref(false)
const showDetail = ref(false)
const showEdit = ref(false)
const showStats = ref(false)
const showUpload = ref(false)
const images = ref<any[]>([])
const selectedImage = ref<any>(null)
const statistics = ref<any>(null)
const editFormRef = ref<FormInstance>()
const uploadFormRef = ref<FormInstance>()
const fileList = ref<any[]>([])

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 24,
  total: 0
})

// 筛选条件
const filters = reactive({
  upload_type: undefined,
  keyword: '',
  orderBy: 'created_at',
  order: 'DESC'
})

// 编辑表单
const editForm = reactive({
  id: null as number | null,
  alt_text: '',
  description: '',
  tags: [] as string[],
  upload_type: 1,
  related_id: null as number | null
})

// 上传表单
const uploadForm = reactive({
  file: null as File | null,
  file_name: '',
  alt_text: '',
  description: '',
  tags: [] as string[],
  upload_type: 4,
  related_id: null as number | null
})

const availableTags = ref<string[]>([])

// 上传表单验证规则
const uploadRules = {
  file: [
    { required: true, message: '请选择要上传的图片', trigger: 'change' }
  ],
  upload_type: [
    { required: true, message: '请选择上传类型', trigger: 'change' }
  ]
}

// 加载图片列表
const loadImages = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters
    }

    const response = await imageAPI.getList(params)

    if (response.success && response.data) {
      images.value = response.data.images || response.data
      pagination.total = response.total || 0
    }
  } catch (error) {
    console.error('Load images error:', error)
    ElMessage.error('加载图片列表失败')
  } finally {
    loading.value = false
  }
}

// 显示上传对话框
const showUploadDialog = () => {
  // 重置表单
  uploadForm.file = null
  uploadForm.file_name = ''
  uploadForm.alt_text = ''
  uploadForm.description = ''
  uploadForm.tags = []
  uploadForm.upload_type = 4
  uploadForm.related_id = null
  fileList.value = []
  showUpload.value = true
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

// 确认上传
const handleUploadConfirm = async () => {
  if (!uploadFormRef.value) return

  try {
    const valid = await uploadFormRef.value.validate()
    if (!valid) return

    if (!uploadForm.file) {
      ElMessage.error('请选择要上传的图片')
      return
    }

    // 检查文件类型
    if (!uploadForm.file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return
    }

    // 检查文件大小（10MB限制）
    if (uploadForm.file.size > 10 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过10MB')
      return
    }

    uploading.value = true

    const formData = new FormData()
    formData.append('image', uploadForm.file)

    // 添加所有可选参数
    if (uploadForm.file_name) {
      formData.append('file_name', uploadForm.file_name)
    }
    if (uploadForm.alt_text) {
      formData.append('alt_text', uploadForm.alt_text)
    }
    if (uploadForm.description) {
      formData.append('description', uploadForm.description)
    }
    if (uploadForm.tags.length > 0) {
      formData.append('tags', JSON.stringify(uploadForm.tags))
    }
    formData.append('upload_type', uploadForm.upload_type.toString())
    if (uploadForm.related_id) {
      formData.append('related_id', uploadForm.related_id.toString())
    }

    const response = await imageAPI.upload(formData)

    if (response.success) {
      ElMessage.success('图片上传成功')
      showUpload.value = false
      loadImages()
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error: any) {
    console.error('Upload image error:', error)
    ElMessage.error(error.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

// 显示图片详情
const showImageDetail = (image: any) => {
  selectedImage.value = image
  showDetail.value = true
}

// 编辑图片
const editImage = (image: any) => {
  editForm.id = image.id
  editForm.alt_text = image.alt_text || ''
  editForm.description = image.description || ''
  editForm.tags = image.tags || []
  editForm.upload_type = image.upload_type
  editForm.related_id = image.related_id
  showEdit.value = true
}

// 更新图片信息
const updateImage = async () => {
  try {
    updating.value = true
    const data = {
      alt_text: editForm.alt_text,
      description: editForm.description,
      tags: editForm.tags,
      upload_type: editForm.upload_type,
      related_id: editForm.related_id
    }

    const response = await imageAPI.update(editForm.id!, data)

    if (response.success) {
      ElMessage.success('图片信息更新成功')
      showEdit.value = false
      loadImages()
    } else {
      throw new Error(response.message || '更新失败')
    }
  } catch (error: any) {
    console.error('Update image error:', error)
    ElMessage.error(error.message || '更新失败')
  } finally {
    updating.value = false
  }
}

// 删除图片
const deleteImage = async (image: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除图片"${image.original_name}"吗？`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await imageAPI.delete(image.id)
    if (response.success) {
      ElMessage.success('图片删除成功')
      loadImages()
    } else {
      throw new Error(response.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete image error:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 复制图片URL
const copyImageUrl = async (image: any) => {
  try {
    await navigator.clipboard.writeText(image.file_url)
    ElMessage.success('图片URL已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 加载统计信息
const loadStatistics = async () => {
  try {
    const response = await imageAPI.getStatistics()
    if (response.success) {
      statistics.value = response.data
      showStats.value = true
    }
  } catch (error) {
    console.error('Load statistics error:', error)
    ElMessage.error('加载统计信息失败')
  }
}

// 获取类型标签
const getTypeLabel = (type: number) => {
  const labels = {
    1: '分类图片',
    2: '文章图片',
    3: '用户头像',
    4: '其他'
  }
  return labels[type as keyof typeof labels] || '未知'
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

// 处理图片URL
const getImageUrl = (url: string) => {
  if (!url) return ''

  // 如果已经是完整的URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 使用环境变量的后端地址拼接完整URL
  return getStaticUrl(url)
}

// 处理图片加载错误
const handleImageError = (image: any) => {
  console.error('图片加载失败:', {
    file_url: image.file_url,
    original_name: image.original_name,
    processed_url: getImageUrl(image.file_url)
  })
}

onMounted(() => {
  loadImages()
})
</script>

<style scoped>
.image-view {
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

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.image-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-container {
  position: relative;
  height: 150px;
}

.image-container .el-image {
  width: 100%;
  height: 100%;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  background-color: #f5f5f5;
  text-align: center;
  padding: 8px;
}

.image-error small {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: #ccc;
  word-break: break-all;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.image-actions {
  display: flex;
  gap: 8px;
}

.image-info {
  padding: 12px;
}

.image-name {
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.image-detail {
  display: flex;
  gap: 20px;
}

.detail-image {
  flex: 1;
  max-width: 400px;
}

.detail-info {
  flex: 1;
}

.statistics-container {
  text-align: center;
}

.type-stats {
  margin: 16px 0;
}

.type-item {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
