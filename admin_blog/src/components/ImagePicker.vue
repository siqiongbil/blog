<template>
  <div class="image-picker">
    <!-- 当前图片显示 -->
    <div v-if="modelValue" class="current-image">
      <el-image :src="getImageUrl(modelValue)" fit="cover" style="width: 120px; height: 80px; border-radius: 4px"
        @error="handleImageError">
        <template #error>
          <div class="image-error">
            <el-icon>
              <Picture />
            </el-icon>
            <span>加载失败</span>
          </div>
        </template>
      </el-image>
      <div class="image-actions">
        <el-button size="small" @click="selectImage">更换图片</el-button>
        <el-button size="small" type="danger" @click="removeImage">移除</el-button>
      </div>
    </div>

    <!-- 选择图片按钮 -->
    <div v-else class="image-placeholder" @click="selectImage">
      <el-icon>
        <Picture />
      </el-icon>
      <span>选择图片</span>
    </div>

    <!-- 图片选择弹窗 -->
    <el-dialog v-model="showPicker" title="选择图片" width="900px" top="5vh">
      <div class="image-picker-dialog">
        <!-- 操作栏 -->
        <div class="picker-toolbar">
          <div class="picker-filters">
            <el-select v-model="filters.upload_type" placeholder="选择类型" clearable @change="loadImages">
              <el-option label="分类图片" :value="1" />
              <el-option label="文章图片" :value="2" />
              <el-option label="用户头像" :value="3" />
              <el-option label="其他" :value="4" />
            </el-select>
            <el-input v-model="filters.keyword" placeholder="搜索图片" clearable @keyup.enter="loadImages"
              style="width: 200px;">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </div>
          <div class="picker-actions">
            <el-upload action="" :before-upload="handleUpload" accept="image/*" :show-file-list="false">
              <el-button type="primary" size="small">
                <el-icon>
                  <Upload />
                </el-icon>
                上传新图片
              </el-button>
            </el-upload>
          </div>
        </div>

        <!-- 图片网格 -->
        <div v-loading="loading" class="picker-grid">
          <div v-for="image in images" :key="image.id" class="picker-item"
            :class="{ selected: selectedImageUrl === image.file_url }" @click="selectImageFromList(image)">
            <el-image :src="getImageUrl(image.file_url)" fit="cover" @error="() => handleImageError(image)">
              <template #error>
                <div class="image-error">
                  <el-icon>
                    <Picture />
                  </el-icon>
                </div>
              </template>
            </el-image>
            <div class="item-info">
              <div class="item-name">{{ image.original_name }}</div>
              <div class="item-size">{{ formatFileSize(image.file_size) }}</div>
            </div>
            <div v-if="selectedImageUrl === image.file_url" class="selected-mark">
              <el-icon>
                <Check />
              </el-icon>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="picker-pagination">
          <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
            :page-sizes="[12, 24, 48]" :total="pagination.total" layout="total, sizes, prev, pager, next"
            @size-change="loadImages" @current-change="loadImages" />
        </div>
      </div>

      <template #footer>
        <el-button @click="showPicker = false">取消</el-button>
        <el-button type="primary" @click="confirmSelection" :disabled="!selectedImageUrl">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineEmits, defineProps } from 'vue'
import { ElMessage } from 'element-plus'
import { imageAPI, getStaticUrl } from '@/utils/api'

// Props
interface Props {
  modelValue?: string
  uploadType?: number // 1-分类图片，2-文章图片，3-用户头像，4-其他
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  uploadType: 4
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 响应式数据
const loading = ref(false)
const showPicker = ref(false)
const images = ref<any[]>([])
const selectedImageUrl = ref('')

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 24,
  total: 0
})

// 筛选条件
const filters = reactive({
  upload_type: undefined as number | undefined,
  keyword: ''
})

// 选择图片
const selectImage = () => {
  selectedImageUrl.value = props.modelValue
  showPicker.value = true
  loadImages()
}

// 移除图片
const removeImage = () => {
  emit('update:modelValue', '')
}

// 从列表中选择图片
const selectImageFromList = (image: any) => {
  selectedImageUrl.value = image.file_url
}

// 确认选择
const confirmSelection = () => {
  emit('update:modelValue', selectedImageUrl.value)
  showPicker.value = false
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

// 上传图片
const handleUpload = async (file: File) => {
  try {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return false
    }

    // 检查文件大小（10MB限制）
    if (file.size > 10 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过10MB')
      return false
    }

    const formData = new FormData()
    formData.append('image', file)
    formData.append('upload_type', props.uploadType.toString())

    // 使用原文件名（去掉扩展名）作为file_name
    const fileName = file.name
    const lastDotIndex = fileName.lastIndexOf('.')
    const fileNameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName
    formData.append('file_name', fileNameWithoutExt)

    const response = await imageAPI.upload(formData)

    if (response.success) {
      ElMessage.success('图片上传成功')
      // 选择刚上传的图片
      selectedImageUrl.value = response.data.file_url
      loadImages()
    } else {
      throw new Error(response.message || '上传失败')
    }
  } catch (error: any) {
    console.error('Upload image error:', error)
    ElMessage.error(error.message || '上传失败')
  }

  return false
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
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
const handleImageError = (image?: any) => {
  if (image) {
    console.error('图片加载失败:', {
      file_url: image.file_url,
      original_name: image.original_name,
      processed_url: getImageUrl(image.file_url)
    })
  } else {
    console.error('当前图片加载失败:', props.modelValue)
  }
}
</script>

<style scoped>
.image-picker {
  width: 100%;
}

.current-image {
  display: flex;
  align-items: center;
  gap: 12px;
}

.image-actions {
  display: flex;
  gap: 8px;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 80px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  color: #909399;
}

.image-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
}

.image-picker-dialog {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.picker-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.picker-filters {
  display: flex;
  gap: 12px;
}

.picker-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  overflow-y: auto;
  padding: 4px;
}

.picker-item {
  position: relative;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.picker-item:hover {
  border-color: #409eff;
}

.picker-item.selected {
  border-color: #409eff;
}

.picker-item .el-image {
  width: 100%;
  height: 80px;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #c0c4cc;
}

.item-info {
  padding: 8px;
  background: #f5f7fa;
}

.item-name {
  font-size: 12px;
  color: #606266;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-size {
  font-size: 11px;
  color: #909399;
}

.selected-mark {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.picker-pagination {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
}
</style>
