class AppConstants {
  // 应用信息
  static const String appName = 'Admin Blog';
  static const String appVersion = '1.0.0';
  
  // API配置
  static const String baseUrl = 'https://yourdomain.com/api';
  static const String apiVersion = 'v1';
  static const String staticBaseUrl = 'https://yourdomain.com';
  
  // 路由名称
  static const String homeRoute = '/';
  static const String loginRoute = '/login';
  static const String dashboardRoute = '/dashboard';
  static const String articlesRoute = '/articles';
  static const String categoriesRoute = '/categories';
  static const String tagsRoute = '/tags';
  static const String imagesRoute = '/images';
  static const String filesRoute = '/files';
  static const String musicRoute = '/music';
  static const String musicStatisticsRoute = '/music/statistics';
  static const String musicEditRoute = '/music/edit';
  static const String settingsRoute = '/settings';
  static const String analyticsRoute = '/analytics';
  static const String dataCleanupRoute = '/data-cleanup';
  
  // 本地存储键名
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_info';
  static const String themeKey = 'app_theme';
  static const String languageKey = 'app_language';
  
  // 主题颜色
  static const int primaryColor = 0xFF6200EE;
  static const int secondaryColor = 0xFF03DAC6;
  static const int errorColor = 0xFFB00020;
  
  // 分页配置
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // 文件上传配置
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const int maxMusicSize = 50 * 1024 * 1024; // 50MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  static const List<String> allowedFileTypes = ['pdf', 'doc', 'docx', 'txt', 'md'];
  static const List<String> allowedMusicTypes = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'];
} 