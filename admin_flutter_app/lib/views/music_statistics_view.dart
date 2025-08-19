import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../constants/app_constants.dart';
import '../services/api_service.dart';

class MusicStatisticsView extends StatefulWidget {
  const MusicStatisticsView({super.key});

  @override
  State<MusicStatisticsView> createState() => _MusicStatisticsViewState();
}

class _MusicStatisticsViewState extends State<MusicStatisticsView> {
  final ApiService _apiService = ApiService();
  
  bool _isLoading = true;
  Map<String, dynamic>? _statistics;
  Map<String, dynamic>? _managementStatistics;

  @override
  void initState() {
    super.initState();
    _loadStatistics();
  }

  Future<void> _loadStatistics() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // 获取公开的音乐统计信息
      final publicStats = await _apiService.getMusicStatistics();
      
      // 获取管理员的音乐统计信息
      final managementStats = await _apiService.getMusicManagementStatistics();

      setState(() {
        _statistics = publicStats['data'];
        _managementStatistics = managementStats['data'];
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('加载统计信息失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('音乐统计'),
        backgroundColor: const Color(AppConstants.primaryColor),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadStatistics,
            tooltip: '刷新',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _statistics == null
              ? _buildErrorState()
              : _buildStatisticsContent(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            '加载统计信息失败',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadStatistics,
            child: const Text('重试'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatisticsContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 概览卡片
          _buildOverviewCards(),
          const SizedBox(height: 24),
          
          // 状态分布图表
          _buildStatusDistributionChart(),
          const SizedBox(height: 24),
          
          // 热门艺术家图表
          if (_statistics?['topArtists'] != null)
            _buildTopArtistsChart(),
          const SizedBox(height: 24),
          
          // 热门流派图表
          if (_statistics?['topGenres'] != null)
            _buildTopGenresChart(),
          const SizedBox(height: 24),
          
          // 详细统计信息
          _buildDetailedStatistics(),
        ],
      ),
    );
  }

  Widget _buildOverviewCards() {
    final total = _parseInt(_statistics?['total']) ?? 0;
    final enabled = _parseInt(_statistics?['enabled']) ?? 0;
    final disabled = _parseInt(_statistics?['disabled']) ?? 0;
    final totalSize = _parseInt(_statistics?['totalSize']) ?? 0;
    final totalDuration = _parseDouble(_statistics?['totalDuration']) ?? 0.0;

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.2,
      children: [
        _buildStatCard(
          '总音乐数',
          total.toString(),
          Icons.music_note,
          Colors.blue,
        ),
        _buildStatCard(
          '启用音乐',
          enabled.toString(),
          Icons.check_circle,
          Colors.green,
        ),
        _buildStatCard(
          '禁用音乐',
          disabled.toString(),
          Icons.cancel,
          Colors.orange,
        ),
        _buildStatCard(
          '总时长',
          _formatDuration(totalDuration),
          Icons.timer,
          Colors.purple,
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 28,
              color: color,
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusDistributionChart() {
    final enabled = _parseInt(_statistics?['enabled']) ?? 0;
    final disabled = _parseInt(_statistics?['disabled']) ?? 0;
    final total = enabled + disabled;

    if (total == 0) {
      return const SizedBox.shrink();
    }

    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '状态分布',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: PieChart(
                PieChartData(
                  sections: [
                    PieChartSectionData(
                      value: enabled.toDouble(),
                      title: '启用\n${((enabled / total) * 100).toStringAsFixed(1)}%',
                      color: Colors.green,
                      radius: 60,
                      titleStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    PieChartSectionData(
                      value: disabled.toDouble(),
                      title: '禁用\n${((disabled / total) * 100).toStringAsFixed(1)}%',
                      color: Colors.orange,
                      radius: 60,
                      titleStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                  centerSpaceRadius: 40,
                  sectionsSpace: 2,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildLegendItem('启用', Colors.green, enabled),
                _buildLegendItem('禁用', Colors.orange, disabled),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopArtistsChart() {
    final topArtists = _statistics?['topArtists'] as List? ?? [];
    
    if (topArtists.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '热门艺术家',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: topArtists.isNotEmpty 
                      ? (_parseInt(topArtists.first['count']) ?? 0).toDouble() * 1.2
                      : 10,
                  barTouchData: BarTouchData(enabled: false),
                  titlesData: FlTitlesData(
                    show: true,
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          if (value.toInt() >= 0 && value.toInt() < topArtists.length) {
                            final artist = topArtists[value.toInt()]['artist'] as String;
                            return Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text(
                                artist.length > 8 ? '${artist.substring(0, 8)}...' : artist,
                                style: const TextStyle(fontSize: 10),
                              ),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            value.toInt().toString(),
                            style: const TextStyle(fontSize: 10),
                          );
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: List.generate(
                    topArtists.length,
                    (index) => BarChartGroupData(
                      x: index,
                      barRods: [
                        BarChartRodData(
                          toY: (_parseInt(topArtists[index]['count']) ?? 0).toDouble(),
                          color: Colors.blue,
                          width: 20,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopGenresChart() {
    final topGenres = _statistics?['topGenres'] as List? ?? [];
    
    if (topGenres.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '热门流派',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: topGenres.isNotEmpty 
                      ? (_parseInt(topGenres.first['count']) ?? 0).toDouble() * 1.2
                      : 10,
                  barTouchData: BarTouchData(enabled: false),
                  titlesData: FlTitlesData(
                    show: true,
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          if (value.toInt() >= 0 && value.toInt() < topGenres.length) {
                            final genre = topGenres[value.toInt()]['genre'] as String;
                            return Padding(
                              padding: const EdgeInsets.only(top: 8),
                              child: Text(
                                genre.length > 8 ? '${genre.substring(0, 8)}...' : genre,
                                style: const TextStyle(fontSize: 10),
                              ),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            value.toInt().toString(),
                            style: const TextStyle(fontSize: 10),
                          );
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: List.generate(
                    topGenres.length,
                    (index) => BarChartGroupData(
                      x: index,
                      barRods: [
                        BarChartRodData(
                          toY: (_parseInt(topGenres[index]['count']) ?? 0).toDouble(),
                          color: Colors.purple,
                          width: 20,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailedStatistics() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '详细统计',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildDetailRow('总文件大小', _formatFileSize(_parseInt(_statistics?['totalSize']) ?? 0)),
            _buildDetailRow('平均时长', _formatDuration(_parseDouble(_statistics?['totalDuration']) ?? 0)),
            _buildDetailRow('平均文件大小', _formatFileSize(_parseInt(_statistics?['totalSize']) ?? 0, _parseInt(_statistics?['total']) ?? 1)),
            if (_managementStatistics != null) ...[
              const Divider(),
              _buildDetailRow('今日上传', _managementStatistics?['todayUploads']?.toString() ?? '0'),
              _buildDetailRow('本周上传', _managementStatistics?['weekUploads']?.toString() ?? '0'),
              _buildDetailRow('本月上传', _managementStatistics?['monthUploads']?.toString() ?? '0'),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color, int count) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          color: color,
        ),
        const SizedBox(width: 8),
        Text('$label ($count)'),
      ],
    );
  }

  String _formatDuration(double seconds) {
    if (seconds == 0) return '0分钟';
    
    final hours = (seconds / 3600).floor();
    final minutes = ((seconds % 3600) / 60).floor();
    
    if (hours > 0) {
      return '${hours}小时${minutes}分钟';
    } else {
      return '${minutes}分钟';
    }
  }

  String _formatFileSize(int bytes, [int count = 1]) {
    if (bytes == 0) return '0 B';
    
    final avgBytes = bytes / count;
    
    if (avgBytes < 1024) {
      return '${avgBytes.toStringAsFixed(1)} B';
    } else if (avgBytes < 1024 * 1024) {
      return '${(avgBytes / 1024).toStringAsFixed(1)} KB';
    } else if (avgBytes < 1024 * 1024 * 1024) {
      return '${(avgBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(avgBytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }

  // 安全解析整数
  int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is String) return int.tryParse(value);
    return null;
  }

  // 安全解析浮点数
  double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }
} 