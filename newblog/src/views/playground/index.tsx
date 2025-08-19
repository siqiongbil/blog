import { defineComponent } from 'vue'
import CodeRunner from '@/components/code-runner'
import './style.css'

export default defineComponent({
  name: 'CodePlayground',
  setup() {
    return () => (
      <div class="playground">
        <CodeRunner />
      </div>
    )
  },
})
