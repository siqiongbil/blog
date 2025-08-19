import { createI18n } from 'vue-i18n'

// 中文语言包
const zh = {
  common: {
    loading: '加载中...',
    refresh: '刷新',
    language: '语言',
    description: '使用 Vue.js 和 TypeScript 构建的现代化 Web 应用，展示最佳实践和开发技巧',
    keywords: 'Vue.js, TypeScript, TSX, 前端开发, Web开发, 单页应用',
  },
  nav: {
    home: '似琼碧落',
    articles: '文章',
    tags: '标签',
    about: '关于',
    posts: '文章列表',
    playground: '代码运行',
    threeDemo: 'Three.js演示',
    echartsDemo: 'ECharts图表',
  },
  footer: {
    copyright: '© 2025 似琼碧落',
  },
  blogTitle: '似琼碧落',
  home: {
    description:
      '似琼碧落 - 使用 Vue.js 和 TypeScript 构建的现代化博客系统，分享技术文章与开发心得',
    keywords: '似琼碧落, Vue.js, TypeScript, TSX, 前端开发, Web开发, 博客, 技术分享, 单页应用',
    searchPlaceholder: '搜索你感兴趣的文章...',
    searchButton: '搜索',
    clickToView: '点击查看相关文章',
    options: {},
  },
  about: {
    description: '了解我们的团队、技术栈和开发理念，探索 Vue.js 和 TypeScript 的最佳实践',
    keywords: '关于我们, 团队介绍, Vue.js开发, TypeScript开发, 技术栈, 开发理念',
  },
  playground: {
    description: '在线编写和运行 JavaScript 代码，支持 ES6+ 语法，实时查看执行结果',
    keywords: '在线代码运行, JavaScript, ES6+, 代码编辑器, 实时执行',
  },
  echarts: {
    title: '周数据统计',
    lineChart: '折线图',
    barChart: '柱状图',
    pieChart: '饼图',
    refreshData: '刷新数据',
    value: '数值',
    description: '使用 ECharts 创建的数据可视化演示，支持多种图表类型和交互功能',
    keywords: 'ECharts, 数据可视化, 图表, 折线图, 柱状图, 饼图, 交互式图表',
  },
  three: {
    title: 'Three.js 演示',
    uploadModel: '上传模型',
    scale: '缩放',
    position: '位置',
    rotation: '旋转',
    x: 'X',
    y: 'Y',
    z: 'Z',
    description: '使用 Three.js 创建的 3D 场景演示，支持模型加载、变换和交互',
    keywords: 'Three.js, 3D, WebGL, 场景演示, 模型加载, 3D 变换',
  },
  error: {
    pageNotFound: '页面未找到',
    pageNotFoundDesc: '页面不存在，不如来玩个贪吃蛇吧！',
    backToHome: '返回首页',
    goBack: '返回上一页',
  },
  game: {
    snake: {
      score: '得分',
      gameOver: '游戏结束!',
      start: '开始游戏',
      restart: '重新开始',
      pause: '暂停',
      continue: '继续',
      instructions1: '使用方向键控制蛇的移动',
      instructions2: '空格键暂停/继续游戏',
    },
  },
  posts: {
    title: '文章列表',
    backToHome: '返回首页',
    searchResult: '搜索结果',
    category: '分类',
    tag: '标签',
    noContent: '暂无内容',
    description: '浏览所有文章和分类内容',
    keywords: '文章,博客,分类,内容',
    // SEO相关
    searchResultTitle: '搜索结果',
    searchDescription: '搜索包含"{keyword}"的文章',
    searchKeywords: '{keyword},搜索,文章,博客,内容',
    tagFilterTitle: '标签筛选',
    tagFilterDescription: '在{category}分类下浏览与{tag}标签相关的文章',
    tagFilterKeywords: '{category},{tag},标签,分类,文章,博客,内容',
    // 错误信息
    fetchTagsError: '获取标签失败',
    fetchCategoriesError: '获取分类失败',
    fetchPostsError: '获取文章失败',
    // 文章状态
    status: {
      published: '已发布',
      draft: '草稿',
      deleted: '已删除',
    },
    // 标签筛选
    tagFilter: '按标签筛选：',
    tagFilterInCategory: '在"{category}"分类下按标签筛选：',
    all: '全部',
    noPosts: '暂无文章',
    publishTime: '发布时间',
  },
  article: {
    title: '文章详情',
    contentFormat: '内容格式',
    wordCount: '字数',
    characters: '字符',
    description: '查看文章详细内容',
    keywords: '文章,详情,内容',
  },
  codeRunner: {
    runResult: '运行结果',
    runCode: '运行代码',
    running: '运行中...',
    error: '运行出错',
  },
  musicPlayer: {
    open: '打开音乐播放器',
    close: '关闭音乐播放器',
  },
  contentType: {
    text: '纯文本',
    markdown: 'Markdown',
    html: 'HTML',
  },
}

