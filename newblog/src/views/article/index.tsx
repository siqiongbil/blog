import { defineComponent, ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NCard, NSpin, NEmpty, NTag, NSpace, NButton, NBackTop } from 'naive-ui'
import api, { type Post } from '@/api'
import {
  renderContent,
  convertBackendContentType,
  getContentTypeLabel,
} from '@/utils/content-renderer'
import { updateSEO, generateArticleSEO, resetSEO, setTitleImmediate } from '@/utils/seo'
import './style.css'

export default defineComponent({
  name: 'ArticleView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()

    const article = ref<Post | null>(null)
    const loading = ref(false)
    const articleId = route.params.id as string

    // 获取文章详情
    const getArticle = async () => {
      if (!articleId) {
        console.error('文章ID不存在')
        router.push('/posts')
        return
      }

      loading.value = true
      try {
        const res = await api.post.getPostById(Number(articleId))
        const data = res as unknown as { success: boolean; data: Post }

        if (data.success && data.data) {
          article.value = data.data
          // 更新文章页面的SEO信息
          updateArticleSEO()
        } else {
          console.error('文章不存在')
          router.push('/posts')
        }
      } catch (error) {
        console.error('获取文章失败:', error)
        router.push('/posts')
      } finally {
        loading.value = false
      }
    }

    // 格式化日期
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    // 解析文章标签
    const parsePostTags = (tags?: string | null): string[] => {
      if (!tags || typeof tags !== 'string') {
        return []
      }

      return tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    }

                        // 构建返回URL - 根据文章分类和标签信息
    const buildReturnUrl = () => {
      if (!article.value) return '/posts'

      const query: Record<string, string> = {}

      // 如果文章有分类，添加到查询参数
      if (article.value.category_id) {
        query.category = article.value.category_id.toString()
      }

                  // 如果文章有标签，添加到查询参数
      if (article.value.tag_details && Array.isArray(article.value.tag_details) && article.value.tag_details.length > 0) {
        // 优先使用tag_details中的标签ID
        query.tag = article.value.tag_details[0].id.toString()
      } else if (article.value.tags && typeof article.value.tags === 'string') {
        // 如果没有tag_details，尝试解析tags字段
        let tags: string[] = []

        try {
          // 尝试解析为JSON数组
          const parsedTags = JSON.parse(article.value.tags)
          if (Array.isArray(parsedTags)) {
            tags = parsedTags
          }
        } catch {
          // 如果不是JSON，按逗号分割
          tags = article.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        }

        if (tags.length > 0) {
          // 使用标签名称（需要后端支持按名称查询）
          query.tag = tags[0]
        }
      }

      // 构建查询字符串
      const queryString = Object.keys(query).length > 0
        ? '?' + Object.entries(query).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
        : ''

      return `/posts${queryString}`
    }

        // 计算返回按钮文本
    const backButtonText = computed(() => {
      const referrer = document.referrer
      const currentHost = window.location.origin

      // 如果来源是同一域名且不是直接访问，显示"返回"
      if (referrer && referrer.startsWith(currentHost) && referrer !== window.location.href) {
        return '← 返回'
      } else {
                // 直接访问或外部来源，根据文章信息显示返回文本
        if (article.value?.category_id) {
          return '← 返回分类'
        } else if (article.value?.tag_details && Array.isArray(article.value.tag_details) && article.value.tag_details.length > 0) {
          return '← 返回标签'
        } else if (article.value?.tags && typeof article.value.tags === 'string') {
          // 检查是否有标签
          let hasTags = false
          try {
            const parsedTags = JSON.parse(article.value.tags)
            hasTags = Array.isArray(parsedTags) && parsedTags.length > 0
          } catch {
            hasTags = article.value.tags.split(',').some(tag => tag.trim().length > 0)
          }

          if (hasTags) {
            return '← 返回标签'
          }
        }
        return '← 返回列表'
      }
    })

    // 返回文章列表 - 智能返回逻辑
    const goBack = () => {
      // 检查来源页面
      const referrer = document.referrer
      const currentHost = window.location.origin

      // 如果来源是同一域名且不是直接访问，尝试返回
      if (referrer && referrer.startsWith(currentHost) && referrer !== window.location.href) {
        try {
          router.back()
        } catch (error) {
          // 如果返回失败，跳转到相应的文章列表
          router.push(buildReturnUrl())
        }
      } else {
        // 直接访问或外部来源，跳转到相应的文章列表
        router.push(buildReturnUrl())
      }
    }

    // 计算属性：渲染后的文章内容
    const renderedContent = computed(() => {
      if (!article.value?.content) return ''

      // 使用API返回的content_type字段
      const contentType = article.value.content_type
        ? convertBackendContentType(article.value.content_type)
        : undefined

      return renderContent(article.value.content, contentType)
    })

    // 计算属性：内容类型显示
    const contentTypeLabel = computed(() => {
      if (!article.value?.content_type) return t('contentType.markdown')
      const typeKey = getContentTypeLabel(article.value.content_type)
      return t(`contentType.${typeKey}`)
    })

    // 更新文章SEO信息
    const updateArticleSEO = () => {
      if (article.value) {
        const tags =
          article.value.tags && typeof article.value.tags === 'string'
            ? article.value.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0)
            : []

        const seoData = generateArticleSEO(article.value.title, article.value.summary, tags)

        // 立即更新标题
        if (seoData.title) {
          setTitleImmediate(seoData.title)
        }

        // 然后更新完整的SEO信息
        updateSEO(seoData)
      }
    }

    // 监听文章数据变化，更新SEO
    watch(
      () => article.value,
      () => {
        if (article.value) {
          updateArticleSEO()
        }
      },
      { deep: true },
    )

    onMounted(() => {
      getArticle()
    })

    onUnmounted(() => {
      // 页面卸载时重置SEO
      resetSEO()
    })

    return () => (
      <div>
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '20px',
            minHeight: 'calc(100vh - 140px)',
          }}
        >
          <NSpin show={loading.value}>
            {article.value ? (
              <div>
                {/* 返回按钮 */}
                <div style={{ marginBottom: '20px' }}>
                  <NButton onClick={goBack} type="default">
                    {backButtonText.value}
                  </NButton>
                </div>

                {/* 文章内容卡片 */}
                <NCard>
                  {/* 文章标题 */}
                  <h1
                    style={{
                      fontSize: '28px',
                      lineHeight: '1.4',
                      marginBottom: '20px',
                      color: '#333',
                    }}
                  >
                    {article.value.title}
                  </h1>

                  {/* 文章元信息 */}
                  <div
                    style={{
                      marginBottom: '20px',
                      padding: '15px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        <span>发布时间: {formatDate(article.value.created_at)}</span>
                        {article.value.author_nickname && (
                          <span style={{ marginLeft: '20px' }}>
                            作者: {article.value.author_nickname}
                          </span>
                        )}
                        <span style={{ marginLeft: '20px' }}>
                          浏览: {article.value.view_count || 0} 次
                        </span>
                      </div>

                      <NTag
                        size="medium"
                        type={
                          article.value.status === 1
                            ? 'success'
                            : article.value.status === 0
                              ? 'warning'
                              : 'error'
                        }
                      >
                        {article.value.status === 1
                          ? '已发布'
                          : article.value.status === 0
                            ? '草稿'
                            : '已删除'}
                      </NTag>
                    </div>
                  </div>

                  {/* 文章标签 */}
                  {parsePostTags(article.value.tags).length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <NSpace>
                        {parsePostTags(article.value.tags).map((tag, index) => (
                          <NTag key={index} type="default">
                            {tag}
                          </NTag>
                        ))}
                      </NSpace>
                    </div>
                  )}

                  {/* 文章摘要 */}
                  {article.value.summary && (
                    <div
                      style={{
                        marginBottom: '20px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        borderLeft: '4px solid #007bff',
                      }}
                    >
                      <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#555' }}>
                        文章摘要
                      </h3>
                      <p style={{ color: '#666', lineHeight: '1.6', margin: 0 }}>
                        {article.value.summary}
                      </p>
                    </div>
                  )}

                  {/* 文章内容 */}
                  <div style={{ marginBottom: '20px' }}>
                    {/* 内容类型标识 */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        padding: '10px 15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#666',
                      }}
                    >
                      <span>
                        {t('article.contentFormat')}: <strong>{contentTypeLabel.value}</strong>
                      </span>
                      <span style={{ fontSize: '12px' }}>
                        {t('article.wordCount')}: {article.value.content?.length || 0}{' '}
                        {t('article.characters')}
                      </span>
                    </div>

                    {/* 渲染的文章内容 */}
                    <div
                      style={{
                        lineHeight: '1.8',
                        fontSize: '16px',
                        color: '#333',
                      }}
                      class="article-content"
                      v-html={renderedContent.value}
                    ></div>
                  </div>

                  {/* 文章底部信息 */}
                  <div
                    style={{
                      marginTop: '40px',
                      padding: '20px 0',
                      borderTop: '1px solid #f0f0f0',
                      textAlign: 'center',
                      color: '#999',
                      fontSize: '14px',
                    }}
                  >
                    {article.value.category_name && (
                      <div style={{ marginBottom: '10px' }}>
                        分类: <NTag type="info">{article.value.category_name}</NTag>
                      </div>
                    )}
                    <div>最后更新: {formatDate(article.value.updated_at)}</div>
                  </div>
                </NCard>
              </div>
            ) : (
              !loading.value && (
                <NEmpty description="文章不存在或已被删除">
                  {{
                    extra: () => <NButton onClick={goBack}>返回列表</NButton>,
                  }}
                </NEmpty>
              )
            )}
          </NSpin>
        </div>

        {/* 返回顶部 */}
        <NBackTop />
      </div>
    )
  },
})
