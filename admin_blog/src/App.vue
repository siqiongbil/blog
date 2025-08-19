<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const route = useRoute()
const authStore = useAuthStore()
const isInitialized = ref(false)

// 判断是否是管理后台路由
const isAdminRoute = computed(() => {
  return route.path !== '/login'
})

onMounted(async () => {
  // 初始化认证状态
  try {
    await authStore.initAuth()
  } finally {
    isInitialized.value = true
  }
})
</script>

<template>
  <div id="app">
    <!-- 初始化加载中 -->
    <div v-if="!isInitialized" class="app-loading">
      <el-icon class="is-loading" :size="24">
        <Loading />
      </el-icon>
      <p>正在初始化...</p>
    </div>

    <!-- 应用主体 -->
    <template v-else>
      <router-view v-if="!isAdminRoute" />
      <AdminLayout v-else />
    </template>
  </div>
</template>

<style scoped>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}

.app-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #666;
}

.app-loading p {
  margin-top: 16px;
  font-size: 14px;
}
</style>
