import 'package:flutter/material.dart';
import '../models/category.dart';
import '../services/api_service.dart';
import '../constants/app_constants.dart';
import '../components/image_picker.dart';

class CategoriesView extends StatefulWidget {
  const CategoriesView({super.key});

  @override
  State<CategoriesView> createState() => _CategoriesViewState();
}

class _CategoriesViewState extends State<CategoriesView> {
  final ApiService _apiService = ApiService();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _slugController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _sortOrderController = TextEditingController();
  
  bool _isLoading = false;
  bool _isSubmitting = false;
  List<Category> _categories = [];
  Category? _editingCategory;
  String? _selectedImageUrl;
  
  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _slugController.dispose();
    _descriptionController.dispose();
    _sortOrderController.dispose();
    super.dispose();
  }

  // 加载分类列表
  Future<void> _loadCategories() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final response = await _apiService.getCategories();
      
      if (response['success'] == true && response['data'] != null) {
        final categoriesData = response['data']['categories'] as List<dynamic>;
        
        setState(() {
          _categories = categoriesData
              .map((item) => Category.fromJson(item))
              .toList();
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
      _showSnackBar('加载分类失败: $e', isError: true);
    }
  }

  // 显示创建对话框
  void _showCreateCategoryDialog() {
    _editingCategory = null;
    _nameController.clear();
    _slugController.clear();
    _descriptionController.clear();
    _sortOrderController.clear();
    _selectedImageUrl = null;
    _showDialog();
  }

  // 显示对话框
  void _showDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return _buildCreateDialog(setDialogState);
        },
      ),
    );
  }

  // 显示编辑对话框
  void _showEditCategoryDialog(Category category) {
    _editingCategory = category;
    _nameController.text = category.name;
    _slugController.text = category.slug;
    _descriptionController.text = category.description ?? '';
    _sortOrderController.text = category.sortOrder?.toString() ?? '0';
    _selectedImageUrl = category.imageUrl;
    _showDialog();
  }

  // 提交表单
  Future<void> _submitForm() async {
    if (_nameController.text.trim().isEmpty || _slugController.text.trim().isEmpty) {
      _showSnackBar('请填写分类名称和别名', isError: true);
      return;
    }

    try {
      setState(() {
        _isSubmitting = true;
      });

      final name = _nameController.text.trim();
      final slug = _slugController.text.trim();
      final description = _descriptionController.text.trim();
      final sortOrder = int.tryParse(_sortOrderController.text) ?? 0;
      final imageUrl = _selectedImageUrl != null ? _getImageUrl(_selectedImageUrl!) : null;

      if (_editingCategory != null) {
        // 更新分类
        await _apiService.updateCategory(
          id: _editingCategory!.id,
          name: name,
          slug: slug,
          description: description.isNotEmpty ? description : null,
          sortOrder: sortOrder,
          imageUrl: imageUrl,
        );
        _showSnackBar('分类更新成功');
      } else {
        // 创建分类
        await _apiService.createCategory(
          name: name,
          slug: slug,
          description: description.isNotEmpty ? description : null,
          sortOrder: sortOrder,
          imageUrl: imageUrl,
        );
        _showSnackBar('分类创建成功');
      }

      setState(() {
        _isSubmitting = false;
      });
      
      Navigator.of(context).pop(); // 关闭对话框
      _loadCategories();
    } catch (e) {
      setState(() {
        _isSubmitting = false;
      });
      _showSnackBar('操作失败: $e', isError: true);
    }
  }

  // 删除分类
  Future<void> _deleteCategory(Category category) async {
    final confirmed = await _showConfirmDialog('确认删除', '确定要删除分类"${category.name}"吗？');
    if (confirmed) {
      try {
        await _apiService.deleteCategory(category.id);
        _showSnackBar('分类删除成功');
        _loadCategories();
      } catch (e) {
        _showSnackBar('删除失败: $e', isError: true);
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
      appBar: AppBar(
        title: const Text(
          '分类管理',
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
            onPressed: _showCreateCategoryDialog,
            tooltip: '新建分类',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCategories,
            tooltip: '刷新',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _categories.isEmpty
              ? _buildEmptyState()
              : _buildCategoriesList(),
    );
  }

  Widget _buildCategoriesList() {
    return ListView.builder(
      itemCount: _categories.length,
      itemBuilder: (context, index) {
        final category = _categories[index];
        
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ListTile(
            leading: _buildCategoryImage(category),
            title: Text(
              category.name,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '别名: ${category.slug}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                if (category.description?.isNotEmpty == true)
                  Text(
                    category.description!,
                    style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                Text(
                  '排序: ${category.sortOrder ?? 0} | 文章: ${category.articleCount ?? 0}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
              ],
            ),
            trailing: PopupMenuButton<String>(
              onSelected: (value) {
                switch (value) {
                  case 'edit':
                    _showEditCategoryDialog(category);
                    break;
                  case 'delete':
                    _deleteCategory(category);
                    break;
                }
              },
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
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete_outlined, size: 18, color: Colors.red),
                      SizedBox(width: 8),
                      Text('删除', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.category_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            '暂无分类',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '点击右上角按钮创建第一个分类',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  // 构建分类图片
  Widget _buildCategoryImage(Category category) {
    if (category.imageUrl != null && category.imageUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          _getImageUrl(category.imageUrl!),
          width: 50,
          height: 50,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            print('❌ 图片加载失败: ${category.imageUrl} - $error');
            return _buildDefaultAvatar(category);
          },
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            );
          },
        ),
      );
    }
    return _buildDefaultAvatar(category);
  }

  // 构建默认头像
  Widget _buildDefaultAvatar(Category category) {
    return Container(
      width: 50,
      height: 50,
      decoration: BoxDecoration(
        color: const Color(0xFF667eea),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Text(
          category.name.isNotEmpty ? category.name[0].toUpperCase() : 'C',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
    );
  }

  // 获取图片URL
  String _getImageUrl(String imageUrl) {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // 如果是相对路径，拼接静态资源URL
    return '${AppConstants.staticBaseUrl}$imageUrl';
  }

  // 创建/编辑分类对话框
  Widget _buildCreateDialog([StateSetter? setDialogState]) {
    return AlertDialog(
      title: Text(_editingCategory != null ? '编辑分类' : '新建分类'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: '分类名称 *',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _slugController,
              decoration: const InputDecoration(
                labelText: '别名 *',
                border: OutlineInputBorder(),
                hintText: '用于URL，如：tech 或 frontend',
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: '描述',
                border: OutlineInputBorder(),
                hintText: '分类描述（可选）',
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _sortOrderController,
              decoration: const InputDecoration(
                labelText: '排序',
                border: OutlineInputBorder(),
                hintText: '数字越小排序越靠前',
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            const Text(
              '分类图片',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            ImagePicker(
              value: _selectedImageUrl,
              uploadType: 1, // 分类图片
              onChanged: (imageUrl) {
                _selectedImageUrl = imageUrl;
                if (setDialogState != null) {
                  setDialogState(() {});
                }
              },
            ),
          ],
        ),
      ),
             actions: [
         TextButton(
           onPressed: () {
             Navigator.of(context).pop();
           },
           child: const Text('取消'),
         ),
        ElevatedButton(
          onPressed: _isSubmitting ? null : _submitForm,
          child: _isSubmitting
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(_editingCategory != null ? '更新' : '创建'),
        ),
      ],
    );
  }
} 