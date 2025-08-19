# 博客管理后台 (Admin Blog)

一个基于 Vue 3 + TypeScript + Element Plus 的现代化博客管理系统，提供完整的内容管理、数据分析和系统配置功能。

## ✨ 功能特性

### 📝 内容管理
- **文章管理** - 创建、编辑、删除文章，支持 Markdown 编辑器
- **分类管理** - 文章分类的增删改查
- **标签管理** - 标签系统管理
- **图片管理** - 图片上传、预览、删除功能
- **文件管理** - 文件上传和管理
- **音乐管理** - 音乐文件管理和播放

### 📊 数据分析
- **仪表板** - 系统概览和关键指标
- **访问统计** - 文章访问量、用户行为分析
- **数据可视化** - 基于 ECharts 的图表展示

### ⚙️ 系统管理
- **用户认证** - 安全的登录系统
- **系统设置** - 博客配置管理
- **数据清理** - 数据维护工具
- **IndexNow** - 搜索引擎索引管理

### 🎨 用户体验
- **响应式设计** - 适配各种屏幕尺寸
- **暗色主题** - 支持明暗主题切换
- **性能优化** - 代码分割、懒加载
- **国际化** - 多语言支持准备

## 🛠️ 技术栈

### 前端框架
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 快速的前端构建工具

### UI 组件库
- **Element Plus** - Vue 3 组件库
- **Element Plus Icons** - 图标库

### 状态管理与路由
- **Pinia** - Vue 3 状态管理
- **Vue Router** - 官方路由管理器

### 工具库
- **Axios** - HTTP 客户端
- **ECharts** - 数据可视化图表库
- **Marked** - Markdown 解析器
- **Highlight.js** - 代码高亮
- **@vueuse/core** - Vue 组合式 API 工具集

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Vue DevTools** - Vue 开发者工具

## 📁 项目结构

```
admin_blog/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 资源文件
│   │   ├── base.css       # 基础样式
│   │   ├── main.css       # 主样式
│   │   └── *.svg          # SVG 图标
│   ├── components/        # 公共组件
│   │   ├── HelloWorld.vue
│   │   ├── ImagePicker.vue      # 图片选择器
│   │   ├── IndexNowSettings.vue # IndexNow 设置
│   │   ├── MarkdownEditor.vue   # Markdown 编辑器
│   │   ├── icons/              # 图标组件
│   │   └── layout/             # 布局组件
│   ├── router/            # 路由配置
│   ├── stores/            # Pinia 状态管理
│   │   ├── auth.ts        # 认证状态
│   │   └── counter.ts     # 计数器状态
│   ├── utils/             # 工具函数
│   │   ├── api.ts         # API 接口
│   │   ├── performance.ts # 性能监控
│   │   └── performancePlugin.ts
│   ├── views/             # 页面组件
│   │   ├── DashboardView.vue    # 仪表板
│   │   ├── ArticleListView.vue  # 文章列表
│   │   ├── ArticleEditView.vue  # 文章编辑
│   │   ├── CategoryView.vue     # 分类管理
│   │   ├── TagView.vue          # 标签管理
│   │   ├── ImageView.vue        # 图片管理
│   │   ├── FileView.vue         # 文件管理
│   │   ├── MusicView.vue        # 音乐管理
│   │   ├── AnalyticsView.vue    # 数据分析
│   │   ├── SettingsView.vue     # 系统设置
│   │   ├── DataCleanupView.vue  # 数据清理
│   │   └── LoginView.vue        # 登录页面
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── package.json           # 项目配置
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
└── README.md              # 项目文档
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

### 代码检查
```bash
npm run lint
```

### 代码格式化
```bash
npm run format
```

## 🔧 配置说明

### 环境变量
创建 `.env` 文件配置环境变量：
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_TITLE=博客管理后台
```

### API 配置
在 `src/utils/api.ts` 中配置 API 基础地址和请求拦截器。

### 路由配置
在 `src/router/index.ts` 中配置页面路由和权限控制。

## 📱 响应式设计

项目采用响应式设计，支持以下断点：
- **手机端**: < 768px
- **平板端**: 768px - 1024px  
- **桌面端**: > 1024px

## 🎯 开发指南

### 组件开发
- 使用 Vue 3 Composition API
- 遵循 TypeScript 类型约束
- 组件命名采用 PascalCase
- 使用 Element Plus 组件库

### 状态管理
- 使用 Pinia 进行状态管理
- 按功能模块划分 store
- 支持 TypeScript 类型推导

### 样式规范
- 使用 CSS 变量定义主题色彩
- 遵循 BEM 命名规范
- 支持暗色主题

### API 接口
- 统一使用 Axios 进行 HTTP 请求
- 实现请求/响应拦截器
- 错误处理和加载状态管理

## 🔒 安全特性

- **身份认证** - JWT Token 认证
- **权限控制** - 基于角色的访问控制
- **XSS 防护** - 输入内容过滤和转义
- **CSRF 防护** - 跨站请求伪造防护

## 📈 性能优化

- **代码分割** - 路由级别的代码分割
- **懒加载** - 组件和图片懒加载
- **缓存策略** - HTTP 缓存和本地存储
- **打包优化** - Vite 构建优化

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 编写单元测试
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [Vue 3 文档](https://vuejs.org/)
- [Element Plus 文档](https://element-plus.org/)
- [Vite 文档](https://vitejs.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Pinia 文档](https://pinia.vuejs.org/)

## 📞 支持

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 加入讨论群

---

**Happy Coding! 🎉**
