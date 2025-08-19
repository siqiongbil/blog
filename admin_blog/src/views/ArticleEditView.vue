<template>
  <div class="article-edit">
    <el-card class="article-form-card">
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑文章' : '写新文章' }}</span>
          <div class="header-actions">
            <el-button @click="handlePreview" :disabled="!articleForm.title || !articleForm.content">
              预览
            </el-button>
            <el-button @click="saveDraft" :loading="saving" v-if="!isEdit || articleForm.status === 0">
              保存草稿
            </el-button>
            <el-button type="primary" @click="publishArticle" :loading="publishing">
              {{ isEdit ? '更新文章' : '发布文章' }}
            </el-button>
          </div>
        </div>
      </template>

      <!-- 文章基本信息 -->
      <el-form ref="formRef" :model="articleForm" :rules="formRules" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="18">
            <el-form-item label="标题" prop="title">
              <el-input v-model="articleForm.title" placeholder="请输入文章标题" size="large" maxlength="255"
                show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="分类" prop="category_id">
              <el-select v-model="articleForm.category_id" placeholder="选择分类" style="width: 100%">
                <el-option v-for="category in categories" :key="category.id" :label="category.name"
                  :value="category.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标签">
              <el-select v-model="articleForm.tags" :key="`tags-${tags.length}-${articleForm.tags.length}`" multiple
                filterable allow-create placeholder="选择或输入标签" style="width: 100%">
                <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="封面图">
              <ImagePicker v-model="articleForm.cover_image" :upload-type="2" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="摘要">
          <el-input v-model="articleForm.summary" type="textarea" :rows="3" placeholder="请输入文章摘要（可选）" maxlength="500"
            show-word-limit />
        </el-form-item>

        <!-- Markdown编辑器 -->
        <el-form-item label="内容" prop="content">
          <div class="editor-container">
            <MarkdownEditor v-model="articleForm.content" :rows="25" />
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预览弹窗 -->
    <el-dialog v-model="showPreview" title="文章预览" width="80%" top="5vh" :close-on-click-modal="false">
      <div class="preview-container">
        <div class="preview-header">
          <h1>{{ articleForm.title || '未命名文章' }}</h1>
          <div class="preview-meta">
            <span v-if="articleForm.category_id">
              分类：{{ getCategoryName(articleForm.category_id) }}
            </span>
            <span v-if="articleForm.tags && articleForm.tags.length">
              标签：{{ articleForm.tags.join(', ') }}
            </span>
          </div>
        </div>
        <div class="preview-content" v-html="previewHtml"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { marked } from 'marked'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import ImagePicker from '@/components/ImagePicker.vue'
import { articleAPI, categoryAPI, tagAPI, indexNowAPI } from '@/utils/api'

const route = useRoute()
const router = useRouter()

// 表单引用
const formRef = ref<FormInstance>()

// 状态变量
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const publishing = ref(false)
const showPreview = ref(false)
const categories = ref<any[]>([])
const tags = ref<any[]>([])

// 文章表单
const articleForm = reactive({
  title: '',
  content: '',
  summary: '',
  cover_image: '',
  category_id: null as number | null,
  tags: [] as string[],
  status: 0
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { max: 255, message: '标题长度不能超过255个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: '请选择文章分类', trigger: 'change' }
  ]
}

// 预览HTML
const previewHtml = computed(() => {
  if (!articleForm.content) return '<p>暂无内容</p>'
  try {
    return marked(articleForm.content)
  } catch (error) {
    return '<p>内容解析错误</p>'
  }
})

// 获取分类名称
const getCategoryName = (categoryId: number) => {
  const category = categories.value.find(cat => cat.id === categoryId)
  return category ? category.name : '未知分类'
}

// 加载数据
const loadData = async () => {
  try {
    // 并行加载分类和标签
    const [categoriesRes, tagsRes] = await Promise.all([
      categoryAPI.getList(),
      tagAPI.getList()
    ])

    if (categoriesRes.success) {
      categories.value = categoriesRes.data.categories || categoriesRes.data
    }

    if (tagsRes.success) {
      tags.value = tagsRes.data.tags || tagsRes.data
    }

    // 加载分类选择项（使用新的API）
    try {
      const selectOptionsRes = await categoryAPI.getSelectOptions()
      if (selectOptionsRes.success && selectOptionsRes.data) {
        console.log('Category select options loaded:', selectOptionsRes.data)
      }
    } catch (error) {
      console.log('分类选择项加载失败，使用常规分类列表')
    }

    // 如果是编辑模式，加载文章数据
    if (isEdit.value) {
      await loadArticle()
    }
  } catch (error) {
    console.error('Load data error:', error)
    ElMessage.error('加载数据失败')
  }
}

// 加载文章数据（编辑模式）
const loadArticle = async () => {
  try {
    const articleId = parseInt(route.params.id as string)
    const response = await articleAPI.getDetail(articleId)

    if (response.success && response.data) {
      const article = response.data
      articleForm.title = article.title
      articleForm.content = article.content
      articleForm.summary = article.summary || ''
      articleForm.cover_image = article.cover_image || ''
      articleForm.category_id = article.category_id
      articleForm.status = article.status

      // 处理标签 - 优先使用tag_details，fallback到tags
      console.log('Article data:', { tags: article.tags, tag_details: article.tag_details })

      if (article.tag_details && Array.isArray(article.tag_details)) {
        // 从tag_details中提取标签名称
        const tagNames = article.tag_details.map((tag: any) => tag.name)
        console.log('Using tag_details, extracted names:', tagNames)
        await nextTick()
        articleForm.tags = tagNames
      } else if (article.tags && Array.isArray(article.tags)) {
        // 如果tags是字符串数组，直接使用
        console.log('Using tags array:', article.tags)
        await nextTick()
        articleForm.tags = article.tags
      } else if (article.tags && typeof article.tags === 'string') {
        // 如果是逗号分隔的字符串
        const tagNames = article.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        console.log('Using tags string, split result:', tagNames)
        await nextTick()
        articleForm.tags = tagNames
      }

      console.log('Final articleForm.tags:', articleForm.tags)
    } else {
      throw new Error(response.message || '文章不存在')
    }
  } catch (error: any) {
    console.error('Load article error:', error)
    ElMessage.error(error.message || '加载文章失败')
    router.push('/articles')
  }
}

// 保存草稿
const saveDraft = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    saving.value = true

    const data = {
      ...articleForm,
      status: 0 // 草稿状态
    }

    let response
    if (isEdit.value) {
      const articleId = parseInt(route.params.id as string)
      response = await articleAPI.update(articleId, data)
    } else {
      response = await articleAPI.create(data)
    }

    if (response.success) {
      ElMessage.success('草稿保存成功')
      if (!isEdit.value && response.data && response.data.id) {
        // 新建文章成功，跳转到编辑页面
        router.replace(`/articles/edit/${response.data.id}`)
      }
    } else {
      throw new Error(response.message || '保存失败')
    }
  } catch (error: any) {
    console.error('Save draft error:', error)
    ElMessage.error(error.message || '保存草稿失败')
  } finally {
    saving.value = false
  }
}

