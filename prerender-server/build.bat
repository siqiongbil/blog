@echo off
chcp 65001 >nul

echo 🚀 Prerender服务器构建脚本
echo ================================

REM 检查参数
set BUILD_TYPE=%1
if "%BUILD_TYPE%"=="" set BUILD_TYPE=standard

echo 📦 构建类型: %BUILD_TYPE%

if "%BUILD_TYPE%"=="fast" (
    echo ⚡ 快速构建模式
    echo 使用阿里云镜像源和npm镜像
    
    REM 设置Docker构建参数
    set DOCKER_BUILDKIT=1
    set BUILDKIT_PROGRESS=plain
    
    docker-compose build --no-cache --build-arg NODE_ENV=production prerender
) else if "%BUILD_TYPE%"=="lightweight" (
    echo 🪶 轻量级构建模式
    echo 使用多阶段构建减少镜像大小
    
    REM 使用轻量级Dockerfile
    docker build -f Dockerfile.lightweight -t prerender-server:lightweight .
) else (
    echo 📋 标准构建模式
    echo 使用默认配置
    
    docker-compose build prerender
)

if %ERRORLEVEL% EQU 0 (
    echo ✅ 构建成功！
    echo.
    echo 📝 使用说明:
    echo    - 启动服务: docker-compose up -d
    echo    - 查看日志: docker-compose logs -f prerender
    echo    - 停止服务: docker-compose down
    echo.
    echo 🔍 镜像信息:
    docker images | findstr prerender
) else (
    echo ❌ 构建失败！
    echo 请检查错误信息并重试
    pause
    exit /b 1
)

pause
