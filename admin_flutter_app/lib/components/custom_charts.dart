import 'package:flutter/material.dart';
import 'dart:math' as math;

class CustomCharts {
  // 饼图 - 使用CustomPainter
  static Widget buildPieChart({
    required Map<String, int> data,
    required String title,
    double height = 250,
  }) {
    final colors = [
      const Color(0xFF667eea),
      const Color(0xFF764ba2),
      const Color(0xFFf093fb),
      const Color(0xFFf5576c),
      const Color(0xFF4facfe),
      const Color(0xFF00f2fe),
    ];

    return Container(
      height: height,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: CustomPaint(
              painter: PieChartPainter(data, colors),
              child: Container(),
            ),
          ),
          const SizedBox(height: 8),
          // 添加图例
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: data.entries.map((entry) {
              final index = data.keys.toList().indexOf(entry.key);
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: colors[index % colors.length],
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${entry.key} (${entry.value})',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF718096),
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // 柱状图 - 使用CustomPainter
  static Widget buildBarChart({
    required Map<String, int> data,
    required String title,
    double height = 280,
  }) {
    return Container(
      height: height,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: CustomPaint(
              painter: BarChartPainter(data),
              child: Container(),
            ),
          ),
          const SizedBox(height: 8),
          // 添加数据说明
          Text(
            '共 ${data.length} 项数据，最高值: ${data.values.isNotEmpty ? data.values.reduce((a, b) => a > b ? a : b) : 0}',
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF718096),
            ),
          ),
        ],
      ),
    );
  }

  // 折线图 - 使用CustomPainter
  static Widget buildLineChart({
    required Map<String, int> data,
    required String title,
    double height = 250,
  }) {
    return Container(
      height: height,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: CustomPaint(
              painter: LineChartPainter(data),
              child: Container(),
            ),
          ),
          const SizedBox(height: 8),
          // 添加趋势说明
          Text(
            '显示 ${data.length} 个时间点的访问趋势',
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF718096),
            ),
          ),
        ],
      ),
    );
  }

  // 空数据图表 - 显示暂无数据
  static Widget buildEmptyChart({
    required String title,
    required String message,
    double height = 200,
  }) {
    return Container(
      height: height,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.bar_chart_outlined,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    message,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 地理位置列表 - 显示完整地名
  static Widget buildLocationList({
    required List<MapEntry<String, int>> data,
    required String title,
    double height = 300,
  }) {
    return Container(
      height: height,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: data.length,
              itemBuilder: (context, index) {
                final entry = data[index];
                final rank = index + 1;
                final percentage = data.isNotEmpty 
                    ? ((entry.value / data.map((e) => e.value).reduce((a, b) => a + b)) * 100).toStringAsFixed(1)
                    : '0.0';
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[200]!),
                  ),
                  child: Row(
                    children: [
                      // 排名
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: rank <= 3 
                              ? [const Color(0xFF667eea), const Color(0xFF764ba2), const Color(0xFFf093fb)][rank - 1]
                              : Colors.grey[300],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            rank.toString(),
                            style: TextStyle(
                              color: rank <= 3 ? Colors.white : Colors.grey[600],
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // 地名
                      Expanded(
                        child: Text(
                          entry.key,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF2D3748),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // 访问量
                      Text(
                        '${entry.value}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF667eea),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // 百分比
                      Text(
                        '(${percentage}%)',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          // 添加统计信息
          Text(
            '共 ${data.length} 个地区，总访问量: ${data.isNotEmpty ? data.map((e) => e.value).reduce((a, b) => a + b) : 0}',
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF718096),
            ),
          ),
        ],
      ),
    );
  }

  // 访问时段分布图表 - 使用时间轴样式
  static Widget buildHourlyChart({
    required List<MapEntry<String, int>> data,
    required String title,
    double height = 300,
  }) {
    if (data.isEmpty) {
      return buildEmptyChart(title: title, message: '暂无数据', height: height);
    }

    final maxValue = data.map((e) => e.value).reduce((a, b) => a > b ? a : b);
    final totalValue = data.map((e) => e.value).reduce((a, b) => a + b);

    return Container(
      height: height,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: data.length,
              itemBuilder: (context, index) {
                final entry = data[index];
                final percentage = ((entry.value / totalValue) * 100).toStringAsFixed(1);
                final barWidth = (entry.value / maxValue) * 0.8; // 最大宽度为容器的80%
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          // 时间标签
                          SizedBox(
                            width: 50,
                            child: Text(
                              entry.key,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF2D3748),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          // 进度条
                          Expanded(
                            child: Stack(
                              children: [
                                // 背景条
                                Container(
                                  height: 24,
                                  decoration: BoxDecoration(
                                    color: Colors.grey[200],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                // 进度条
                                Container(
                                  height: 24,
                                  width: MediaQuery.of(context).size.width * barWidth,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [
                                        Color(0xFF667eea),
                                        Color(0xFF764ba2),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF667eea).withValues(alpha: 0.3),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                ),
                                // 数值标签
                                Positioned(
                                  right: 8,
                                  top: 0,
                                  bottom: 0,
                                  child: Center(
                                    child: Text(
                                      '${entry.value}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          // 百分比
                          SizedBox(
                            width: 45,
                            child: Text(
                              '${percentage}%',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          // 添加统计信息
          Text(
            '共 ${data.length} 个时段，总访问量: $totalValue',
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF718096),
            ),
          ),
        ],
      ),
    );
  }

  // 访问来源分布列表 - 显示完整来源URL
  static Widget buildRefererList({
    required List<MapEntry<String, int>> data,
    required String title,
    double height = 300,
  }) {
    if (data.isEmpty) {
      return buildEmptyChart(title: title, message: '暂无数据', height: height);
    }

    final totalValue = data.map((e) => e.value).reduce((a, b) => a + b);

    return Container(
      height: height,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: data.length,
              itemBuilder: (context, index) {
                final entry = data[index];
                final rank = index + 1;
                final percentage = ((entry.value / totalValue) * 100).toStringAsFixed(1);
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[200]!),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          // 排名
                          Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              color: rank <= 3 
                                  ? [const Color(0xFF667eea), const Color(0xFF764ba2), const Color(0xFFf093fb)][rank - 1]
                                  : Colors.grey[300],
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Text(
                                rank.toString(),
                                style: TextStyle(
                                  color: rank <= 3 ? Colors.white : Colors.grey[600],
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          // 访问量
                          Text(
                            '${entry.value}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF667eea),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // 百分比
                          Text(
                            '(${percentage}%)',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // 来源URL
                      Text(
                        entry.key,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF2D3748),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          // 添加统计信息
          Text(
            '共 ${data.length} 个来源，总访问量: $totalValue',
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF718096),
            ),
          ),
        ],
      ),
    );
  }

  // 热门文章排行列表 - 显示完整文章标题
  static Widget buildArticleList({
    required List<MapEntry<String, int>> data,
    required String title,
    double height = 300,
  }) {
    if (data.isEmpty) {
      return buildEmptyChart(title: title, message: '暂无数据', height: height);
    }

    final totalValue = data.map((e) => e.value).reduce((a, b) => a + b);

    return Container(
      height: height,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: data.length,
              itemBuilder: (context, index) {
                final entry = data[index];
                final rank = index + 1;
                final percentage = ((entry.value / totalValue) * 100).toStringAsFixed(1);
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[200]!),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          // 排名
                          Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              color: rank <= 3 
                                  ? [const Color(0xFF667eea), const Color(0xFF764ba2), const Color(0xFFf093fb)][rank - 1]
                                  : Colors.grey[300],
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Text(
                                rank.toString(),
                                style: TextStyle(
                                  color: rank <= 3 ? Colors.white : Colors.grey[600],
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          // 访问量
                          Text(
                            '${entry.value}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF667eea),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // 百分比
                          Text(
                            '(${percentage}%)',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // 文章标题
                      Text(
                        entry.key,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF2D3748),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          // 添加统计信息
          Text(
            '共 ${data.length} 篇文章，总访问量: $totalValue',
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF718096),
            ),
          ),
        ],
      ),
    );
  }

  // 统计卡片 - 用于显示关键指标
  static Widget buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    String? subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 20,
                ),
              ),
              const Spacer(),
              Icon(
                Icons.trending_up,
                color: Colors.green,
                size: 16,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF718096),
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFFA0AEC0),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// 饼图绘制器
class PieChartPainter extends CustomPainter {
  final Map<String, int> data;
  final List<Color> colors;

  PieChartPainter(this.data, this.colors);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 20;
    
    final total = data.values.fold(0, (sum, value) => sum + value);
    if (total == 0) return; // 如果没有数据，不绘制
    
    double startAngle = 0;
    
    data.entries.forEach((entry) {
      final sweepAngle = (entry.value / total) * 2 * math.pi;
      final paint = Paint()
        ..color = colors[data.keys.toList().indexOf(entry.key) % colors.length]
        ..style = PaintingStyle.fill;
      
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        true,
        paint,
      );
      
      // 绘制标签
      final labelAngle = startAngle + sweepAngle / 2;
      final labelRadius = radius * 0.7;
      final labelX = center.dx + labelRadius * math.cos(labelAngle);
      final labelY = center.dy + labelRadius * math.sin(labelAngle);
      
      // 检查标签是否在饼图范围内
      final labelDistance = math.sqrt(labelX * labelX + labelY * labelY);
      if (labelDistance < radius * 0.8) {
        final textPainter = TextPainter(
          text: TextSpan(
            text: '${entry.key}\n${entry.value}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
          textDirection: TextDirection.ltr,
        );
        textPainter.layout();
        textPainter.paint(
          canvas,
          Offset(
            labelX - textPainter.width / 2,
            labelY - textPainter.height / 2,
          ),
        );
      }
      
      startAngle += sweepAngle;
    });
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// 柱状图绘制器
class BarChartPainter extends CustomPainter {
  final Map<String, int> data;

  BarChartPainter(this.data);

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;
    
    final maxValue = data.values.reduce((a, b) => a > b ? a : b);
    final barWidth = (size.width - 40) / data.length - 10;
    final maxHeight = size.height - 80; // 增加标签空间
    
    data.entries.forEach((entry) {
      final index = data.keys.toList().indexOf(entry.key);
      final x = 20 + index * (barWidth + 10) + barWidth / 2;
      final height = (entry.value / maxValue) * maxHeight;
      final y = size.height - 40 - height;
      
      // 绘制柱子
      final paint = Paint()
        ..color = const Color(0xFF667eea)
        ..style = PaintingStyle.fill;
      
      final rect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x - barWidth / 2, y, barWidth, height),
        const Radius.circular(4),
      );
      canvas.drawRRect(rect, paint);
      
      // 绘制数值标签
      final textPainter = TextPainter(
        text: TextSpan(
          text: entry.value.toString(),
          style: const TextStyle(
            color: Color(0xFF2D3748),
            fontSize: 10,
            fontWeight: FontWeight.w500,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(x - textPainter.width / 2, y - textPainter.height - 5),
      );
      
      // 绘制X轴标签
      final labelPainter = TextPainter(
        text: TextSpan(
          text: entry.key.length > 12 ? '${entry.key.substring(0, 12)}...' : entry.key,
          style: const TextStyle(
            color: Color(0xFF718096),
            fontSize: 10,
            fontWeight: FontWeight.w500,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      labelPainter.layout();
      labelPainter.paint(
        canvas,
        Offset(x - labelPainter.width / 2, size.height - 45),
      );
    });
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// 折线图绘制器
class LineChartPainter extends CustomPainter {
  final Map<String, int> data;

  LineChartPainter(this.data);

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;
    
    final maxValue = data.values.reduce((a, b) => a > b ? a : b);
    final minValue = data.values.reduce((a, b) => a < b ? a : b);
    // 如果只有一个数据点，设置一个合理的值范围
    final valueRange = maxValue == minValue ? maxValue : maxValue - minValue;
    
    final padding = 40.0;
    final chartWidth = size.width - 2 * padding;
    final chartHeight = size.height - 2 * padding;
    final pointSpacing = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
    
    final points = <Offset>[];
    data.entries.forEach((entry) {
      final index = data.keys.toList().indexOf(entry.key);
      final x = padding + index * pointSpacing;
      
      // 修复数据点Y坐标计算
      double normalizedValue;
      if (maxValue == minValue) {
        // 单数据点时，将数据点放在图表顶部
        normalizedValue = 1.0;
      } else {
        // 多数据点时，正常计算
        normalizedValue = (entry.value - minValue) / valueRange;
      }
      
      final y = size.height - padding - normalizedValue * chartHeight;
      points.add(Offset(x, y));
    });
    
    // 绘制网格线
    final gridPaint = Paint()
      ..color = Colors.grey.withValues(alpha: 0.2)
      ..strokeWidth = 1;
    
    for (int i = 0; i <= 4; i++) {
      final y = padding + (chartHeight / 4) * i;
      canvas.drawLine(Offset(padding, y), Offset(size.width - padding, y), gridPaint);
    }
    
    // 绘制折线
    if (points.length > 1) {
      final linePaint = Paint()
        ..color = const Color(0xFF667eea)
        ..strokeWidth = 3
        ..strokeCap = StrokeCap.round;
      
      final path = Path();
      path.moveTo(points.first.dx, points.first.dy);
      for (int i = 1; i < points.length; i++) {
        path.lineTo(points[i].dx, points[i].dy);
      }
      canvas.drawPath(path, linePaint);
    }
    
    // 绘制数据点
    final pointPaint = Paint()
      ..color = const Color(0xFF667eea)
      ..style = PaintingStyle.fill;
    
    for (final point in points) {
      canvas.drawCircle(point, 4, pointPaint);
    }
    
    // 绘制渐变填充
    if (points.length > 1) {
      final fillPath = Path();
      fillPath.moveTo(points.first.dx, size.height - padding);
      fillPath.lineTo(points.first.dx, points.first.dy);
      for (int i = 1; i < points.length; i++) {
        fillPath.lineTo(points[i].dx, points[i].dy);
      }
      fillPath.lineTo(points.last.dx, size.height - padding);
      fillPath.close();
      
      final fillPaint = Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xFF667eea).withValues(alpha: 0.3),
            const Color(0xFF667eea).withValues(alpha: 0.1),
          ],
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
      
      canvas.drawPath(fillPath, fillPaint);
    }
    
    // 绘制Y轴标签
    for (int i = 0; i <= 4; i++) {
      // 修复Y轴标签计算：确保标签值不重复且合理分布
      final value = maxValue == minValue 
          ? (maxValue * (i / 4)).round()  // 单数据点时，从0到maxValue均匀分布
          : minValue + (valueRange / 4) * i;
      final y = padding + (chartHeight / 4) * i;
      
      final textPainter = TextPainter(
        text: TextSpan(
          text: value.toString(),
          style: const TextStyle(
            color: Color(0xFF718096),
            fontSize: 10,
            fontWeight: FontWeight.w500,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      // 修复Y轴标签位置：从上到下应该是从最大值到最小值
      final correctedY = size.height - padding - (chartHeight / 4) * i;
      textPainter.paint(canvas, Offset(5, correctedY - textPainter.height / 2));
    }
    
    // 绘制X轴标签
    data.entries.forEach((entry) {
      final index = data.keys.toList().indexOf(entry.key);
      final x = padding + index * pointSpacing;
      
      final textPainter = TextPainter(
        text: TextSpan(
          text: entry.key,
          style: const TextStyle(
            color: Color(0xFF718096),
            fontSize: 10,
            fontWeight: FontWeight.w500,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(x - textPainter.width / 2, size.height - 25),
      );
    });
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
} 