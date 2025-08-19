/**
 * SEO 工具函数
 * 用于动态更新页面的标题、描述和关键字
 */

// 默认的SEO信息
const DEFAULT_SEO = {
  title: '首页',
  description: '一个现代化的博客系统',
  keywords: '博客,文章,技术,分享',
}

/**
 * 立即更新页面标题（同步操作）
 * 用于路由跳转时快速更新标题，避免短暂的默认标题显示
 * @param title 页面标题
 */
export function setTitleImmediate(title: string) {
  if (typeof document !== 'undefined' && title) {
    document.title = title
  }
}

/**
 * 更新页面标题
 * @param title 页面标题
 */
export function updateTitle(title: string) {
  if (typeof document !== 'undefined') {
    document.title = title
  }
}

/**
 * 更新页面描述
 * @param description 页面描述
 */
export function updateDescription(description: string) {
  if (typeof document !== 'undefined') {
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', description)
  }
}

/**
 * 更新页面关键字
 * @param keywords 页面关键字
 */
export function updateKeywords(keywords: string) {
  if (typeof document !== 'undefined') {
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.setAttribute('name', 'keywords')
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.setAttribute('content', keywords)
  }
}

/**
 * 更新Open Graph标题
 * @param title OG标题
 */
export function updateOgTitle(title: string) {
  if (typeof document !== 'undefined') {
    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (!ogTitle) {
      ogTitle = document.createElement('meta')
      ogTitle.setAttribute('property', 'og:title')
      document.head.appendChild(ogTitle)
    }
    ogTitle.setAttribute('content', title)
  }
}

/**
 * 更新Open Graph描述
 * @param description OG描述
 */
export function updateOgDescription(description: string) {
  if (typeof document !== 'undefined') {
    let ogDescription = document.querySelector('meta[property="og:description"]')
    if (!ogDescription) {
      ogDescription = document.createElement('meta')
      ogDescription.setAttribute('property', 'og:description')
      document.head.appendChild(ogDescription)
    }
    ogDescription.setAttribute('content', description)
  }
}

/**
 * 批量更新SEO信息
 * @param seoData SEO数据
 */
export interface SEOData {
  title?: string
  description?: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
}

export function updateSEO(seoData: SEOData) {
  const {
    title = DEFAULT_SEO.title,
    description = DEFAULT_SEO.description,
    keywords = DEFAULT_SEO.keywords,
    ogTitle,
    ogDescription,
  } = seoData

  // 立即更新标题
  setTitleImmediate(title)

  updateDescription(description)
  updateKeywords(keywords)

  if (ogTitle) {
    updateOgTitle(ogTitle)
  } else {
    updateOgTitle(title)
  }

  if (ogDescription) {
    updateOgDescription(ogDescription)
  } else {
    updateOgDescription(description)
  }
}

/**
 * 根据分类信息生成SEO数据
 * @param categoryName 分类名称
 * @param categoryDescription 分类描述
 * @param categorySlug 分类slug
 * @returns SEO数据
 */
export function generateCategorySEO(
  categoryName: string,
  categoryDescription?: string,
  categorySlug?: string,
): SEOData {
  const title = `${categoryName} - 文章分类`
  const description = categoryDescription || `浏览${categoryName}分类下的所有文章`
  const keywords = [categoryName, '文章', '分类', '博客', categorySlug, '内容']
    .filter(Boolean)
    .join(',')

  return {
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
  }
}

/**
 * 根据标签信息生成SEO数据
 * @param tagName 标签名称
 * @param tagDescription 标签描述
 * @returns SEO数据
 */
export function generateTagSEO(tagName: string, tagDescription?: string): SEOData {
  const title = `${tagName} - 标签文章`
  const description = tagDescription || `浏览与${tagName}标签相关的所有文章`
  const keywords = [tagName, '标签', '文章', '博客', '内容'].filter(Boolean).join(',')

  return {
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
  }
}

/**
 * 根据文章信息生成SEO数据
 * @param articleTitle 文章标题
 * @param articleSummary 文章摘要
 * @param articleTags 文章标签
 * @returns SEO数据
 */
export function generateArticleSEO(
  articleTitle: string,
  articleSummary?: string,
  articleTags?: string[],
): SEOData {
  const title = `${articleTitle} - 文章详情`
  const description = articleSummary || `阅读文章：${articleTitle}`
  const keywords = [articleTitle, '文章', '详情', '博客', ...(articleTags || [])]
    .filter(Boolean)
    .join(',')

  return {
    title,
    description,
    keywords,
    ogTitle: articleTitle,
    ogDescription: description,
  }
}

/**
 * 重置为默认SEO信息
 */
export function resetSEO() {
  updateSEO(DEFAULT_SEO)
}
