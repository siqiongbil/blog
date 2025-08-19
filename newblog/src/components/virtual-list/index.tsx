import { defineComponent, ref, computed, onMounted, onUnmounted, watch } from 'vue'

export interface VirtualListProps {
  items: any[]
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export default defineComponent({
  name: 'VirtualList',
  props: {
    items: {
      type: Array,
      required: true,
    },
    itemHeight: {
      type: Number,
      required: true,
    },
    containerHeight: {
      type: Number,
      required: true,
    },
    overscan: {
      type: Number,
      default: 5,
    },
  },
  emits: ['scroll'],
  setup(props, { emit, slots }) {
    const containerRef = ref<HTMLElement>()
    const scrollTop = ref(0)

    // 计算可见区域
    const visibleRange = computed(() => {
      const start = Math.floor(scrollTop.value / props.itemHeight)
      const end = Math.min(
        start + Math.ceil(props.containerHeight / props.itemHeight) + props.overscan,
        props.items.length
      )
      return {
        start: Math.max(0, start - props.overscan),
        end,
      }
    })

    // 计算可见项目
    const visibleItems = computed(() => {
      const { start, end } = visibleRange.value
      return props.items.slice(start, end).map((item, index) => ({
        item,
        index: start + index,
      }))
    })

    // 计算总高度
    const totalHeight = computed(() => props.items.length * props.itemHeight)

    // 计算偏移量
    const offsetY = computed(() => visibleRange.value.start * props.itemHeight)

    // 处理滚动事件
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement
      scrollTop.value = target.scrollTop
      emit('scroll', { scrollTop: target.scrollTop })
    }

    // 滚动到指定项目
    const scrollToItem = (index: number) => {
      if (containerRef.value) {
        const scrollTop = index * props.itemHeight
        containerRef.value.scrollTop = scrollTop
      }
    }

    // 滚动到顶部
    const scrollToTop = () => {
      if (containerRef.value) {
        containerRef.value.scrollTop = 0
      }
    }

    // 滚动到底部
    const scrollToBottom = () => {
      if (containerRef.value) {
        containerRef.value.scrollTop = totalHeight.value - props.containerHeight
      }
    }

    // 监听项目变化，自动滚动到顶部
    watch(
      () => props.items,
      () => {
        scrollTop.value = 0
        if (containerRef.value) {
          containerRef.value.scrollTop = 0
        }
      },
      { deep: true }
    )

    onMounted(() => {
      // 初始化滚动位置
      if (containerRef.value) {
        containerRef.value.scrollTop = 0
      }
    })

    onUnmounted(() => {
      // 清理
    })

    return () => (
      <div
        ref={containerRef}
        style={{
          height: `${props.containerHeight}px`,
          overflow: 'auto',
          position: 'relative',
        }}
        onScroll={handleScroll}
      >
        <div
          style={{
            height: `${totalHeight.value}px`,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: `${offsetY.value}px`,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.value.map(({ item, index }) => (
              <div
                key={index}
                style={{
                  height: `${props.itemHeight}px`,
                }}
              >
                {slots.default?.({ item, index })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
})
