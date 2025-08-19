<template>
    <div class="file-view">
        <!-- 文件管理 -->
        <el-card class="mb-4">
            <template #header>
                <div class="card-header">
                    <span>文件管理</span>
                    <div class="header-actions">
                        <el-button type="primary" @click="showFileUploadDialog">
                            <el-icon>
                                <upload />
                            </el-icon>
                            上传文件
                        </el-button>
                        <el-button @click="refreshFileList" :loading="loadingFiles">
                            <el-icon>
                                <refresh />
                            </el-icon>
                            刷新
                        </el-button>
                    </div>
                </div>
            </template>

            <!-- 文件筛选 -->
            <div class="filter-container mb-4">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-select v-model="fileFilters.file_type" placeholder="文件类型" clearable @change="loadFiles">
                            <el-option label="文档" value="document" />
                            <el-option label="视频" value="video" />
                            <el-option label="音频" value="audio" />
                            <el-option label="压缩包" value="archive" />
                            <el-option label="其他" value="other" />
                        </el-select>
                    </el-col>
                    <el-col :span="8">
                        <el-input v-model="fileFilters.keyword" placeholder="搜索文件名" clearable @keyup.enter="loadFiles">
                            <template #prefix>
                                <el-icon>
                                    <search />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-col>
                    <el-col :span="4">
                        <el-button @click="loadFiles">搜索</el-button>
                    </el-col>
                    <el-col :span="6">
                        <el-button @click="showFileStatistics" type="info">
                            <el-icon><data-line /></el-icon>
                            统计信息
                        </el-button>
                    </el-col>
                </el-row>
            </div>

            <!-- 文件列表 -->
            <el-table v-loading="loadingFiles" :data="files" stripe>
                <el-table-column label="文件名" min-width="200">
                    <template #default="{ row }">
                        <div class="file-item">
                            <el-icon class="file-icon">
                                <document v-if="row.file_type === 'document'" />
                                <video-play v-else-if="row.file_type === 'video'" />
                                <headset v-else-if="row.file_type === 'audio'" />
                                <folder v-else-if="row.file_type === 'archive'" />
                                <document v-else />
                            </el-icon>
                            <div class="file-info">
                                <div class="file-name">{{ row.file_name || row.original_name }}</div>
                                <div class="file-meta">{{ row.description || '无描述' }}</div>
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="类型" width="100">
                    <template #default="{ row }">
                        <el-tag :type="getFileTypeTag(row.file_type)" size="small">
                            {{ getFileTypeText(row.file_type) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="大小" width="100">
                    <template #default="{ row }">
                        {{ formatFileSize(row.file_size) }}
                    </template>
                </el-table-column>
                <el-table-column label="上传时间" width="150">
                    <template #default="{ row }">
                        {{ formatDate(row.created_at) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" @click="downloadFile(row)">下载</el-button>
                        <el-button size="small" @click="editFile(row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteFile(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 文件分页 -->
            <div class="pagination-container">
                <el-pagination v-model:current-page="filePagination.page" v-model:page-size="filePagination.pageSize"
                    :page-sizes="[10, 20, 50, 100]" :total="filePagination.total"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="loadFiles"
                    @current-change="loadFiles" />
            </div>
        </el-card>

        <!-- 图片管理 -->
        <el-card class="mb-4">
            <template #header>
                <div class="card-header">
                    <span>图片管理</span>
                    <div class="header-actions">
                        <el-button type="primary" @click="showImageUploadDialog">
                            <el-icon>
                                <picture />
                            </el-icon>
                            上传图片
                        </el-button>
                        <el-button @click="showImageStatistics" type="info">
                            <el-icon><data-line /></el-icon>
                            图片统计
                        </el-button>
                    </div>
                </div>
            </template>

            <!-- 图片筛选 -->
            <div class="filter-container mb-4">
                <el-row :gutter="20">
                    <el-col :span="6">
                        <el-select v-model="imageFilters.upload_type" placeholder="图片类型" clearable @change="loadImages">
                            <el-option label="分类图片" :value="1" />
                            <el-option label="文章图片" :value="2" />
                            <el-option label="用户头像" :value="3" />
                            <el-option label="其他图片" :value="4" />
                        </el-select>
                    </el-col>
                    <el-col :span="8">
                        <el-input v-model="imageFilters.keyword" placeholder="搜索图片名" clearable
                            @keyup.enter="loadImages">
                            <template #prefix>
                                <el-icon>
                                    <search />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-col>
                    <el-col :span="4">
                        <el-button @click="loadImages">搜索</el-button>
                    </el-col>
                </el-row>
            </div>

            <!-- 图片网格 -->
            <div v-loading="loadingImages" class="image-grid">
                <div v-for="image in images" :key="image.id" class="image-card">
                    <el-image :src="getStaticUrl(image.file_url)" :preview-src-list="[getStaticUrl(image.file_url)]"
                        fit="cover" class="image-preview" />
                    <div class="image-info">
                        <div class="image-name">{{ image.file_name || image.original_name }}</div>
                        <div class="image-meta">
                            <el-tag :type="getUploadTypeTag(image.upload_type)" size="small">
                                {{ getUploadTypeText(image.upload_type) }}
                            </el-tag>
                            <span class="image-size">{{ formatFileSize(image.file_size) }}</span>
                        </div>
                        <div class="image-actions">
                            <el-button size="small" @click="editImage(image)">编辑</el-button>
                            <el-button size="small" type="danger" @click="deleteImage(image)">删除</el-button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 图片分页 -->
            <div class="pagination-container">
                <el-pagination v-model:current-page="imagePagination.page" v-model:page-size="imagePagination.pageSize"
                    :page-sizes="[12, 24, 48, 96]" :total="imagePagination.total"
                    layout="total, sizes, prev, pager, next, jumper" @size-change="loadImages"
                    @current-change="loadImages" />
            </div>
        </el-card>

        <!-- 文件上传对话框 -->
        <el-dialog v-model="showFileUpload" title="上传文件" width="500px">
            <el-form :model="fileUploadForm" label-width="100px">
                <el-form-item label="选择文件" required>
                    <el-upload ref="fileUploadRef" :auto-upload="false" :limit="1" :on-change="handleFileSelect"
                        :file-list="fileList" drag>
                        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                        <div class="el-upload__text">拖拽文件到此处或<em>点击选择文件</em></div>
                        <template #tip>
                            <div class="el-upload__tip">支持所有类型文件，最大100MB</div>
                        </template>
                    </el-upload>
                </el-form-item>
                <el-form-item label="文件名">
                    <el-input v-model="fileUploadForm.file_name" placeholder="可选，不填则使用原文件名" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="fileUploadForm.description" type="textarea" :rows="3" placeholder="文件描述" />
                </el-form-item>
                <el-form-item label="标签">
                    <el-select v-model="fileUploadForm.tags" multiple filterable allow-create placeholder="文件标签">
                        <el-option v-for="tag in commonTags" :key="tag" :label="tag" :value="tag" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showFileUpload = false">取消</el-button>
                <el-button type="primary" @click="handleFileUpload" :loading="uploading">上传文件</el-button>
            </template>
        </el-dialog>

        <!-- 图片上传对话框 -->
        <el-dialog v-model="showImageUpload" title="上传图片" width="500px">
            <el-form :model="imageUploadForm" label-width="100px">
                <el-form-item label="选择图片" required>
                    <el-upload ref="imageUploadRef" :auto-upload="false" :limit="1" :on-change="handleImageSelect"
                        :file-list="imageList" accept="image/*" list-type="picture-card">
                        <el-icon>
                            <plus />
                        </el-icon>
                        <template #tip>
                            <div class="el-upload__tip">支持 jpg/png/gif/webp 格式，最大10MB</div>
                        </template>
                    </el-upload>
                </el-form-item>
                <el-form-item label="图片名称">
                    <el-input v-model="imageUploadForm.file_name" placeholder="可选，不填则使用原文件名" />
                </el-form-item>
                <el-form-item label="替代文本">
                    <el-input v-model="imageUploadForm.alt_text" placeholder="图片的替代文本（SEO友好）" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="imageUploadForm.description" type="textarea" :rows="3" placeholder="图片描述" />
                </el-form-item>
                <el-form-item label="图片类型">
                    <el-select v-model="imageUploadForm.upload_type" placeholder="选择图片类型">
                        <el-option label="分类图片" :value="1" />
                        <el-option label="文章图片" :value="2" />
                        <el-option label="用户头像" :value="3" />
                        <el-option label="其他图片" :value="4" />
                    </el-select>
                </el-form-item>
                <el-form-item label="关联ID">
                    <el-input-number v-model="imageUploadForm.related_id" :min="0" placeholder="关联的分类ID或文章ID（可选）" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showImageUpload = false">取消</el-button>
                <el-button type="primary" @click="handleImageUpload" :loading="uploading">上传图片</el-button>
            </template>
        </el-dialog>

        <!-- 统计信息对话框 -->
        <el-dialog v-model="showStats" title="存储统计" width="600px">
            <div v-if="statistics">
                <el-descriptions title="文件统计" :column="2" border>
                    <el-descriptions-item label="文件总数">{{ statistics.files?.total || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="文件总大小">{{ formatFileSize(statistics.files?.totalSize || 0)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="平均文件大小">{{ formatFileSize(statistics.files?.averageSize || 0)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="最大文件">{{ formatFileSize(statistics.files?.maxSize || 0)
                    }}</el-descriptions-item>
                </el-descriptions>

                <el-descriptions title="图片统计" :column="2" border class="mt-4">
                    <el-descriptions-item label="图片总数">{{ statistics.images?.total || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="图片总大小">{{ formatFileSize(statistics.images?.totalSize || 0)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="平均图片大小">{{ formatFileSize(statistics.images?.averageSize || 0)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="分类图片">{{ statistics.images?.byType?.[1] || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="文章图片">{{ statistics.images?.byType?.[2] || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="用户头像">{{ statistics.images?.byType?.[3] || 0 }}</el-descriptions-item>
                    <el-descriptions-item label="其他图片">{{ statistics.images?.byType?.[4] || 0 }}</el-descriptions-item>
                </el-descriptions>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fileAPI, imageAPI, getStaticUrl } from '@/utils/api'
import {
    Upload,
    Refresh,
    Search,
    DataLine,
    Document,
    VideoPlay,
    Headset,
    Folder,
    Picture,
    Plus,
    UploadFilled
} from '@element-plus/icons-vue'

// 响应式数据
const loadingFiles = ref(false)
const loadingImages = ref(false)
const uploading = ref(false)
const showFileUpload = ref(false)
const showImageUpload = ref(false)
const showStats = ref(false)

const files = ref<any[]>([])
const images = ref<any[]>([])
const statistics = ref<any>(null)

// 分页信息
const filePagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
})

const imagePagination = reactive({
    page: 1,
    pageSize: 24,
    total: 0
})

// 筛选条件
const fileFilters = reactive({
    file_type: '',
    keyword: ''
})

const imageFilters = reactive({
    upload_type: null as number | null,
    keyword: ''
})

// 上传表单
const fileUploadForm = reactive({
    file_name: '',
    description: '',
    tags: [] as string[],
    related_id: null as number | null
})

const imageUploadForm = reactive({
    file_name: '',
    alt_text: '',
    description: '',
    upload_type: 1,
    related_id: null as number | null
})

const fileList = ref<any[]>([])
const imageList = ref<any[]>([])
const selectedFile = ref<File | null>(null)
const selectedImage = ref<File | null>(null)

const commonTags = ['文档', '重要', '临时', '资料', '教程', '设计', '代码']

// 加载文件列表
const loadFiles = async () => {
    try {
        loadingFiles.value = true
        const params = {
            page: filePagination.page,
            pageSize: filePagination.pageSize,
            ...fileFilters,
            orderBy: 'created_at',
            order: 'DESC'
        }

        // 清除空值
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null) {
                delete params[key]
            }
        })

        const response = await fileAPI.getList(params)
        if (response.success && response.data) {
            files.value = response.data.files || response.data
            if (response.data.pagination) {
                filePagination.total = response.data.pagination.total
            }
        }
    } catch (error) {
        console.error('Load files error:', error)
        ElMessage.error('加载文件列表失败')
    } finally {
        loadingFiles.value = false
    }
}

// 加载图片列表
const loadImages = async () => {
    try {
        loadingImages.value = true
        const params = {
            page: imagePagination.page,
            pageSize: imagePagination.pageSize,
            ...imageFilters,
            orderBy: 'created_at',
            order: 'DESC'
        }

        // 清除空值
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null) {
                delete params[key]
            }
        })

        const response = await imageAPI.getList(params)
        if (response.success && response.data) {
            images.value = response.data.images || response.data
            if (response.data.pagination) {
                imagePagination.total = response.data.pagination.total
            }
        }
    } catch (error) {
        console.error('Load images error:', error)
        ElMessage.error('加载图片列表失败')
    } finally {
        loadingImages.value = false
    }
}

// 显示统计信息
const showFileStatistics = async () => {
    await loadStatistics()
    showStats.value = true
}

const showImageStatistics = async () => {
    await loadStatistics()
    showStats.value = true
}

const loadStatistics = async () => {
    try {
        const [fileStats, imageStats] = await Promise.all([
            fileAPI.getStatistics(),
            imageAPI.getStatistics()
        ])

        statistics.value = {
            files: fileStats.data,
            images: imageStats.data
        }
    } catch (error) {
        console.error('Load statistics error:', error)
        ElMessage.error('加载统计信息失败')
    }
}

// 文件操作
const showFileUploadDialog = () => {
    fileUploadForm.file_name = ''
    fileUploadForm.description = ''
    fileUploadForm.tags = []
    fileUploadForm.related_id = null
    fileList.value = []
    selectedFile.value = null
    showFileUpload.value = true
}

const handleFileSelect = (file: any) => {
    selectedFile.value = file.raw
    if (!fileUploadForm.file_name && file.name) {
        fileUploadForm.file_name = file.name
    }
}

const handleFileUpload = async () => {
    if (!selectedFile.value) {
        ElMessage.warning('请选择要上传的文件')
        return
    }

    try {
        uploading.value = true
        const formData = new FormData()
        formData.append('file', selectedFile.value)

        if (fileUploadForm.file_name) {
            formData.append('file_name', fileUploadForm.file_name)
        }
        if (fileUploadForm.description) {
            formData.append('description', fileUploadForm.description)
        }
        if (fileUploadForm.tags.length > 0) {
            formData.append('tags', JSON.stringify(fileUploadForm.tags))
        }
        if (fileUploadForm.related_id) {
            formData.append('related_id', fileUploadForm.related_id.toString())
        }

        const response = await fileAPI.upload(formData)
        if (response.success) {
            ElMessage.success('文件上传成功')
            showFileUpload.value = false
            loadFiles()
        }
    } catch (error) {
        console.error('File upload error:', error)
        ElMessage.error('文件上传失败')
    } finally {
        uploading.value = false
    }
}

// 图片操作
const showImageUploadDialog = () => {
    imageUploadForm.file_name = ''
    imageUploadForm.alt_text = ''
    imageUploadForm.description = ''
    imageUploadForm.upload_type = 1
    imageUploadForm.related_id = null
    imageList.value = []
    selectedImage.value = null
    showImageUpload.value = true
}

const handleImageSelect = (file: any) => {
    selectedImage.value = file.raw
    if (!imageUploadForm.file_name && file.name) {
        imageUploadForm.file_name = file.name
    }
}

const handleImageUpload = async () => {
    if (!selectedImage.value) {
        ElMessage.warning('请选择要上传的图片')
        return
    }

    try {
        uploading.value = true
        const formData = new FormData()
        formData.append('image', selectedImage.value)

        if (imageUploadForm.file_name) {
            formData.append('file_name', imageUploadForm.file_name)
        }
        if (imageUploadForm.alt_text) {
            formData.append('alt_text', imageUploadForm.alt_text)
        }
        if (imageUploadForm.description) {
            formData.append('description', imageUploadForm.description)
        }
        formData.append('upload_type', imageUploadForm.upload_type.toString())
        if (imageUploadForm.related_id) {
            formData.append('related_id', imageUploadForm.related_id.toString())
        }

        const response = await imageAPI.upload(formData)
        if (response.success) {
            ElMessage.success('图片上传成功')
            showImageUpload.value = false
            loadImages()
        }
    } catch (error) {
        console.error('Image upload error:', error)
        ElMessage.error('图片上传失败')
    } finally {
        uploading.value = false
    }
}

// 刷新列表
const refreshFileList = () => {
    loadFiles()
    loadImages()
}

// 文件操作函数
const downloadFile = (file: any) => {
    const url = getStaticUrl(file.file_url)
    window.open(url, '_blank')
}

const editFile = async (file: any) => {
    // 这里可以实现编辑文件信息的功能
    ElMessage.info('编辑文件功能待实现')
}

const deleteFile = async (file: any) => {
    try {
        await ElMessageBox.confirm(`确定要删除文件 "${file.file_name}" 吗？`, '确认删除', {
            type: 'warning'
        })

        const response = await fileAPI.delete(file.id)
        if (response.success) {
            ElMessage.success('文件删除成功')
            loadFiles()
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('Delete file error:', error)
            ElMessage.error('文件删除失败')
        }
    }
}

const editImage = async (image: any) => {
    // 这里可以实现编辑图片信息的功能
    ElMessage.info('编辑图片功能待实现')
}

const deleteImage = async (image: any) => {
    try {
        await ElMessageBox.confirm(`确定要删除图片 "${image.file_name}" 吗？`, '确认删除', {
            type: 'warning'
        })

        const response = await imageAPI.delete(image.id)
        if (response.success) {
            ElMessage.success('图片删除成功')
            loadImages()
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('Delete image error:', error)
            ElMessage.error('图片删除失败')
        }
    }
}

// 工具函数
const getFileTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
        document: '文档',
        video: '视频',
        audio: '音频',
        archive: '压缩包',
        other: '其他'
    }
    return typeMap[type] || '未知'
}

const getFileTypeTag = (type: string) => {
    const tagMap: Record<string, string> = {
        document: 'primary',
        video: 'success',
        audio: 'warning',
        archive: 'info',
        other: 'default'
    }
    return tagMap[type] || 'default'
}

const getUploadTypeText = (type: number) => {
    const typeMap: Record<number, string> = {
        1: '分类图片',
        2: '文章图片',
        3: '用户头像',
        4: '其他图片'
    }
    return typeMap[type] || '未知'
}

const getUploadTypeTag = (type: number) => {
    const tagMap: Record<number, string> = {
        1: 'primary',
        2: 'success',
        3: 'warning',
        4: 'info'
    }
    return tagMap[type] || 'default'
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN')
}

onMounted(() => {
    loadFiles()
    loadImages()
})
</script>

<style scoped>
.file-view {
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
    display: flex;
    gap: 8px;
}

.filter-container {
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 6px;
}

.mb-4 {
    margin-bottom: 16px;
}

.mt-4 {
    margin-top: 16px;
}

.file-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.file-icon {
    font-size: 24px;
    color: #409eff;
}

.file-info {
    flex: 1;
}

.file-name {
    font-weight: 500;
    margin-bottom: 4px;
}

.file-meta {
    font-size: 12px;
    color: #666;
}

.image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
}

.image-card {
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s;
}

.image-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-preview {
    width: 100%;
    height: 120px;
    display: block;
}

.image-info {
    padding: 12px;
}

.image-name {
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.image-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.image-size {
    font-size: 12px;
    color: #666;
}

.image-actions {
    display: flex;
    gap: 8px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}
</style>
