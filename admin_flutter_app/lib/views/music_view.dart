import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import '../constants/app_constants.dart';
import '../models/music.dart';
import '../services/api_service.dart';
import '../utils/storage_utils.dart';
import 'music_edit_view.dart';
import 'music_batch_view.dart';
import '../components/music_player.dart';

class MusicView extends StatefulWidget {
  const MusicView({super.key});

  @override
  State<MusicView> createState() => _MusicViewState();
}

class _MusicViewState extends State<MusicView> with TickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  
  List<Music> _musicList = [];
  List<Music> _filteredMusicList = [];
  List<Music> _selectedMusicList = [];
  bool _isLoading = false;
  bool _isUploading = false;
  bool _isBatchUploading = false;
  Music? _currentPlayingMusic;
  
  // 分页信息
  int _currentPage = 1;
  int _totalPages = 1;
  int _totalItems = 0;
  int _pageSize = 20;
  
  // 筛选条件
  int? _statusFilter;
  String _searchKeyword = '';
  
  // 上传相关
  File? _selectedFile;
  List<File> _selectedFiles = [];
  
  // 动画控制器
  late AnimationController _fadeController;
  late AnimationController _slideController;
  
  // 表单控制器
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _artistController = TextEditingController();
  final _albumController = TextEditingController();
  final _genreController = TextEditingController();
  final _yearController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _tagsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    
    _loadMusicList();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    _searchController.dispose();
    _titleController.dispose();
    _artistController.dispose();
    _albumController.dispose();
    _genreController.dispose();
    _yearController.dispose();
    _descriptionController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  // 加载音乐列表
  Future<void> _loadMusicList() async {
    if (_isLoading) return;
    
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await _apiService.getMusicList(
        page: _currentPage,
        pageSize: _pageSize,
        status: _statusFilter,
        keyword: _searchKeyword.isNotEmpty ? _searchKeyword : null,
      );

      if (response['success']) {
        final data = response['data'];
        final musicData = data['music'] as List;
        
        setState(() {
          _musicList = musicData.map((json) => Music.fromJson(json)).toList();
          _filteredMusicList = List.from(_musicList);
          
          if (data['pagination'] != null) {
            final pagination = data['pagination'];
            _totalItems = pagination['total'] ?? 0;
            _totalPages = pagination['pages'] ?? 1;
          }
        });
      }
    } catch (e) {
      _showErrorSnackBar('加载音乐列表失败: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // 搜索音乐
  void _searchMusic() {
    setState(() {
      _searchKeyword = _searchController.text.trim();
      _currentPage = 1;
    });
    _loadMusicList();
  }

  // 筛选音乐
  void _filterMusic(int? status) {
    setState(() {
      _statusFilter = status;
      _currentPage = 1;
    });
    _loadMusicList();
  }

  // 请求存储权限
  Future<bool> _requestStoragePermission() async {
    try {
      // 检查权限状态
      var status = await Permission.storage.status;
      
      if (status.isGranted) {
        return true;
      }
      
      // 请求权限
      status = await Permission.storage.request();
      
      if (status.isGranted) {
        return true;
      }
      
      // 如果权限被拒绝，显示说明
      if (status.isDenied) {
        _showErrorSnackBar('需要存储权限来选择音乐文件');
      } else if (status.isPermanentlyDenied) {
        _showErrorSnackBar('存储权限被永久拒绝，请在设置中手动开启');
      }
      
      return false;
    } catch (e) {
      print('权限请求失败: $e');
      return false;
    }
  }

  // 选择单个文件
  Future<void> _pickSingleFile() async {
    try {
      print('开始选择单个文件...');
      
      // 请求权限
      final hasPermission = await _requestStoragePermission();
      if (!hasPermission) {
        return;
      }
      
      // 先尝试选择任何类型的文件来测试
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.any,
        allowMultiple: false,
      );

      print('文件选择结果: $result');
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.single;
        print('选择的文件: ${file.name}, 路径: ${file.path}');
        
        // 检查文件扩展名
        final extension = file.extension?.toLowerCase();
        final allowedExtensions = ['mp3', 'wav', 'flac', 'ogg', 'm4a'];
        
        if (extension != null && allowedExtensions.contains(extension)) {
          setState(() {
            _selectedFile = File(file.path!);
            _selectedFiles.clear(); // 清除多文件选择
          });
          print('音乐文件已设置到状态中');
          _showSuccessSnackBar('已选择音乐文件: ${file.name}');
        } else {
          _showErrorSnackBar('请选择音乐文件格式 (mp3, wav, flac, ogg, m4a)');
        }
      } else {
        print('没有选择文件或文件列表为空');
      }
    } catch (e) {
      print('选择文件时发生错误: $e');
      _showErrorSnackBar('选择文件失败: $e');
    }
  }

  // 选择多个文件
  Future<void> _pickMultipleFiles() async {
    try {
      print('开始选择多个文件...');
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.any,
        allowMultiple: true,
      );

      print('多文件选择结果: $result');
      if (result != null && result.files.isNotEmpty) {
        print('选择的文件数量: ${result.files.length}');
        
        final allowedExtensions = ['mp3', 'wav', 'flac', 'ogg', 'm4a'];
        final musicFiles = <File>[];
        final invalidFiles = <String>[];
        
        for (final file in result.files) {
          print('文件: ${file.name}, 路径: ${file.path}');
          final extension = file.extension?.toLowerCase();
          
          if (extension != null && allowedExtensions.contains(extension)) {
            musicFiles.add(File(file.path!));
          } else {
            invalidFiles.add(file.name);
          }
        }
        
        setState(() {
          _selectedFiles = musicFiles;
          _selectedFile = null; // 清除单文件选择
        });
        
        print('音乐文件列表已设置到状态中，共 ${musicFiles.length} 个');
        
        if (musicFiles.isNotEmpty) {
          _showSuccessSnackBar('已选择 ${musicFiles.length} 个音乐文件');
        }
        
        if (invalidFiles.isNotEmpty) {
          _showErrorSnackBar('以下文件不是音乐格式: ${invalidFiles.join(', ')}');
        }
      } else {
        print('没有选择文件或文件列表为空');
      }
    } catch (e) {
      print('选择多个文件时发生错误: $e');
      _showErrorSnackBar('选择文件失败: $e');
    }
  }

  // 上传单个音乐
  Future<void> _uploadSingleMusic() async {
    if (_selectedFile == null) {
      _showErrorSnackBar('请先选择音乐文件');
      return;
    }

    setState(() {
      _isUploading = true;
    });

    try {
      final response = await _apiService.uploadMusic(
        _selectedFile!,
        title: _titleController.text.isNotEmpty ? _titleController.text : null,
        artist: _artistController.text.isNotEmpty ? _artistController.text : null,
        album: _albumController.text.isNotEmpty ? _albumController.text : null,
        genre: _genreController.text.isNotEmpty ? _genreController.text : null,
        year: _yearController.text.isNotEmpty ? int.tryParse(_yearController.text) : null,
        description: _descriptionController.text.isNotEmpty ? _descriptionController.text : null,
        tags: _tagsController.text.isNotEmpty 
            ? _tagsController.text.split(',').map((e) => e.trim()).toList()
            : null,
        onProgress: (progress) {
          // 进度回调，但在这个实现中我们暂时不使用
          print('上传进度: ${(progress * 100).toStringAsFixed(1)}%');
        },
      );

      if (response['success']) {
        _showSuccessSnackBar('音乐上传成功');
        _clearUploadForm();
        _loadMusicList();
        // 延迟关闭对话框，让用户看到成功消息
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          Navigator.of(context).pop();
        }
      } else {
        _showErrorSnackBar(response['message'] ?? '上传失败');
      }
    } catch (e) {
      _showErrorSnackBar('上传失败: $e');
    } finally {
      setState(() {
        _isUploading = false;
      });
    }
  }

  // 批量上传音乐
  Future<void> _uploadMultipleMusic() async {
    if (_selectedFiles.isEmpty) {
      _showErrorSnackBar('请先选择音乐文件');
      return;
    }

    setState(() {
      _isBatchUploading = true;
    });

    try {
      final response = await _apiService.uploadMultipleMusic(
        _selectedFiles,
        artist: _artistController.text.isNotEmpty ? _artistController.text : null,
        album: _albumController.text.isNotEmpty ? _albumController.text : null,
        genre: _genreController.text.isNotEmpty ? _genreController.text : null,
        year: _yearController.text.isNotEmpty ? int.tryParse(_yearController.text) : null,
        description: _descriptionController.text.isNotEmpty ? _descriptionController.text : null,
        tags: _tagsController.text.isNotEmpty 
            ? _tagsController.text.split(',').map((e) => e.trim()).toList()
            : null,
        onProgress: (progress) {
          // 进度回调，但在这个实现中我们暂时不使用
          print('批量上传进度: ${(progress * 100).toStringAsFixed(1)}%');
        },
      );

      if (response['success']) {
        final data = response['data'];
        final successCount = data['successCount'] ?? 0;
        final failureCount = data['failureCount'] ?? 0;
        final total = data['total'] ?? 0;
        
        _showSuccessSnackBar('批量上传完成。成功：$successCount个，失败：$failureCount个，总计：$total个');
        _clearUploadForm();
        _loadMusicList();
        // 延迟关闭对话框，让用户看到成功消息
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          Navigator.of(context).pop();
        }
      } else {
        _showErrorSnackBar(response['message'] ?? '批量上传失败');
      }
    } catch (e) {
      _showErrorSnackBar('批量上传失败: $e');
    } finally {
      setState(() {
        _isBatchUploading = false;
      });
    }
  }

  // 清除上传表单
  void _clearUploadForm() {
    setState(() {
      _selectedFile = null;
      _selectedFiles.clear();
      _titleController.clear();
      _artistController.clear();
      _albumController.clear();
      _genreController.clear();
      _yearController.clear();
      _descriptionController.clear();
      _tagsController.clear();
    });
  }

  // 切换音乐状态
  Future<void> _toggleMusicStatus(Music music) async {
    try {
      final response = await _apiService.toggleMusicStatus(music.id);
      if (response['success']) {
        _showSuccessSnackBar(music.isEnabled ? '音乐已禁用' : '音乐已启用');
        _loadMusicList();
      } else {
        _showErrorSnackBar(response['message'] ?? '操作失败');
      }
    } catch (e) {
      _showErrorSnackBar('操作失败: $e');
    }
  }

  // 删除音乐
  Future<void> _deleteMusic(Music music) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除'),
        content: Text('确定要删除音乐 "${music.displayName}" 吗？此操作不可恢复。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final response = await _apiService.deleteMusic(music.id);
        if (response['success']) {
          _showSuccessSnackBar('音乐删除成功');
          _loadMusicList();
        } else {
          _showErrorSnackBar(response['message'] ?? '删除失败');
        }
      } catch (e) {
        _showErrorSnackBar('删除失败: $e');
      }
    }
  }

  // 批量删除音乐
  Future<void> _batchDeleteMusic() async {
    if (_selectedMusicList.isEmpty) {
      _showErrorSnackBar('请先选择要删除的音乐');
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认批量删除'),
        content: Text('确定要删除选中的 ${_selectedMusicList.length} 首音乐吗？此操作不可恢复。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        for (final music in _selectedMusicList) {
          await _apiService.deleteMusic(music.id);
        }
        _showSuccessSnackBar('批量删除成功');
        setState(() {
          _selectedMusicList.clear();
        });
        _loadMusicList();
      } catch (e) {
        _showErrorSnackBar('批量删除失败: $e');
      }
    }
  }

  // 批量更新状态
  Future<void> _batchUpdateStatus(int status) async {
    if (_selectedMusicList.isEmpty) {
      _showErrorSnackBar('请先选择要更新的音乐');
      return;
    }

    try {
      final ids = _selectedMusicList.map((music) => music.id).toList();
      final response = await _apiService.batchUpdateMusicStatus(ids, status);
      
      if (response['success']) {
        _showSuccessSnackBar('批量更新状态成功');
        setState(() {
          _selectedMusicList.clear();
        });
        _loadMusicList();
      } else {
        _showErrorSnackBar(response['message'] ?? '批量更新失败');
      }
    } catch (e) {
      _showErrorSnackBar('批量更新失败: $e');
    }
  }

  // 播放音乐
  void _playMusic(Music music) {
    setState(() {
      _currentPlayingMusic = music;
    });
  }

  // 停止播放
  void _stopMusic() {
    setState(() {
      _currentPlayingMusic = null;
    });
  }

  // 编辑音乐
  void _editMusic(Music music) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MusicEditView(music: music),
      ),
    );
    
    if (result == true) {
      _loadMusicList(); // 如果编辑成功，刷新列表
    }
  }

  // 显示音乐详情
  void _showMusicDetail(Music music) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(music.displayName),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDetailItem('文件名', music.fileName),
              _buildDetailItem('艺术家', music.artistDisplayName),
              _buildDetailItem('专辑', music.albumDisplayName),
              _buildDetailItem('流派', music.genre ?? '未知'),
              _buildDetailItem('年份', music.year?.toString() ?? '未知'),
              _buildDetailItem('时长', music.durationDisplay),
              _buildDetailItem('文件大小', music.fileSizeDisplay),
              _buildDetailItem('播放次数', music.playCount.toString()),
              _buildDetailItem('状态', music.statusDisplay),
              _buildDetailItem('上传时间', _formatDate(music.createdAt)),
              if (music.description?.isNotEmpty == true)
                _buildDetailItem('描述', music.description!),
              if (music.tags?.isNotEmpty == true)
                _buildDetailItem('标签', music.tags!.join(', ')),
            ],
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

  Widget _buildDetailItem(String label, String value) {
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
            child: Text(value),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} '
           '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('音乐管理'),
        backgroundColor: const Color(AppConstants.primaryColor),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.upload),
            onPressed: _showUploadDialog,
            tooltip: '上传音乐',
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const MusicBatchView()),
            ),
            tooltip: '批量操作',
          ),
          IconButton(
            icon: const Icon(Icons.bar_chart),
            onPressed: () => Navigator.pushNamed(context, AppConstants.musicStatisticsRoute),
            tooltip: '统计信息',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMusicList,
            tooltip: '刷新',
          ),
        ],
      ),
      body: Column(
        children: [
          // 搜索和筛选区域
          _buildSearchAndFilterSection(),
          
          // 批量操作工具栏
          if (_selectedMusicList.isNotEmpty) _buildBatchActionToolbar(),
          
          // 音乐列表
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _musicList.isEmpty
                    ? _buildEmptyState()
                    : _buildMusicList(),
          ),
          
          // 音乐播放器
          if (_currentPlayingMusic != null)
            Container(
              padding: const EdgeInsets.all(16),
              child: MusicPlayer(
                music: _currentPlayingMusic!,
                onClose: _stopMusic,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilterSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 3,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        children: [
          // 搜索框
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: '搜索音乐名称、艺术家、专辑...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  onSubmitted: (_) => _searchMusic(),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: _searchMusic,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(AppConstants.primaryColor),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                child: const Text('搜索'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // 筛选按钮
          Row(
            children: [
              const Text('状态筛选: ', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              FilterChip(
                label: const Text('全部'),
                selected: _statusFilter == null,
                onSelected: (_) => _filterMusic(null),
              ),
              const SizedBox(width: 8),
              FilterChip(
                label: const Text('启用'),
                selected: _statusFilter == 1,
                onSelected: (_) => _filterMusic(1),
              ),
              const SizedBox(width: 8),
              FilterChip(
                label: const Text('禁用'),
                selected: _statusFilter == 0,
                onSelected: (_) => _filterMusic(0),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBatchActionToolbar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.blue.shade50,
      child: Row(
        children: [
          Text(
            '已选择 ${_selectedMusicList.length} 项',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          const Spacer(),
          TextButton.icon(
            onPressed: () => _batchUpdateStatus(1),
            icon: const Icon(Icons.check_circle, color: Colors.green),
            label: const Text('启用'),
          ),
          TextButton.icon(
            onPressed: () => _batchUpdateStatus(0),
            icon: const Icon(Icons.cancel, color: Colors.orange),
            label: const Text('禁用'),
          ),
          TextButton.icon(
            onPressed: _batchDeleteMusic,
            icon: const Icon(Icons.delete, color: Colors.red),
            label: const Text('删除'),
          ),
          TextButton(
            onPressed: () => setState(() => _selectedMusicList.clear()),
            child: const Text('取消选择'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.music_note,
            size: 64,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            '暂无音乐',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '点击右上角按钮上传音乐文件',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMusicList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredMusicList.length,
      itemBuilder: (context, index) {
        final music = _filteredMusicList[index];
        final isSelected = _selectedMusicList.contains(music);
        
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: Checkbox(
              value: isSelected,
              onChanged: (value) {
                setState(() {
                  if (value == true) {
                    _selectedMusicList.add(music);
                  } else {
                    _selectedMusicList.remove(music);
                  }
                });
              },
            ),
            title: Text(
              music.displayName,
              style: const TextStyle(fontWeight: FontWeight.bold),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${music.artistDisplayName} • ${music.albumDisplayName}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${music.durationDisplay} • ${music.fileSizeDisplay} • 播放${music.playCount}次',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Chip(
                  label: Text(
                    music.statusDisplay,
                    style: TextStyle(
                      color: music.isEnabled ? Colors.green : Colors.red,
                      fontSize: 12,
                    ),
                  ),
                  backgroundColor: music.isEnabled 
                      ? Colors.green.shade50 
                      : Colors.red.shade50,
                ),
                const SizedBox(width: 8),
                PopupMenuButton<String>(
                                     onSelected: (value) {
                     switch (value) {
                       case 'play':
                         _playMusic(music);
                         break;
                       case 'detail':
                         _showMusicDetail(music);
                         break;
                       case 'edit':
                         _editMusic(music);
                         break;
                       case 'toggle':
                         _toggleMusicStatus(music);
                         break;
                       case 'delete':
                         _deleteMusic(music);
                         break;
                     }
                   },
                  itemBuilder: (context) => [
                                         const PopupMenuItem(
                       value: 'play',
                       child: Row(
                         children: [
                           Icon(Icons.play_arrow, size: 16),
                           SizedBox(width: 8),
                           Text('播放'),
                         ],
                       ),
                     ),
                     const PopupMenuItem(
                       value: 'detail',
                       child: Row(
                         children: [
                           Icon(Icons.info, size: 16),
                           SizedBox(width: 8),
                           Text('详情'),
                         ],
                       ),
                     ),
                     const PopupMenuItem(
                       value: 'edit',
                       child: Row(
                         children: [
                           Icon(Icons.edit, size: 16),
                           SizedBox(width: 8),
                           Text('编辑'),
                         ],
                       ),
                     ),
                    PopupMenuItem(
                      value: 'toggle',
                      child: Row(
                        children: [
                          Icon(
                            music.isEnabled ? Icons.cancel : Icons.check_circle,
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Text(music.isEnabled ? '禁用' : '启用'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete, size: 16, color: Colors.red),
                          SizedBox(width: 8),
                          Text('删除', style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showUploadDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text('上传音乐'),
            content: SizedBox(
              width: double.maxFinite,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // 上传状态显示
                    if (_isUploading || _isBatchUploading) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                _isUploading ? '正在上传音乐文件...' : '正在批量上传音乐文件...',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    
                    // 上传类型选择
                    if (!_isUploading && !_isBatchUploading) ...[
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () async {
                                await _pickSingleFile();
                                setDialogState(() {}); // 重新构建对话框
                              },
                              icon: const Icon(Icons.file_upload),
                              label: const Text('选择单个文件'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () async {
                                await _pickMultipleFiles();
                                setDialogState(() {}); // 重新构建对话框
                              },
                              icon: const Icon(Icons.folder_open),
                              label: const Text('选择多个文件'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],
                    
                    // 显示选中的文件
                    if (!_isUploading && !_isBatchUploading) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              '文件选择状态:',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Text('单个文件: ${_selectedFile != null ? "已选择" : "未选择"}'),
                            Text('多个文件: ${_selectedFiles.length} 个'),
                            if (_selectedFile != null) ...[
                              const SizedBox(height: 8),
                              Text('单个文件路径: ${_selectedFile!.path}'),
                            ],
                            if (_selectedFiles.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              const Text('多个文件列表:'),
                              ..._selectedFiles.map((file) => 
                                Text('• ${file.path}')
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    
                    // 音乐信息表单
                    if (!_isUploading && !_isBatchUploading) ...[
                      Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            TextFormField(
                              controller: _titleController,
                              decoration: const InputDecoration(
                                labelText: '标题',
                                border: OutlineInputBorder(),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _artistController,
                                    decoration: const InputDecoration(
                                      labelText: '艺术家',
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    controller: _albumController,
                                    decoration: const InputDecoration(
                                      labelText: '专辑',
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _genreController,
                                    decoration: const InputDecoration(
                                      labelText: '流派',
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    controller: _yearController,
                                    decoration: const InputDecoration(
                                      labelText: '年份',
                                      border: OutlineInputBorder(),
                                    ),
                                    keyboardType: TextInputType.number,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _descriptionController,
                              decoration: const InputDecoration(
                                labelText: '描述',
                                border: OutlineInputBorder(),
                              ),
                              maxLines: 3,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _tagsController,
                              decoration: const InputDecoration(
                                labelText: '标签（用逗号分隔）',
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            actions: [
              if (!_isUploading && !_isBatchUploading) ...[
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    _clearUploadForm();
                  },
                  child: const Text('取消'),
                ),
                if (_selectedFile != null)
                  ElevatedButton(
                    onPressed: () async {
                      await _uploadSingleMusic();
                    },
                    child: const Text('上传'),
                  ),
                if (_selectedFiles.isNotEmpty)
                  ElevatedButton(
                    onPressed: () async {
                      await _uploadMultipleMusic();
                    },
                    child: const Text('批量上传'),
                  ),
              ],
            ],
          );
        },
      ),
    );
  }
} 