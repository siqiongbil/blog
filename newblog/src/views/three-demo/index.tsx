import { defineComponent, ref } from 'vue'
import ThreeScene from '@/components/three-scene'
import { useI18n } from 'vue-i18n'
import './style.css'

export default defineComponent({
  name: 'ThreeDemo',
  setup() {
    const { t } = useI18n()
    const modelUrl = ref('')
    const modelScale = ref(1)
    const modelPosition = ref({ x: 0, y: 0, z: 0 })
    const modelRotation = ref({ x: 0, y: 0, z: 0 })

    const handleFileChange = (event: Event) => {
      const input = event.target as HTMLInputElement
      if (input.files && input.files[0]) {
        const file = input.files[0]
        modelUrl.value = URL.createObjectURL(file)
      }
    }

    return () => (
      <div class="three-demo">
        <h1>{t('nav.threeDemo')}</h1>
        <div class="controls">
          <div class="control-group">
            <label>{t('three.uploadModel')}：</label>
            <input type="file" accept=".glb,.gltf" onChange={handleFileChange} />
          </div>
          <div class="control-group">
            <label>{t('three.scale')}：</label>
            <input type="range" min="0.1" max="5" step="0.1" v-model={modelScale.value} />
            <span>{modelScale.value}</span>
          </div>
          <div class="control-group">
            <label>{t('three.position')}：</label>
            <div class="position-controls">
              <div>
                <label>{t('three.x')}：</label>
                <input type="number" v-model={modelPosition.value.x} step="0.1" />
              </div>
              <div>
                <label>{t('three.y')}：</label>
                <input type="number" v-model={modelPosition.value.y} step="0.1" />
              </div>
              <div>
                <label>{t('three.z')}：</label>
                <input type="number" v-model={modelPosition.value.z} step="0.1" />
              </div>
            </div>
          </div>
          <div class="control-group">
            <label>{t('three.rotation')}：</label>
            <div class="rotation-controls">
              <div>
                <label>{t('three.x')}：</label>
                <input type="number" v-model={modelRotation.value.x} step="0.1" />
              </div>
              <div>
                <label>{t('three.y')}：</label>
                <input type="number" v-model={modelRotation.value.y} step="0.1" />
              </div>
              <div>
                <label>{t('three.z')}：</label>
                <input type="number" v-model={modelRotation.value.z} step="0.1" />
              </div>
            </div>
          </div>
        </div>
        <div class="scene-container">
          <ThreeScene
            width="800px"
            height="600px"
            backgroundColor="#1a1a1a"
            modelUrl={modelUrl.value}
            modelScale={modelScale.value}
            modelPosition={modelPosition.value}
            modelRotation={modelRotation.value}
          />
        </div>
      </div>
    )
  },
})
