import { defineComponent, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { setTitleImmediate } from '@/utils/seo'

export default defineComponent({
  name: 'SeoComponent',
  props: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    keywords: {
      type: String,
      default: '',
    },
    ogImage: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const route = useRoute()

    const updateMeta = () => {
      // 立即更新标题，不等待DOM更新
      if (props.title) {
        setTitleImmediate(props.title)
      }

      // 使用nextTick确保DOM更新后再更新meta标签
      nextTick(() => {
        // 更新 meta 标签
        const metaTags = {
          description: props.description,
          keywords: props.keywords,
          'og:title': props.title,
          'og:description': props.description,
          'og:image': props.ogImage,
          'og:url': window.location.origin + route.path,
        }

        // 更新或创建 meta 标签
        Object.entries(metaTags).forEach(([name, content]) => {
          if (!content) return

          let meta =
            document.querySelector(`meta[name="${name}"]`) ||
            document.querySelector(`meta[property="${name}"]`)

          if (!meta) {
            meta = document.createElement('meta')
            if (name.startsWith('og:')) {
              meta.setAttribute('property', name)
            } else {
              meta.setAttribute('name', name)
            }
            document.head.appendChild(meta)
          }

          meta.setAttribute('content', content)
        })
      })
    }

    // 立即更新标题，不等待监听器
    if (props.title) {
      setTitleImmediate(props.title)
    }

    // 监听路由变化
    watch(
      () => route.path,
      () => {
        updateMeta()
      },
      { immediate: true },
    )

    // 监听 props 变化，确保标题变化时立即更新
    watch(
      () => props.title,
      (newTitle) => {
        if (newTitle) {
          setTitleImmediate(newTitle)
        }
      },
      { immediate: true },
    )

    // 监听其他props变化
    watch(
      () => [props.description, props.keywords, props.ogImage],
      () => {
        updateMeta()
      },
    )

    // 组件挂载时更新
    onMounted(() => {
      updateMeta()
    })

    return () => null
  },
})
