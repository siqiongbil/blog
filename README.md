# 个人博客系统

这是一个完整的个人博客系统，包含前端、后端、管理后台和移动端管理应用。

## 项目结构

```
newblog/
├── app/                    # 后端API服务 (Node.js + Express)
├── newblog/               # 前端博客网站 (Vue 3 + TypeScript)
├── admin_blog/            # Web管理后台 (Vue 3)
├── admin_flutter_app/     # 移动端管理应用 (Flutter)
├── prerender-server/      # 预渲染服务器 (SEO优化)
├── sql/                   # 数据库脚本
└── start-prerender.*      # 预渲染服务启动脚本
```

## 功能特性

### 前端博客 (newblog/)
- 响应式设计，支持移动端
- 文章浏览、分类、标签系统
- 音乐播放器
- SEO优化
- 多语言支持 (中英文)
- PWA支持

### 后端API (app/)
- RESTful API设计
- JWT身份认证
- 文件上传管理
- 图片处理
- 访问统计
- 系统配置管理

### 管理后台 (admin_blog/)
- 文章管理 (创建、编辑、删除)
- 分类和标签管理
- 文件和图片管理
- 音乐管理
- 系统配置
- 用户管理

### 移动端管理 (admin_flutter_app/)
- 跨平台支持 (iOS/Android/Web)
- 文章快速发布
- 图片上传
- 系统监控

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI库**: Naive UI
- **状态管理**: Pinia
- **路由**: Vue Router
- **样式**: CSS3 + 响应式设计

### 后端
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MySQL
- **认证**: JWT
- **文件处理**: Multer
- **API文档**: Swagger

### 移动端
- **框架**: Flutter
- **状态管理**: Provider
- **网络请求**: Dio
- **本地存储**: SharedPreferences

## 快速开始

### 环境要求
- Node.js >= 16
- MySQL >= 8.0
- Flutter >= 3.0 (可选，仅移动端管理)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd newblog
   ```

2. **设置数据库**
   ```bash
   # 导入数据库结构
   mysql -u root -p < sql/blog.sql
   ```

3. **启动后端服务**
   ```bash
   cd app
   npm install
   npm start
   ```

4. **启动前端博客**
   ```bash
   cd newblog
   npm install
   npm run dev
   ```

5. **启动管理后台**
   ```bash
   cd admin_blog
   npm install
   npm run dev
   ```

6. **启动预渲染服务** (可选，用于SEO)
   ```bash
   cd prerender-server
   npm install
   npm start
   ```

## 配置说明

### 后端配置 (app/config/)
- `db.js`: 数据库连接配置
- `tracking.js`: 访问统计配置

### 前端配置
- `newblog/.env`: 前端环境变量
- `admin_blog/.env`: 管理后台环境变量

### 部署配置
- `app/docker-compose.yml`: Docker部署配置
- `newblog/nginx.conf`: Nginx配置

## API文档

启动后端服务后，访问 `http://localhost:9000/api-docs` 查看完整的API文档。

## 开发指南

### 代码规范
- 使用 ESLint + Prettier 进行代码格式化
- 遵循 TypeScript 严格模式
- 组件命名使用 PascalCase
- 文件命名使用 kebab-case

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。