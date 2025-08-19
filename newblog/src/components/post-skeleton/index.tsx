import { defineComponent } from 'vue'
import { NSkeleton } from 'naive-ui'
import './style.css'

export default defineComponent({
  name: 'PostSkeleton',
  setup() {
    return () => (
      <div class="post-skeleton">
        <NSkeleton text repeat={3} />
        <div class="skeleton-tags">
          <NSkeleton text width="60px" />
          <NSkeleton text width="80px" />
          <NSkeleton text width="70px" />
        </div>
        <div class="skeleton-meta">
          <NSkeleton text width="120px" />
          <NSkeleton text width="60px" />
        </div>
      </div>
    )
  },
})
