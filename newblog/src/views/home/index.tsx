import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NGrid, NGi, NCard, NInput, NButton } from 'naive-ui'
import './style.css'
import api, { type Category } from '@/api'

export default defineComponent({
  name: 'HomeView',
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    const categories = ref<Category[]>([])
    const searchKeyword = ref('')

    // 静态默认选项，作为后备
    const defaultOptions: Array<{
      title: string
      value: string
      hoverable: boolean
      image: boolean
      imageUrl?: string
      imageWidth?: string
      imageHeight?: string
      slug?: string
      category?: Category
    }> = []

    const getCategories = async () => {
      try {
        const res = await api.category.getCategories()
        console.log('API响应:', res)

        // 直接访问响应数据，axios拦截器已处理
        const data = res as unknown as { success: boolean; data: { categories: Category[] } }
        if (data.success && data.data && data.data.categories) {
          categories.value = data.data.categories
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        // 失败时使用默认选项
        categories.value = []
      }
    }

    // 处理分类卡片点击事件
    const handleCategoryClick = (category: Category) => {
      // 跳转到文章列表页，并传递分类ID
      router.push({
        path: '/posts',
        query: {
          category: category.id.toString(),
        },
      })
    }

    // 处理搜索功能
    const handleSearch = () => {
      if (searchKeyword.value.trim()) {
        // 跳转到文章列表页，并传递搜索关键字
        router.push({
          path: '/posts',
          query: {
            keyword: searchKeyword.value.trim(),
          },
        })
      }
    }

    // 处理回车键搜索
    const handleSearchKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSearch()
      }
    }

    onMounted(() => {
      getCategories()
    })

    return () => {
      // 如果有分类数据就使用分类数据，否则使用默认选项
      const displayItems =
        categories.value.length > 0
          ? categories.value.map((cat) => ({
              title: cat.name,
              value: cat.description,
              hoverable: true,
              image: !!cat.image_url, // 有图片URL就显示图片
              imageUrl: cat.image_url,
              imageWidth: '100%',
              imageHeight: '160px',
              slug: cat.slug,
              category: cat, // 保存完整的分类对象
            }))
          : defaultOptions

      return (
        <div class="home-layout">
          {/* 搜索框 */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div class="search-container">
              <NInput
                v-model:value={searchKeyword.value}
                placeholder={t('home.searchPlaceholder')}
                style={{
                  flex: '1',
                  fontSize: '16px',
                }}
                size="large"
                onKeydown={handleSearchKeyPress}
                clearable
              />
              <NButton
                type="primary"
                size="large"
                onClick={handleSearch}
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              >
                {t('home.searchButton')}
              </NButton>
            </div>
          </div>
          <NGrid class="home-grid" xGap={12} yGap={12} responsive="screen" cols={1}>
            {displayItems.map((item, index) => (
              <NGi key={item.slug || index}>
                <div
                  style={{ cursor: 'pointer', height: '100%' }}
                  onClick={() => {
                    if (item.category) {
                      handleCategoryClick(item.category)
                    }
                  }}
                >
                  <NCard
                    title={item.title}
                    hoverable={item.hoverable}
                    style={{ height: '100%' }}
                    cover={
                      item.image && item.imageUrl
                        ? () => (
                            <img
                              src={item.imageUrl}
                              style={{
                                width: item.imageWidth,
                                height: item.imageHeight,
                                objectFit: 'cover',
                                display: 'block',
                              }}
                              alt={item.title}
                            />
                          )
                        : undefined
                    }
                  >
                    <div>
                      <p style={{ color: '#666', lineHeight: '1.6' }}>{item.value}</p>
                      <div
                        style={{
                          marginTop: '10px',
                          fontSize: '12px',
                          color: '#999',
                          textAlign: 'center',
                        }}
                      >
                        {t('home.clickToView')}
                      </div>
                    </div>
                  </NCard>
                </div>
              </NGi>
            ))}
          </NGrid>
        </div>
      )
    }
  },
})
