# 贡献指南

感谢您对本项目的关注！我们欢迎任何形式的贡献，包括但不限于：

- 报告问题和建议
- 提交代码修复
- 添加新功能
- 改进文档
- 优化性能

## 开始之前

在开始贡献之前，请确保您已经：

1. 阅读了项目的 [README.md](README.md)
2. 了解了项目的技术栈和架构
3. 设置了本地开发环境

## 开发环境设置

### 环境要求
- Node.js >= 16
- MySQL >= 8.0
- Git
- Flutter >= 3.0 (可选，仅移动端开发)

### 安装步骤

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 fork 项目到您的账户
   git clone https://github.com/YOUR_USERNAME/newblog.git
   cd newblog
   ```

2. **设置上游仓库**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/newblog.git
   ```

3. **安装依赖**
   ```bash
   # 后端
   cd app && npm install
   
   # 前端博客
   cd ../newblog && npm install
   
   # 管理后台
   cd ../admin_blog && npm install
   
   # 预渲染服务
   cd ../prerender-server && npm install
   ```

4. **配置数据库**
   ```bash
   mysql -u root -p < sql/blog.sql
   ```

5. **启动开发服务**
   ```bash
   # 在不同终端中启动各个服务
   cd app && npm run dev
   cd newblog && npm run dev
   cd admin_blog && npm run dev
   ```

## 贡献流程

### 1. 创建分支

```bash
# 确保主分支是最新的
git checkout main
git pull upstream main

# 创建新的功能分支
git checkout -b feature/your-feature-name
# 或者修复分支
git checkout -b fix/your-fix-name
```

### 2. 开发和测试

- 编写代码时请遵循项目的代码规范
- 添加必要的测试用例
- 确保所有测试通过
- 运行代码格式化工具

```bash
# 运行测试
npm test

# 代码格式化
npm run lint
npm run format
```

### 3. 提交更改

```bash
# 添加更改的文件
git add .

# 提交更改（请使用有意义的提交信息）
git commit -m "feat: add new feature description"
```

### 4. 推送分支

```bash
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

1. 在 GitHub 上打开您的 fork
2. 点击 "New Pull Request"
3. 选择您的分支和目标分支
4. 填写 PR 描述模板
5. 提交 Pull Request

## 代码规范

### JavaScript/TypeScript
- 使用 ESLint 和 Prettier 进行代码格式化
- 遵循 TypeScript 严格模式
- 使用有意义的变量和函数名
- 添加必要的注释

### Vue 组件
- 组件名使用 PascalCase
- 文件名使用 kebab-case
- 使用 Composition API
- 合理使用 TypeScript 类型定义

### CSS
- 使用 BEM 命名规范
- 优先使用 CSS 变量
- 确保响应式设计

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型包括：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(blog): add article search functionality

fix(api): resolve user authentication issue

docs: update installation guide
```

## Pull Request 指南

### PR 描述模板

```markdown
## 更改类型
- [ ] 新功能
- [ ] Bug修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 其他

## 更改描述
简要描述您的更改内容和原因。

## 测试
- [ ] 已添加测试用例
- [ ] 所有测试通过
- [ ] 手动测试通过

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 已更新相关文档
- [ ] 已更新 CHANGELOG.md
- [ ] 没有引入破坏性更改
```

### 审查流程

1. 自动化检查（CI/CD）
2. 代码审查
3. 测试验证
4. 合并到主分支

## 报告问题

如果您发现了问题，请：

1. 检查是否已有相关的 issue
2. 使用 issue 模板创建新的问题报告
3. 提供详细的重现步骤
4. 包含相关的错误信息和截图

## 功能请求

如果您有新功能的想法：

1. 先创建一个 issue 讨论
2. 描述功能的用途和价值
3. 提供可能的实现方案
4. 等待社区反馈

## 文档贡献

文档同样重要！您可以：

- 修复文档中的错误
- 改进现有文档的清晰度
- 添加缺失的文档
- 翻译文档到其他语言

## 社区准则

- 保持友善和专业
- 尊重不同的观点和经验水平
- 提供建设性的反馈
- 帮助新贡献者

## 获得帮助

如果您需要帮助：

- 查看项目文档
- 搜索现有的 issues
- 创建新的 issue 提问
- 联系项目维护者

## 许可证

通过贡献代码，您同意您的贡献将在 MIT 许可证下发布。

---

再次感谢您的贡献！🎉