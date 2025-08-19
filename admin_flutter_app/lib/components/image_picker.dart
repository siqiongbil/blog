import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import 'dart:math';
import '../services/api_service.dart';
import '../constants/app_constants.dart';

class ImagePicker extends StatefulWidget {
  final String? value;
  final int uploadType;
  final Function(String?) onChanged;

  const ImagePicker({
    super.key,
    this.value,
    this.uploadType = 1,
    required this.onChanged,
  });

  @override
  State<ImagePicker> createState() => _ImagePickerState();
}

class _ImagePickerState extends State<ImagePicker> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  bool _isUploading = false;
  List<Map<String, dynamic>> _images = [];
  String? _selectedImageUrl;
  int _currentPage = 1;
  int _pageSize = 24;
  int _total = 0;
  String _searchKeyword = '';
  int? _selectedUploadType;
  
  // 上传相关
  File? _selectedFile;
  final _fileNameController = TextEditingController();
  final _altTextController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _tagsController = TextEditingController();
  final _relatedIdController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _selectedImageUrl = widget.value;
    _selectedUploadType = widget.uploadType;
  }

  @override
  void dispose() {
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
        keyword: _searchKeyword.isNotEmpty ? _searchKeyword : null,
        orderBy: 'created_at',
        order: 'DESC',
      );

      if (response['success'] == true && response['data'] != null) {
        final imagesData = response['data']['images'] as List<dynamic>;
        setState(() {
          _images = imagesData.map((item) => Map<String, dynamic>.from(item)).toList();
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
      _showSnackBar('加载图片失败: $e', isError: true);
    }
  }

  // 显示图片选择对话框
  void _showImagePicker() {
    _selectedImageUrl = widget.value;
    // 先加载图片，再显示对话框
    _loadImages().then((_) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => StatefulBuilder(
          builder: (context, setDialogState) {
            return _buildImagePickerDialog(setDialogState);
          },
        ),
      );
    });
  }

  // 移除图片
  void _removeImage() {
    widget.onChanged(null);
  }

  // 确认选择
  void _confirmSelection() {
    print('🔍 确认选择图片: $_selectedImageUrl');
    widget.onChanged(_selectedImageUrl);
    // 强制更新父组件状态
    setState(() {});
    Navigator.of(context).pop();
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

  // 格式化文件大小
  String _formatFileSize(int bytes) {
    if (bytes == 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    final i = (log(bytes) / log(k)).floor();
    final clampedIndex = i.clamp(0, sizes.length - 1);
    return '${(bytes / pow(k, clampedIndex)).toStringAsFixed(1)} ${sizes[clampedIndex]}';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 当前图片显示
        if (widget.value != null && widget.value!.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    _getImageUrl(widget.value!),
                    width: 120,
                    height: 80,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        width: 120,
                        height: 80,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.error, color: Colors.grey),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: ElevatedButton(
                          onPressed: _showImagePicker,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                          child: const Text('更换图片', style: TextStyle(fontSize: 12)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: _removeImage,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                          child: const Text('移除', style: TextStyle(fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )
        else
          // 选择图片按钮
          GestureDetector(
            onTap: _showImagePicker,
            child: Container(
              width: 120,
              height: 80,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(8),
                color: Colors.grey[50],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.image, color: Colors.grey[400], size: 24),
                  const SizedBox(height: 4),
                  Text(
                    '选择图片',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 11,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  // 构建图片选择对话框
  Widget _buildImagePickerDialog([StateSetter? setDialogState]) {
    return Dialog(
      child: Container(
        width: 900,
        height: 600,
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // 标题
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '选择图片',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // 工具栏
            Column(
              children: [
                // 第一行：类型筛选和搜索
                Row(
                  children: [
                    // 类型筛选
                    DropdownButton<int?>(
                      value: _selectedUploadType,
                      hint: const Text('选择类型'),
                      items: [
                        const DropdownMenuItem<int?>(value: null, child: Text('全部')),
                        const DropdownMenuItem<int?>(value: 1, child: Text('分类图片')),
                        const DropdownMenuItem<int?>(value: 2, child: Text('文章图片')),
                        const DropdownMenuItem<int?>(value: 3, child: Text('用户头像')),
                        const DropdownMenuItem<int?>(value: 4, child: Text('其他')),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedUploadType = value;
                          _currentPage = 1;
                        });
                        _loadImages();
                      },
                    ),
                    const SizedBox(width: 8),
                    
                    // 搜索框
                    Expanded(
                      child: TextField(
                        decoration: const InputDecoration(
                          hintText: '搜索图片',
                          prefixIcon: Icon(Icons.search),
                          border: OutlineInputBorder(),
                        ),
                        onSubmitted: (value) {
                          setState(() {
                            _searchKeyword = value;
                            _currentPage = 1;
                          });
                          _loadImages();
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                
                // 第二行：上传按钮
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: () {
                        _showUploadDialog();
                      },
                      icon: const Icon(Icons.upload),
                      label: const Text('上传新图片'),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // 图片网格
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _images.isEmpty
                      ? const Center(child: Text('暂无图片'))
                      : GridView.builder(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.8,
                          ),
                          itemCount: _images.length,
                          itemBuilder: (context, index) {
                            final image = _images[index];
                            final imageUrl = image['file_url'] as String;
                            final isSelected = _selectedImageUrl == imageUrl;
                            
                            return GestureDetector(
                              onTap: () {
                                print('🔍 点击选择图片: $imageUrl');
                                _selectedImageUrl = imageUrl;
                                if (setDialogState != null) {
                                  setDialogState(() {});
                                }
                              },
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
                                              _getImageUrl(imageUrl),
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
                                          padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                image['original_name'] ?? '未知',
                                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                _formatFileSize(image['file_size'] ?? 0),
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: Colors.grey[600],
                                                  fontWeight: FontWeight.w500,
                                                ),
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
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
            
            // 分页
            if (_total > 0)
              Row(
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
                  Text('第 $_currentPage 页，共 ${(_total / _pageSize).ceil()} 页'),
                  IconButton(
                    onPressed: _currentPage < (_total / _pageSize).ceil()
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
            
            const SizedBox(height: 16),
            
            // 底部按钮
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('取消'),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _selectedImageUrl != null ? _confirmSelection : null,
                  child: const Text('确定'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
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
        uploadType: widget.uploadType,
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
                    TextField(
                      controller: _fileNameController,
                      decoration: const InputDecoration(
                        labelText: '文件名（可选）',
                        hintText: '不填则使用原文件名',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // 替代文本
                    TextField(
                      controller: _altTextController,
                      decoration: const InputDecoration(
                        labelText: '替代文本（可选）',
                        hintText: '图片的替代文本',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // 描述
                    TextField(
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
                    TextField(
                      controller: _tagsController,
                      decoration: const InputDecoration(
                        labelText: '标签（可选）',
                        hintText: '用逗号分隔多个标签',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // 关联ID
                    TextField(
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
} 