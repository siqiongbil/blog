import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'dart:io';
import '../constants/app_constants.dart';
import '../models/category.dart';
import '../models/tag.dart';
import '../services/api_service.dart';

class ArticleCreateView extends StatefulWidget {
  const ArticleCreateView({super.key});

  @override
  State<ArticleCreateView> createState() => _ArticleCreateViewState();
}

class _ArticleCreateViewState extends State<ArticleCreateView> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  
  // 表单控制器
  final _titleController = TextEditingController();
  final _summaryController = TextEditingController();
  final _contentController = TextEditingController();
  
  // 状态变量
  bool _isLoading = false;
  bool _isSaving = false;
  bool _isPublishing = false;
  bool _showPreview = false;
  
  // 数据
  List<Category> _categories = [];
  List<Tag> _tags = [];
  Category? _selectedCategory;
  List<String> _selectedTags = [];
  String? _coverImage;
  File? _coverImageFile;
  
  // 表单验证
  final _formRules = {
    'title': [
      (value) {
        if (value == null || value.trim().isEmpty) {
          return '请输入文章标题';
        }
        if (value.length > 255) {
          return '标题长度不能超过255个字符';
        }
        return null;
      }
    ],
    'content': [
      (value) {
        if (value == null || value.trim().isEmpty) {
          return '请输入文章内容';
        }
        return null;
      }
    ],
    'category': [
      (value) {
        if (value == null) {
          return '请选择文章分类';
        }
        return null;
      }
    ]
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _summaryController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  // 加载数据
  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // 加载分类和标签，使用try-catch分别处理
      List<Category> categories = [];
      List<Tag> tags = [];
      
      try {
        final response = await _apiService.getCategories();
        if (response['success'] && response['data'] != null) {
          final categoriesData = response['data']['categories'] as List<dynamic>;
          categories = categoriesData.map((json) => Category.fromJson(json)).toList();
        }
      } catch (e) {
        print('加载分类失败: $e');
        // 使用默认分类
        categories = [
          Category(
            id: 1,
            name: '技术',
            slug: 'tech',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
          Category(
            id: 2,
            name: '生活',
            slug: 'life',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        ];
      }
      
      try {
        final response = await _apiService.getTags();
        if (response['success'] == true && response['data'] != null) {
          final tagsData = response['data']['tags'] as List<dynamic>;
          tags = tagsData.map((json) => Tag.fromJson(json)).toList();
        }
      } catch (e) {
        print('加载标签失败: $e');
        // 使用默认标签
        tags = [
          Tag(
            id: 1,
            name: 'Flutter',
            slug: 'flutter',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
          Tag(
            id: 2,
            name: 'Dart',
            slug: 'dart',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
          Tag(
            id: 3,
            name: '移动开发',
            slug: 'mobile',
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        ];
      }
      
      setState(() {
        _categories = categories;
        _tags = tags;
        // 设置默认选中的分类
        if (_categories.isNotEmpty && _selectedCategory == null) {
          _selectedCategory = _categories.first;
        }

      });
    } catch (e) {
      _showErrorSnackBar('加载数据失败: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // 选择封面图片
  Future<void> _pickCoverImage() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.single;
        if (file.path != null) {
          setState(() {
            _coverImageFile = File(file.path!);
          });
        }
      }
    } catch (e) {
      _showErrorSnackBar('选择图片失败: $e');
    }
  }

  // 上传封面图片
  Future<String?> _uploadCoverImage() async {
    if (_coverImageFile == null) return null;
    
    try {
      final imageBytes = await _coverImageFile!.readAsBytes();
      final response = await _apiService.uploadImage(imageBytes, _coverImageFile!.path.split('/').last);
      
      if (response['success']) {
        return response['data']['url'];
      } else {
        throw Exception(response['message'] ?? '上传失败');
      }
    } catch (e) {
      _showErrorSnackBar('上传封面图片失败: $e');
      return null;
    }
  }

  // 保存草稿
  Future<void> _saveDraft() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
    });

    try {
      // 上传封面图片
      String? coverImageUrl = await _uploadCoverImage();
      
      final response = await _apiService.createArticle(
        title: _titleController.text.trim(),
        content: _contentController.text.trim(),
        summary: _summaryController.text.trim().isEmpty ? null : _summaryController.text.trim(),
        coverImage: coverImageUrl,
        categoryId: _selectedCategory!.id,
        tags: _selectedTags.isEmpty ? null : _selectedTags,
        status: 0, // 草稿状态
      );

      if (response['success']) {
        _showSuccessSnackBar('草稿保存成功');
        Navigator.pop(context, true);
      } else {
        throw Exception(response['message'] ?? '保存失败');
      }
    } catch (e) {
      _showErrorSnackBar('保存草稿失败: $e');
    } finally {
      setState(() {
        _isSaving = false;
      });
    }
  }

  // 发布文章
  Future<void> _publishArticle() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isPublishing = true;
    });

    try {
      // 上传封面图片
      String? coverImageUrl = await _uploadCoverImage();
      
      final response = await _apiService.createArticle(
        title: _titleController.text.trim(),
        content: _contentController.text.trim(),
        summary: _summaryController.text.trim().isEmpty ? null : _summaryController.text.trim(),
        coverImage: coverImageUrl,
        categoryId: _selectedCategory!.id,
        tags: _selectedTags.isEmpty ? null : _selectedTags,
        status: 1, // 发布状态
      );

      if (response['success']) {
        _showSuccessSnackBar('文章发布成功');
        Navigator.pop(context, true);
      } else {
        throw Exception(response['message'] ?? '发布失败');
      }
    } catch (e) {
      _showErrorSnackBar('发布文章失败: $e');
    } finally {
      setState(() {
        _isPublishing = false;
      });
    }
  }

  // 预览文章
  void _showPreviewDialog() {
    if (_titleController.text.trim().isEmpty || _contentController.text.trim().isEmpty) {
      _showErrorSnackBar('请先填写标题和内容');
      return;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.preview, color: const Color(AppConstants.primaryColor)),
            const SizedBox(width: 8),
            const Text('文章预览'),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          height: MediaQuery.of(context).size.height * 0.7,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 标题
                Text(
                  _titleController.text.trim(),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                if (_selectedCategory != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(AppConstants.primaryColor).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _selectedCategory!.name,
                      style: TextStyle(
                        color: const Color(AppConstants.primaryColor),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                if (_selectedTags.isNotEmpty) ...[
                  Wrap(
                    spacing: 4,
                    children: _selectedTags.map((tag) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        tag,
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade700,
                        ),
                      ),
                    )).toList(),
                  ),
                  const SizedBox(height: 8),
                ],
                if (_summaryController.text.trim().isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Text(
                      _summaryController.text.trim(),
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey.shade600,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                // 使用Markdown渲染内容
                MarkdownBody(
                  data: _contentController.text.trim(),
                  styleSheet: MarkdownStyleSheet(
                    h1: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    h2: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    h3: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    p: const TextStyle(fontSize: 16, height: 1.6),
                    code: TextStyle(
                      fontSize: 14,
                      backgroundColor: Colors.grey.shade200,
                      fontFamily: 'monospace',
                    ),
                    codeblockDecoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('关闭'),
          ),
        ],
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(Icons.edit_note, size: 18),
            ),
            const SizedBox(width: 8),
            const Text(
              '写新文章',
              style: TextStyle(fontSize: 16),
            ),
          ],
        ),
        backgroundColor: const Color(AppConstants.primaryColor),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          if (!_isSaving && !_isPublishing) ...[
            // 使用更紧凑的图标按钮
            IconButton(
              onPressed: _showPreviewDialog,
              icon: const Icon(Icons.preview, color: Colors.white, size: 20),
              tooltip: '预览',
              padding: const EdgeInsets.all(8),
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
            IconButton(
              onPressed: _saveDraft,
              icon: const Icon(Icons.save, color: Colors.white, size: 20),
              tooltip: '保存草稿',
              padding: const EdgeInsets.all(8),
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
            // 使用更小的发布按钮
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: SizedBox(
                height: 32,
                child: ElevatedButton(
                  onPressed: _publishArticle,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(AppConstants.primaryColor),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    minimumSize: const Size(40, 24),
                  ),
                  child: const Text(
                    '发布',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                  ),
                ),
              ),
            ),
          ] else ...[
            // 更紧凑的加载状态
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _isSaving ? '保存中...' : '发布中...',
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
      body: _isLoading
          ? Container(
              color: Colors.grey.shade50,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('加载中...', style: TextStyle(fontSize: 16, color: Colors.grey)),
                  ],
                ),
              ),
            )
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 标题输入卡片
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.title, color: const Color(AppConstants.primaryColor)),
                                const SizedBox(width: 8),
                                const Text(
                                  '文章标题',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _titleController,
                              decoration: InputDecoration(
                                hintText: '请输入文章标题',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide(color: Colors.grey.shade300),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide(color: Colors.grey.shade300),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: const BorderSide(color: Color(AppConstants.primaryColor), width: 2),
                                ),
                                filled: true,
                                fillColor: Colors.grey.shade50,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              ),
                              validator: _formRules['title']!.first,
                              maxLength: 255,
                              style: const TextStyle(fontSize: 16),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 分类和标签卡片
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.category, color: const Color(AppConstants.primaryColor)),
                                const SizedBox(width: 8),
                                const Text(
                                  '分类与标签',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            // 分类选择
                            DropdownButtonFormField<Category>(
                              value: _selectedCategory,
                              decoration: InputDecoration(
                                labelText: '选择分类',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide(color: Colors.grey.shade300),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide(color: Colors.grey.shade300),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: const BorderSide(color: Color(AppConstants.primaryColor), width: 2),
                                ),
                                filled: true,
                                fillColor: Colors.grey.shade50,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              ),
                              hint: const Text('请选择分类'),
                              items: _categories.map((category) {
                                return DropdownMenuItem(
                                  value: category,
                                  child: Text(category.name),
                                );
                              }).toList(),
                              onChanged: (value) {
                                setState(() {
                                  _selectedCategory = value;
                                });
                              },
                              validator: _formRules['category']!.first,
                            ),
                            const SizedBox(height: 16),
                            // 标签选择
                            Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey.shade300),
                                borderRadius: BorderRadius.circular(8),
                                color: Colors.grey.shade50,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.only(left: 16, top: 12),
                                    child: Text(
                                      '选择标签',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey.shade600,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: _tags.map((tag) {
                                        final isSelected = _selectedTags.contains(tag.name);
                                        return FilterChip(
                                          label: Text(tag.name),
                                          selected: isSelected,
                                          onSelected: (selected) {
                                            setState(() {
                                              if (selected) {
                                                _selectedTags.add(tag.name);
                                              } else {
                                                _selectedTags.remove(tag.name);
                                              }
                                            });
                                          },
                                          selectedColor: const Color(AppConstants.primaryColor).withOpacity(0.2),
                                          checkmarkColor: const Color(AppConstants.primaryColor),
                                          backgroundColor: Colors.white,
                                          side: BorderSide(color: Colors.grey.shade300),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                        );
                                      }).toList(),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 封面图片卡片
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.image, color: const Color(AppConstants.primaryColor)),
                                const SizedBox(width: 8),
                                const Text(
                                  '封面图片',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: _pickCoverImage,
                                    icon: const Icon(Icons.add_photo_alternate),
                                    label: const Text('选择封面图片'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(AppConstants.primaryColor),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                if (_coverImageFile != null)
                                  Expanded(
                                    child: Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Colors.green.shade50,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.green.shade200),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(Icons.check_circle, color: Colors.green.shade600, size: 16),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              _coverImageFile!.path.split('/').last,
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.green.shade700,
                                                fontWeight: FontWeight.w500,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 摘要输入卡片
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.description, color: const Color(AppConstants.primaryColor)),
                                const SizedBox(width: 8),
                                const Text(
                                  '文章摘要',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.orange.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '可选',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: Colors.orange.shade700,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _summaryController,
                              decoration: InputDecoration(
                                hintText: '请输入文章摘要（可选）',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide(color: Colors.grey.shade300),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide(color: Colors.grey.shade300),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: const BorderSide(color: Color(AppConstants.primaryColor), width: 2),
                                ),
                                filled: true,
                                fillColor: Colors.grey.shade50,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              ),
                              maxLines: 3,
                              maxLength: 500,
                              style: const TextStyle(fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 内容输入卡片
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.edit_note, color: const Color(AppConstants.primaryColor)),
                                const SizedBox(width: 8),
                                const Text(
                                  '文章内容',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _contentController,
                              decoration: InputDecoration(
                                hintText: '请输入文章内容（支持Markdown格式）...',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide(color: Colors.grey.shade300),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: BorderSide(color: Colors.grey.shade300),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: const BorderSide(color: Color(AppConstants.primaryColor), width: 2),
                                ),
                                filled: true,
                                fillColor: Colors.grey.shade50,
                                contentPadding: const EdgeInsets.all(16),
                                alignLabelWithHint: true,
                              ),
                              maxLines: 20,
                              validator: _formRules['content']!.first,
                              style: const TextStyle(fontSize: 14, height: 1.5),
                            ),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.blue.shade200),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.info_outline, color: Colors.blue.shade600, size: 16),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      '支持Markdown格式：**粗体**、*斜体*、`代码`、# 标题、- 列表等',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.blue.shade700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 30),

                    // 底部操作按钮
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.1),
                            spreadRadius: 1,
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _isSaving ? null : _saveDraft,
                              icon: _isSaving 
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    )
                                  : const Icon(Icons.save),
                              label: Text(_isSaving ? '保存中...' : '保存草稿'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.grey.shade200,
                                foregroundColor: Colors.black87,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _isPublishing ? null : _publishArticle,
                              icon: _isPublishing
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Icon(Icons.publish),
                              label: Text(_isPublishing ? '发布中...' : '发布文章'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(AppConstants.primaryColor),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
    );
  }
} 