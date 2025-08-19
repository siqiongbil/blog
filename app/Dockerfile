# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装应用依赖
RUN npm install --production && npm cache clean --force

# 复制应用源码（排除不需要的文件）
COPY config/ ./config/
COPY controllers/ ./controllers/
COPY dao/ ./dao/
COPY middleware/ ./middleware/
COPY routes/ ./routes/
COPY utils/ ./utils/
COPY scripts/ ./scripts/
COPY image/ ./image/
COPY files/ ./files/
COPY music/ ./music/
COPY sql/ ./sql/
COPY index.js ./
COPY swagger*.json ./

# 创建必要的目录并设置脚本权限
RUN mkdir -p uploads logs \
    && chmod +x scripts/start.sh \
    && chown -R node:node /app

# 切换到非root用户
USER node

# 暴露端口
EXPOSE ${PORT:-9000}

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-9000}/api/health || exit 1

# 启动应用
CMD ["node", "index.js"] 