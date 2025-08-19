# Admin Flutter App

这是一个使用Flutter开发的博客管理系统移动端应用，提供完整的博客内容管理功能。

## 📱 项目信息

- **项目名称**: admin_flutter_app
- **应用版本**: 1.0.0+1
- **Flutter SDK**: ^3.7.2
- **Dart SDK**: ^3.7.2
- **支持平台**: Android, iOS, Web, Windows, macOS, Linux

## ✨ 功能特性

### 核心功能
- 🔐 **用户认证** - 安全的登录/登出系统
- 📝 **博客文章管理** - 创建、编辑、删除文章
- 🏷️ **分类和标签管理** - 内容分类组织
- 🖼️ **图片管理** - 图片上传和管理
- 🎵 **音乐管理** - 音频文件播放和管理
- 📊 **数据统计** - 可视化图表展示
- 📁 **文件管理** - 文件上传和管理
- 🎨 **主题定制** - 支持自定义主题
- 🌐 **多语言支持** - 国际化配置

### 技术特性
- 🔒 **HTTPS安全通信** - 所有API请求使用HTTPS
- 💾 **本地数据存储** - SharedPreferences持久化
- 📱 **响应式设计** - 适配多种屏幕尺寸
- 🎯 **权限管理** - 智能权限请求处理

## 🛠️ 开发环境要求

- **Flutter SDK**: 3.7.2 或更高版本
- **Dart SDK**: 3.7.2 或更高版本
- **IDE**: Android Studio / VS Code / IntelliJ IDEA
- **Android开发**: Android SDK (API 21+)
- **iOS开发**: Xcode (仅macOS)
- **Web开发**: Chrome浏览器

## 📦 主要依赖

```yaml
dependencies:
  flutter: sdk
  cupertino_icons: ^1.0.8      # iOS风格图标
  http: ^1.1.0                 # HTTP客户端
  shared_preferences: ^2.2.2   # 本地存储
  fl_chart: ^0.64.0           # 图表组件
  file_picker: ^8.0.0+1       # 文件选择器
  audioplayers: ^6.5.0        # 音频播放器
  permission_handler: ^11.3.1  # 权限管理
  flutter_markdown: ^0.6.18   # Markdown渲染
  flutter_colorpicker: ^1.0.3 # 颜色选择器
```

## 🚀 安装和运行

### 1. 环境准备
```bash
# 检查Flutter环境
flutter doctor

# 确保所有依赖都已安装
flutter doctor --android-licenses
```

### 2. 项目设置
```bash
# 克隆项目
git clone <repository-url>
cd admin_flutter_app

# 安装依赖
flutter pub get

# 生成应用图标（可选）
flutter pub run flutter_launcher_icons:main
```

### 3. 运行项目
```bash
# 查看可用设备
flutter devices

# Android设备/模拟器
flutter run

# iOS设备/模拟器（仅macOS）
flutter run -d ios

# Web浏览器
flutter run -d chrome

# Windows桌面
flutter run -d windows

# 调试模式运行
flutter run --debug

# 发布模式运行
flutter run --release
```

## 📁 项目结构

```
admin_flutter_app/
├── android/               # Android平台配置
├── ios/                   # iOS平台配置
├── web/                   # Web平台配置
├── windows/               # Windows平台配置
├── linux/                 # Linux平台配置
├── macos/                 # macOS平台配置
├── assets/                # 静态资源
│   ├── images/           # 图片资源
│   └── app_icon/         # 应用图标
├── lib/                   # 主要代码目录
│   ├── main.dart         # 应用入口文件
│   ├── components/       # 可复用组件
│   ├── constants/        # 常量定义
│   │   └── app_constants.dart
│   ├── models/           # 数据模型
│   ├── services/         # 服务层
│   │   └── api_service.dart
│   ├── utils/            # 工具类
│   │   └── storage_utils.dart
│   ├── views/            # 页面视图
│   └── widgets/          # UI组件
├── test/                  # 测试文件
├── pubspec.yaml          # 项目配置文件
├── README.md             # 项目说明文档
├── HTTPS_CONFIG.md       # HTTPS配置说明
└── start.bat             # Windows启动脚本
```

## 🔧 配置说明

### API配置
应用使用HTTPS协议与后端API通信，配置文件位于 `lib/constants/app_constants.dart`：

```dart
class AppConstants {
  static const String baseUrl = 'https://admin.siqiongbiluo.love/api';
  static const String staticBaseUrl = 'https://admin.siqiongbiluo.love';
}
```

### 环境变量支持
支持使用环境变量配置不同环境的API地址：

```bash
# 开发环境
flutter run --dart-define=BASE_URL=https://dev.example.com/api

# 生产环境
flutter build apk --dart-define=BASE_URL=https://admin.siqiongbiluo.love/api
```

### 权限配置
应用需要以下权限：
- **网络访问**: 用于API请求
- **存储访问**: 用于文件上传/下载
- **相机访问**: 用于拍照上传
- **音频播放**: 用于音乐功能

## 💻 开发指南

### 代码规范
- 遵循 [Flutter官方代码规范](https://dart.dev/guides/language/effective-dart)
- 使用 `flutter_lints` 进行代码检查
- 保持代码简洁和可读性

### 架构模式
- **网络请求**: 使用 `http` 包进行API调用
- **本地存储**: 使用 `SharedPreferences` 进行数据持久化
- **状态管理**: 使用Flutter内置的StatefulWidget
- **文件处理**: 使用 `file_picker` 进行文件选择

### 开发工具
```bash
# 代码格式化
flutter format .

# 代码分析
flutter analyze

# 运行测试
flutter test

# 清理构建缓存
flutter clean
```

## 📦 构建发布

### Android
```bash
# 构建调试APK
flutter build apk --debug

# 构建发布APK
flutter build apk --release

# 构建App Bundle（推荐用于Google Play）
flutter build appbundle --release

# 构建分架构APK
flutter build apk --split-per-abi
```

### iOS
```bash
# 构建iOS应用（需要macOS）
flutter build ios --release

# 构建IPA文件
flutter build ipa
```

### Web
```bash
# 构建Web应用
flutter build web --release

# 构建Web应用（优化性能）
flutter build web --web-renderer html --release
```

### 桌面平台
```bash
# Windows
flutter build windows --release

# macOS
flutter build macos --release

# Linux
flutter build linux --release
```

## 🔍 故障排除

### 常见问题
1. **网络请求失败**: 检查HTTPS证书和网络连接
2. **权限被拒绝**: 确保在AndroidManifest.xml中声明了必要权限
3. **构建失败**: 运行 `flutter clean` 后重新构建
4. **依赖冲突**: 运行 `flutter pub deps` 检查依赖关系

### 调试技巧
```bash
# 查看详细日志
flutter run --verbose

# 性能分析
flutter run --profile

# 检查应用大小
flutter build apk --analyze-size
```

## 📚 相关文档

- [HTTPS配置说明](HTTPS_CONFIG.md)
- [Flutter官方文档](https://flutter.dev/docs)
- [Dart语言指南](https://dart.dev/guides)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License
