#!/bin/bash

# 启动脚本 - 确保正确的启动顺序

echo "🚀 启动博客应用..."

# 设置错误时退出
set -e

echo "⏳ 等待数据库连接..."
# 等待数据库准备就绪
node scripts/wait-for-db.js

echo "✅ 数据库连接成功，启动应用..."
# 启动主应用
node index.js 