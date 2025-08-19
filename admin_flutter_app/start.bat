@echo off
echo 启动Flutter项目...
echo.

REM 检查Flutter是否安装
flutter --version >nul 2>&1
if errorlevel 1 (
    echo 错误: Flutter未安装或未添加到PATH环境变量
    pause
    exit /b 1
)

REM 安装依赖
echo 安装项目依赖...
flutter pub get

REM 运行项目
echo.
echo 启动应用...
echo 按 'r' 进行热重载
echo 按 'R' 进行热重启
echo 按 'q' 退出
echo.
flutter run

pause 