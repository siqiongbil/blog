<template>
    <div class="tag-view">
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>标签管理</span>
                    <el-button type="primary" @click="showCreateDialog">
                        <el-icon>
                            <Plus />
                        </el-icon>
                        新建标签
                    </el-button>
                </div>
            </template>

            <!-- 标签列表 -->
            <el-table v-loading="loading" :data="tags" stripe>
                <el-table-column prop="name" label="标签名称" />
                <el-table-column prop="slug" label="别名" />
                <el-table-column prop="color" label="颜色" width="100">
                    <template #default="{ row }">
                        <div class="color-display">
                            <div class="color-box" :style="{ backgroundColor: row.color }"></div>
                            <span>{{ row.color }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" show-overflow-tooltip />
                <el-table-column prop="article_count" label="文章数量" width="100" />
                <el-table-column prop="created_at" label="创建时间" width="150">
                    <template #default="{ row }">
                        {{ formatDate(row.created_at) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                        <el-button size="small" @click="editTag(row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteTag(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 创建/编辑标签弹窗 -->
        <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑标签' : '新建标签'" width="500px">
            <el-form ref="formRef" :model="tagForm" :rules="formRules" label-width="80px">
                <el-form-item label="标签名称" prop="name">
                    <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
                </el-form-item>
                <el-form-item label="别名" prop="slug">
                    <el-input v-model="tagForm.slug" placeholder="用于URL，如：JavaScript 或 Vue3" />
                </el-form-item>
                <el-form-item label="颜色">
                    <el-color-picker v-model="tagForm.color" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="tagForm.description" type="textarea" :rows="3" placeholder="标签描述（可选）" />
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

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { tagAPI } from '@/utils/api'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const tags = ref<any[]>([])
const formRef = ref<FormInstance>()

// 表单数据
const tagForm = reactive({
    id: null as number | null,
    name: '',
    slug: '',
    color: '#409EFF',
    description: ''
})

// 表单验证规则
const formRules = {
    name: [
        { required: true, message: '请输入标签名称', trigger: 'blur' },
        { max: 50, message: '标签名称不能超过50个字符', trigger: 'blur' }
    ],
    slug: [
        { required: true, message: '请输入别名', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9-]+$/, message: '别名只能包含字母、数字和连字符', trigger: 'blur' },
        { max: 50, message: '别名不能超过50个字符', trigger: 'blur' }
    ]
}

// 加载标签列表
const loadTags = async () => {
    try {
        loading.value = true
        const response = await tagAPI.getList()

        if (response.success && response.data) {
            tags.value = response.data.tags || response.data
        }
    } catch (error) {
        console.error('Load tags error:', error)
        ElMessage.error('加载标签列表失败')
    } finally {
        loading.value = false
    }
}

// 显示创建对话框
const showCreateDialog = () => {
    isEdit.value = false
    tagForm.id = null
    tagForm.name = ''
    tagForm.slug = ''
    tagForm.color = '#409EFF'
    tagForm.description = ''
    dialogVisible.value = true
}

// 编辑标签
const editTag = (tag: any) => {
    isEdit.value = true
    tagForm.id = tag.id
    tagForm.name = tag.name
    tagForm.slug = tag.slug
    tagForm.color = tag.color || '#409EFF'
    tagForm.description = tag.description || ''
    dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return

    try {
        const valid = await formRef.value.validate()
        if (!valid) return

        submitting.value = true

        const data = {
            name: tagForm.name,
            slug: tagForm.slug,
            color: tagForm.color,
            description: tagForm.description
        }

        let response
        if (isEdit.value) {
            response = await tagAPI.update(tagForm.id!, data)
        } else {
            response = await tagAPI.create(data)
        }

        if (response.success) {
            ElMessage.success(isEdit.value ? '标签更新成功' : '标签创建成功')
            dialogVisible.value = false
            loadTags()
        } else {
            throw new Error(response.message || '操作失败')
        }
    } catch (error: any) {
        console.error('Submit tag error:', error)
        ElMessage.error(error.message || '操作失败')
    } finally {
        submitting.value = false
    }
}

// 删除标签
const deleteTag = async (tag: any) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除标签"${tag.name}"吗？删除后相关文章将失去该标签。`,
            '警告',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'error'
            }
        )

        const response = await tagAPI.delete(tag.id)
        if (response.success) {
            ElMessage.success('标签删除成功')
            loadTags()
        } else {
            throw new Error(response.message || '删除失败')
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('Delete tag error:', error)
            ElMessage.error(error.message || '删除失败')
        }
    }
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
    loadTags()
})
</script>

<style scoped>
.tag-view {
    width: 100%;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.color-display {
    display: flex;
    align-items: center;
    gap: 8px;
}

.color-box {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid #ddd;
}
</style>
