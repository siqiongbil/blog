import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import '../models/tag.dart';
import '../services/api_service.dart';
import '../constants/app_constants.dart';

class TagsView extends StatefulWidget {
  const TagsView({super.key});

  @override
  State<TagsView> createState() => _TagsViewState();
}

class _TagsViewState extends State<TagsView> {
  final ApiService _apiService = ApiService();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _slugController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  
  bool _isLoading = false;
  bool _isSubmitting = false;
  List<Tag> _tags = [];
  Tag? _editingTag;
  Color _selectedColor = const Color(0xFF409EFF);
  
  @override
  void initState() {
    super.initState();
    _loadTags();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _slugController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  // 加载标签列表
  Future<void> _loadTags() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final response = await _apiService.getTags();
      
      if (response['success'] == true && response['data'] != null) {
        final tagsData = response['data']['tags'] as List<dynamic>;
        
        setState(() {
          _tags = tagsData
              .map((item) => Tag.fromJson(item))
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
      _showSnackBar('加载标签失败: $e', isError: true);
    }
  }

  // 显示创建对话框
  void _showCreateTagDialog() {
    _editingTag = null;
    _nameController.clear();
    _slugController.clear();
    _descriptionController.clear();
    _selectedColor = const Color(0xFF409EFF);
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
  void _showEditTagDialog(Tag tag) {
    _editingTag = tag;
    _nameController.text = tag.name;
    _slugController.text = tag.slug;
    _descriptionController.text = tag.description ?? '';
    _selectedColor = tag.color != null ? _parseColor(tag.color!) : const Color(0xFF409EFF);
    _showDialog();
  }

  // 解析颜色字符串
  Color _parseColor(String colorString) {
    try {
      if (colorString.startsWith('#')) {
        return Color(int.parse(colorString.replaceFirst('#', '0xFF')));
      }
      return const Color(0xFF409EFF);
    } catch (e) {
      return const Color(0xFF409EFF);
    }
  }

  // 提交表单
  Future<void> _submitForm() async {
    if (_nameController.text.trim().isEmpty || _slugController.text.trim().isEmpty) {
      _showSnackBar('请填写标签名称和别名', isError: true);
      return;
    }

    try {
      setState(() {
        _isSubmitting = true;
      });

      final name = _nameController.text.trim();
      final slug = _slugController.text.trim();
      final description = _descriptionController.text.trim();
      final color = '#${_selectedColor.value.toRadixString(16).substring(2)}';

      if (_editingTag != null) {
        // 更新标签
        await _apiService.updateTag(
          id: _editingTag!.id,
          name: name,
          slug: slug,
          description: description.isNotEmpty ? description : null,
          color: color,
        );
        _showSnackBar('标签更新成功');
      } else {
        // 创建标签
        await _apiService.createTag(
          name: name,
          slug: slug,
          description: description.isNotEmpty ? description : null,
          color: color,
        );
        _showSnackBar('标签创建成功');
      }

      setState(() {
        _isSubmitting = false;
      });
      
      Navigator.of(context).pop(); // 关闭对话框
      _loadTags();
    } catch (e) {
      setState(() {
        _isSubmitting = false;
      });
      _showSnackBar('操作失败: $e', isError: true);
    }
  }

  // 删除标签
  Future<void> _deleteTag(Tag tag) async {
    final confirmed = await _showConfirmDialog('确认删除', '确定要删除标签"${tag.name}"吗？删除后相关文章将失去该标签。');
    if (confirmed) {
      try {
        await _apiService.deleteTag(tag.id);
        _showSnackBar('标签删除成功');
        _loadTags();
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
          '标签管理',
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
            onPressed: _showCreateTagDialog,
            tooltip: '新建标签',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTags,
            tooltip: '刷新',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _tags.isEmpty
              ? _buildEmptyState()
              : _buildTagsList(),
    );
  }

  Widget _buildTagsList() {
    return ListView.builder(
      itemCount: _tags.length,
      itemBuilder: (context, index) {
        final tag = _tags[index];
        
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: ListTile(
            leading: _buildTagColor(tag),
            title: Text(
              tag.name,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '别名: ${tag.slug}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                if (tag.description?.isNotEmpty == true)
                  Text(
                    tag.description!,
                    style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                Text(
                  '文章: ${tag.articleCount ?? 0}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
              ],
            ),
            trailing: PopupMenuButton<String>(
              onSelected: (value) {
                switch (value) {
                  case 'edit':
                    _showEditTagDialog(tag);
                    break;
                  case 'delete':
                    _deleteTag(tag);
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

  Widget _buildTagColor(Tag tag) {
    Color tagColor = const Color(0xFF409EFF);
    if (tag.color != null && tag.color!.isNotEmpty) {
      tagColor = _parseColor(tag.color!);
    }
    
    return Container(
      width: 50,
      height: 50,
      decoration: BoxDecoration(
        color: tagColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Center(
        child: Text(
          tag.name.isNotEmpty ? tag.name[0].toUpperCase() : 'T',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.label_outline,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            '暂无标签',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '点击右上角按钮创建第一个标签',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  // 创建/编辑标签对话框
  Widget _buildCreateDialog([StateSetter? setDialogState]) {
    return AlertDialog(
      title: Text(_editingTag != null ? '编辑标签' : '新建标签'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: '标签名称 *',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _slugController,
              decoration: const InputDecoration(
                labelText: '别名 *',
                border: OutlineInputBorder(),
                hintText: '用于URL，如：JavaScript 或 Vue3',
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: '描述',
                border: OutlineInputBorder(),
                hintText: '标签描述（可选）',
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            const Text(
              '标签颜色',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('选择颜色'),
                    content: SingleChildScrollView(
                      child: ColorPicker(
                        pickerColor: _selectedColor,
                        onColorChanged: (color) {
                          _selectedColor = color;
                          if (setDialogState != null) {
                            setDialogState(() {});
                          }
                        },
                        pickerAreaHeightPercent: 0.8,
                      ),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('确定'),
                      ),
                    ],
                  ),
                );
              },
              child: Container(
                width: double.infinity,
                height: 50,
                decoration: BoxDecoration(
                  color: _selectedColor,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Center(
                  child: Text(
                    '点击选择颜色',
                    style: TextStyle(
                      color: _selectedColor.computeLuminance() > 0.5 ? Colors.black : Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
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
              : Text(_editingTag != null ? '更新' : '创建'),
        ),
      ],
    );
  }
} 