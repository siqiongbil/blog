<template>
  <div class="category-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>分类管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon>
              <Plus />
            </el-icon>
            新建分类
          </el-button>
        </div>
      </template>

      <!-- 工具栏 -->
      <div class="toolbar">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-select v-model="listParams.orderBy" placeholder="排序字段" @change="loadCategories">
              <el-option label="排序顺序" value="sort_order" />
              <el-option label="创建时间" value="created_at" />
              <el-option label="名称" value="name" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-select v-model="listParams.order" placeholder="排序方向" @change="loadCategories">
              <el-option label="升序" value="ASC" />
              <el-option label="降序" value="DESC" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-switch v-model="enablePagination" @change="handlePaginationChange" active-text="分页"
              inactive-text="全部" />
          </el-col>
        </el-row>
      </div>

      <!-- 统计信息 -->
      <div v-if="showStats" class="stats-info">
        <el-alert title="分类统计" type="info" :closable="false">
          <template #default>
            <div class="stats-content">
              <span>总分类: {{ totalCategories }}</span>
              <span>总文章: {{ totalArticles }}</span>
              <span>平均每个分类: {{ averageArticles }} 篇文章</span>
            </div>
          </template>
        </el-alert>
      </div>

      <!-- 批量操作 -->
      <div v-if="selectedCategories.length > 0" class="batch-actions">
        <el-alert :title="`已选择 ${selectedCategories.length} 个分类`" type="info" show-icon>
          <template #default>
            <el-button size="small" @click="batchSort">批量排序</el-button>
            <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
          </template>
        </el-alert>
      </div>

      <!-- 分类列表 -->
      <el-table v-loading="loading" :data="categories" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image v-if="row.image_url" :src="getImageUrl(row.image_url)" style="width: 50px; height: 35px"
              fit="cover" :preview-src-list="[getImageUrl(row.image_url)]" />
            <div v-else class="no-image">📁</div>
          </template>
        </el-table-column>
        <el-table-column label="分类信息" min-width="200">
          <template #default="{ row }">
            <div class="category-info">
              <div class="name">{{ row.name }}</div>
              <div class="slug">{{ row.slug }}</div>
              <div v-if="row.description" class="description">{{ row.description }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="80" sortable="custom">
          <template #default="{ row }">
            <el-tag size="small">{{ row.sort_order }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文章数" width="100">
          <template #default="{ row }">
            <el-badge :value="row.article_count || 0" class="article-badge">
              <el-button size="small" plain>{{ row.article_count || 0 }}</el-button>
            </el-badge>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editCategory(row)">编辑</el-button>
            <el-dropdown trigger="click">
              <el-button size="small">
                更多<el-icon><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="uploadCategoryImage(row)">上传图片</el-dropdown-item>
                  <el-dropdown-item @click="deleteCategoryImage(row)" :disabled="!row.image_url">删除图片</el-dropdown-item>
                  <el-dropdown-item @click="viewCategoryDetail(row)">查看详情</el-dropdown-item>
                  <el-dropdown-item @click="deleteCategory(row)" divided>删除分类</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div v-if="enablePagination && pagination.total > 0" class="pagination-container">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadCategories" @current-change="loadCategories" />
      </div>
    </el-card>

    <!-- 创建/编辑分类弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新建分类'" width="500px">
      <el-form ref="formRef" :model="categoryForm" :rules="formRules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="别名" prop="slug">
          <el-input v-model="categoryForm.slug" placeholder="用于URL，如：Tech 或 Frontend" />
        </el-form-item>
        <el-form-item label="分类图片">
          <ImagePicker v-model="categoryForm.image_url" :upload-type="1" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="categoryForm.description" type="textarea" :rows="3" placeholder="分类描述（可选）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort_order" :min="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 6px;
}

.stats-info {
  margin-bottom: 16px;
}

.stats-content {
  display: flex;
  gap: 24px;
  font-size: 14px;
}

.stats-content span {
  color: #666;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 35px;
  font-size: 20px;
  color: #ccc;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.category-info {
  line-height: 1.4;
}

.category-info .name {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
  margin-bottom: 4px;
}

.category-info .slug {
  font-size: 12px;
  color: #909399;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  margin-bottom: 4px;
  display: inline-block;
}

.category-info .description {
  font-size: 13px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.article-badge {
  display: inline-block;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { categoryAPI, getStaticUrl } from '@/utils/api'
import ImagePicker from '@/components/ImagePicker.vue'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const enablePagination = ref(false)
const showStats = ref(true)
const categories = ref<any[]>([])
const selectedCategories = ref<any[]>([])
const formRef = ref<FormInstance>()

// 列表参数
const listParams = reactive({
  orderBy: 'sort_order' as 'sort_order' | 'created_at' | 'name',
  order: 'ASC' as 'ASC' | 'DESC'
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 统计信息
const totalCategories = ref(0)
const totalArticles = ref(0)
const averageArticles = computed(() => {
  return totalCategories.value > 0 ? Math.round(totalArticles.value / totalCategories.value) : 0
})

// 表单数据
const categoryForm = reactive({
  id: null as number | null,
  name: '',
  slug: '',
  description: '',
  sort_order: 0,
  image_url: ''
})

// 自定义别名验证器
const validateSlug = async (rule: any, value: string, callback: any) => {
  if (!value) {
    callback()
    return
  }

  try {
    // 如果是编辑模式且别名没有改变，跳过验证
    if (isEdit.value && categoryForm.slug === value) {
      callback()
      return
    }

    const response = await categoryAPI.checkSlug(value)
    if (response.data?.available === false) {
      callback(new Error('别名已存在，请使用其他别名'))
    } else {
      callback()
    }
  } catch (error) {
    // 检查失败时不阻止提交，只是警告
    console.warn('别名检查失败:', error)
    callback()
  }
}

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 50, message: '分类名称不能超过50个字符', trigger: 'blur' }
  ],
  slug: [
    { required: true, message: '请输入别名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9-]+$/, message: '别名只能包含字母、数字和连字符', trigger: 'blur' },
    { max: 50, message: '别名不能超过50个字符', trigger: 'blur' },
    { validator: validateSlug, trigger: 'blur' }
  ]
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedCategories.value = selection
}

// 批量排序
const batchSort = async () => {
  if (selectedCategories.value.length === 0) {
    ElMessage.warning('请先选择要排序的分类')
    return
  }

  try {
    // 显示排序对话框
    const result = await ElMessageBox.prompt(
      '请输入排序规则（格式：分类ID:排序值，多个用逗号分隔）\n例如：1:10,2:20,3:30',
      '批量排序',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^(\d+:\d+)(,\d+:\d+)*$/,
        inputErrorMessage: '格式错误，请按照示例格式输入'
      }
    )

    if (result.action === 'confirm' && result.value) {
      const sortData = result.value.split(',').map((item: string) => {
        const [id, sort_order] = item.split(':')
        return { id: parseInt(id), sort_order: parseInt(sort_order) }
      })

      const response = await categoryAPI.batchSort({ categories: sortData })
      if (response.success) {
        ElMessage.success('批量排序成功')
        loadCategories()
        selectedCategories.value = []
      }
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Batch sort error:', error)
      ElMessage.error('批量排序失败')
    }
  }
}

// 批量删除
const batchDelete = async () => {
  if (selectedCategories.value.length === 0) {
    ElMessage.warning('请先选择要删除的分类')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedCategories.value.length} 个分类吗？删除后这些分类下的文章将变为未分类状态。`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const ids = selectedCategories.value.map(cat => cat.id)
    const response = await categoryAPI.batchDelete({ ids })

    if (response.success) {
      ElMessage.success('批量删除成功')
      loadCategories()
      selectedCategories.value = []
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Batch delete error:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 加载分类列表
const loadCategories = async () => {
  try {
    loading.value = true

    // 构建请求参数
    const params: any = {
      orderBy: listParams.orderBy,
      order: listParams.order
    }

    if (enablePagination.value) {
      params.page = pagination.page
      params.pageSize = pagination.pageSize
    }

    const response = await categoryAPI.getList(params)
    const responseData = response.data

    if (responseData) {
      categories.value = responseData.categories || responseData

      // 如果有分页信息，更新分页状态
      if (responseData.pagination) {
        pagination.page = responseData.pagination.current
        pagination.pageSize = responseData.pagination.pageSize
        pagination.total = responseData.pagination.total
      }
    }

    // 加载统计信息
    if (showStats.value) {
      await loadCategoryStats()
    }
  } catch (error) {
    console.error('Load categories error:', error)
    ElMessage.error('加载分类列表失败')
  } finally {
    loading.value = false
  }
}

// 加载分类统计
const loadCategoryStats = async () => {
  try {
    const response = await categoryAPI.getArticleStats()
    const statsData = response.data

    if (statsData && Array.isArray(statsData)) {
      totalCategories.value = statsData.length
      totalArticles.value = statsData.reduce((sum, cat) => sum + (cat.article_count || 0), 0)
    }
  } catch (error) {
    console.error('Load category stats error:', error)
  }
}

// 处理分页切换
const handlePaginationChange = () => {
  pagination.page = 1
  loadCategories()
}

// 上传分类图片
const uploadCategoryImage = (category: any) => {
  // 这里可以实现图片上传功能
  ElMessage.info('图片上传功能待实现')
}

// 删除分类图片
const deleteCategoryImage = async (category: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.name}"的图片吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await categoryAPI.deleteImage(category.id)
    ElMessage.success('图片删除成功')
    loadCategories()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete category image error:', error)
      ElMessage.error('删除图片失败')
    }
  }
}

// 查看分类详情
const viewCategoryDetail = async (category: any) => {
  try {
    const response = await categoryAPI.getDetail(category.id)
    const detailData = response.data

    ElMessageBox.alert(
      `
      <div style="text-align: left;">
        <p><strong>分类名称:</strong> ${detailData.name}</p>
        <p><strong>别名:</strong> ${detailData.slug}</p>
        <p><strong>描述:</strong> ${detailData.description || '暂无描述'}</p>
        <p><strong>排序:</strong> ${detailData.sort_order}</p>
        <p><strong>文章数量:</strong> ${detailData.article_count || 0}</p>
        <p><strong>创建时间:</strong> ${formatDate(detailData.created_at)}</p>
        <p><strong>更新时间:</strong> ${formatDate(detailData.updated_at)}</p>
      </div>
      `,
      '分类详情',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭'
      }
    )
  } catch (error) {
    console.error('Get category detail error:', error)
    ElMessage.error('获取分类详情失败')
  }
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  categoryForm.id = null
  categoryForm.name = ''
  categoryForm.slug = ''
  categoryForm.description = ''
  categoryForm.sort_order = 0
  categoryForm.image_url = ''
  dialogVisible.value = true
}

// 编辑分类
const editCategory = (category: any) => {
  isEdit.value = true
  categoryForm.id = category.id
  categoryForm.name = category.name
  categoryForm.slug = category.slug
  categoryForm.description = category.description || ''
  categoryForm.sort_order = category.sort_order || 0
  categoryForm.image_url = category.image_url || ''
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    submitting.value = true
    console.log(categoryForm.image_url)

    const data = {
      name: categoryForm.name,
      slug: categoryForm.slug,
      description: categoryForm.description,
      sort_order: categoryForm.sort_order,
      image_url: getImageUrl(categoryForm.image_url)
    }

    let response
    if (isEdit.value) {
      response = await categoryAPI.update(categoryForm.id!, data)
    } else {
      response = await categoryAPI.create(data)
    }

    if (response.success) {
      ElMessage.success(isEdit.value ? '分类更新成功' : '分类创建成功')
      dialogVisible.value = false
      loadCategories()
    } else {
      throw new Error(response.message || '操作失败')
    }
  } catch (error: any) {
    console.error('Submit category error:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

// 删除分类
const deleteCategory = async (category: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.name}"吗？删除后该分类下的文章将变为未分类状态。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const response = await categoryAPI.delete(category.id)
    if (response.success) {
      ElMessage.success('分类删除成功')
      loadCategories()
    } else {
      throw new Error(response.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete category error:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
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

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-view {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-preview-container {
  margin-top: 8px;
}
</style>
