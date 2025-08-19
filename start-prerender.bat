@echo off
chcp 65001 >nul

echo 🚀 启动Prerender服务器...

REM 检查Docker是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker未运行，请先启动Docker
    pause
    exit /b 1
)

REM 进入prerender-server目录
cd prerender-server

REM 检查是否存在docker-compose.yml
if not exist "docker-compose.yml" (
    echo ❌ 未找到docker-compose.yml文件
    pause
    exit /b 1
)

REM 构建并启动prerender服务
echo 📦 构建Prerender Docker镜像...
docker-compose build

echo 🔧 启动Prerender服务...
docker-compose up -d

REM 等待服务启动
echo ⏳ 等待Prerender服务启动...
timeout /t 10 /nobreak >nul

REM 检查服务状态
curl -f http://localhost:3000/status >nul 2>&1
if errorlevel 1 (
    echo ❌ Prerender服务启动失败
    echo 📋 查看日志: docker-compose logs prerender
    pause
    exit /b 1
) else (
    echo ✅ Prerender服务启动成功！
    echo 📍 服务地址: http://localhost:3000
    echo 🔍 健康检查: http://localhost:3000/status
)

echo.
echo 🎯 Prerender配置信息:
echo    - 支持的搜索引擎: Google, Bing, Baidu, Yandex, Sogou, 360
echo    - 社交媒体爬虫: Facebook, Twitter, LinkedIn, WhatsApp, Telegram
echo    - 缓存策略: 根据爬虫类型动态调整
echo    - 白名单域名: siqiongbiluo.love, admin.siqiongbiluo.love, demo.siqiongbiluo.love
echo.
echo 📝 使用说明:
echo    - 停止服务: docker-compose down
echo    - 查看日志: docker-compose logs -f prerender
echo    - 重启服务: docker-compose restart prerender
echo    - 更新配置: docker-compose up -d --build

pause
