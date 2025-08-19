import { defineComponent, Transition, TransitionGroup } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'PageTransition',
  setup() {
    const route = useRoute()

    return () => (
      <Transition
        name="page"
        mode="out-in"
        appear
        onBeforeEnter={(el: Element) => {
          // 页面进入前的处理
          const target = el as HTMLElement
          target.style.opacity = '0'
          target.style.transform = 'translateY(20px)'
        }}
        onEnter={(el: Element, done: () => void) => {
          // 页面进入动画
          const target = el as HTMLElement
          target.style.transition = 'all 0.3s ease'
          target.style.opacity = '1'
          target.style.transform = 'translateY(0)'

          setTimeout(done, 300)
        }}
        onLeave={(el: Element, done: () => void) => {
          // 页面离开动画
          const target = el as HTMLElement
          target.style.transition = 'all 0.3s ease'
          target.style.opacity = '0'
          target.style.transform = 'translateY(-20px)'

          setTimeout(done, 300)
        }}
      >
        <div key={route.path} class="page-content">
          <router-view />
        </div>
      </Transition>
    )
  },
})
