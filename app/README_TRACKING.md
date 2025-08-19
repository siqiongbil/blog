# 访问记录跟踪功能说明

## 功能概述

本系统的 `getArticleInfo` 方法已经支持跳过特定域名的访问记录，避免在访问统计中留下不必要的痕迹。

## 实现原理

### 1. 跳过访问记录的条件

系统会检查以下条件来决定是否跳过访问记录：

- **域名检查**：检查请求的 `Host` 头和 `Referer` 头
- **User-Agent检查**：识别爬虫、机器人和开发工具
- **IP地址检查**：过滤本地和内网IP地址

### 2. 配置文件

配置文件位于 `app/config/tracking.js`，包含三个主要配置：

```javascript
// 需要跳过的域名
SKIP_TRACKING_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'admin.example.com',    // 管理后台域名
  'preview.example.com',  // 预览域名
  'test.example.com',     // 测试环境域名
]

// 需要跳过的User-Agent模式
SKIP_TRACKING_USER_AGENTS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i,
  /curl/i, /wget/i, /postman/i, /insomnia/i,
  // ... 更多爬虫和工具
]

// 需要跳过的IP地址
SKIP_TRACKING_IPS = [
  '127.0.0.1',
  '::1',
  // 可以添加内网IP范围
]
```

### 3. 工作流程

1. 当用户访问文章时，`getArticleInfo` 方法会调用 `shouldSkipVisitTracking(req)` 检查是否需要跳过访问记录
2. 如果匹配跳过条件，则：
   - 不记录详细访问信息到 `article_visits` 表
   - 仍然增加文章的浏览次数（保持用户体验）
   - 在控制台输出跳过原因（便于调试）
3. 如果不匹配跳过条件，则正常记录访问信息

## 使用场景

### 1. 管理后台访问
当管理员通过管理后台预览文章时，不会在访问统计中留下记录。

### 2. 开发和测试
在本地开发或测试环境中访问文章时，不会污染生产环境的访问数据。

### 3. 爬虫和机器人
自动过滤搜索引擎爬虫、社交媒体机器人等的访问。

### 4. 开发工具
过滤 Postman、curl、wget 等开发工具的请求。

## 配置方法

### 1. 添加需要跳过的域名

编辑 `app/config/tracking.js` 文件，在 `SKIP_TRACKING_DOMAINS` 数组中添加域名：

```javascript
export const SKIP_TRACKING_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'your-admin-domain.com',  // 添加你的管理域名
  'staging.your-site.com',  // 添加测试环境域名
];
```

### 2. 添加需要跳过的User-Agent

在 `SKIP_TRACKING_USER_AGENTS` 数组中添加正则表达式：

```javascript
export const SKIP_TRACKING_USER_AGENTS = [
  /your-custom-bot/i,  // 添加自定义机器人
  /your-tool/i,        // 添加自定义工具
];
```

### 3. 添加需要跳过的IP地址

在 `SKIP_TRACKING_IPS` 数组中添加IP地址或IP段：

```javascript
export const SKIP_TRACKING_IPS = [
  '192.168.1.100',     // 特定IP
  '192.168.',          // IP段
  '10.0.0.',           // 内网段
];
```

## 注意事项

1. **浏览次数仍会增加**：即使跳过访问记录，文章的浏览次数仍会正常增加，确保用户体验不受影响。

2. **调试信息**：当跳过访问记录时，系统会在控制台输出相应的日志信息，便于调试和监控。

3. **性能影响**：跳过访问记录的检查逻辑非常轻量，对系统性能影响微乎其微。

4. **配置热更新**：修改配置文件后需要重启应用才能生效。

## 验证方法

1. 使用配置中的域名访问文章
2. 检查数据库中的 `article_visits` 表，确认没有相应的访问记录
3. 确认文章的 `view_count` 仍然正常增加
4. 查看控制台日志，确认输出了跳过访问记录的信息