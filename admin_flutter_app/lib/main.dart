import 'package:flutter/material.dart';
import 'constants/app_constants.dart';
import 'utils/storage_utils.dart';
import 'views/login_view.dart';
import 'views/dashboard_view.dart';
import 'views/articles_view.dart';
import 'views/categories_view.dart';
import 'views/tags_view.dart';
import 'views/images_view.dart';
import 'views/files_view.dart';
import 'views/music_view.dart';
import 'views/music_statistics_view.dart';
import 'views/music_edit_view.dart';
import 'views/settings_view.dart';
import 'views/analytics_view.dart';
import 'views/data_cleanup_view.dart';
import 'views/article_create_view.dart';
import 'views/article_preview_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 初始化StorageUtils
  await StorageUtils.init();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(AppConstants.primaryColor),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(AppConstants.primaryColor),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(AppConstants.primaryColor),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(
              color: Color(AppConstants.primaryColor),
              width: 2,
            ),
          ),
        ),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(AppConstants.primaryColor),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      themeMode: ThemeMode.system,
      initialRoute: AppConstants.loginRoute,
      routes: {
        AppConstants.loginRoute: (context) => const LoginView(),
        AppConstants.dashboardRoute: (context) => const DashboardView(),
        AppConstants.articlesRoute: (context) => const ArticlesView(),
        AppConstants.categoriesRoute: (context) => const CategoriesView(),
        AppConstants.tagsRoute: (context) => const TagsView(),
        AppConstants.imagesRoute: (context) => const ImagesView(),
        AppConstants.filesRoute: (context) => const FilesView(),
        AppConstants.musicRoute: (context) => const MusicView(),
        AppConstants.musicStatisticsRoute: (context) => const MusicStatisticsView(),
        AppConstants.settingsRoute: (context) => const SettingsView(),
        AppConstants.analyticsRoute: (context) => const AnalyticsView(),
        AppConstants.dataCleanupRoute: (context) => const DataCleanupView(),
        '/articles/create': (context) => const ArticleCreateView(),
        '/articles/preview': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
          return ArticlePreviewView(article: args['article']);
        },
      },
    );
  }
}


