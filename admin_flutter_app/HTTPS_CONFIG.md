# HTTPS 配置说明

## 🔒 HTTPS 配置概述

本Flutter应用已配置为使用HTTPS协议与后端API进行安全通信。

## 📋 配置详情

### 1. API 基础URL配置

在 `lib/constants/app_constants.dart` 中配置了HTTPS基础URL：

```dart
class AppConstants {
  // API配置
  static const String baseUrl = 'https://admin.siqiongbiluo.love/api';
  static const String apiVersion = 'v1';
  static const String staticBaseUrl = 'https://admin.siqiongbiluo.love';
}
```

### 2. Android 网络权限

在 `android/app/src/main/AndroidManifest.xml` 中添加了必要的网络权限：

```xml
<!-- 网络权限 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### 3. API 服务配置

在 `lib/services/api_service.dart` 中使用HTTPS进行所有API请求：

```dart
class ApiService {
  final String _baseUrl = AppConstants.baseUrl; // 使用HTTPS URL
  
  // 所有API请求都通过HTTPS进行
  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/users/login'), // HTTPS URL
      headers: _headers,
      body: json.encode({
        'username': username,
        'password': password,
      }),
    );
  }
}
```

## 🔐 安全特性

### 1. 加密通信
- 所有API请求都通过HTTPS进行
- 数据传输过程中自动加密
- 防止中间人攻击

### 2. 认证机制
- 使用Bearer Token认证
- Token通过HTTPS安全传输
- 自动处理认证头

### 3. 错误处理
- HTTPS连接错误处理
- 网络状态检查
- 友好的错误提示

## 🌐 支持的API端点

### 用户相关
- `POST https://admin.siqiongbiluo.love/api/users/login` - 用户登录
- `GET https://admin.siqiongbiluo.love/api/users/me` - 获取用户信息

### 文章相关
- `GET https://admin.siqiongbiluo.love/api/articles` - 获取文章列表
- `GET https://admin.siqiongbiluo.love/api/articles/statistics` - 文章统计

### 图片相关
- `GET https://admin.siqiongbiluo.love/api/images/stats/statistics` - 图片统计

### 音乐相关
- `GET https://admin.siqiongbiluo.love/api/music/statistics` - 音乐统计

### 文件相关
- `GET https://admin.siqiongbiluo.love/api/files/stats/overview` - 文件统计

### 系统相关
- `GET https://admin.siqiongbiluo.love/api/info` - 系统信息
- `GET https://admin.siqiongbiluo.love/api/health` - 系统健康状态
- `GET https://admin.siqiongbiluo.love/api/config` - 系统配置

## 🔧 开发环境配置

### 1. 本地开发
如果需要连接到本地开发服务器，可以修改 `AppConstants.baseUrl`：

```dart
// 开发环境
static const String baseUrl = 'http://localhost:3000/api';

// 生产环境
static const String baseUrl = 'https://admin.siqiongbiluo.love/api';
```

### 2. 环境变量
建议使用环境变量来管理不同环境的URL：

```dart
// 从环境变量读取
static const String baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://admin.siqiongbiluo.love/api',
);
```

### 3. 证书验证
对于自签名证书或开发环境，可能需要配置证书验证：

```dart
// 在开发环境中跳过证书验证（仅用于开发）
HttpOverrides.global = MyHttpOverrides();

class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback = (X509Certificate cert, String host, int port) => true;
  }
}
```

## 🚀 部署注意事项

### 1. 生产环境
- 确保使用有效的SSL证书
- 配置正确的域名和端口
- 启用HTTPS重定向

### 2. 证书管理
- 定期更新SSL证书
- 监控证书过期时间
- 配置证书自动续期

### 3. 安全最佳实践
- 使用强加密算法
- 启用HSTS头
- 配置CSP策略
- 定期安全审计

## 📱 移动端适配

### 1. Android
- 已添加网络权限
- 支持HTTP/2
- 自动处理证书验证

### 2. iOS
- 默认支持HTTPS
- 需要配置ATS (App Transport Security)
- 支持证书固定

### 3. Web
- 现代浏览器自动支持HTTPS
- 支持Service Worker
- PWA功能支持

## 🔍 故障排除

### 1. 常见问题
- **证书错误**: 检查SSL证书是否有效
- **网络超时**: 检查网络连接和服务器状态
- **权限错误**: 确认已添加网络权限

### 2. 调试方法
```dart
// 启用HTTP请求日志
import 'package:http/http.dart' as http;

// 在开发环境中打印请求日志
if (kDebugMode) {
  print('Request: ${request.url}');
  print('Response: ${response.body}');
}
```

### 3. 网络诊断
- 使用 `ping` 测试网络连接
- 检查DNS解析
- 验证防火墙设置

## 📚 相关文档

- [Flutter HTTP 包文档](https://pub.dev/packages/http)
- [Android 网络权限](https://developer.android.com/training/basics/network-ops/connecting)
- [iOS ATS 配置](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html#//apple_ref/doc/uid/TP40009251-SW33)
- [HTTPS 最佳实践](https://developers.google.com/web/fundamentals/security/encrypt-in-transit/)

## ✅ 验证清单

- [x] HTTPS URL配置正确
- [x] Android网络权限已添加
- [x] API服务使用HTTPS
- [x] 错误处理完善
- [x] 证书验证正常
- [x] 网络状态检查
- [x] 安全传输配置
- [x] 开发环境适配
- [x] 生产环境准备
- [x] 文档完善 