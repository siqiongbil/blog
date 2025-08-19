import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import 'dart:math';
import '../constants/app_constants.dart';
import '../models/image.dart';
import '../services/api_service.dart';
import '../utils/storage_utils.dart';

class ImagesView extends StatefulWidget {
  const ImagesView({super.key});

  @override
  State<ImagesView> createState() => _ImagesViewState();
}

class _ImagesViewState extends State<ImagesView> with TickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  
  List<ImageModel> _images = [];
  List<ImageModel> _selectedImages = [];
  bool _isLoading = false;
  bool _isUploading = false;
  bool _isUpdating = false;
  bool _showStatistics = false;
  
  // 分页信息
  int _currentPage = 1;
  int _totalPages = 1;
  int _totalItems = 0;
  int _pageSize = 24;
  
  // 筛选条件
  int? _uploadTypeFilter;
  String _searchKeyword = '';
  String _orderBy = 'created_at';
  String _order = 'DESC';
  
  // 上传相关
  File? _selectedFile;
  
  // 动画控制器
  late AnimationController _fadeController;
  late AnimationController _slideController;
  
  // 表单控制器
  final _formKey = GlobalKey<FormState>();
  final _fileNameController = TextEditingController();
  final _altTextController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _tagsController = TextEditingController();
  final _relatedIdController = TextEditingController();
  
  // 编辑相关
  ImageModel? _editingImage;
  bool _showEditDialog = false;
  
  // 统计信息
  Map<String, dynamic>? _statistics;
  
  // 上传类型选项
  final List<Map<String, dynamic>> _uploadTypeOptions = [
    {'label': '分类图片', 'value': 1},
    {'label': '文章图片', 'value': 2},
    {'label': '用户头像', 'value': 3},
    {'label': '其他', 'value': 4},
  ];

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _loadImages();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    _searchController.dispose();
    _fileNameController.dispose();
    _altTextController.dispose();
    _descriptionController.dispose();
    _tagsController.dispose();
    _relatedIdController.dispose();
    super.dispose();
  }

  // 加载图片列表
  Future<void> _loadImages() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final response = await _apiService.getImages(
        page: _currentPage,
        pageSize: _pageSize,
        uploadType: _uploadTypeFilter,
        keyword: _searchKeyword.isNotEmpty ? _searchKeyword : null,
        orderBy: _orderBy,
        order: _order,
      );

      if (response['success'] == true && response['data'] != null) {
        final imagesData = response['data']['images'] as List<dynamic>;
        final pagination = response['data']['pagination'];
        
        setState(() {
          _images = imagesData
              .map((item) => ImageModel.fromJson(item))
              .toList();
          _totalItems = pagination?['total'] ?? 0;
          _totalPages = pagination?['pages'] ?? 1;
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
      _showSnackBar('加载图片失败: $e', isError: true);
    }
  }

  // 加载统计信息
  Future<void> _loadStatistics() async {
    try {
      final response = await _apiService.getImageStatistics();
      if (response['success'] == true) {
        setState(() {
          _statistics = response['data'];
          _showStatistics = true;
        });
      }
    } catch (e) {
      _showSnackBar('加载统计信息失败: $e', isError: true);
    }
  }

  // 选择文件
  Future<void> _pickFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.single;
        if (file.path != null) {
          setState(() {
            _selectedFile = File(file.path!);
            if (_fileNameController.text.isEmpty) {
              _fileNameController.text = file.name;
            }
          });
        }
      }
    } catch (e) {
      _showSnackBar('选择文件失败: $e', isError: true);
    }
  }

  // 上传图片
  Future<void> _uploadImage() async {
    if (_selectedFile == null) {
      _showSnackBar('请先选择图片文件', isError: true);
      return;
    }

    try {
      setState(() {
        _isUploading = true;
      });

      final imageBytes = await _selectedFile!.readAsBytes();
      
      // 处理标签
      List<String>? tags;
      if (_tagsController.text.trim().isNotEmpty) {
        tags = _tagsController.text.split(',').map((e) => e.trim()).toList();
      }
      
      // 处理关联ID
      int? relatedId;
      if (_relatedIdController.text.trim().isNotEmpty) {
        relatedId = int.tryParse(_relatedIdController.text.trim());
      }
      
      final response = await _apiService.uploadImage(
        imageBytes,
        _selectedFile!.path.split('/').last,
        altText: _altTextController.text.trim().isEmpty ? null : _altTextController.text.trim(),
        description: _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
        tags: tags,
        relatedId: relatedId,
        uploadType: 1, // 默认上传类型
      );

      if (response['success'] == true) {
        _showSnackBar('图片上传成功');
        _clearUploadForm();
        _loadImages();
        Navigator.of(context).pop();
      } else {
        throw Exception(response['message'] ?? '上传失败');
      }
    } catch (e) {
      _showSnackBar('上传失败: $e', isError: true);
    } finally {
      setState(() {
        _isUploading = false;
      });
    }
  }

  // 清除上传表单
  void _clearUploadForm() {
    _selectedFile = null;
    _fileNameController.clear();
    _altTextController.clear();
    _descriptionController.clear();
    _tagsController.clear();
    _relatedIdController.clear();
  }

  // 显示上传对话框
  void _showUploadDialog() {
    _clearUploadForm();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return _buildUploadDialog(setDialogState);
        },
      ),
    );
  }

  // 编辑图片
  void _editImage(ImageModel image) {
    _editingImage = image;
    _altTextController.text = image.altText ?? '';
    _descriptionController.text = image.description ?? '';
    _tagsController.text = image.tags?.join(', ') ?? '';
    _relatedIdController.text = image.relatedId?.toString() ?? '';
    _showEditDialogDialog();
  }

  // 更新图片信息
  Future<void> _updateImage() async {
    if (_editingImage == null) return;

    try {
      setState(() {
        _isUpdating = true;
      });

      final data = {
        'alt_text': _altTextController.text.trim().isEmpty ? null : _altTextController.text.trim(),
        'description': _descriptionController.text.trim().isEmpty ? null : _descriptionController.text.trim(),
        'tags': _tagsController.text.trim().isEmpty ? null : _tagsController.text.split(',').map((e) => e.trim()).toList(),
        'upload_type': _editingImage!.uploadType,
        'related_id': _relatedIdController.text.trim().isEmpty ? null : int.tryParse(_relatedIdController.text.trim()),
      };

      final response = await _apiService.updateImage(_editingImage!.id, data);

      if (response['success'] == true) {
        _showSnackBar('图片信息更新成功');
        Navigator.of(context).pop();
        _loadImages();
      } else {
        throw Exception(response['message'] ?? '更新失败');
      }
    } catch (e) {
      _showSnackBar('更新失败: $e', isError: true);
    } finally {
      setState(() {
        _isUpdating = false;
      });
    }
  }

  // 删除图片
  Future<void> _deleteImage(ImageModel image) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除图片"${image.originalName}"吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final response = await _apiService.deleteImage(image.id);
        if (response['success'] == true) {
          _showSnackBar('图片删除成功');
          _loadImages();
        } else {
          throw Exception(response['message'] ?? '删除失败');
        }
      } catch (e) {
        _showSnackBar('删除失败: $e', isError: true);
      }
    }
  }

  // 复制图片URL
  void _copyImageUrl(ImageModel image) {
    // 这里可以实现复制到剪贴板的功能
    _showSnackBar('图片URL已复制: ${image.fileUrl}');
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

  // 获取图片URL
  String _getImageUrl(String imageUrl) {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return '${AppConstants.staticBaseUrl}$imageUrl';
  }

  // 处理搜索
  void _handleSearch() {
    setState(() {
      _searchKeyword = _searchController.text.trim();
      _currentPage = 1;
    });
    _loadImages();
  }

  // 处理筛选
  void _handleFilter() {
    setState(() {
      _currentPage = 1;
    });
    _loadImages();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '图片管理',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 20,
          ),
        ),
        backgroundColor: const Color(AppConstants.primaryColor),
        foregroundColor: Colors.white,
        elevation: 0,
        shadowColor: Colors.transparent,
        actions: [
          IconButton(
            icon: const Icon(Icons.upload),
            onPressed: _showUploadDialog,
            tooltip: '上传图片',
          ),
          IconButton(
            icon: const Icon(Icons.bar_chart),
            onPressed: _showStatisticsDialogDialog,
            tooltip: '统计信息',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadImages,
            tooltip: '刷新',
          ),
        ],
      ),
      body: Column(
        children: [
          // 搜索和筛选区域
          _buildSearchAndFilterSection(),
          
          // 批量操作工具栏
          if (_selectedImages.isNotEmpty) _buildBatchActionToolbar(),
          
          // 图片网格
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _images.isEmpty
                    ? _buildEmptyState()
                    : _buildImageGrid(),
          ),
          
          // 分页
          if (_totalPages > 1) _buildPagination(),
        ],
      ),
    );
  }

  // 显示编辑对话框
  void _showEditDialogDialog() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => _buildEditDialog(),
    );
  }

  // 显示统计信息对话框
  void _showStatisticsDialogDialog() {
    showDialog(
      context: context,
      builder: (context) => _buildStatisticsDialog(),
    );
  }

  // 构建搜索和筛选区域
  Widget _buildSearchAndFilterSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        children: [
          // 第一行：搜索和类型筛选
          Row(
            children: [
              // 类型筛选
              DropdownButton<int?>(
                value: _uploadTypeFilter,
                hint: const Text('选择类型'),
                items: [
                  const DropdownMenuItem<int?>(value: null, child: Text('全部')),
                  ..._uploadTypeOptions.map((option) => DropdownMenuItem<int?>(
                    value: option['value'],
                    child: Text(option['label']),
                  )),
                ],
                onChanged: (value) {
                  setState(() {
                    _uploadTypeFilter = value;
                  });
                  _handleFilter();
                },
              ),
              const SizedBox(width: 16),
              
              // 搜索框
              Expanded(
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: '搜索文件名、描述',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.search),
                      onPressed: _handleSearch,
                    ),
                    border: const OutlineInputBorder(),
                  ),
                  onSubmitted: (_) => _handleSearch(),
                ),
              ),
              const SizedBox(width: 16),
              
              // 排序
              DropdownButton<String>(
                value: _orderBy,
                items: [
                  const DropdownMenuItem(value: 'created_at', child: Text('按创建时间')),
                  const DropdownMenuItem(value: 'updated_at', child: Text('按更新时间')),
                  const DropdownMenuItem(value: 'file_size', child: Text('按文件大小')),
                  const DropdownMenuItem(value: 'file_name', child: Text('按文件名')),
                ],
                onChanged: (value) {
                  setState(() {
                    _orderBy = value!;
                  });
                  _handleFilter();
                },
              ),
              const SizedBox(width: 8),
              
              DropdownButton<String>(
                value: _order,
                items: [
                  const DropdownMenuItem(value: 'DESC', child: Text('降序')),
                  const DropdownMenuItem(value: 'ASC', child: Text('升序')),
                ],
                onChanged: (value) {
                  setState(() {
                    _order = value!;
                  });
                  _handleFilter();
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 构建批量操作工具栏
  Widget _buildBatchActionToolbar() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.blue[50],
      child: Row(
        children: [
          Text('已选择 ${_selectedImages.length} 张图片'),
          const Spacer(),
          ElevatedButton(
            onPressed: () {
              // TODO: 实现批量删除
              _showSnackBar('批量删除功能待实现');
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('批量删除'),
          ),
        ],
      ),
    );
  }

  // 构建图片网格
  Widget _buildImageGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.8,
      ),
      itemCount: _images.length,
      itemBuilder: (context, index) {
        final image = _images[index];
        final isSelected = _selectedImages.contains(image);
        
        return GestureDetector(
          onTap: () {
            setState(() {
              if (isSelected) {
                _selectedImages.remove(image);
              } else {
                _selectedImages.add(image);
              }
            });
          },
          onLongPress: () => _showImageDetail(image),
          child: Container(
            decoration: BoxDecoration(
              border: Border.all(
                color: isSelected ? Colors.blue : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Stack(
              children: [
                Column(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(6),
                        ),
                        child: Image.network(
                          _getImageUrl(image.fileUrl),
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: Colors.grey[200],
                              child: const Icon(Icons.error),
                            );
                          },
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            image.originalName,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.blue[100],
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    image.uploadTypeLabel,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.blue[700],
                                      fontWeight: FontWeight.w500,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                image.formattedFileSize,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (isSelected)
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: const BoxDecoration(
                        color: Colors.blue,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check,
                        color: Colors.white,
                        size: 12,
                      ),
                    ),
                  ),
                // 操作按钮
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildActionButton(
                          icon: Icons.copy,
                          onPressed: () => _copyImageUrl(image),
                          tooltip: '复制链接',
                        ),
                        _buildActionButton(
                          icon: Icons.edit,
                          onPressed: () => _editImage(image),
                          tooltip: '编辑',
                        ),
                        _buildActionButton(
                          icon: Icons.delete,
                          onPressed: () => _deleteImage(image),
                          tooltip: '删除',
                          isDestructive: true,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // 构建分页
  Widget _buildPagination() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: _currentPage > 1
                ? () {
                    setState(() {
                      _currentPage--;
                    });
                    _loadImages();
                  }
                : null,
            icon: const Icon(Icons.chevron_left),
          ),
          Text('第 $_currentPage 页，共 $_totalPages 页'),
          IconButton(
            onPressed: _currentPage < _totalPages
                ? () {
                    setState(() {
                      _currentPage++;
                    });
                    _loadImages();
                  }
                : null,
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }

  // 构建空状态
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.image_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            '暂无图片',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '点击右上角按钮上传第一张图片',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  // 显示图片详情
  void _showImageDetail(ImageModel image) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Container(
          width: 600,
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    '图片详情',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  _getImageUrl(image.fileUrl),
                  height: 300,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 16),
              _buildDetailInfo(image),
            ],
          ),
        ),
      ),
    );
  }

  // 构建详情信息
  Widget _buildDetailInfo(ImageModel image) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailRow('文件名', image.originalName),
        _buildDetailRow('文件大小', image.formattedFileSize),
        _buildDetailRow('图片尺寸', image.dimensionsString),
        _buildDetailRow('MIME类型', image.mimeType),
        _buildDetailRow('上传类型', image.uploadTypeLabel),
        _buildDetailRow('上传时间', image.formattedCreatedAt),
        _buildDetailRow('文件URL', image.fileUrl, isUrl: true),
        if (image.altText != null) _buildDetailRow('替代文本', image.altText!),
        if (image.description != null) _buildDetailRow('描述', image.description!),
        if (image.tags != null && image.tags!.isNotEmpty)
          _buildDetailRow('标签', image.tags!.join(', ')),
      ],
    );
  }

  // 构建详情行
  Widget _buildDetailRow(String label, String value, {bool isUrl = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: isUrl
                ? SelectableText(value)
                : Text(value),
          ),
        ],
      ),
    );
  }

  // 构建上传对话框
  Widget _buildUploadDialog([StateSetter? setDialogState]) {
    return Dialog(
      child: Container(
        width: 500,
        height: MediaQuery.of(context).size.height * 0.8,
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '上传图片',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      // 文件选择
                      GestureDetector(
                        onTap: _pickFile,
                        child: Container(
                          width: double.infinity,
                          height: 120,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey[300]!),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: _selectedFile != null
                              ? Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.image, size: 32, color: Colors.grey[600]),
                                    const SizedBox(height: 8),
                                    Text(
                                      _selectedFile!.path.split('/').last,
                                      style: TextStyle(color: Colors.grey[600]),
                                    ),
                                  ],
                                )
                              : Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.upload, size: 32, color: Colors.grey[400]),
                                    const SizedBox(height: 8),
                                    Text(
                                      '点击选择图片文件',
                                      style: TextStyle(color: Colors.grey[500]),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // 文件名
                      TextFormField(
                        controller: _fileNameController,
                        decoration: const InputDecoration(
                          labelText: '文件名（可选）',
                          hintText: '不填则使用原文件名',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // 替代文本
                      TextFormField(
                        controller: _altTextController,
                        decoration: const InputDecoration(
                          labelText: '替代文本（可选）',
                          hintText: '图片的替代文本',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // 描述
                      TextFormField(
                        controller: _descriptionController,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: '描述（可选）',
                          hintText: '图片描述',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // 标签
                      TextFormField(
                        controller: _tagsController,
                        decoration: const InputDecoration(
                          labelText: '标签（可选）',
                          hintText: '用逗号分隔多个标签',
                          border: OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // 关联ID
                      TextFormField(
                        controller: _relatedIdController,
                        decoration: const InputDecoration(
                          labelText: '关联ID（可选）',
                          hintText: '相关联的ID',
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('取消'),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _isUploading ? null : _uploadImage,
                  child: _isUploading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('上传'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // 构建编辑对话框
  Widget _buildEditDialog() {
    return Dialog(
      child: Container(
        width: 500,
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '编辑图片信息',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Form(
              key: _formKey,
              child: Column(
                children: [
                  // 替代文本
                  TextFormField(
                    controller: _altTextController,
                    decoration: const InputDecoration(
                      labelText: '替代文本',
                      hintText: '图片的替代文本',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // 描述
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: '描述',
                      hintText: '图片描述',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // 标签
                  TextFormField(
                    controller: _tagsController,
                    decoration: const InputDecoration(
                      labelText: '标签',
                      hintText: '用逗号分隔多个标签',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // 关联ID
                  TextFormField(
                    controller: _relatedIdController,
                    decoration: const InputDecoration(
                      labelText: '关联ID',
                      hintText: '相关联的ID',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  child: const Text('取消'),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _isUpdating ? null : _updateImage,
                  child: _isUpdating
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('保存'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // 构建统计信息对话框
  Widget _buildStatisticsDialog() {
    if (_statistics == null) {
      return const Dialog(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('加载统计信息中...'),
        ),
      );
    }

    return Dialog(
      child: Container(
        width: 500,
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '图片统计信息',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildStatisticsContent(),
          ],
        ),
      ),
    );
  }

  // 构建统计信息内容
  Widget _buildStatisticsContent() {
    final stats = _statistics!;
    
    return Column(
      children: [
        // 总体统计
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildStatRow('图片总数', '${stats['total'] ?? 0}'),
                _buildStatRow('总文件大小', _formatFileSize(stats['totalSize'] ?? 0)),
                _buildStatRow('平均文件大小', _formatFileSize(stats['averageSize'] ?? 0)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        
        // 按类型统计
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '按类型统计',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ..._uploadTypeOptions.map((option) {
                  final count = stats['byType']?[option['value']] ?? 0;
                  return _buildStatRow(option['label'], '$count 张');
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // 构建统计行
  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  // 格式化文件大小
  String _formatFileSize(int bytes) {
    if (bytes == 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    final i = (log(bytes) / log(k)).floor();
    final clampedIndex = i.clamp(0, sizes.length - 1);
    return '${(bytes / pow(k, clampedIndex)).toStringAsFixed(2)} ${sizes[clampedIndex]}';
  }

  // 构建操作按钮
  Widget _buildActionButton({
    required IconData icon,
    required VoidCallback onPressed,
    required String tooltip,
    bool isDestructive = false,
  }) {
    return Tooltip(
      message: tooltip,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: IconButton(
          onPressed: onPressed,
          icon: Icon(
            icon,
            size: 16,
            color: isDestructive ? Colors.red[300] : Colors.white,
          ),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
      ),
    );
  }
} 