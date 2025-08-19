#!/bin/bash

# 博客系统Docker部署脚本
echo "🚀 开始部署博客系统..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p uploads logs

# 检查music目录是否存在
if [ ! -d "music" ]; then
    echo "⚠️  music目录不存在，正在创建..."
    mkdir -p music
fi

# 停止已存在的容器
echo "🛑 停止现有容器..."
docker-compose down

# 构建并启动服务
echo "🔧 构建并启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查应用健康状态
echo "🏥 检查应用健康状态..."
if curl -f http://localhost:3000/api/health &> /dev/null; then
    echo "✅ 应用启动成功！"
    echo ""
    echo "🌐 服务端口映射："
    echo "   📱 API服务: http://localhost:3000"
    echo "   📚 API文档: http://localhost:3000/api-docs"
    echo "   🗄️  MySQL: localhost:3307"
    echo ""
    echo "🎵 静态文件路径："
    echo "   音乐文件: ./music -> /app/music"
    echo "   上传文件: ./uploads -> /app/uploads"
    echo ""
    echo "💡 可以在您的外部Nginx中配置反向代理到 localhost:3000"
    echo "💡 启用管理工具: docker-compose --profile tools up -d"
else
    echo "❌ 应用启动失败，请检查日志:"
    docker-compose logs blog_app
fi

echo "🎉 部署完成！" 