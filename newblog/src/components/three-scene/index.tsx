import { defineComponent, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import './style.css'

export default defineComponent({
  name: 'ThreeScene',
  props: {
    width: {
      type: String,
      default: '100%',
    },
    height: {
      type: String,
      default: '100%',
    },
    backgroundColor: {
      type: String,
      default: '#000000',
    },
    modelUrl: {
      type: String,
      default: '',
    },
    modelScale: {
      type: Number,
      default: 1,
    },
    modelPosition: {
      type: Object,
      default: () => ({ x: 0, y: 0, z: 0 }),
    },
    modelRotation: {
      type: Object,
      default: () => ({ x: 0, y: 0, z: 0 }),
    },
  },
  setup(props) {
    const containerRef = ref<HTMLElement | null>(null)
    let scene: THREE.Scene
    let camera: THREE.PerspectiveCamera
    let renderer: THREE.WebGLRenderer
    let controls: OrbitControls
    let animationFrameId: number
    let loadedModel: THREE.Group | null = null
    let defaultCube: THREE.Mesh | null = null

    const loader = new GLTFLoader()

    const loadModel = (url: string) => {
      if (!scene) return

      // 移除之前的模型
      if (loadedModel) {
        scene.remove(loadedModel)
        loadedModel = null
      }

      if (url) {
        loader.load(
          url,
          (gltf) => {
            loadedModel = gltf.scene
            updateModelTransform()
            scene.add(loadedModel)
            // 隐藏默认立方体
            if (defaultCube) {
              defaultCube.visible = false
            }
          },
          (progress) => {
            console.log('Loading progress:', progress)
          },
          (error) => {
            console.error('Error loading model:', error)
          },
        )
      } else {
        // 显示默认立方体
        if (defaultCube) {
          defaultCube.visible = true
        }
      }
    }

    const updateModelTransform = () => {
      if (!loadedModel) return

      // 设置缩放
      loadedModel.scale.setScalar(props.modelScale)

      // 设置位置
      loadedModel.position.set(props.modelPosition.x, props.modelPosition.y, props.modelPosition.z)

      // 设置旋转
      loadedModel.rotation.set(props.modelRotation.x, props.modelRotation.y, props.modelRotation.z)
    }

    const init = () => {
      if (!containerRef.value) return

      // 创建场景
      scene = new THREE.Scene()
      scene.background = new THREE.Color(props.backgroundColor)

      // 创建相机
      const { width, height } = containerRef.value.getBoundingClientRect()
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      camera.position.z = 5

      // 创建渲染器
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      containerRef.value.appendChild(renderer.domElement)

      // 创建控制器
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true

      // 添加环境光
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      scene.add(ambientLight)

      // 添加平行光
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
      directionalLight.position.set(0, 1, 0)
      scene.add(directionalLight)

      // 添加一个示例立方体
      const geometry = new THREE.BoxGeometry()
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
      defaultCube = new THREE.Mesh(geometry, material)
      scene.add(defaultCube)

      // 如果有模型 URL，加载模型
      if (props.modelUrl) {
        loadModel(props.modelUrl)
      }

      // 动画循环
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate)
        if (defaultCube && defaultCube.visible) {
          defaultCube.rotation.x += 0.01
          defaultCube.rotation.y += 0.01
        }
        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      // 处理窗口大小变化
      const handleResize = () => {
        if (!containerRef.value) return
        const { width, height } = containerRef.value.getBoundingClientRect()
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }
      window.addEventListener('resize', handleResize)
    }

    // 监听属性变化
    watch(
      () => props.modelUrl,
      (newUrl) => {
        loadModel(newUrl)
      },
    )

    watch(
      [() => props.modelScale, () => props.modelPosition, () => props.modelRotation],
      () => {
        updateModelTransform()
      },
      { deep: true },
    )

    onMounted(() => {
      init()
    })

    onBeforeUnmount(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      if (renderer) {
        renderer.dispose()
      }
      if (controls) {
        controls.dispose()
      }
      if (containerRef.value) {
        containerRef.value.removeChild(renderer.domElement)
      }
    })

    return () => (
      <div
        ref={containerRef}
        class="three-scene"
        style={{
          width: props.width,
          height: props.height,
        }}
      />
    )
  },
})
