#!/bin/bash

# Prerender服务器构建脚本
# 提供不同的构建选项来优化构建速度

echo "🚀 Prerender服务器构建脚本"
echo "================================"

# 检查参数
BUILD_TYPE=${1:-standard}
REGISTRY=${2:-default}

echo "📦 构建类型: $BUILD_TYPE"
echo "🌐 镜像源: $REGISTRY"

case $BUILD_TYPE in
    "fast")
        echo "⚡ 快速构建模式"
        echo "使用阿里云镜像源和npm镜像"
        
        # 设置Docker构建参数
        export DOCKER_BUILDKIT=1
        export BUILDKIT_PROGRESS=plain
        
        docker-compose build --no-cache --build-arg NODE_ENV=production prerender
        ;;
        
    "lightweight")
        echo "🪶 轻量级构建模式"
        echo "使用多阶段构建减少镜像大小"
        
        # 使用轻量级Dockerfile
        docker build -f Dockerfile.lightweight -t prerender-server:lightweight .
        ;;
        
    "standard"|*)
        echo "📋 标准构建模式"
        echo "使用默认配置"
        
        docker-compose build prerender
        ;;
esac

if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo ""
    echo "📝 使用说明:"
    echo "   - 启动服务: docker-compose up -d"
    echo "   - 查看日志: docker-compose logs -f prerender"
    echo "   - 停止服务: docker-compose down"
    echo ""
    echo "🔍 镜像信息:"
    docker images | grep prerender
else
    echo "❌ 构建失败！"
    echo "请检查错误信息并重试"
    exit 1
fi