// 发布文章
const publishArticle = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    publishing.value = true

    const data = {
      ...articleForm,
      status: 1 // 发布状态
    }

    let response
    if (isEdit.value) {
      const articleId = parseInt(route.params.id as string)
      response = await articleAPI.update(articleId, data)
    } else {
      response = await articleAPI.create(data)
    }

    if (response.success) {
      const articleId = isEdit.value ? parseInt(route.params.id as string) : response.data?.id
      ElMessage.success(isEdit.value ? '文章更新成功' : '文章发布成功')

      // 发布/更新成功后，提交到IndexNow
      if (articleId && data.status === 1) {
        try {
          const indexNowResult = await indexNowAPI.submitArticle(
            articleId,
            isEdit.value ? 'update' : 'create'
          )
          if (indexNowResult.success) {
            ElMessage.success('已通知搜索引擎更新索引')
          } else {
            // 显示IndexNow相关的错误信息
            console.warn('IndexNow通知失败:', indexNowResult.message)
            if (indexNowResult.message.includes('API密钥未配置')) {
              ElMessage.warning('IndexNow API密钥未配置，请在设置中配置API密钥')
            } else {
              ElMessage.warning(`IndexNow通知失败: ${indexNowResult.message}`)
            }
          }
        } catch (error) {
          console.warn('IndexNow通知失败:', error)
          // 不影响主流程，只在控制台记录
        }
      }

      router.push('/articles')
    } else {
      throw new Error(response.message || '发布失败')
    }
  } catch (error: any) {
    console.error('Publish article error:', error)
    ElMessage.error(error.message || '发布文章失败')
  } finally {
    publishing.value = false
  }
}

// 预览文章
const handlePreview = () => {
  showPreview.value = true
}

// 离开页面确认
const beforeUnload = (e: BeforeUnloadEvent) => {
  if (articleForm.title || articleForm.content) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('beforeunload', beforeUnload)
})

// 组件卸载时移除监听器
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnload)
})
</script>

<style scoped>
.article-edit {
  width: 100%;
}

.article-form-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.editor-container {
  height: 600px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.preview-container {
  max-height: 70vh;
  overflow-y: auto;
}

.preview-header {
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.preview-header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  color: #303133;
}

.preview-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
}

.preview-content {
  line-height: 1.8;
  font-size: 16px;
  color: #303133;
}

/* 预览内容样式 */
:deep(.preview-content) {

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 1.5em 0 0.5em 0;
    font-weight: 600;
    line-height: 1.25;
  }

  h1 {
    font-size: 2em;
  }

  h2 {
    font-size: 1.5em;
  }

  h3 {
    font-size: 1.25em;
  }

  h4 {
    font-size: 1em;
  }

  h5 {
    font-size: 0.875em;
  }

  h6 {
    font-size: 0.75em;
  }

  p {
    margin: 0.8em 0;
  }

  ul,
  ol {
    margin: 0.8em 0;
    padding-left: 2em;
  }

  li {
    margin: 0.3em 0;
  }

  blockquote {
    margin: 1em 0;
    padding: 0.8em 1em;
    border-left: 4px solid #409eff;
    background-color: #f8f9fa;
    color: #666;
  }

  code {
    background-color: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9em;
  }

  pre {
    background-color: #f6f8fa;
    border-radius: 6px;
    padding: 1.2em;
    overflow-x: auto;
    margin: 1em 0;
  }

  pre code {
    background-color: transparent;
    padding: 0;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }

  table th,
  table td {
    border: 1px solid #ddd;
    padding: 10px 15px;
    text-align: left;
  }

  table th {
    background-color: #f8f9fa;
    font-weight: 600;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 1em 0;
  }

  a {
    color: #409eff;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  hr {
    border: none;
    border-top: 1px solid #eee;
    margin: 2em 0;
  }
}
</style>
