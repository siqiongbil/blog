<template>
  <div class="markdown-editor">
    <div class="editor-container">
      <!-- 编辑区域 -->
      <div class="editor-panel">
        <div class="panel-header">
          <span class="panel-title">
            <el-icon>
              <Edit />
            </el-icon>
            编辑
          </span>
          <div class="editor-tools">
            <el-tooltip content="粗体" placement="top">
              <el-button text @click="insertText('**', '**')">
                <el-icon>
                  <Bold />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="斜体" placement="top">
              <el-button text @click="insertText('*', '*')">
                <el-icon>
                  <Italic />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="标题" placement="top">
              <el-button text @click="insertText('## ', '')">
                <el-icon>
                  <Heading />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="链接" placement="top">
              <el-button text @click="insertText('[链接文字](', ')')">
                <el-icon>
                  <Link />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="图片" placement="top">
              <el-button text @click="insertText('![图片描述](', ')')">
                <el-icon>
                  <Picture />
                </el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="代码块" placement="top">
              <el-button text @click="insertText('```\n', '\n```')">
                <el-icon><Code /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip content="表格" placement="top">
              <el-button text @click="insertTable">
                <el-icon>
                  <Grid />
                </el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        <el-input ref="textareaRef" v-model="content" type="textarea" :rows="rows" resize="none"
          placeholder="请输入文章内容，支持Markdown语法..." class="editor-textarea" @input="handleInput"
          @scroll="handleEditorScroll" />
      </div>

      <!-- 分割线 -->
      <div class="divider"></div>

      <!-- 预览区域 -->
      <div class="preview-panel">
        <div class="panel-header">
          <span class="panel-title">
            <el-icon>
              <View />
            </el-icon>
            预览
          </span>
          <div class="preview-tools">
            <el-tooltip content="同步滚动" placement="top">
              <el-button text :type="syncScroll ? 'primary' : 'default'" @click="syncScroll = !syncScroll">
                <el-icon>
                  <Connection />
                </el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
        <div ref="previewRef" class="preview-content" v-html="htmlContent" @scroll="handlePreviewScroll"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'

interface Props {
  modelValue: string
  rows?: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  rows: 20
})

const emit = defineEmits<Emits>()

// 编辑器内容
const content = ref(props.modelValue)
const textareaRef = ref()
const previewRef = ref()
const syncScroll = ref(true)
let isEditorScrolling = false
let isPreviewScrolling = false

// 配置marked
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.error('Highlight error:', err)
      }
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

// 转换为HTML
const htmlContent = computed(() => {
  if (!content.value) return '<p class="empty-placeholder">在左侧编辑区域输入Markdown内容，这里会实时显示预览效果</p>'

  try {
    return marked(content.value)
  } catch (error) {
    console.error('Markdown parse error:', error)
    return '<p class="error-message">Markdown解析错误</p>'
  }
})

// 监听内容变化
watch(content, (newValue) => {
  emit('update:modelValue', newValue)
}, { immediate: true })

// 监听props变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue
  }
})

// 处理输入
const handleInput = () => {
  // 这里可以添加防抖逻辑
}

// 插入文本
const insertText = (before: string, after: string = '') => {
  const textarea = textareaRef.value?.textarea
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)

  const newText = before + selectedText + after
  const newContent = content.value.substring(0, start) + newText + content.value.substring(end)

  content.value = newContent

  // 设置光标位置
  nextTick(() => {
    const newCursorPos = start + before.length + selectedText.length
    textarea.focus()
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  })
}

// 插入表格
const insertTable = () => {
  const tableTemplate = `
| 列1 | 列2 | 列3 |
| --- | --- | --- |
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |
`
  insertText(tableTemplate)
}

// 编辑器滚动处理
const handleEditorScroll = () => {
  if (!syncScroll.value || isPreviewScrolling) return

  isEditorScrolling = true
  const textarea = textareaRef.value?.textarea
  const preview = previewRef.value

  if (textarea && preview) {
    const scrollPercentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight)
    const previewScrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight)
    preview.scrollTop = previewScrollTop
  }

  setTimeout(() => {
    isEditorScrolling = false
  }, 100)
}

// 预览区滚动处理
const handlePreviewScroll = () => {
  if (!syncScroll.value || isEditorScrolling) return

  isPreviewScrolling = true
  const textarea = textareaRef.value?.textarea
  const preview = previewRef.value

  if (textarea && preview) {
    const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
    const textareaScrollTop = scrollPercentage * (textarea.scrollHeight - textarea.clientHeight)
    textarea.scrollTop = textareaScrollTop
  }

  setTimeout(() => {
    isPreviewScrolling = false
  }, 100)
}

// 暴露方法给父组件
defineExpose({
  insertText,
  insertTable,
  focus: () => textareaRef.value?.focus()
})
</script>

<style scoped>
.markdown-editor {
  width: 100%;
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.editor-container {
  display: flex;
  height: 100%;
}

.editor-panel,
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-size: 14px;
  color: #606266;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.editor-tools,
.preview-tools {
  display: flex;
  gap: 4px;
}

.editor-textarea {
  flex: 1;
  border: none;
}

:deep(.el-textarea__inner) {
  border: none;
  border-radius: 0;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px;
  height: 100% !important;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.preview-content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background-color: #fff;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
}

.divider {
  width: 1px;
  background-color: #e4e7ed;
  flex-shrink: 0;
}

/* 预览内容样式 */
:deep(.preview-content) {

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 1.5em 0 0.5em 0;
    font-weight: 600;
    line-height: 1.25;
  }

  h1 {
    font-size: 2em;
  }

  h2 {
    font-size: 1.5em;
  }

  h3 {
    font-size: 1.25em;
  }

  h4 {
    font-size: 1em;
  }

  h5 {
    font-size: 0.875em;
  }

  h6 {
    font-size: 0.75em;
  }

  p {
    margin: 0.5em 0;
  }

  ul,
  ol {
    margin: 0.5em 0;
    padding-left: 2em;
  }

  li {
    margin: 0.2em 0;
  }

  blockquote {
    margin: 1em 0;
    padding: 0.5em 1em;
    border-left: 4px solid #409eff;
    background-color: #f8f9fa;
    color: #666;
  }

  code {
    background-color: #f5f5f5;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9em;
  }

  pre {
    background-color: #f6f8fa;
    border-radius: 6px;
    padding: 1em;
    overflow-x: auto;
    margin: 1em 0;
  }

  pre code {
    background-color: transparent;
    padding: 0;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }

  table th,
  table td {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
  }

  table th {
    background-color: #f8f9fa;
    font-weight: 600;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
  }

  a {
    color: #409eff;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  hr {
    border: none;
    border-top: 1px solid #eee;
    margin: 2em 0;
  }

  .empty-placeholder {
    color: #909399;
    font-style: italic;
    text-align: center;
    margin-top: 2em;
  }

  .error-message {
    color: #f56c6c;
    text-align: center;
    margin-top: 2em;
  }
}

/* 代码高亮样式 */
:deep(.hljs) {
  background: #f6f8fa !important;
  color: #24292e;
}
</style>
