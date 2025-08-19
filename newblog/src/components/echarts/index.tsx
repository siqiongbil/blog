import { defineComponent, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption, ECharts } from 'echarts'
import './style.css'

export default defineComponent({
  name: 'EChartsComponent',
  props: {
    options: {
      type: Object as () => EChartsOption,
      required: true,
    },
    width: {
      type: String,
      default: '100%',
    },
    height: {
      type: String,
      default: '100%',
    },
    theme: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    autoResize: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const chartRef = ref<HTMLElement | null>(null)
    let chart: ECharts | null = null

    const initChart = () => {
      if (!chartRef.value) return

      // 初始化图表
      chart = echarts.init(chartRef.value, props.theme)

      // 设置图表配置
      chart.setOption(props.options)

      // 自动调整大小
      if (props.autoResize) {
        window.addEventListener('resize', handleResize)
      }
    }

    const handleResize = () => {
      chart?.resize()
    }

    // 监听配置变化
    watch(
      () => props.options,
      (newOptions) => {
        chart?.setOption(newOptions)
      },
      { deep: true },
    )

    // 监听加载状态
    watch(
      () => props.loading,
      (loading) => {
        if (loading) {
          chart?.showLoading()
        } else {
          chart?.hideLoading()
        }
      },
    )

    // 监听主题变化
    watch(
      () => props.theme,
      (newTheme) => {
        if (chart) {
          chart.dispose()
          chart = echarts.init(chartRef.value!, newTheme)
          chart.setOption(props.options)
        }
      },
    )

    onMounted(() => {
      initChart()
    })

    onBeforeUnmount(() => {
      if (props.autoResize) {
        window.removeEventListener('resize', handleResize)
      }
      chart?.dispose()
    })

    return () => (
      <div
        ref={chartRef}
        class="echarts-container"
        style={{
          width: props.width,
          height: props.height,
        }}
      />
    )
  },
})
