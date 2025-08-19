import { defineComponent, watch, ref, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import SeoComponent from '@/components/seo'
import LanguageSwitcher from '@/components/language-switcher'
import MusicPlayer from '@/components/music-player'
import PageTransition from '@/components/page-transition'
import { useI18n } from 'vue-i18n'
import { setTitleImmediate } from '@/utils/seo'
import {
  NConfigProvider,
  NMessageProvider,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutFooter,
  NSpace,
  NButton,
  NTooltip,
} from 'naive-ui'

export default defineComponent({
  name: 'App',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()
    const isMobile = ref(false)
    const musicPlayerVisible = ref(false)

    const defaultMeta = {
      title: t('nav.home'),
      description: t('common.description'),
      keywords: t('common.keywords'),
    }

    // 检测屏幕尺寸
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
    }

    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
    })

    // 监听路由变化，立即更新页面标题
    watch(
      () => route.meta.title,
      (newTitle) => {
        if (newTitle) {
          setTitleImmediate(newTitle as string)
        }
      },
      { immediate: true },
    )

    // 监听路由路径变化，确保每次路由切换都更新标题
    watch(
      () => route.path,
      () => {
        const title = route.meta.title || defaultMeta.title
        setTitleImmediate(title as string)
      },
      { immediate: true },
    )

    return () => (
      <NConfigProvider>
        <NMessageProvider>
          <NLayout style="min-height: 100vh; display: flex; flex-direction: column;">
            <NLayoutHeader
              style={`height: 64px; padding: 0 ${isMobile.value ? '16px' : '24px'}; position: sticky; top: 0; z-index: 1000;`}
              bordered
            >
              <div style="display: flex; justify-content: space-between; align-items: center; height: 100%">
                <div style="display: flex; align-items: center; gap: 40px; min-width: 0;">
                  <div
                    style={`font-size: ${isMobile.value ? '18px' : '20px'}; font-weight: 500; color: #333; white-space: nowrap; cursor: pointer; transition: color 0.2s ease;`}
                    onClick={() => router.push('/')}
                  >
                    {t('blogTitle')}
                  </div>
                </div>

                <NSpace align="center">
                  <NTooltip trigger="hover">
                    {{
                      trigger: () => (
                        <NButton
                          size="medium"
                          quaternary
                          circle
                          onClick={() => (musicPlayerVisible.value = !musicPlayerVisible.value)}
                          style="margin-right: 8px;"
                        >
                          🎵
                        </NButton>
                      ),
                      default: () =>
                        musicPlayerVisible.value ? t('musicPlayer.close') : t('musicPlayer.open'),
                    }}
                  </NTooltip>
                  <LanguageSwitcher />
                </NSpace>
              </div>
            </NLayoutHeader>

            <NLayoutContent
              style={`flex: 1; padding: ${isMobile.value ? '16px' : '24px'}; display: flex; flex-direction: column;`}
            >
              <div
                style={`max-width: 1800px; margin: 0 auto; width: 100%; flex: 1; display: flex; flex-direction: column;`}
              >
                <SeoComponent
                  title={route.meta.title || defaultMeta.title}
                  description={route.meta.description || defaultMeta.description}
                  keywords={route.meta.keywords || defaultMeta.keywords}
                />
                <div class="router-view-container" style="flex: 1;">
                  <PageTransition />
                </div>
              </div>
            </NLayoutContent>

            <NLayoutFooter style={`padding: ${isMobile.value ? '8px 16px' : '12px'}; height: 60px;`} bordered>
              <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                <div
                  style={`font-size: ${isMobile.value ? '12px' : '14px'}; color: #666; text-align: center;`}
                >
                  <div style="margin-bottom: 4px;">
                    <a
                      href="https://beian.miit.gov.cn/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="color: #666; text-decoration: none; background: transparent;"
                    >
                      皖ICP备2024030829号-1
                    </a>
                  </div>
                  <div>{t('footer.copyright')}</div>
                </div>
              </div>
            </NLayoutFooter>
          </NLayout>

          {/* 悬浮音乐播放器 */}
          <MusicPlayer
            visible={musicPlayerVisible.value}
            onUpdate:visible={(value: boolean) => (musicPlayerVisible.value = value)}
          />
        </NMessageProvider>
      </NConfigProvider>
    )
  },
})
