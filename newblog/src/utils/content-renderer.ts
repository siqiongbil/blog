import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

// 初始化 markdown-it 实例
const md = new MarkdownIt({
  html: true, // 允许HTML标签
  linkify: true, // 自动转换URL为链接
  typographer: true, // 启用一些语言特定的替换规则
  breaks: true, // 转换换行符为<br>
})

// 内容类型枚举
export enum ContentType {
  TEXT = 'text',
  HTML = 'html',
  MARKDOWN = 'markdown',
}

// 后端内容类型数字映射
export const BACKEND_CONTENT_TYPE = {
  TEXT: 1,
  MARKDOWN: 2,
  HTML: 3,
} as const

/**
 * 将后端的数字类型转换为内容类型枚举
 * @param backendType 后端返回的数字类型 (1-纯文本，2-Markdown，3-HTML)
 * @returns ContentType 枚举值
 */
export function convertBackendContentType(backendType: 1 | 2 | 3): ContentType {
  switch (backendType) {
    case BACKEND_CONTENT_TYPE.TEXT:
      return ContentType.TEXT
    case BACKEND_CONTENT_TYPE.MARKDOWN:
      return ContentType.MARKDOWN
    case BACKEND_CONTENT_TYPE.HTML:
      return ContentType.HTML
    default:
      return ContentType.MARKDOWN // 默认为Markdown
  }
}

/**
 * 将内容类型枚举转换为可读的中文标签
 * @param contentType 内容类型枚举或后端数字类型
 * @returns 中文标签
 */
export function getContentTypeLabel(contentType: ContentType | 1 | 2 | 3): string {
  if (typeof contentType === 'number') {
    contentType = convertBackendContentType(contentType)
  }

  // 这里暂时保持原有的返回值，因为这个函数被多个地方调用
  // 在组件中使用时会通过国际化键来获取对应的翻译
  switch (contentType) {
    case ContentType.TEXT:
      return 'text'
    case ContentType.MARKDOWN:
      return 'markdown'
    case ContentType.HTML:
      return 'html'
    default:
      return 'markdown'
  }
}

/**
 * 检测内容类型
 * @param content 内容字符串
 * @returns 内容类型
 */
export function detectContentType(content: string): ContentType {
  if (!content || typeof content !== 'string') {
    return ContentType.TEXT
  }

  // 检测是否包含 Markdown 语法
  const markdownPatterns = [
    /^#{1,6}\s+/m, // 标题
    /\*\*[^*]+\*\*/, // 粗体
    /\*[^*]+\*/, // 斜体
    /`[^`]+`/, // 行内代码
    /```[\s\S]*?```/, // 代码块
    /^\* /m, // 无序列表
    /^\d+\. /m, // 有序列表
    /\[([^\]]+)\]\(([^)]+)\)/, // 链接
    /!\[([^\]]*)\]\(([^)]+)\)/, // 图片
  ]

  if (markdownPatterns.some((pattern) => pattern.test(content))) {
    return ContentType.MARKDOWN
  }

  // 检测是否包含 HTML 标签
  const htmlPatterns = [
    /<\/?[a-z][\s\S]*>/i, // HTML标签
    /&[a-z]+;/i, // HTML实体
  ]

  if (htmlPatterns.some((pattern) => pattern.test(content))) {
    return ContentType.HTML
  }

  return ContentType.TEXT
}

/**
 * 渲染文本内容（保持换行）
 * @param content 文本内容
 * @returns 格式化的文本
 */
export function renderTextContent(content: string): string {
  return content
    .replace(/\n/g, '<br/>') // 换行符转为<br>
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;') // tab转为空格
}

/**
 * 渲染 HTML 内容（安全过滤）
 * @param content HTML内容
 * @returns 安全的HTML字符串
 */
export function renderHtmlContent(content: string): string {
  // 使用 DOMPurify 过滤不安全的HTML
  return DOMPurify.sanitize(content, {
    // 允许的标签
    ALLOWED_TAGS: [
      'p',
      'br',
      'div',
      'span',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'strike',
      'del',
      'ins',
      'ul',
      'ol',
      'li',
      'dl',
      'dt',
      'dd',
      'a',
      'img',
      'figure',
      'figcaption',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'code',
      'pre',
      'blockquote',
      'hr',
      'details',
      'summary',
    ],
    // 允许的属性
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'class',
      'id',
      'style',
      'target',
      'rel',
      'width',
      'height',
    ],
    // 允许的协议
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  })
}

/**
 * 渲染 Markdown 内容
 * @param content Markdown内容
 * @returns 渲染后的HTML字符串
 */
export function renderMarkdownContent(content: string): string {
  // 先用 markdown-it 转换为HTML
  const htmlContent = md.render(content)

  // 再用 DOMPurify 过滤确保安全
  return renderHtmlContent(htmlContent)
}

/**
 * 智能渲染内容（自动检测格式）
 * @param content 内容字符串
 * @param contentType 指定的内容类型（可选，不指定则自动检测）
 * @returns 渲染后的HTML字符串
 */
export function renderContent(content: string, contentType?: ContentType): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  const type = contentType || detectContentType(content)

  switch (type) {
    case ContentType.MARKDOWN:
      return renderMarkdownContent(content)
    case ContentType.HTML:
      return renderHtmlContent(content)
    case ContentType.TEXT:
    default:
      return renderTextContent(content)
  }
}

/**
 * 从内容中提取纯文本（用于摘要或搜索）
 * @param content 内容字符串
 * @param maxLength 最大长度
 * @returns 纯文本字符串
 */
export function extractPlainText(content: string, maxLength: number = 200): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  // 移除HTML标签和Markdown语法
  let plainText = content
    .replace(/<[^>]*>/g, '') // 移除HTML标签
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
    .replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
    .replace(/`([^`]+)`/g, '$1') // 移除行内代码标记
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/#{1,6}\s*/g, '') // 移除标题标记
    .replace(/^\* /gm, '') // 移除列表标记
    .replace(/^\d+\. /gm, '') // 移除有序列表标记
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // 移除图片
    .replace(/\s+/g, ' ') // 合并多个空白字符
    .trim()

  // 截断到指定长度
  if (plainText.length > maxLength) {
    plainText = plainText.substring(0, maxLength) + '...'
  }

  return plainText
}
