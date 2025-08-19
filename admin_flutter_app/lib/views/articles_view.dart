import 'package:flutter/material.dart';
import '../models/article.dart';
import '../models/category.dart';
import '../services/api_service.dart';
import '../constants/app_constants.dart';

class ArticlesView extends StatefulWidget {
  const ArticlesView({super.key});

  @override
  State<ArticlesView> createState() => _ArticlesViewState();
}

class _ArticlesViewState extends State<ArticlesView> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  
  bool _isLoading = false;
  List<Article> _articles = [];
  List<Category> _categories = [];
  List<Article> _selectedArticles = [];
  
  // 搜索和筛选参数
  String _searchKeyword = '';
  int? _selectedCategoryId;
  int? _selectedStatus;
  
  // 分页参数
  int _currentPage = 1;
  int _pageSize = 20;
  int _total = 0;
  
  // 状态选项
  final List<Map<String, dynamic>> _statusOptions = [
    {'label': '全部', 'value': null},
    {'label': '草稿', 'value': 0},
    {'label': '已发布', 'value': 1},
    {'label': '已删除', 'value': 2},
  ];

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadArticles();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // 加载分类列表
  Future<void> _loadCategories() async {
    try {
      final response = await _apiService.getCategories();
      if (response['success'] && response['data'] != null) {
        final categoriesData = response['data']['categories'] as List<dynamic>;
        setState(() {
          _categories = categoriesData
              .map((item) => Category.fromJson(item))
              .toList();
        });
      }
    } catch (e) {
      print('加载分类失败: $e');
    }
  }

  // 加载文章列表
  Future<void> _loadArticles() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final response = await _apiService.getArticles(
        page: _currentPage,
        limit: _pageSize,
        category: _selectedCategoryId?.toString(),
      );
      
      if (response['success'] == true && response['data'] != null) {
        setState(() {
          _articles = (response['data']['articles'] as List)
              .map((item) => Article.fromJson(item))
              .toList();
          _total = response['data']['pagination']?['total'] ?? 0;
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showSnackBar('加载文章失败: $e', isError: true);
    }
  }

  // 处理搜索
  void _handleSearch() {
    setState(() {
      _searchKeyword = _searchController.text.trim();
      _currentPage = 1;
    });
    _loadArticles();
  }

  // 处理重置
  void _handleReset() {
    setState(() {
      _searchController.clear();
      _searchKeyword = '';
      _selectedCategoryId = null;
      _selectedStatus = null;
      _currentPage = 1;
    });
    _loadArticles();
  }

  // 处理文章选择
  void _handleArticleSelection(Article article, bool? value) {
    setState(() {
      if (value == true) {
        _selectedArticles.add(article);
      } else {
        _selectedArticles.removeWhere((item) => item.id == article.id);
      }
    });
  }

  // 发布文章
  Future<void> _publishArticle(Article article) async {
    try {
      await _apiService.updateArticle(
        id: article.id,
        status: 1,
      );
      _showSnackBar('文章发布成功');
      _loadArticles();
    } catch (e) {
      _showSnackBar('发布失败: $e', isError: true);
    }
  }

  // 下线文章
  Future<void> _unpublishArticle(Article article) async {
    try {
      await _apiService.updateArticle(
        id: article.id,
        status: 0,
      );
      _showSnackBar('文章下线成功');
      _loadArticles();
    } catch (e) {
      _showSnackBar('下线失败: $e', isError: true);
    }
  }

  // 删除文章
  Future<void> _deleteArticle(Article article) async {
    final confirmed = await _showConfirmDialog('确认删除', '确定要删除这篇文章吗？');
    if (confirmed) {
      try {
        await _apiService.deleteArticle(article.id);
        _showSnackBar('文章删除成功');
        _loadArticles();
      } catch (e) {
        _showSnackBar('删除失败: $e', isError: true);
      }
    }
  }

  // 恢复文章
  Future<void> _restoreArticle(Article article) async {
    try {
      await _apiService.updateArticle(
        id: article.id,
        status: 0,
      );
      _showSnackBar('文章恢复成功');
      _loadArticles();
    } catch (e) {
      _showSnackBar('恢复失败: $e', isError: true);
    }
  }

  // 永久删除文章
  Future<void> _permanentDeleteArticle(Article article) async {
    final confirmed = await _showConfirmDialog('确认永久删除', '此操作不可恢复，确定要永久删除这篇文章吗？');
    if (confirmed) {
      try {
        await _apiService.permanentDeleteArticle(article.id);
        _showSnackBar('文章永久删除成功');
        _loadArticles();
      } catch (e) {
        _showSnackBar('永久删除失败: $e', isError: true);
      }
    }
  }

  // 显示确认对话框
  Future<bool> _showConfirmDialog(String title, String content) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('确认'),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  // 显示提示信息
  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      body: Column(
        children: [
          _buildSearchAndFilter(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _articles.isEmpty
                    ? _buildEmptyState()
                    : _buildArticlesList(),
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      title: const Text(
        '文章管理',
        style: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 20,
        ),
      ),
      elevation: 0,
      shadowColor: Colors.transparent,
      actions: [
        IconButton(
          icon: const Icon(Icons.add),
          onPressed: () {
            Navigator.pushNamed(context, '${AppConstants.articlesRoute}/create');
          },
          tooltip: '写文章',
        ),
        IconButton(
          icon: const Icon(Icons.refresh),
          onPressed: _loadArticles,
          tooltip: '刷新',
        ),
      ],
    );
  }

  Widget _buildSearchAndFilter() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        children: [
          // 搜索栏
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: '搜索文章标题或内容...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.search),
                onPressed: _handleSearch,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            onSubmitted: (_) => _handleSearch(),
          ),
          const SizedBox(height: 12),
          // 筛选器
          Column(
            children: [
              // 分类筛选
              DropdownButtonFormField<int?>(
                value: _selectedCategoryId,
                decoration: InputDecoration(
                  labelText: '选择分类',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                items: [
                  const DropdownMenuItem<int?>(value: null, child: Text('全部分类')),
                  ..._categories.map((category) => DropdownMenuItem<int?>(
                    value: category.id,
                    child: Text(category.name),
                  )),
                ],
                onChanged: (value) {
                  setState(() {
                    _selectedCategoryId = value;
                  });
                  _loadArticles();
                },
              ),
              const SizedBox(height: 12),
              // 状态筛选
              DropdownButtonFormField<int?>(
                value: _selectedStatus,
                decoration: InputDecoration(
                  labelText: '文章状态',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                items: _statusOptions.map((option) => DropdownMenuItem<int?>(
                  value: option['value'],
                  child: Text(option['label']),
                )).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedStatus = value;
                  });
                  _loadArticles();
                },
              ),
              const SizedBox(height: 12),
              // 重置按钮
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _handleReset,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey[300],
                    foregroundColor: Colors.black87,
                  ),
                  child: const Text('重置'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildArticlesList() {
    return ListView.builder(
      itemCount: _articles.length,
      itemBuilder: (context, index) {
        final article = _articles[index];
        final isSelected = _selectedArticles.any((item) => item.id == article.id);
        
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Checkbox(
                      value: isSelected,
                      onChanged: (value) => _handleArticleSelection(article, value),
                    ),
                    Expanded(
                      child: Text(
                        article.title,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                      ),
                    ),
                    PopupMenuButton<String>(
                      onSelected: (value) => _handleArticleAction(value, article),
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(Icons.edit_outlined, size: 18),
                              SizedBox(width: 8),
                              Text('编辑'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'view',
                          child: Row(
                            children: [
                              Icon(Icons.visibility_outlined, size: 18),
                              SizedBox(width: 8),
                              Text('预览'),
                            ],
                          ),
                        ),
                        if (article.status == 0)
                          const PopupMenuItem(
                            value: 'publish',
                            child: Row(
                              children: [
                                Icon(Icons.publish_outlined, size: 18),
                                SizedBox(width: 8),
                                Text('发布'),
                              ],
                            ),
                          ),
                        if (article.status == 1)
                          const PopupMenuItem(
                            value: 'unpublish',
                            child: Row(
                              children: [
                                Icon(Icons.visibility_off_outlined, size: 18),
                                SizedBox(width: 8),
                                Text('下线'),
                              ],
                            ),
                          ),
                        if (article.status != 2)
                          const PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete_outlined, size: 18, color: Colors.red),
                                SizedBox(width: 8),
                                Text('删除', style: TextStyle(color: Colors.red)),
                              ],
                            ),
                          ),
                        if (article.status == 2) ...[
                          const PopupMenuItem(
                            value: 'restore',
                            child: Row(
                              children: [
                                Icon(Icons.restore_outlined, size: 18),
                                SizedBox(width: 8),
                                Text('恢复'),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'permanent_delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete_forever_outlined, size: 18, color: Colors.red),
                                SizedBox(width: 8),
                                Text('永久删除', style: TextStyle(color: Colors.red)),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    _buildStatusChip(article.status),
                    if (article.categoryName.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          article.categoryName,
                          style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                        ),
                      ),
                    Text(
                      '${article.viewCount} 次浏览',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '创建时间: ${_formatDate(article.createdAt)}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusChip(int status) {
    Color color;
    String text;
    
    switch (status) {
      case 0:
        color = Colors.orange;
        text = '草稿';
        break;
      case 1:
        color = Colors.green;
        text = '已发布';
        break;
      case 2:
        color = Colors.red;
        text = '已删除';
        break;
      default:
        color = Colors.grey;
        text = '未知';
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.article_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            '暂无文章',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '点击右上角按钮创建第一篇文章',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  void _handleArticleAction(String action, Article article) {
    switch (action) {
      case 'edit':
        Navigator.pushNamed(context, '${AppConstants.articlesRoute}/edit/${article.id}');
        break;
      case 'view':
        Navigator.pushNamed(
          context, 
          '/articles/preview',
          arguments: {'article': article},
        );
        break;
      case 'publish':
        _publishArticle(article);
        break;
      case 'unpublish':
        _unpublishArticle(article);
        break;
      case 'delete':
        _deleteArticle(article);
        break;
      case 'restore':
        _restoreArticle(article);
        break;
      case 'permanent_delete':
        _permanentDeleteArticle(article);
        break;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
} 