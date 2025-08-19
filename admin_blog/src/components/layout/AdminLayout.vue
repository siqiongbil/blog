<template>
  <el-container class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside width="260px">
      <div class="logo">
        <h2>博客管理后台</h2>
      </div>
      <el-menu :default-active="currentRoute" class="sidebar-menu" background-color="#304156" text-color="#bfcbd9"
        active-text-color="#409EFF" router>
        <el-menu-item index="/dashboard">
          <el-icon>
            <Odometer />
          </el-icon>
          <span>仪表盘</span>
        </el-menu-item>

        <el-sub-menu index="articles">
          <template #title>
            <el-icon>
              <Document />
            </el-icon>
            <span>文章管理</span>
          </template>
          <el-menu-item index="/articles">文章列表</el-menu-item>
          <el-menu-item index="/articles/create">写文章</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/categories">
          <el-icon>
            <Collection />
          </el-icon>
          <span>分类管理</span>
        </el-menu-item>

        <el-menu-item index="/tags">
          <el-icon>
            <PriceTag />
          </el-icon>
          <span>标签管理</span>
        </el-menu-item>

        <el-menu-item index="/music">
          <el-icon>
            <Headset />
          </el-icon>
          <span>音乐管理</span>
        </el-menu-item>

        <el-sub-menu index="media">
          <template #title>
            <el-icon>
              <Folder />
            </el-icon>
            <span>媒体管理</span>
          </template>
          <el-menu-item index="/files">文件管理</el-menu-item>
          <el-menu-item index="/images">图片管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/analytics">
          <el-icon>
            <TrendCharts />
          </el-icon>
          <span>访问统计</span>
        </el-menu-item>

        <el-menu-item index="/data-cleanup">
          <el-icon>
            <Delete />
          </el-icon>
          <span>数据清理</span>
        </el-menu-item>

        <el-menu-item index="/settings">
          <el-icon>
            <Setting />
          </el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header height="60px" class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 用户菜单 -->
          <el-dropdown @command="handleUserMenuCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.user?.avatar" />
              <span class="username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
              <el-icon>
                <ArrowDown />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="changePassword">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主要内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input v-model="passwordForm.currentPassword" type="password" placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPasswordDialog = false">取消</el-button>
          <el-button type="primary" @click="handleChangePassword" :loading="loading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Odometer,
  Document,
  Collection,
  PriceTag,
  Headset,
  Picture,
  Folder,
  Setting,
  ArrowDown,
  TrendCharts
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const userStore = useAuthStore()

// 当前路由
const currentRoute = computed(() => route.path)

// 面包屑导航
const breadcrumbMap: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/articles': '文章列表',
  '/articles/create': '写文章',
  '/categories': '分类管理',
  '/tags': '标签管理',
  '/music': '音乐管理',
  '/images': '媒体管理',
  '/files': '媒体管理',
  '/analytics': '访问统计',
  '/data-cleanup': '数据清理',
  '/settings': '系统设置'
}

const breadcrumbs = computed(() => {
  const path = route.path
  const items = []

  // 始终添加首页
  items.push({ path: '/dashboard', title: '首页' })

  // 处理特殊路由
  if (path.startsWith('/articles/edit/')) {
    items.push(
      { path: '/articles', title: '文章列表' },
      { path: '', title: '编辑文章' }
    )
  } else if (path.startsWith('/articles/create')) {
    items.push(
      { path: '/articles', title: '文章列表' },
      { path: '', title: '写文章' }
    )
  } else if (path !== '/dashboard') {
    // 获取页面标题
    const title = breadcrumbMap[path]
    if (title) {
      items.push({ path: '', title: title })
    } else {
      // 如果没有找到映射，尝试从路由名称获取
      const routeName = route.name as string
      if (routeName) {
        const nameMap: Record<string, string> = {
          'Analytics': '访问统计',
          'DataCleanup': '数据清理'
        }
        items.push({ path: '', title: nameMap[routeName] || '未知页面' })
      } else {
        items.push({ path: '', title: '未知页面' })
      }
    }
  }

  return items
})

// 修改密码相关
const showPasswordDialog = ref(false)
const loading = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 用户菜单命令处理
const handleUserMenuCommand = (command: string) => {
  switch (command) {
    case 'profile':
      // TODO: 打开个人资料编辑弹窗
      ElMessage.info('个人资料功能开发中...')
      break
    case 'changePassword':
      showPasswordDialog.value = true
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    const valid = await passwordFormRef.value.validate()
    if (!valid) return

    loading.value = true
    const result = await userStore.changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })

    if (result.success) {
      ElMessage.success(result.message)
      showPasswordDialog.value = false
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('Change password error:', error)
  } finally {
    loading.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    userStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  } catch {
    // 用户取消
  }
}

// 监听密码弹窗关闭，重置表单
watch(showPasswordDialog, (newVal) => {
  if (!newVal) {
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    passwordFormRef.value?.resetFields()
  }
})
</script>

<style scoped>
.admin-layout {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
  color: #fff;
  border-bottom: 1px solid #1f2d3d;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.sidebar-menu {
  border-right: none;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 260px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.header-left .el-breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.username {
  margin: 0 8px;
  font-size: 14px;
  color: #606266;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
  width: 100%;
  max-width: none;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
