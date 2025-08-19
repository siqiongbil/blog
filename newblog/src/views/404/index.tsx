import { defineComponent, onMounted, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import './style.css'

export default defineComponent({
  name: 'NotFound',
  setup() {
    const router = useRouter()

    // 游戏状态
    const score = ref(0)
    const gameRunning = ref(false)
    const gameOver = ref(false)
    const isPaused = ref(false)

    let gameInterval: ReturnType<typeof setInterval> | null = null
    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null

    // 游戏数据
    const GRID_SIZE = 20
    const CANVAS_WIDTH = 400
    const CANVAS_HEIGHT = 280

    let snake = [{ x: 10, y: 10 }]
    let food = { x: 15, y: 15 }
    let direction = { x: 0, y: 0 }

    onMounted(() => {
      // 初始化游戏
      initGame()
    })

    onUnmounted(() => {
      if (gameInterval) {
        clearInterval(gameInterval)
      }
      document.removeEventListener('keydown', handleKeyPress)
    })

    const initGame = () => {
      canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
      if (!canvas) return

      ctx = canvas.getContext('2d')
      if (!ctx) return

      draw()
      document.addEventListener('keydown', handleKeyPress)
    }

    const generateFood = () => {
      food = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
      }
    }

    const draw = () => {
      if (!ctx || !canvas) return

      // 清空画布
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // 绘制蛇
      snake.forEach((segment, index) => {
        if (index === 0) {
          ctx!.fillStyle = '#4CAF50'
        } else {
          ctx!.fillStyle = '#81C784'
        }
        ctx!.fillRect(
          segment.x * GRID_SIZE + 1,
          segment.y * GRID_SIZE + 1,
          GRID_SIZE - 2,
          GRID_SIZE - 2,
        )
      })

      // 绘制食物
      ctx!.fillStyle = '#FF5722'
      ctx!.fillRect(food.x * GRID_SIZE + 1, food.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2)
    }

    const update = () => {
      if (!gameRunning.value || (direction.x === 0 && direction.y === 0)) return

      const head = { ...snake[0] }
      head.x += direction.x
      head.y += direction.y

      // 检查边界碰撞
      if (
        head.x < 0 ||
        head.x >= CANVAS_WIDTH / GRID_SIZE ||
        head.y < 0 ||
        head.y >= CANVAS_HEIGHT / GRID_SIZE
      ) {
        gameOver.value = true
        gameRunning.value = false
        return
      }

      // 检查自身碰撞
      if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        gameOver.value = true
        gameRunning.value = false
        return
      }

      snake.unshift(head)

      // 检查是否吃到食物
      if (head.x === food.x && head.y === food.y) {
        score.value += 10
        generateFood()
      } else {
        snake.pop()
      }
    }

    const gameLoop = () => {
      update()
      draw()
    }

    const startGame = () => {
      snake = [{ x: 10, y: 10 }]
      direction = { x: 0, y: 0 }
      score.value = 0
      gameOver.value = false
      gameRunning.value = true
      isPaused.value = false
      generateFood()

      if (gameInterval) clearInterval(gameInterval)
      gameInterval = setInterval(gameLoop, 150)
    }

    const toggleGame = () => {
      if (gameOver.value) {
        startGame()
        return
      }

      gameRunning.value = !gameRunning.value
      isPaused.value = !gameRunning.value

      if (gameRunning.value) {
        if (!gameInterval) {
          gameInterval = setInterval(gameLoop, 150)
        }
      } else {
        if (gameInterval) {
          clearInterval(gameInterval)
          gameInterval = null
        }
      }
    }

    const handleKeyPress = (event: KeyboardEvent) => {
      if (!gameRunning.value && !gameOver.value) return

      switch (event.key) {
        case 'ArrowUp':
          if (direction.y !== 1) direction = { x: 0, y: -1 }
          break
        case 'ArrowDown':
          if (direction.y !== -1) direction = { x: 0, y: 1 }
          break
        case 'ArrowLeft':
          if (direction.x !== 1) direction = { x: -1, y: 0 }
          break
        case 'ArrowRight':
          if (direction.x !== -1) direction = { x: 1, y: 0 }
          break
        case ' ':
          event.preventDefault()
          toggleGame()
          break
      }
    }

    const goHome = () => {
      router.push('/')
    }

    const goBack = () => {
      router.go(-1)
    }

    return () => (
      <div class="not-found-container">
        <div class="not-found-content">
          <div class="error-code">404</div>
          <h1 class="error-title">页面未找到</h1>
          <p class="error-description">
            抱歉，您访问的页面不存在。不过，来玩个贪吃蛇游戏放松一下吧！
          </p>

          <div class="snake-game">
            <div class="game-layout">
              <div class="game-board">
                <canvas id="gameCanvas" class="game-canvas" width="400" height="280"></canvas>
              </div>

              <div class="game-sidebar">
                <div class="game-info">
                  <span class="score">得分: {score.value}</span>
                  {gameOver.value && <span class="game-over">游戏结束</span>}
                </div>

                <div class="game-controls">
                  {!gameRunning.value && (
                    <button class="btn btn-game" onClick={startGame}>
                      {gameOver.value ? '重新开始' : '开始游戏'}
                    </button>
                  )}
                  {gameRunning.value && (
                    <button class="btn btn-game" onClick={toggleGame}>
                      {isPaused.value ? '继续' : '暂停'}
                    </button>
                  )}
                </div>

                <div class="game-instructions">
                  <p>使用方向键控制贪吃蛇移动</p>
                  <p>按空格键暂停/继续游戏</p>
                </div>
              </div>
            </div>
          </div>

          <div class="error-actions">
            <button class="btn btn-primary" onClick={goHome}>
              返回首页
            </button>
            <button class="btn btn-secondary" onClick={goBack}>
              返回上页
            </button>
          </div>
        </div>
      </div>
    )
  }
})
