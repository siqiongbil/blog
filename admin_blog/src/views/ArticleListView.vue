<template>
  <div class="article-list">
    <el-card>
      <template #header>
        <div class="list-header">
          <span>文章管理</span>
          <el-button type="primary" @click="$router.push('/articles/create')">
            <el-icon>
              <Plus />
            </el-icon>
            写文章
          </el-button>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div class="search-filters">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input v-model="searchForm.keyword" placeholder="搜索文章标题或内容..." clearable @keyup.enter="handleSearch">
              <template #prefix>
                <el-icon>
                  <Search />
                </el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="searchForm.category_id" placeholder="选择分类" clearable>
              <el-option v-for="category in categories" :key="category.id" :label="category.name"
                :value="category.id" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="searchForm.status" placeholder="文章状态" clearable>
              <el-option label="草稿" :value="0" />
              <el-option label="已发布" :value="1" />
              <el-option label="已删除" :value="2" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 文章表格 -->
      <el-table v-loading="loading" :data="articles" stripe style="width: 100%"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />

        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="article-title-cell">
              <el-link type="primary" :underline="false" @click="$router.push(`/articles/edit/${row.id}`)">
                {{ row.title }}
              </el-link>
              <div class="title-meta">
                <span v-if="row.category_name" class="category-tag">{{ row.category_name }}</span>
                <span class="view-count">{{ row.view_count || 0 }} 次浏览</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="tags" label="标签" width="150">
          <template #default="{ row }">
            <div class="tags-cell">
              <el-tag v-for="tag in row.tags?.slice(0, 2)" :key="tag.id" size="small" effect="plain"
                style="margin-right: 4px;">
                {{ tag.name }}
              </el-tag>
              <el-tag v-if="row.tags?.length > 2" size="small" type="info">
                +{{ row.tags.length - 2 }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="更新时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="$router.push(`/articles/edit/${row.id}`)">
              编辑
            </el-button>
            <el-button size="small" type="info" @click="viewArticleStats(row)">
              统计
            </el-button>
            <el-button v-if="row.status === 0" size="small" type="success" @click="publishArticle(row)">
              发布
            </el-button>
            <el-button v-else-if="row.status === 1" size="small" type="warning" @click="unpublishArticle(row)">
              下线
            </el-button>
            <el-button v-if="row.status !== 2" size="small" type="danger" @click="deleteArticle(row)">
              删除
            </el-button>
            <el-button v-if="row.status === 2" size="small" type="danger" @click="permanentDeleteArticle(row)">
              硬删除
            </el-button>
            <el-button v-if="row.status === 2" size="small" type="success" @click="restoreArticle(row)">
              恢复
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div v-if="selectedArticles.length > 0" class="batch-actions">
        <span>已选择 {{ selectedArticles.length }} 篇文章</span>
        <el-button size="small" @click="batchPublish">批量发布</el-button>
        <el-button size="small" @click="batchUnpublish">批量下线</el-button>
        <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
        <el-button size="small" type="danger" @click="batchPermanentDelete">批量硬删除</el-button>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.current" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { articleAPI, categoryAPI } from '@/utils/api'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const articles = ref<any[]>([])
const categories = ref<any[]>([])
const selectedArticles = ref<any[]>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  category_id: null as number | null,
  status: null as number | null
})

// 分页信息
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

// 加载文章列表
const loadArticles = async () => {
  try {
    loading.value = true

    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...searchForm,
      orderBy: 'updated_at',
      order: 'DESC'
    }

    // 清除空值
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === '') {
        delete params[key]
      }
    })

    const response = await articleAPI.getList(params)

    if (response.success && response.data) {
      articles.value = response.data.articles || []
      if (response.data.pagination) {
        pagination.total = response.data.pagination.total
        pagination.current = response.data.pagination.current
      }
    }
  } catch (error) {
    console.error('Load articles error:', error)
    ElMessage.error('加载文章列表失败')
  } finally {
    loading.value = false
  }
}

