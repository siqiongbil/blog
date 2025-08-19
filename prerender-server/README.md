# 自建Prerender服务器

基于 [prerender/prerender](https://github.com/prerender/prerender) 开源项目的自建预渲染服务器，用于Vue项目的SEO优化。

## 功能特性

- 🚀 基于Headless Chrome的预渲染
- 🔒 白名单域名限制
- 💾 内存缓存支持
- 🧹 自动移除脚本标签
- 📊 HTTP状态码控制
- 🐳 Docker容器化部署
- 🔧 自定义插件支持

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制环境变量示例文件：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置您的域名：

```bash
ALLOWED_DOMAINS=siqiongbiluo.love,www.siqiongbiluo.love,admin.siqiongbiluo.love
```

### 3. 启动服务器

#### 开发模式
```bash
npm run dev
```

#### 生产模式
```bash
npm start
```

#### Docker部署
```bash
docker-compose up -d
```

## Nginx集成

在nginx配置中添加以下内容：

```nginx
# 上游服务器配置
upstream prerender {
    server 127.0.0.1:3000;
}

# 在server块中添加
location /prerenderio {
    if ($prerender = 0) {
        return 404;
    }
    
    proxy_pass http://prerender;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Prerender 1;
    proxy_set_header User-Agent $http_user_agent;
    proxy_set_header Accept-Encoding "gzip";
    proxy_redirect off;
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
    
    proxy_hide_header Cache-Control;
    add_header Cache-Control "private,max-age=600,must-revalidate";
    
    rewrite .* /$scheme://$host$request_uri? break;
}
```

## 测试

测试预渲染功能：

```bash
# 测试HTML渲染
curl "http://localhost:3000/render?url=https://siqiongbiluo.love/"

# 测试截图
curl "http://localhost:3000/render?url=https://siqiongbiluo.love/&renderType=png"

# 测试PDF生成
curl "http://localhost:3000/render?url=https://siqiongbiluo.love/&renderType=pdf"
```

## 配置选项

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PRERENDER_PORT` | 3000 | 服务器端口 |
| `CHROME_BIN` | - | Chrome可执行文件路径 |
| `CACHE_MAX_AGE` | 86400 | 缓存过期时间（秒） |
| `ALLOWED_DOMAINS` | - | 允许的域名列表 |

### 插件配置

服务器已预配置以下插件：

- `prerender-remove-script-tags`: 移除脚本标签
- `prerender-http-headers`: HTTP状态码控制
- `prerender-memory-cache`: 内存缓存
- `prerender-whitelist`: 域名白名单

## 监控和日志

### 健康检查

```bash
curl http://localhost:3000/status
```

### 日志查看

```bash
# Docker日志
docker-compose logs -f prerender

# 应用日志
tail -f logs/app.log
```

## 性能优化

1. **内存缓存**: 已启用内存缓存，减少重复渲染
2. **Chrome优化**: 配置了Chrome启动参数以优化性能
3. **超时设置**: 合理的超时配置避免长时间等待
4. **并发控制**: 支持多实例部署

## 故障排除

### 常见问题

1. **Chrome启动失败**
   - 检查Chrome是否正确安装
   - 确认环境变量 `CHROME_BIN` 设置正确

2. **内存不足**
   - 增加服务器内存
   - 调整Chrome启动参数

3. **渲染超时**
   - 检查网络连接
   - 调整超时配置

### 调试模式

启用详细日志：

```bash
DEBUG=prerender:* npm start
```

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 参考

- [prerender/prerender](https://github.com/prerender/prerender) - 原始项目
- [prerender.io](https://prerender.io/) - 官方服务
- [Nginx Prerender 中间件](https://github.com/prerender/nginx) - Nginx集成
