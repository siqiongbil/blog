import 'package:flutter/material.dart';
import '../constants/app_constants.dart';
import '../services/api_service.dart';
import '../models/user.dart';
import '../components/custom_charts.dart';

class DashboardView extends StatefulWidget {
  const DashboardView({super.key});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> with TickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  User? _currentUser;
  Map<String, dynamic>? _articleStats;
  Map<String, dynamic>? _imageStats;
  Map<String, dynamic>? _musicStats;
  Map<String, dynamic>? _fileStats;
  
  // 图表数据 - 从统计接口获取
  Map<String, dynamic>? _visitTrends;
  Map<String, dynamic>? _hotArticles;
  Map<String, dynamic>? _deviceStats;
  Map<String, dynamic>? _refererStats;
  Map<String, dynamic>? _hourlyStats;
  Map<String, dynamic>? _locationStats;
  Map<String, dynamic>? _countryStats;
  Map<String, dynamic>? _cleanupStats;
  
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _loadDashboardData();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadDashboardData() async {
    try {
      setState(() {
        _isLoading = true;
      });

      // 分别加载数据，使用错误处理
      User? user;
      Map<String, dynamic>? articleStats;
      Map<String, dynamic>? imageStats;
      Map<String, dynamic>? musicStats;
      Map<String, dynamic>? fileStats;
      Map<String, dynamic>? visitTrends;
      Map<String, dynamic>? hotArticles;
      Map<String, dynamic>? deviceStats;
      Map<String, dynamic>? refererStats;
      Map<String, dynamic>? hourlyStats;
      Map<String, dynamic>? locationStats;
      Map<String, dynamic>? countryStats;
      Map<String, dynamic>? cleanupStats;
      try {
        user = await _apiService.getUserInfo();
      } catch (e) {
        // 用户信息加载失败，使用默认值
      }

      try {
        articleStats = await _apiService.getArticleStatistics();
      } catch (e) {
        // 文章统计加载失败
      }

      try {
        imageStats = await _apiService.getImageStatistics();
      } catch (e) {
        // 图片统计加载失败
      }

      try {
        musicStats = await _apiService.getMusicStatistics();
      } catch (e) {
        // 音乐统计加载失败
      }

      try {
        fileStats = await _apiService.getFileStatistics();
      } catch (e) {
        // 文件统计加载失败
      }

      try {
        visitTrends = await _apiService.getVisitTrends(days: 30);
        print('🔍 访问趋势数据: $visitTrends');
      } catch (e) {
        print('❌ 访问趋势统计加载失败: $e');
      }

      try {
        hotArticles = await _apiService.getHotArticles(limit: 10, days: 30);
        print('🔍 热门文章数据: $hotArticles');
      } catch (e) {
        print('❌ 热门文章统计加载失败: $e');
      }

      try {
        deviceStats = await _apiService.getDeviceStats(days: 30);
        print('🔍 设备统计数据: $deviceStats');
      } catch (e) {
        print('❌ 设备统计加载失败: $e');
      }

      try {
        refererStats = await _apiService.getRefererStats(days: 30);
        print('🔍 来源统计数据: $refererStats');
      } catch (e) {
        print('❌ 来源统计加载失败: $e');
      }

      try {
        hourlyStats = await _apiService.getHourlyStats(days: 30);
        print('🔍 时段统计数据: $hourlyStats');
      } catch (e) {
        print('❌ 时段统计加载失败: $e');
      }

      try {
        locationStats = await _apiService.getLocationStats(days: 30);
        print('🔍 地理位置数据: $locationStats');
      } catch (e) {
        print('❌ 地理位置统计加载失败: $e');
      }

      try {
        countryStats = await _apiService.getCountryStats(days: 30);
        print('🔍 国家统计数据: $countryStats');
      } catch (e) {
        print('❌ 国家统计加载失败: $e');
      }

      try {
        cleanupStats = await _apiService.getCleanupStats();
        print('🔍 清理统计数据: $cleanupStats');
      } catch (e) {
        print('❌ 清理统计加载失败: $e');
      }



      setState(() {
        _currentUser = user;
        _articleStats = articleStats;
        _imageStats = imageStats;
        _musicStats = musicStats;
        _fileStats = fileStats;
        _visitTrends = visitTrends;
        _hotArticles = hotArticles;
        _deviceStats = deviceStats;
        _refererStats = refererStats;
        _hourlyStats = hourlyStats;
        _locationStats = locationStats;
        _countryStats = countryStats;
        _cleanupStats = cleanupStats;
        _isLoading = false;
      });
      
      _animationController.forward();
      
      // 检查是否有数据加载失败
      final failedCount = [
        user, articleStats, imageStats, musicStats, fileStats
      ].where((result) => result == null).length;
      
      if (failedCount > 0 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('部分数据加载失败，显示默认数据'),
            backgroundColor: Colors.orange,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('加载数据失败: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7FAFC),
      appBar: _buildAppBar(),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 欢迎卡片
                      _buildWelcomeCard(),
                      const SizedBox(height: 24),
                      
                      // 统计卡片
                      _buildStatisticsSection(),
                      const SizedBox(height: 24),
                      
                      // 快速操作
                      _buildQuickActionsSection(),
                      const SizedBox(height: 24),
                      
                      // 数据图表
                      _buildChartsSection(),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      title: const Text(
        '仪表板',
        style: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 20,
        ),
      ),

      elevation: 0,
      shadowColor: Colors.transparent,
      actions: [
        IconButton(
          icon: const Icon(Icons.bug_report),
          onPressed: _testAPI,
          tooltip: '测试API',
        ),
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          onPressed: () {
            // TODO: 显示通知
          },
        ),
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: _loadDashboardData,
        ),
        PopupMenuButton<String>(
          onSelected: (value) {
            if (value == 'logout') {
              _handleLogout();
            }
          },
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'profile',
              child: Row(
                children: [
                  Icon(Icons.person_outline),
                  SizedBox(width: 8),
                  Text('个人资料'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'settings',
              child: Row(
                children: [
                  Icon(Icons.settings_outlined),
                  SizedBox(width: 8),
                  Text('设置'),
                ],
              ),
            ),
            const PopupMenuDivider(),
            const PopupMenuItem(
              value: 'logout',
              child: Row(
                children: [
                  Icon(Icons.logout, color: Colors.red),
                  SizedBox(width: 8),
                  Text('退出登录', style: TextStyle(color: Colors.red)),
                ],
              ),
            ),
          ],
          child: CircleAvatar(
            backgroundColor: const Color(0xFF667eea),
            child: Text(
              _currentUser?.nickname.substring(0, 1).toUpperCase() ?? 'A',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
      ],
    );
  }

  Widget _buildWelcomeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF667eea),
            Color(0xFF764ba2),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF667eea).withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '欢迎回来，${_currentUser?.nickname ?? '管理员'}！',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '今天是 ${DateTime.now().toString().substring(0, 10)}，祝您工作愉快！',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(15),
            ),
            child: const Icon(
              Icons.waving_hand,
              color: Colors.white,
              size: 30,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatisticsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '数据概览',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2D3748),
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: [
            _buildStatCard(
              '文章',
              _articleStats?['data']?['total']?.toString() ?? '0',
              Icons.article_outlined,
              const Color(0xFF4299E1),
              const Color(0xFFEBF8FF),
            ),
            _buildStatCard(
              '图片',
              _imageStats?['data']?['total']?.toString() ?? '0',
              Icons.image_outlined,
              const Color(0xFF48BB78),
              const Color(0xFFF0FFF4),
            ),
            _buildStatCard(
              '音乐',
              _musicStats?['data']?['total']?.toString() ?? '0',
              Icons.music_note_outlined,
              const Color(0xFFED8936),
              const Color(0xFFFFF5F5),
            ),
            _buildStatCard(
              '文件',
              _fileStats?['data']?['total']?.toString() ?? '0',
              Icons.folder_outlined,
              const Color(0xFF9F7AEA),
              const Color(0xFFFAF5FF),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Icon(icon, color: color, size: 16),
              ),
              const Spacer(),
              Icon(
                Icons.trending_up,
                color: Colors.green[400],
                size: 12,
              ),
            ],
          ),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '快速操作',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2D3748),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                children: [
                  _buildActionButton(
                    '写文章',
                    Icons.edit_outlined,
                    const Color(0xFF4299E1),
                    () => Navigator.pushNamed(context, '${AppConstants.articlesRoute}/create'),
                  ),
                  const SizedBox(width: 12),
                  _buildActionButton(
                    '文章管理',
                    Icons.article_outlined,
                    const Color(0xFF3182CE),
                    () => Navigator.pushNamed(context, AppConstants.articlesRoute),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildActionButton(
                    '分类管理',
                    Icons.category_outlined,
                    const Color(0xFFED8936),
                    () => Navigator.pushNamed(context, AppConstants.categoriesRoute),
                  ),
                  const SizedBox(width: 12),
                  _buildActionButton(
                    '标签管理',
                    Icons.label_outlined,
                    const Color(0xFF38A169),
                    () => Navigator.pushNamed(context, AppConstants.tagsRoute),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildActionButton(
                    '图片管理',
                    Icons.image_outlined,
                    const Color(0xFF48BB78),
                    () => Navigator.pushNamed(context, AppConstants.imagesRoute),
                  ),
                  const SizedBox(width: 12),
                  _buildActionButton(
                    '音乐管理',
                    Icons.music_note_outlined,
                    const Color(0xFF9F7AEA),
                    () => Navigator.pushNamed(context, AppConstants.musicRoute),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton(String title, IconData icon, Color color, VoidCallback onTap) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withValues(alpha: 0.2)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 8),
              Text(
                title,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChartsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '访问统计分析',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2D3748),
          ),
        ),
        const SizedBox(height: 16),
        
        // 设备类型分布
        _buildPieChart(),
        const SizedBox(height: 16),
        
        // 热门文章排行
        _buildBarChart(),
        const SizedBox(height: 16),
        
        // 访问量趋势
        _buildLineChart(),
        const SizedBox(height: 16),
        
        // 访问来源分布
        _buildRefererChart(),
        const SizedBox(height: 16),
        
        // 访问时段分布
        _buildHourlyChart(),
        const SizedBox(height: 16),
        
        // 地理位置分布
        _buildLocationChart(),
      ],
    );
  }

  Widget _buildPieChart() {
    // 使用设备类型统计数据
    Map<String, int> deviceData = {};
    
    if (_deviceStats != null) {
      print('🔍 处理设备统计数据: $_deviceStats');
      
      // 尝试不同的数据格式
      List<dynamic> devices = [];
      
      if (_deviceStats!['data'] != null) {
        devices = _deviceStats!['data'] as List<dynamic>;
      } else if (_deviceStats!['devices'] != null) {
        devices = _deviceStats!['devices'] as List<dynamic>;
      } else if (_deviceStats!['list'] != null) {
        devices = _deviceStats!['list'] as List<dynamic>;
      } else if (_deviceStats! is List) {
        devices = _deviceStats! as List<dynamic>;
      }
      
      print('🔍 设备数据列表: $devices');
      
      for (final device in devices) {
        print('🔍 处理设备项: $device');
        
        // 尝试不同的字段名
        String? deviceType;
        int? visitCount;
        
        if (device is Map<String, dynamic>) {
          deviceType = device['device_type'] ?? device['type'] ?? device['name'] ?? device['device'];
          visitCount = device['visit_count'] ?? device['count'] ?? device['visits'] ?? device['total'];
        }
        
        if (deviceType != null && visitCount != null) {
          deviceData[deviceType] = visitCount;
          print('✅ 添加设备数据: $deviceType = $visitCount');
        }
      }
    }
    
    print('🔍 最终设备数据: $deviceData');
    
    // 如果没有数据，显示暂无数据
    if (deviceData.isEmpty) {
      print('⚠️ 设备数据为空，显示暂无数据');
      return CustomCharts.buildEmptyChart(
        title: '设备类型分布',
        message: '暂无数据',
        height: 200,
      );
    }
    
    return CustomCharts.buildPieChart(
      data: deviceData,
      title: '设备类型分布',
      height: 250,
    );
  }

  Widget _buildBarChart() {
    // 使用热门文章统计数据
    List<MapEntry<String, int>> hotArticleData = [];
    
    if (_hotArticles != null) {
      print('🔍 处理热门文章数据: $_hotArticles');
      
      // 尝试不同的数据格式
      List<dynamic> articles = [];
      
      if (_hotArticles!['data'] != null) {
        articles = _hotArticles!['data'] as List<dynamic>;
      } else if (_hotArticles!['articles'] != null) {
        articles = _hotArticles!['articles'] as List<dynamic>;
      } else if (_hotArticles!['list'] != null) {
        articles = _hotArticles!['list'] as List<dynamic>;
      } else if (_hotArticles! is List) {
        articles = _hotArticles! as List<dynamic>;
      }
      
      print('🔍 文章数据列表: $articles');
      
      for (int i = 0; i < articles.length && i < 10; i++) {
        final article = articles[i];
        print('🔍 处理文章项: $article');
        
        // 尝试不同的字段名
        String? title;
        int? visitCount;
        
        if (article is Map<String, dynamic>) {
          title = article['title'] ?? article['name'] ?? article['article_title'];
          visitCount = article['visit_count'] ?? article['count'] ?? article['visits'] ?? article['total'] ?? article['view_count'];
        }
        
        if (title != null && visitCount != null) {
          hotArticleData.add(MapEntry(title.toString(), visitCount));
          print('✅ 添加文章数据: $title = $visitCount');
        }
      }
    }
    
    print('🔍 最终文章数据: $hotArticleData');
    
    // 如果没有数据，显示暂无数据
    if (hotArticleData.isEmpty) {
      print('⚠️ 热门文章数据为空，显示暂无数据');
      return CustomCharts.buildEmptyChart(
        title: '热门文章排行',
        message: '暂无数据',
        height: 200,
      );
    }
    
    // 按访问量排序
    hotArticleData.sort((a, b) => b.value.compareTo(a.value));
    
    return CustomCharts.buildArticleList(
      data: hotArticleData,
      title: '热门文章排行',
      height: 300,
    );
  }

  Widget _buildLineChart() {
    // 使用访问趋势统计数据
    Map<String, int> visitData = {};
    
    if (_visitTrends != null) {
      print('🔍 处理访问趋势数据: $_visitTrends');
      
      // 尝试不同的数据格式
      List<dynamic> trends = [];
      
      if (_visitTrends!['data'] != null) {
        trends = _visitTrends!['data'] as List<dynamic>;
      } else if (_visitTrends!['trends'] != null) {
        trends = _visitTrends!['trends'] as List<dynamic>;
      } else if (_visitTrends!['list'] != null) {
        trends = _visitTrends!['list'] as List<dynamic>;
      } else if (_visitTrends! is List) {
        trends = _visitTrends! as List<dynamic>;
      }
      
      print('🔍 趋势数据列表: $trends');
      
      for (int i = 0; i < trends.length && i < 7; i++) {
        final trend = trends[i];
        print('🔍 处理趋势项: $trend');
        
        // 尝试不同的字段名
        String? date;
        int? visitCount;
        
        if (trend is Map<String, dynamic>) {
          date = trend['date'] ?? trend['day'] ?? trend['time'];
          visitCount = trend['total_visits'] ?? trend['visits'] ?? trend['count'] ?? trend['total'] ?? trend['visit_count'];
        }
        
        if (date != null && visitCount != null) {
          final formattedDate = _formatDate(date.toString());
          visitData[formattedDate] = visitCount;
          print('✅ 添加趋势数据: $formattedDate = $visitCount');
        }
      }
    }
    
    print('🔍 最终趋势数据: $visitData');
    
    // 如果没有数据，显示暂无数据
    if (visitData.isEmpty) {
      print('⚠️ 访问趋势数据为空，显示暂无数据');
      return CustomCharts.buildEmptyChart(
        title: '访问量趋势',
        message: '暂无数据',
        height: 200,
      );
    }
    
    // 如果只有一个数据点，直接显示该数据点
    if (visitData.length == 1) {
      print('⚠️ 访问趋势数据只有一个点，直接显示');
    }
    
    return CustomCharts.buildLineChart(
      data: visitData,
      title: '访问量趋势',
      height: 250,
    );
  }

  // 辅助方法：格式化日期显示
  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.month}/${date.day}';
    } catch (e) {
      return dateStr;
    }
  }

  Widget _buildRefererChart() {
    // 使用访问来源统计数据
    List<MapEntry<String, int>> refererData = [];
    
    if (_refererStats != null) {
      print('🔍 处理访问来源数据: $_refererStats');
      
      // 尝试不同的数据格式
      List<dynamic> referers = [];
      
      if (_refererStats!['data'] != null) {
        referers = _refererStats!['data'] as List<dynamic>;
      } else if (_refererStats!['referers'] != null) {
        referers = _refererStats!['referers'] as List<dynamic>;
      } else if (_refererStats!['list'] != null) {
        referers = _refererStats!['list'] as List<dynamic>;
      } else if (_refererStats! is List) {
        referers = _refererStats! as List<dynamic>;
      }
      
      print('🔍 来源数据列表: $referers');
      
      for (int i = 0; i < referers.length && i < 10; i++) {
        final referer = referers[i];
        print('🔍 处理来源项: $referer');
        
        // 尝试不同的字段名
        String? refererName;
        int? visitCount;
        
        if (referer is Map<String, dynamic>) {
          refererName = referer['referer'] ?? referer['source'] ?? referer['name'] ?? referer['url'];
          visitCount = referer['visit_count'] ?? referer['count'] ?? referer['visits'] ?? referer['total'];
        }
        
        if (refererName != null && visitCount != null) {
          refererData.add(MapEntry(refererName.toString(), visitCount));
          print('✅ 添加来源数据: $refererName = $visitCount');
        }
      }
    }
    
    print('🔍 最终来源数据: $refererData');
    
    // 如果没有数据，显示暂无数据
    if (refererData.isEmpty) {
      print('⚠️ 访问来源数据为空，显示暂无数据');
      return CustomCharts.buildEmptyChart(
        title: '访问来源分布',
        message: '暂无数据',
        height: 200,
      );
    }
    
    // 按访问量排序
    refererData.sort((a, b) => b.value.compareTo(a.value));
    
    return CustomCharts.buildRefererList(
      data: refererData,
      title: '访问来源分布',
      height: 300,
    );
  }

  Widget _buildHourlyChart() {
    // 使用访问时段统计数据
    List<MapEntry<String, int>> hourlyData = [];
    
    if (_hourlyStats != null) {
      print('🔍 处理时段统计数据: $_hourlyStats');
      
      // 尝试不同的数据格式
      List<dynamic> hours = [];
      
      if (_hourlyStats!['data'] != null) {
        hours = _hourlyStats!['data'] as List<dynamic>;
      } else if (_hourlyStats!['hours'] != null) {
        hours = _hourlyStats!['hours'] as List<dynamic>;
      } else if (_hourlyStats!['list'] != null) {
        hours = _hourlyStats!['list'] as List<dynamic>;
      } else if (_hourlyStats! is List) {
        hours = _hourlyStats! as List<dynamic>;
      }
      
      print('🔍 时段数据列表: $hours');
      
      for (final hour in hours) {
        print('🔍 处理时段项: $hour');
        
        // 尝试不同的字段名
        int? hourValue;
        int? visitCount;
        
        if (hour is Map<String, dynamic>) {
          hourValue = hour['hour'] ?? hour['time'] ?? hour['hour_value'];
          visitCount = hour['visit_count'] ?? hour['count'] ?? hour['visits'] ?? hour['total'];
        }
        
        if (hourValue != null && visitCount != null) {
          hourlyData.add(MapEntry('${hourValue}时', visitCount));
          print('✅ 添加时段数据: ${hourValue}时 = $visitCount');
        }
      }
    }
    
    print('🔍 最终时段数据: $hourlyData');
    
    // 如果没有数据，显示暂无数据
    if (hourlyData.isEmpty) {
      print('⚠️ 访问时段数据为空，显示暂无数据');
      return CustomCharts.buildEmptyChart(
        title: '访问时段分布',
        message: '暂无数据',
        height: 200,
      );
    }
    
    // 按时间排序
    hourlyData.sort((a, b) {
      final hourA = int.tryParse(a.key.replaceAll('时', '')) ?? 0;
      final hourB = int.tryParse(b.key.replaceAll('时', '')) ?? 0;
      return hourA.compareTo(hourB);
    });
    
    return CustomCharts.buildHourlyChart(
      data: hourlyData,
      title: '访问时段分布',
      height: 300,
    );
  }

  Widget _buildLocationChart() {
    // 使用地理位置统计数据
    List<MapEntry<String, int>> locationData = [];
    
    if (_locationStats != null) {
      print('🔍 处理地理位置数据: $_locationStats');
      
      // 尝试不同的数据格式
      List<dynamic> locations = [];
      
      if (_locationStats!['data'] != null) {
        locations = _locationStats!['data'] as List<dynamic>;
      } else if (_locationStats!['locations'] != null) {
        locations = _locationStats!['locations'] as List<dynamic>;
      } else if (_locationStats!['list'] != null) {
        locations = _locationStats!['list'] as List<dynamic>;
      } else if (_locationStats! is List) {
        locations = _locationStats! as List<dynamic>;
      }
      
      print('🔍 地理位置数据列表: $locations');
      
      for (int i = 0; i < locations.length && i < 10; i++) {
        final location = locations[i];
        print('🔍 处理地理位置项: $location');
        
        // 尝试不同的字段名
        String? locationName;
        int? visitCount;
        
        if (location is Map<String, dynamic>) {
          locationName = location['location'] ?? location['city'] ?? location['region'] ?? location['name'] ?? location['province'];
          visitCount = location['visit_count'] ?? location['count'] ?? location['visits'] ?? location['total'];
        }
        
        if (locationName != null && visitCount != null) {
          locationData.add(MapEntry(locationName.toString(), visitCount));
          print('✅ 添加地理位置数据: ${locationName.toString()} = $visitCount');
        }
      }
    }
    
    print('🔍 最终地理位置数据: $locationData');
    
    // 如果没有数据，显示暂无数据
    if (locationData.isEmpty) {
      print('⚠️ 地理位置数据为空，显示暂无数据');
      return CustomCharts.buildEmptyChart(
        title: '地理位置分布',
        message: '暂无数据',
        height: 200,
      );
    }
    
    return CustomCharts.buildLocationList(
      data: locationData,
      title: '地理位置分布',
      height: 300,
    );
  }



  // 测试API接口
  Future<void> _testAPI() async {
    try {
      print('🧪 开始测试API接口...');
      
      // 测试访问趋势接口
      print('🧪 测试访问趋势接口...');
      final trends = await _apiService.getVisitTrends(days: 7);
      print('✅ 访问趋势接口成功: $trends');
      
      // 测试热门文章接口
      print('🧪 测试热门文章接口...');
      final hot = await _apiService.getHotArticles(limit: 5, days: 7);
      print('✅ 热门文章接口成功: $hot');
      
      // 测试设备统计接口
      print('🧪 测试设备统计接口...');
      final devices = await _apiService.getDeviceStats(days: 7);
      print('✅ 设备统计接口成功: $devices');
      
      // 测试来源统计接口
      print('🧪 测试来源统计接口...');
      final referers = await _apiService.getRefererStats(days: 7);
      print('✅ 来源统计接口成功: $referers');
      
      // 测试时段统计接口
      print('🧪 测试时段统计接口...');
      final hourly = await _apiService.getHourlyStats(days: 7);
      print('✅ 时段统计接口成功: $hourly');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('API测试完成，请查看控制台输出'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      print('❌ API测试失败: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('API测试失败: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleLogout() async {
    await _apiService.logout();
    if (mounted) {
      Navigator.pushReplacementNamed(context, AppConstants.loginRoute);
    }
  }
} 