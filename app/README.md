# 博客系统后端 API 服务

这是一个基于 Node.js 和 Express 构建的现代化博客系统后端服务，提供完整的内容管理、用户认证、文件上传、访问统计等功能。

## 🚀 主要特性

- **文章管理**：支持文章的增删改查、分类管理、标签系统
- **用户系统**：用户注册、登录、权限管理
- **文件管理**：图片上传、音乐文件管理、文件存储
- **访问统计**：详细的访问记录和数据分析
- **SEO优化**：sitemap生成、IndexNow支持
- **系统配置**：灵活的系统参数配置
- **安全防护**：JWT认证、访问控制、数据验证

## 📁 项目结构

```
app/
├── config/           # 配置文件
│   ├── db.js        # 数据库配置
│   └── tracking.js  # 访问跟踪配置
├── controllers/     # 控制器层
├── dao/            # 数据访问层
├── middleware/     # 中间件
├── routes/         # 路由定义
├── utils/          # 工具函数
├── scripts/        # 脚本文件
├── sql/           # 数据库脚本
├── files/         # 文件存储目录
├── image/         # 图片存储目录
├── music/         # 音乐文件目录
└── index.js       # 应用入口文件
```

## 🛠️ 技术栈

- **运行环境**：Node.js
- **Web框架**：Express.js
- **数据库**：MySQL
- **认证**：JWT (JSON Web Token)
- **文件上传**：Multer
- **密码加密**：bcryptjs
- **跨域处理**：CORS

## 📦 安装和运行

### 环境要求

- Node.js >= 14.0.0
- MySQL >= 5.7
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

1. 创建 `.env` 文件并配置数据库连接：

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=blog_db
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

2. 导入数据库结构：

```bash
mysql -u username -p database_name < sql/blog.sql
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:3000` 启动。

## 🔧 API 接口

### 文章相关

- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:id` - 获取文章详情
- `POST /api/articles` - 创建文章（需要认证）
- `PUT /api/articles/:id` - 更新文章（需要认证）
- `DELETE /api/articles/:id` - 删除文章（需要认证）

### 用户相关

- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息（需要认证）

### 文件管理

- `POST /api/images/upload` - 图片上传
- `POST /api/files/upload` - 文件上传
- `POST /api/music/upload` - 音乐上传

### 访问统计

- `GET /api/articles/:id/visit-stats` - 获取文章访问统计
- `GET /api/analytics/trends` - 获取访问趋势
- `GET /api/analytics/hot-articles` - 获取热门文章

## 🔒 访问控制

系统支持智能访问记录过滤，可以跳过特定域名、爬虫和开发工具的访问记录：

- **域名过滤**：管理后台、测试环境等域名
- **爬虫检测**：自动识别搜索引擎爬虫
- **开发工具**：过滤 Postman、curl 等工具请求

详细配置请参考 [访问记录跟踪功能说明](./README_TRACKING.md)。

## 🐳 Docker 部署

项目支持 Docker 容器化部署：

```bash
# 构建镜像
docker build -t blog-api .

# 运行容器
docker-compose up -d
```

## 📊 数据库设计

主要数据表：

- `articles` - 文章表
- `categories` - 分类表
- `tags` - 标签表
- `users` - 用户表
- `article_visits` - 访问记录表
- `system_config` - 系统配置表

## 🔧 开发工具

### 脚本命令

- `scripts/auto-cleanup.js` - 自动清理过期数据
- `scripts/fix-image-urls.js` - 修复图片URL
- `utils/initAdmin.js` - 初始化管理员账户

### 实用工具

- `utils/visitUtils.js` - 访问数据处理工具
- `utils/ipLocationService.js` - IP地理位置服务
- `utils/musicImporter.js` - 音乐文件导入工具

## 🚀 性能优化

- **数据库索引**：关键字段建立索引
- **缓存策略**：静态文件缓存
- **压缩传输**：gzip压缩
- **访问控制**：智能过滤无效请求

## 🛡️ 安全特性

- **JWT认证**：安全的用户认证机制
- **密码加密**：bcrypt加密存储
- **输入验证**：防止SQL注入和XSS攻击
- **访问限制**：基于角色的权限控制

## 📝 日志记录

系统提供详细的日志记录：

- 访问日志
- 错误日志
- 操作日志
- 性能监控

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 项目讨论区

---

**注意**：请确保在生产环境中正确配置环境变量和安全设置。