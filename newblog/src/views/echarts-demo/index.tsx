import { defineComponent, ref } from 'vue'
import EChartsComponent from '@/components/echarts'
import type { EChartsOption } from 'echarts'
import { useI18n } from 'vue-i18n'
import './style.css'

export default defineComponent({
  name: 'EChartsDemo',
  setup() {
    const { t } = useI18n()
    const loading = ref(false)
    const chartType = ref('line')

    // 示例数据
    const xData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const yData = [150, 230, 224, 218, 135, 147, 260]

    // 图表配置
    const options = ref<EChartsOption>({
      title: {
        text: t('echarts.title'),
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        data: xData,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: t('echarts.value'),
          type: 'line',
          data: yData,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 3,
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowBlur: 10,
            shadowOffsetY: 8,
          },
        },
      ],
    })

    // 切换图表类型
    const changeChartType = (type: string) => {
      chartType.value = type
      const newOptions = { ...options.value }
      if (newOptions.series && Array.isArray(newOptions.series)) {
        newOptions.series[0].type = type as 'line' | 'bar' | 'pie'
      }
      options.value = newOptions
    }

    // 模拟数据加载
    const refreshData = () => {
      loading.value = true
      setTimeout(() => {
        const newData = yData.map(() => Math.floor(Math.random() * 300))
        const newOptions = { ...options.value }
        if (newOptions.series && Array.isArray(newOptions.series)) {
          newOptions.series[0].data = newData
        }
        options.value = newOptions
        loading.value = false
      }, 1000)
    }

    return () => (
      <div class="echarts-demo">
        <h1>{t('nav.echartsDemo')}</h1>
        <div class="controls">
          <div class="control-group">
            <button
              class={['btn', { active: chartType.value === 'line' }]}
              onClick={() => changeChartType('line')}
            >
              {t('echarts.lineChart')}
            </button>
            <button
              class={['btn', { active: chartType.value === 'bar' }]}
              onClick={() => changeChartType('bar')}
            >
              {t('echarts.barChart')}
            </button>
            <button
              class={['btn', { active: chartType.value === 'pie' }]}
              onClick={() => changeChartType('pie')}
            >
              {t('echarts.pieChart')}
            </button>
          </div>
          <button class="btn refresh" onClick={refreshData}>
            {t('echarts.refreshData')}
          </button>
        </div>
        <div class="chart-container">
          <EChartsComponent
            options={options.value as EChartsOption}
            width="800px"
            height="400px"
            loading={loading.value}
          />
        </div>
      </div>
    )
  },
})