// 英文语言包
const en = {
  common: {
    loading: 'Loading...',
    refresh: 'Refresh',
    language: 'Language',
    description:
      'A modern web application built with Vue.js and TypeScript, showcasing best practices and development tips',
    keywords:
      'Vue.js, TypeScript, TSX, Frontend Development, Web Development, Single Page Application',
  },
  nav: {
    home: 'siqiongbiluo.love',
    articles: 'Articles',
    tags: 'Tags',
    about: 'About',
    posts: 'Posts',
    playground: 'Playground',
    threeDemo: 'Three.js Demo',
    echartsDemo: 'ECharts Demo',
  },
  footer: {
    about: 'About Us',
    contact: 'Contact',
    terms: 'Terms',
    privacy: 'Privacy Policy',
    copyright: '© 2025 siqiongbiluo.love',
  },
  blogTitle: 'siqiongbiluo.love',
  home: {
    description:
      'siqiongbiluo.love - A modern blog system built with Vue.js and TypeScript, sharing technical articles and development insights',
    keywords:
      'siqiongbiluo.love, Vue.js, TypeScript, TSX, Frontend Development, Web Development, Blog, Tech Sharing, Single Page Application',
    searchPlaceholder: 'Search for articles that interest you...',
    searchButton: 'Search',
    clickToView: 'Click to view related articles',
  },
  about: {
    description:
      'Learn about our team, tech stack, and development philosophy, exploring Vue.js and TypeScript best practices',
    keywords:
      'About Us, Team Introduction, Vue.js Development, TypeScript Development, Tech Stack, Development Philosophy',
  },
  playground: {
    description:
      'Write and run JavaScript code online with ES6+ syntax support and real-time execution results',
    keywords: 'Online Code Runner, JavaScript, ES6+, Code Editor, Real-time Execution',
  },
  echarts: {
    title: 'Weekly Statistics',
    lineChart: 'Line Chart',
    barChart: 'Bar Chart',
    pieChart: 'Pie Chart',
    refreshData: 'Refresh Data',
    value: 'Value',
    description:
      'Data visualization demo using ECharts, supporting multiple chart types and interactive features',
    keywords:
      'ECharts, Data Visualization, Charts, Line Chart, Bar Chart, Pie Chart, Interactive Charts',
  },
  three: {
    title: 'Three.js Demo',
    uploadModel: 'Upload Model',
    scale: 'Scale',
    position: 'Position',
    rotation: 'Rotation',
    x: 'X',
    y: 'Y',
    z: 'Z',
    description:
      '3D scene demonstration using Three.js, supporting model loading, transformation, and interaction',
    keywords: 'Three.js, 3D, WebGL, Scene Demo, Model Loading, 3D Transformation',
  },
  error: {
    pageNotFound: 'Page Not Found',
    pageNotFoundDesc: 'Page not found, why not play Snake instead!',
    backToHome: 'Back to Home',
    goBack: 'Go Back',
  },
  game: {
    snake: {
      score: 'Score',
      gameOver: 'Game Over!',
      start: 'Start Game',
      restart: 'Restart',
      pause: 'Pause',
      continue: 'Continue',
      instructions1: 'Use arrow keys to control the snake',
      instructions2: 'Press spacebar to pause/continue',
    },
  },
  posts: {
    title: 'Posts',
    backToHome: 'Back to Home',
    searchResult: 'Search Results',
    category: 'Category',
    tag: 'Tag',
    noContent: 'No content available',
    description: 'Browse all articles and category content',
    keywords: 'articles,blog,categories,content',
    // SEO related
    searchResultTitle: 'Search Results',
    searchDescription: 'Search for articles containing "{keyword}"',
    searchKeywords: '{keyword},search,articles,blog,content',
    tagFilterTitle: 'Tag Filter',
    tagFilterDescription: 'Browse articles tagged with {tag} in {category} category',
    tagFilterKeywords: '{category},{tag},tag,category,articles,blog,content',
    // Error messages
    fetchTagsError: 'Failed to fetch tags',
    fetchCategoriesError: 'Failed to fetch categories',
    fetchPostsError: 'Failed to fetch posts',
    // Post status
    status: {
      published: 'Published',
      draft: 'Draft',
      deleted: 'Deleted',
    },
    // Tag filter
    tagFilter: 'Filter by tags:',
    tagFilterInCategory: 'Filter by tags in "{category}" category:',
    all: 'All',
    noPosts: 'No posts available',
    publishTime: 'Published',
  },
  article: {
    title: 'Article Details',
    contentFormat: 'Content Format',
    wordCount: 'Word Count',
    characters: 'characters',
    description: 'View detailed article content',
    keywords: 'article,details,content',
  },
  codeRunner: {
    runResult: 'Run Result',
    runCode: 'Run Code',
    running: 'Running...',
    error: 'Runtime Error',
  },
  musicPlayer: {
    open: 'Open Music Player',
    close: 'Close Music Player',
  },
  contentType: {
    text: 'Plain Text',
    markdown: 'Markdown',
    html: 'HTML',
  },
}

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: localStorage.getItem('language') || 'zh', // 默认语言
  fallbackLocale: 'en', // 备用语言
  messages: {
    zh,
    en,
  },
})

export default i18n
