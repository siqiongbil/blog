import { defineComponent, ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NCard, NGrid, NGi, NSpin, NEmpty, NPagination, NTag, NSpace, NButton } from 'naive-ui'
import api, { type Post, type Tag, type Category } from '@/api'
import {
  updateSEO,
  generateCategorySEO,
  generateTagSEO,
  resetSEO,
  setTitleImmediate,
} from '@/utils/seo'
import { debounce } from '@/utils/performance'
import cache from '@/utils/cache'
import PostCard from '@/components/post-card'
import PostSkeleton from '@/components/post-skeleton'
import './style.css'

export default defineComponent({
  name: 'PostsView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()

    const posts = ref<Post[]>([])
    const tags = ref<Tag[]>([])
    const categories = ref<Category[]>([])
    const currentTag = ref<Tag | null>(null)
    const currentCategory = ref<Category | null>(null)
    const loading = ref(false)
    const total = ref(0)
    const page = ref(1)
    const pageSize = ref(10)

    // 添加防抖动的数据刷新状态
    const isRefreshing = ref(false)
    const showLoading = ref(false)

    // 添加初始加载状态，防止显示空状态
    const isInitialized = ref(false)

    // 获取标签列表
    const getTags = async () => {
      // 先尝试从缓存获取
      const cachedTags = cache.getCachedTags()
      if (cachedTags) {
        tags.value = cachedTags
        return
      }

      try {
        const res = await api.tag.getTagsSelect()
        const data = res as unknown as { success: boolean; data: Tag[] }
        if (data.success && data.data) {
          tags.value = data.data
          // 缓存标签数据
          cache.cacheTags(data.data)

          // 如果URL中有标签ID，找到对应的标签
          const tagId = route.query.tag
          if (tagId) {
            currentTag.value = tags.value.find((tag) => tag.id === Number(tagId)) || null
          }
        }
      } catch (error) {
        console.error(t('posts.fetchTagsError'), error)
      }
    }

    // 获取分类列表
    const getCategories = async () => {
      // 先尝试从缓存获取
      const cachedCategories = cache.getCachedCategories()
      if (cachedCategories) {
        categories.value = cachedCategories
        return
      }

      try {
        const res = await api.category.getCategories()
        const data = res as unknown as { success: boolean; data: { categories: Category[] } }
        if (data.success && data.data) {
          categories.value = data.data.categories
          // 缓存分类数据
          cache.cacheCategories(data.data.categories)

          // 如果URL中有分类ID，找到对应的分类
          const categoryId = route.query.category
          if (categoryId) {
            currentCategory.value =
              categories.value.find((cat) => cat.id === Number(categoryId)) || null
          }
        }
      } catch (error) {
        console.error(t('posts.fetchCategoriesError'), error)
      }
    }

    // 更新页面SEO信息
    const updatePageSEO = () => {
      const tagId = route.query.tag
      const categoryId = route.query.category
      const keyword = route.query.keyword

      let seoData
      if (keyword) {
        // 如果是搜索页面，使用搜索关键字
        seoData = {
          title: `"${keyword}" - ${t('posts.searchResultTitle')}`,
          description: t('posts.searchDescription').replace('{keyword}', keyword as string),
          keywords: t('posts.searchKeywords').replace('{keyword}', keyword as string),
        }
      } else if (categoryId && tagId && currentCategory.value && currentTag.value) {
        // 如果同时有分类和标签，显示组合信息
        seoData = {
          title: `${currentCategory.value.name} - ${currentTag.value.name} - ${t('posts.tagFilterTitle')}`,
          description: t('posts.tagFilterDescription')
            .replace('{category}', currentCategory.value.name)
            .replace('{tag}', currentTag.value.name),
          keywords: t('posts.tagFilterKeywords')
            .replace('{category}', currentCategory.value.name)
            .replace('{tag}', currentTag.value.name),
        }
      } else if (categoryId && currentCategory.value) {
        // 如果只有分类，使用分类信息
        seoData = generateCategorySEO(
          currentCategory.value.name,
          currentCategory.value.description,
          currentCategory.value.slug,
        )
      } else if (tagId && currentTag.value) {
        // 如果只有标签，使用标签信息
        seoData = generateTagSEO(currentTag.value.name, currentTag.value.description)
      } else {
        // 默认文章列表页面
        seoData = {
          title: t('posts.title'),
          description: t('posts.description'),
          keywords: t('posts.keywords'),
        }
      }

      // 立即更新标题
      if (seoData.title) {
        setTitleImmediate(seoData.title)
      }

      // 然后更新完整的SEO信息
      updateSEO(seoData)
    }

    // 构建请求参数
    const buildParams = () => {
      const tagId = route.query.tag
      const categoryId = route.query.category
      const keyword = route.query.keyword

      const params: Record<string, string | number> = {
        page: page.value,
        pageSize: pageSize.value,
        status: 1, // 默认只获取已发布的文章
      }

      // 添加标签筛选参数
      if (tagId) {
        params.tag_ids = tagId.toString()
        params.tag_match_type = 'any'
      }

      // 添加分类筛选参数
      if (categoryId) {
        params.category_id = Number(categoryId)
      }

      // 添加关键字搜索参数
      if (keyword) {
        params.keyword = keyword.toString()
      }

      return params
    }

    // 防抖动的获取文章列表函数
    const debouncedGetPosts = debounce(async () => {
      if (isRefreshing.value) return

      isRefreshing.value = true
      showLoading.value = true

      try {
        const params = buildParams()

        // 先尝试从缓存获取
        const cachedData = cache.getCachedPosts(params)
        if (cachedData) {
          posts.value = cachedData.articles || []
          total.value = cachedData.pagination?.total || 0
          showLoading.value = false
          isRefreshing.value = false
          isInitialized.value = true
          updatePageSEO()
          return
        }

        const res = await api.post.getPosts(params)
        const data = res as unknown as {
          success: boolean
          data: {
            articles: Post[]
            pagination: { total: number }
          }
        }

        if (data.success && data.data) {
          // 使用 nextTick 确保DOM更新后再设置数据
          await nextTick()
          posts.value = data.data.articles || []
          total.value = data.data.pagination?.total || 0

          // 缓存数据
          cache.cachePosts(params, data.data)

          // 如果有标签筛选，更新当前标签信息
          const tagId = route.query.tag
          if (tagId && tags.value.length > 0) {
            currentTag.value = tags.value.find((tag) => tag.id === Number(tagId)) || null
          } else {
            currentTag.value = null
          }

          // 如果有分类筛选，更新当前分类信息
          const categoryId = route.query.category
          if (categoryId && categories.value.length > 0) {
            currentCategory.value =
              categories.value.find((cat) => cat.id === Number(categoryId)) || null
          } else {
            currentCategory.value = null
          }

          // 更新SEO信息
          updatePageSEO()

          // 预加载相关数据
          cache.preloadRelatedData(params)
        }
      } catch (error) {
        console.error(t('posts.fetchPostsError'), error)
        posts.value = []
      } finally {
        loading.value = false
        showLoading.value = false
        isRefreshing.value = false
        // 标记已初始化
        isInitialized.value = true
      }
    }, 100)

    // 获取文章列表
    const getPosts = async () => {
      loading.value = true
      await debouncedGetPosts()
    }

    // 处理分页变化
    const handlePageChange = (newPage: number) => {
      page.value = newPage
      // 更新URL参数
      const query = { ...route.query, page: newPage.toString() }
      router.replace({ query })
    }

    // 处理标签变化
    const handleTagChange = (tagId?: number) => {
      page.value = 1
      const query: Record<string, string> = { page: '1' }

      // 保持当前的分类ID
      if (route.query.category) {
        query.category = route.query.category.toString()
      }

      // 设置标签ID
      if (tagId) {
        query.tag = tagId.toString()
      }

      // 保持搜索关键字（如果有的话，虽然在标签筛选时通常不会有）
      if (route.query.keyword) {
        query.keyword = route.query.keyword.toString()
      }

      router.replace({ query })
    }

    // 监听路由变化
    watch(
      () => route.query,
      () => {
        const newPage = Number(route.query.page) || 1
        page.value = newPage
        getPosts()
      },
      { immediate: false },
    )

    onMounted(async () => {
      // 设置初始加载状态
      showLoading.value = true
      loading.value = true

      await getTags()
      await getCategories()
      await getPosts()
    })

    onUnmounted(() => {
      // 页面卸载时重置SEO
      resetSEO()
    })

    return () => (
      <div class="posts-layout">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* 返回首页按钮 */}
          <div style={{ marginBottom: '20px' }}>
            <NButton onClick={() => router.push('/')} type="default">
              ← {t('posts.backToHome')}
            </NButton>
          </div>

          {/* 文章列表卡片 */}
          <NCard>
            {/* 标题和标签信息 */}
            <div class="posts-header">
              <h1 class="posts-title">
                {route.query.keyword
                  ? `${t('posts.searchResult')}：${route.query.keyword}`
                  : route.query.category &&
                      route.query.tag &&
                      currentCategory.value &&
                      currentTag.value
                    ? `${t('posts.category')}：${currentCategory.value.name} / ${t('posts.tag')}：${currentTag.value.name}`
                    : route.query.category && currentCategory.value
                      ? `${t('posts.category')}：${currentCategory.value.name}`
                      : route.query.tag && currentTag.value
                        ? `${t('posts.tag')}：${currentTag.value.name}`
                        : t('posts.title')}
              </h1>

              {/* 标签筛选 - 仅在非搜索模式下显示 */}
              {!route.query.keyword && (
                <div class="category-filter">
                  <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#666' }}>
                    {route.query.category && currentCategory.value
                      ? t('posts.tagFilterInCategory').replace(
                          '{category}',
                          currentCategory.value.name,
                        )
                      : t('posts.tagFilter')}
                  </h3>
                  <NSpace>
                    <div onClick={() => handleTagChange()}>
                      <NTag checkable checked={!route.query.tag}>
                        {t('posts.all')}
                      </NTag>
                    </div>
                    {tags.value.map((tag) => (
                      <div key={tag.id} onClick={() => handleTagChange(tag.id)}>
                        <NTag checkable checked={Number(route.query.tag) === tag.id}>
                          {tag.name}
                        </NTag>
                      </div>
                    ))}
                  </NSpace>
                </div>
              )}
            </div>

            {/* 文章列表 */}
            <div class="posts-grid">
              {showLoading.value && !isInitialized.value ? (
                // 初始加载时显示骨架屏
                <NGrid xGap={16} yGap={16} responsive="screen" cols={1}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <NGi key={index}>
                      <NCard>
                        <PostSkeleton />
                      </NCard>
                    </NGi>
                  ))}
                </NGrid>
              ) : posts.value.length === 0 && isInitialized.value && !loading.value ? (
                // 数据加载完成后显示空状态
                <div class="posts-empty-container">
                  <NEmpty description={t('posts.noPosts')} />
                </div>
              ) : (
                // 显示文章列表
                <NGrid xGap={16} yGap={16} responsive="screen" cols={1}>
                  {posts.value.map((post) => (
                    <NGi key={post.id}>
                      <PostCard post={post} />
                    </NGi>
                  ))}
                </NGrid>
              )}
            </div>

            {/* 分页 */}
            {total.value > pageSize.value && (
              <div class="pagination-container">
                <NPagination
                  page={page.value}
                  pageCount={Math.ceil(total.value / pageSize.value)}
                  pageSize={pageSize.value}
                  showSizePicker
                  pageSizes={[10, 20, 50]}
                  onUpdatePage={handlePageChange}
                  onUpdatePageSize={(size: number) => {
                    pageSize.value = size
                    page.value = 1
                    handlePageChange(1)
                  }}
                />
              </div>
            )}
          </NCard>
        </div>
      </div>
    )
  },
})
