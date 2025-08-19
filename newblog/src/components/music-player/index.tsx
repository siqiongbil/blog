import { defineComponent, ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import {
  NCard,
  NButton,
  NSlider,
  NSpace,
  NTooltip,
  NPopover,
  NList,
  NText,
  useMessage,
} from 'naive-ui'
import { musicApi, type Music } from '@/api'
import './style.css'

export default defineComponent({
  name: 'MusicPlayer',
  props: {
    visible: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const message = useMessage()

    // 播放器状态
    const isPlaying = ref(false)
    const currentTime = ref(0)
    const volume = ref(70)
    const isMuted = ref(false)
    const currentSongIndex = ref(0)
    const isMinimized = ref(false)
    const isVisible = computed({
      get: () => props.visible,
      set: (value) => emit('update:visible', value),
    })

    // 拖拽相关
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })

    // 根据屏幕尺寸设置初始位置
    const getInitialPosition = () => {
      const isMobile = window.innerWidth <= 480
      if (isMobile) {
        // 移动端固定在底部，CSS已处理位置
        return { x: 0, y: 0 }
      } else {
        // 桌面端在右上角
        return { x: window.innerWidth - 340, y: 100 }
      }
    }

    const position = ref(getInitialPosition())
    const playerRef = ref<HTMLElement>()
    const audioRef = ref<HTMLAudioElement>()

    // 音乐列表
    const playlist = ref<Music[]>([])
    const loading = ref(false)

    const currentSong = computed(() => playlist.value[currentSongIndex.value])
    const duration = computed(() => currentSong.value?.duration || 0)

    // 获取音乐列表
    const fetchMusic = async () => {
      try {
        console.log('开始调用音乐API...')
        loading.value = true
        const response = await musicApi.getEnabledMusic()
        console.log('API响应:', response)
        if ((response as any).success) {
          playlist.value = (response as any).data
          console.log('获取到音乐列表:', playlist.value)
          if ((response as any).data.length > 0) {
            currentSongIndex.value = 0
            // 立即加载第一首歌曲
            await loadCurrentSong()
          }
        } else {
          console.warn('API返回失败状态:', response)
          message.warning('获取音乐列表失败')
        }
      } catch (error) {
        console.error('获取音乐列表失败:', error)
        message.error('获取音乐列表失败，请检查网络连接')
      } finally {
        loading.value = false
      }
    }

    // 格式化时间
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // 播放/暂停
    const togglePlay = async () => {
      console.log('点击播放按钮')
      console.log('audioRef.value:', audioRef.value)
      console.log('currentSong.value:', currentSong.value)
      console.log('playlist.value:', playlist.value)

      if (!audioRef.value) {
        console.error('audio元素未找到')
        message.error('播放器初始化失败')
        return
      }

      if (!currentSong.value) {
        console.error('没有当前歌曲')
        message.error('请先选择音乐')
        return
      }

      try {
        console.log('当前音频源:', audioRef.value.src)
        if (isPlaying.value) {
          console.log('暂停播放')
          audioRef.value.pause()
        } else {
          console.log('开始播放')
          console.log('当前音频源URL:', audioRef.value.src)

          // 如果没有音频源，先加载当前歌曲
          if (!audioRef.value.src) {
            console.log('音频源为空，重新加载当前歌曲')
            await loadCurrentSong()
          }

          await audioRef.value.play()
        }
        isPlaying.value = !isPlaying.value
        console.log('播放状态已更新:', isPlaying.value)
      } catch (error: any) {
        console.error('播放失败:', error)
        message.error(`播放失败: ${error?.message || '未知错误'}`)
      }
    }

    // 上一首
    const previousSong = async () => {
      currentSongIndex.value =
        currentSongIndex.value > 0 ? currentSongIndex.value - 1 : playlist.value.length - 1
      console.log('切换到上一首:', currentSong.value?.title || currentSong.value?.file_name)
      await loadCurrentSong()
    }

    // 下一首
    const nextSong = async () => {
      currentSongIndex.value =
        currentSongIndex.value < playlist.value.length - 1 ? currentSongIndex.value + 1 : 0
      console.log('切换到下一首:', currentSong.value?.title || currentSong.value?.file_name)
      await loadCurrentSong()
    }

    // 加载当前歌曲
    const loadCurrentSong = async () => {
      if (!audioRef.value || !currentSong.value) return

      // 使用完整的API URL
      const fullAudioUrl =
        import.meta.env.VITE_API_BASE_URL.replace('/api', '') + currentSong.value.file_url
      console.log('加载歌曲:', currentSong.value.title || currentSong.value.file_name)
      console.log('音频URL:', fullAudioUrl)

      audioRef.value.src = fullAudioUrl
      currentTime.value = 0

      // 预加载音频数据
      try {
        audioRef.value.load()
        console.log('歌曲预加载完成')
      } catch (error) {
        console.error('歌曲预加载失败:', error)
      }

      // 如果当前正在播放状态，则自动播放新歌曲
      if (isPlaying.value) {
        try {
          await audioRef.value.play()
          console.log('自动播放新歌曲')
        } catch (error) {
          console.error('自动播放失败:', error)
          isPlaying.value = false
          message.error('播放失败')
        }
      }
    }

    // 设置播放位置
    const seekTo = (value: number) => {
      if (!audioRef.value) return
      audioRef.value.currentTime = value
      currentTime.value = value
    }

    // 设置音量
    const setVolume = (value: number) => {
      volume.value = value
      if (audioRef.value) {
        audioRef.value.volume = value / 100
      }
      if (value === 0) {
        isMuted.value = true
      } else if (isMuted.value) {
        isMuted.value = false
      }
    }

    // 静音切换
    const toggleMute = () => {
      if (!audioRef.value) return

      if (isMuted.value) {
        audioRef.value.volume = volume.value / 100
        isMuted.value = false
      } else {
        audioRef.value.volume = 0
        isMuted.value = true
      }
    }

    // 拖拽开始
    const startDrag = (e: MouseEvent) => {
      if (!playerRef.value) return

      // 移动端禁用拖拽
      const isMobile = window.innerWidth <= 480
      if (isMobile) return

      isDragging.value = true
      const rect = playerRef.value.getBoundingClientRect()
      dragOffset.value = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', stopDrag)
      e.preventDefault()
    }

    // 拖拽过程
    const handleDrag = (e: MouseEvent) => {
      if (!isDragging.value) return

      const newX = e.clientX - dragOffset.value.x
      const newY = e.clientY - dragOffset.value.y

      // 边界检查
      const maxX = window.innerWidth - 320
      const maxY = window.innerHeight - (isMinimized.value ? 60 : 280)

      position.value = {
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      }
    }

    // 停止拖拽
    const stopDrag = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    // 音频事件监听
    const setupAudioEvents = () => {
      if (!audioRef.value) return

      audioRef.value.addEventListener('timeupdate', () => {
        if (audioRef.value) {
          currentTime.value = audioRef.value.currentTime
        }
      })

      audioRef.value.addEventListener('ended', async () => {
        console.log('歌曲播放结束，自动播放下一首')
        await nextSong()
      })

      audioRef.value.addEventListener('loadedmetadata', () => {
        if (audioRef.value && currentSong.value) {
          currentSong.value.duration = audioRef.value.duration
        }
      })
    }

    // 监听窗口大小变化
    const handleResize = () => {
      const isMobile = window.innerWidth <= 480
      if (!isMobile) {
        // 桌面端重新计算位置
        const newX = Math.min(position.value.x, window.innerWidth - 340)
        const newY = Math.min(position.value.y, window.innerHeight - 300)
        position.value = { x: Math.max(0, newX), y: Math.max(0, newY) }
      }
    }

    onMounted(() => {
      nextTick(() => {
        setupAudioEvents()
        if (audioRef.value) {
          audioRef.value.volume = volume.value / 100
        }
        // 加载音乐列表
        fetchMusic()

        // 监听窗口大小变化
        window.addEventListener('resize', handleResize)
      })
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', stopDrag)
    })

    return () => (
      <div
        class="music-player-container"
        style={{
          display: isVisible.value ? 'block' : 'none',
        }}
      >
        <audio ref={audioRef} preload="metadata" />

        <div
          ref={playerRef}
          class={`music-player ${isDragging.value ? 'dragging' : ''} ${isMinimized.value ? 'minimized' : ''}`}
          style={{
            left: `${position.value.x}px`,
            top: `${position.value.y}px`,
          }}
        >
          <NCard
            size="small"
            class="player-card"
            style="box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);"
          >
            {/* 拖拽头部 */}
            <div class="player-header" onMousedown={startDrag}>
              <div class="song-info">
                <div class="song-title">
                  {currentSong.value?.title || currentSong.value?.original_name || '暂无音乐'}
                </div>
                <div class="song-artist">{currentSong.value?.artist || '未知艺术家'}</div>
              </div>

              <div class="header-controls">
                <NTooltip trigger="hover">
                  {{
                    trigger: () => (
                      <NButton
                        size="small"
                        quaternary
                        circle
                        onClick={() => (isMinimized.value = !isMinimized.value)}
                      >
                        {isMinimized.value ? '🔼' : '🔽'}
                      </NButton>
                    ),
                    default: () => (isMinimized.value ? '展开' : '最小化'),
                  }}
                </NTooltip>

                <NTooltip trigger="hover">
                  {{
                    trigger: () => (
                      <NButton
                        size="small"
                        quaternary
                        circle
                        onClick={() => {
                          isVisible.value = false
                        }}
                      >
                        ❌
                      </NButton>
                    ),
                    default: () => '关闭',
                  }}
                </NTooltip>
              </div>
            </div>

            {/* 播放器主体 */}
            {!isMinimized.value && (
              <div class="player-body">
                {/* 进度条 */}
                <div class="progress-section">
                  <div class="time-display">
                    <span>{formatTime(currentTime.value)}</span>
                    <span>{formatTime(duration.value)}</span>
                  </div>
                  <NSlider
                    value={currentTime.value}
                    max={duration.value}
                    step={1}
                    onUpdateValue={seekTo}
                    tooltip={false}
                  />
                </div>

                {/* 控制按钮 */}
                <div class="controls-section">
                  <NSpace justify="center" align="center" size="medium">
                    <NButton size="medium" circle quaternary onClick={previousSong}>
                      ⏮
                    </NButton>

                    <NButton size="large" circle type="primary" onClick={togglePlay}>
                      {isPlaying.value ? '⏸' : '▶'}
                    </NButton>

                    <NButton size="medium" circle quaternary onClick={nextSong}>
                      ⏭
                    </NButton>
                  </NSpace>
                </div>

                {/* 音量和播放列表 */}
                <div class="bottom-section">
                  <div class="volume-control">
                    <NButton size="small" quaternary circle onClick={toggleMute}>
                      {isMuted.value ? '🔇' : '🔊'}
                    </NButton>
                    <NSlider
                      value={isMuted.value ? 0 : volume.value}
                      max={100}
                      step={1}
                      onUpdateValue={setVolume}
                      style="width: 80px; margin-left: 8px;"
                      tooltip={false}
                    />
                  </div>

                  <NPopover
                    trigger="click"
                    placement="top-end"
                    zIndex={10000}
                    to="body"
                    class="music-player-popover"
                  >
                    {{
                      trigger: () => (
                        <NButton size="small" quaternary circle>
                          🎵
                        </NButton>
                      ),
                      default: () => (
                        <div style="width: 300px; max-height: 400px; overflow-y: auto;">
                          {loading.value ? (
                            <div style="padding: 20px; text-align: center;">
                              <NText depth="3">加载中...</NText>
                            </div>
                          ) : playlist.value.length === 0 ? (
                            <div style="padding: 20px; text-align: center;">
                              <NText depth="3">暂无音乐</NText>
                            </div>
                          ) : (
                            <NList>
                              {playlist.value.map((song, index) => (
                                <div
                                  key={song.id}
                                  style={{
                                    cursor: 'pointer',
                                    backgroundColor:
                                      index === currentSongIndex.value ? '#f0f0f0' : 'transparent',
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f0f0f0',
                                  }}
                                  onClick={() => {
                                    currentSongIndex.value = index
                                    loadCurrentSong()
                                  }}
                                >
                                  <div>
                                    <NText strong>{song.title || song.original_name}</NText>
                                    <br />
                                    <NText depth="3" style="font-size: 12px;">
                                      {song.artist || '未知艺术家'}
                                    </NText>
                                    {song.album && (
                                      <>
                                        <br />
                                        <NText depth="3" style="font-size: 11px;">
                                          专辑: {song.album}
                                        </NText>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </NList>
                          )}
                        </div>
                      ),
                    }}
                  </NPopover>
                </div>
              </div>
            )}
          </NCard>
        </div>
      </div>
    )
  },
})