// 加载分类列表
const loadCategories = async () => {
  try {
    const response = await categoryAPI.getList()
    if (response.success && response.data) {
      categories.value = response.data.categories || response.data
    }
  } catch (error) {
    console.error('Load categories error:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadArticles()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.category_id = null
  searchForm.status = null
  pagination.current = 1
  loadArticles()
}

// 分页处理
const handleSizeChange = (newSize: number) => {
  pagination.pageSize = newSize
  pagination.current = 1
  loadArticles()
}

const handleCurrentChange = (newPage: number) => {
  pagination.current = newPage
  loadArticles()
}

// 选择文章
const handleSelectionChange = (selection: any[]) => {
  selectedArticles.value = selection
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

// 获取状态文本
const getStatusText = (status: number) => {
  const statusMap = {
    0: '草稿',
    1: '已发布',
    2: '已删除'
  }
  return statusMap[status as keyof typeof statusMap] || '未知'
}

// 获取状态标签类型
const getStatusTagType = (status: number) => {
  const typeMap = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return typeMap[status as keyof typeof typeMap] || 'info'
}

// 发布文章
const publishArticle = async (article: any) => {
  try {
    await ElMessageBox.confirm('确定要发布这篇文章吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await articleAPI.update(article.id, { ...article, status: 1 })
    if (response.success) {
      ElMessage.success('文章发布成功')
      loadArticles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Publish article error:', error)
      ElMessage.error('发布文章失败')
    }
  }
}

// 下线文章
const unpublishArticle = async (article: any) => {
  try {
    await ElMessageBox.confirm('确定要下线这篇文章吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await articleAPI.update(article.id, { ...article, status: 0 })
    if (response.success) {
      ElMessage.success('文章已下线')
      loadArticles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Unpublish article error:', error)
      ElMessage.error('下线文章失败')
    }
  }
}

// 删除文章
const deleteArticle = async (article: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })

    const response = await articleAPI.delete(article.id)
    if (response.success) {
      ElMessage.success('文章删除成功')
      loadArticles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete article error:', error)
      ElMessage.error('删除文章失败')
    }
  }
}

// 硬删除文章（永久删除）
const permanentDeleteArticle = async (article: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要永久删除文章《${article.title}》吗？此操作不可恢复，文章将从数据库中彻底删除！`,
      '危险操作',
      {
        confirmButtonText: '确定永久删除',
        cancelButtonText: '取消',
        type: 'error',
        dangerouslyUseHTMLString: true
      }
    )

    const response = await articleAPI.permanentDelete(article.id)
    if (response.success) {
      ElMessage.success('文章已永久删除')
      loadArticles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Permanent delete article error:', error)
      ElMessage.error('永久删除文章失败')
    }
  }
}

// 恢复文章
const restoreArticle = async (article: any) => {
  try {
    await ElMessageBox.confirm(`确定要恢复文章《${article.title}》吗？`, '提示', {
      confirmButtonText: '确定恢复',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await articleAPI.update(article.id, { ...article, status: 0 })
    if (response.success) {
      ElMessage.success('文章已恢复为草稿状态')
      loadArticles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Restore article error:', error)
      ElMessage.error('恢复文章失败')
    }
  }
}

// 批量操作
const batchPublish = async () => {
  try {
    await ElMessageBox.confirm(`确定要发布选中的 ${selectedArticles.value.length} 篇文章吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 这里应该调用批量发布接口，暂时用循环模拟
    for (const article of selectedArticles.value) {
      await articleAPI.update(article.id, { ...article, status: 1 })
    }

    ElMessage.success('批量发布成功')
    loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch publish error:', error)
      ElMessage.error('批量发布失败')
    }
  }
}

const batchUnpublish = async () => {
  try {
    await ElMessageBox.confirm(`确定要下线选中的 ${selectedArticles.value.length} 篇文章吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    for (const article of selectedArticles.value) {
      await articleAPI.update(article.id, { ...article, status: 0 })
    }

    ElMessage.success('批量下线成功')
    loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch unpublish error:', error)
      ElMessage.error('批量下线失败')
    }
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedArticles.value.length} 篇文章吗？删除后无法恢复！`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    })

    for (const article of selectedArticles.value) {
      await articleAPI.delete(article.id)
    }

    ElMessage.success('批量删除成功')
    loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch delete error:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 批量硬删除
const batchPermanentDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要永久删除选中的 ${selectedArticles.value.length} 篇文章吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定永久删除',
      cancelButtonText: '取消',
      type: 'error'
    })

    for (const article of selectedArticles.value) {
      await articleAPI.permanentDelete(article.id)
    }

    ElMessage.success('批量永久删除成功')
    loadArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch permanent delete error:', error)
      ElMessage.error('批量永久删除失败')
    }
  }
}

// 查看文章统计
const viewArticleStats = (article) => {
  // 可以打开一个对话框显示详细统计，或者跳转到统计页面
  ElMessageBox.alert(
    `文章《${article.title}》的访问统计功能正在开发中...`,
    '访问统计',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

onMounted(() => {
  loadCategories()
  loadArticles()
})
</script>

<style scoped>
.article-list {
  width: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-filters {
  margin-bottom: 20px;
}

.article-title-cell {
  max-width: 300px;
}

.title-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.category-tag {
  display: inline-block;
  background-color: #f0f9ff;
  color: #0369a1;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.view-count {
  color: #909399;
  font-size: 12px;
}

.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid #e4e7ed;
  margin-top: 16px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
