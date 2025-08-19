import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import i18n from '@/i18n'
import { watch } from 'vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home'),
    meta: {
      title: i18n.global.t('nav.home'),
      description: i18n.global.t('home.description'),
      keywords: i18n.global.t('home.keywords'),
      // 添加页面切换动画
      transition: 'page',
    },
  },
  {
    path: '/posts',
    name: 'posts',
    component: () => import('@/views/posts'),
    meta: {
      title: i18n.global.t('nav.posts'),
      description: i18n.global.t('posts.description'),
      keywords: i18n.global.t('posts.keywords'),
      // 添加页面切换动画
      transition: 'page',
    },
  },
  {
    path: '/article/:id',
    name: 'article',
    component: () => import('@/views/article'),
    meta: {
      title: i18n.global.t('nav.articles'),
      description: i18n.global.t('article.description'),
      keywords: i18n.global.t('article.keywords'),
      // 添加页面切换动画
      transition: 'page',
      // 标记这是一个需要特殊返回处理的页面
      requiresBackHandling: true,
    },
  },
  // 添加404路由 - 处理所有未匹配的路径
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/404'),
    meta: {
      title: '404 - 页面未找到',
      description: '抱歉，您访问的页面不存在',
      keywords: '404,页面未找到,错误页面',
      // 标记这是404页面
      is404: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 添加滚动行为优化
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置，恢复到该位置
    if (savedPosition) {
      return savedPosition
    }

    // 如果是同一页面的锚点跳转，平滑滚动到锚点
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }

    // 其他情况滚动到顶部，使用平滑滚动
    return {
      top: 0,
      behavior: 'smooth'
    }
  }
})

// 路由守卫 - 处理404状态码
router.beforeEach((to, from, next) => {
  // 如果是404页面，设置prerender状态码
  if (to.name === 'not-found' || to.meta?.is404 === true) {
    if (typeof window !== 'undefined') {
      // 为prerender服务设置状态码
      Object.defineProperty(window, '__PRERENDER_STATUS_CODE', {
        value: 404,
        writable: true,
        configurable: true
      })

      // 设置页面标题
      document.title = '404 - 页面未找到'

      // 添加noindex meta标签，告诉搜索引擎不要索引这个页面
      let noindexMeta = document.querySelector('meta[name="robots"]')
      if (!noindexMeta) {
        noindexMeta = document.createElement('meta')
        noindexMeta.setAttribute('name', 'robots')
        document.head.appendChild(noindexMeta)
      }
      noindexMeta.setAttribute('content', 'noindex, nofollow')

      // 添加404相关的结构化数据
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "404 - 页面未找到",
        "description": "抱歉，您访问的页面不存在",
        "url": window.location.href,
        "isPartOf": {
          "@type": "WebSite",
          "url": window.location.origin
        }
      })
      document.head.appendChild(script)
    }
  }

  // 仅做路由验证等必要的逻辑
  next()
})

// 路由后置守卫 - 处理404状态码
router.afterEach((to) => {
  // 如果是404页面，发送分析数据
  if (to.name === 'not-found') {
    // 记录404错误到控制台（开发环境）
    if (import.meta.env.DEV) {
      console.warn('404页面访问:', to.fullPath)
    }
  }
})

// 监听语言变化，更新路由元信息
watch(
  () => i18n.global.locale.value,
  () => {
    // 更新所有路由的元信息
    routes.forEach((route) => {
      if (route.meta) {
        route.meta.title = i18n.global.t(`nav.${String(route.name)}`)
        if (route.name === 'about') {
          route.meta.description = i18n.global.t('about.description')
          route.meta.keywords = i18n.global.t('about.keywords')
        } else if (route.name === 'threeDemo') {
          route.meta.description = i18n.global.t('three.description')
          route.meta.keywords = i18n.global.t('three.keywords')
        } else if (route.name === 'echartsDemo') {
          route.meta.description = i18n.global.t('echarts.description')
          route.meta.keywords = i18n.global.t('echarts.keywords')
        } else if (route.name === 'posts') {
          route.meta.title = i18n.global.t('nav.posts')
          route.meta.description = i18n.global.t('posts.description')
          route.meta.keywords = i18n.global.t('posts.keywords')
        } else if (route.name === 'article') {
          route.meta.title = i18n.global.t('nav.articles')
          route.meta.description = i18n.global.t('article.description')
          route.meta.keywords = i18n.global.t('article.keywords')
        } else {
          route.meta.description = i18n.global.t(`${String(route.name)}.description`)
          route.meta.keywords = i18n.global.t(`${String(route.name)}.keywords`)
        }
      }
    })

    // 语言切换时不需要强制刷新页面，Vue的响应式系统会自动更新
    // 更新当前页面的标题为新语言的标题
    const currentRoute = router.currentRoute.value
    if (currentRoute.name && typeof document !== 'undefined') {
      // 根据当前路由名称获取更新后的标题
      let newTitle = ''
      const routeName = String(currentRoute.name)

      if (routeName === 'posts') {
        newTitle = i18n.global.t('nav.posts')
      } else if (routeName === 'article') {
        newTitle = i18n.global.t('nav.articles')
      } else {
        newTitle = i18n.global.t(`nav.${routeName}`)
      }

      document.title = newTitle
    }
  },
  { immediate: true },
)

// 重定向路由已移除，不再需要强制页面刷新

export default router
