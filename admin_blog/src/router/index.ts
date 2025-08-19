import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/articles',
      name: 'Articles',
      component: () => import('@/views/ArticleListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/articles/create',
      name: 'CreateArticle',
      component: () => import('@/views/ArticleEditView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/articles/edit/:id',
      name: 'EditArticle',
      component: () => import('@/views/ArticleEditView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/categories',
      name: 'Categories',
      component: () => import('@/views/CategoryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tags',
      name: 'Tags',
      component: () => import('@/views/TagView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/music',
      name: 'Music',
      component: () => import('@/views/MusicView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/images',
      name: 'Images',
      component: () => import('@/views/FileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/files',
      name: 'Files',
      component: () => import('@/views/FileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/analytics',
      name: 'Analytics',
      component: () => import('@/views/AnalyticsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/data-cleanup',
      name: 'DataCleanup',
      component: () => import('@/views/DataCleanupView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
