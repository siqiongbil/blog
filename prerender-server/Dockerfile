FROM node:18-alpine

# 使用更快的镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装Chrome依赖和必要工具（减少不必要的包）
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    curl \
    dumb-init

# 设置Chrome环境变量
ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/ \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 创建应用目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 使用npm镜像加速安装
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci --only=production && \
    npm cache clean --force

# 复制应用代码
COPY . .

# 创建日志目录
RUN mkdir -p /app/logs

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S prerender -u 1001 -G nodejs

# 更改文件权限
RUN chown -R prerender:nodejs /app

# 切换到非root用户
USER prerender

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/status || exit 1

# 使用dumb-init作为PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["npm", "start"]
