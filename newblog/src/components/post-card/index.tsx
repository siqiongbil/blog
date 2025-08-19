import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NTag, NSpace } from 'naive-ui'
import { extractPlainText } from '@/utils/content-renderer'
import './style.css'

export interface PostCardProps {
  post: {
    id: number
    title: string
    content?: string
    summary?: string
    tags?: string | null
    created_at: string
    status: number
  }
}

export default defineComponent({
  name: 'PostCard',
  props: {
    post: {
      type: Object as () => PostCardProps['post'],
      required: true,
    },
  },
  setup(props) {
    const router = useRouter()

    // 格式化日期
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN')
    }

    // 安全地解析文章标签
    const parsePostTags = (tags?: string | null): string[] => {
      if (!tags || typeof tags !== 'string') {
        return []
      }

      return tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    }

    // 计算文章内容
    const postContent = computed(() => {
      return props.post.summary ||
        extractPlainText(props.post.content || '', 120) ||
        '暂无内容'
    })

    // 计算文章标签
    const postTags = computed(() => {
      return parsePostTags(props.post.tags)
    })

    // 计算状态标签类型
    const statusType = computed(() => {
      switch (props.post.status) {
        case 1:
          return 'success'
        case 0:
          return 'warning'
        default:
          return 'error'
      }
    })

    // 计算状态文本
    const statusText = computed(() => {
      switch (props.post.status) {
        case 1:
          return '已发布'
        case 0:
          return '草稿'
        default:
          return '已删除'
      }
    })

    const handleClick = () => {
      router.push(`/article/${props.post.id}`)
    }

    return () => (
      <div class="post-card" onClick={handleClick}>
        <NCard hoverable style={{ height: '100%' }}>
          {{
            header: () => (
              <div class="post-card-header">
                <h3 class="post-title">
                  {props.post.title}
                </h3>
              </div>
            ),
            default: () => (
              <div class="post-card-content">
                <p class="post-content">
                  {postContent.value}
                </p>

                {/* 文章标签 */}
                <div class="post-tags-container">
                  {postTags.value.length > 0 && (
                    <NSpace size="small">
                      {postTags.value.map((tag, index) => (
                        <NTag key={index} size="small" type="default">
                          {tag}
                        </NTag>
                      ))}
                    </NSpace>
                  )}
                </div>

                <div class="post-meta">
                  <span class="post-date">
                    发布时间: {formatDate(props.post.created_at)}
                  </span>
                  <NTag size="small" type={statusType.value}>
                    {statusText.value}
                  </NTag>
                </div>
              </div>
            ),
          }}
        </NCard>
      </div>
    )
  },
})
