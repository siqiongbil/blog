import 'package:flutter/material.dart';
import '../constants/app_constants.dart';
import '../models/music.dart';
import '../services/api_service.dart';

class MusicEditView extends StatefulWidget {
  final Music music;
  
  const MusicEditView({
    super.key,
    required this.music,
  });

  @override
  State<MusicEditView> createState() => _MusicEditViewState();
}

class _MusicEditViewState extends State<MusicEditView> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _titleController;
  late TextEditingController _artistController;
  late TextEditingController _albumController;
  late TextEditingController _genreController;
  late TextEditingController _yearController;
  late TextEditingController _descriptionController;
  late TextEditingController _tagsController;
  
  bool _isLoading = false;
  bool _isSaving = false;
  int? _status;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.music.title ?? '');
    _artistController = TextEditingController(text: widget.music.artist ?? '');
    _albumController = TextEditingController(text: widget.music.album ?? '');
    _genreController = TextEditingController(text: widget.music.genre ?? '');
    _yearController = TextEditingController(text: widget.music.year?.toString() ?? '');
    _descriptionController = TextEditingController(text: widget.music.description ?? '');
    _tagsController = TextEditingController(text: widget.music.tags?.join(', ') ?? '');
    _status = widget.music.status;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _artistController.dispose();
    _albumController.dispose();
    _genreController.dispose();
    _yearController.dispose();
    _descriptionController.dispose();
    _tagsController.dispose();
    super.dispose();
  }

  Future<void> _saveMusic() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final response = await _apiService.updateMusic(
        widget.music.id,
        title: _titleController.text.isNotEmpty ? _titleController.text : null,
        artist: _artistController.text.isNotEmpty ? _artistController.text : null,
        album: _albumController.text.isNotEmpty ? _albumController.text : null,
        genre: _genreController.text.isNotEmpty ? _genreController.text : null,
        year: _yearController.text.isNotEmpty ? int.tryParse(_yearController.text) : null,
        description: _descriptionController.text.isNotEmpty ? _descriptionController.text : null,
        tags: _tagsController.text.isNotEmpty 
            ? _tagsController.text.split(',').map((e) => e.trim()).toList()
            : null,
        status: _status,
      );

      if (response['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('音乐信息更新成功'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop(true); // 返回true表示已更新
      } else {
        throw Exception(response['message'] ?? '更新失败');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('更新失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('编辑音乐 - ${widget.music.displayName}'),
        backgroundColor: const Color(AppConstants.primaryColor),
        foregroundColor: Colors.white,
        actions: [
          if (!_isSaving)
            TextButton(
              onPressed: _saveMusic,
              child: const Text(
                '保存',
                style: TextStyle(color: Colors.white),
              ),
            ),
          if (_isSaving)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 基本信息卡片
                    _buildBasicInfoCard(),
                    const SizedBox(height: 16),
                    
                    // 音乐信息卡片
                    _buildMusicInfoCard(),
                    const SizedBox(height: 16),
                    
                    // 状态设置卡片
                    _buildStatusCard(),
                    const SizedBox(height: 16),
                    
                    // 文件信息卡片
                    _buildFileInfoCard(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildBasicInfoCard() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '基本信息',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: '音乐标题',
                border: OutlineInputBorder(),
                hintText: '输入音乐标题',
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return '请输入音乐标题';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _artistController,
                    decoration: const InputDecoration(
                      labelText: '艺术家',
                      border: OutlineInputBorder(),
                      hintText: '输入艺术家名称',
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _albumController,
                    decoration: const InputDecoration(
                      labelText: '专辑',
                      border: OutlineInputBorder(),
                      hintText: '输入专辑名称',
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMusicInfoCard() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '音乐信息',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _genreController,
                    decoration: const InputDecoration(
                      labelText: '流派',
                      border: OutlineInputBorder(),
                      hintText: '如：流行、摇滚、古典',
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _yearController,
                    decoration: const InputDecoration(
                      labelText: '发行年份',
                      border: OutlineInputBorder(),
                      hintText: '如：2023',
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value != null && value.isNotEmpty) {
                        final year = int.tryParse(value);
                        if (year == null || year < 1900 || year > DateTime.now().year + 1) {
                          return '请输入有效的年份';
                        }
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: '描述',
                border: OutlineInputBorder(),
                hintText: '输入音乐描述',
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _tagsController,
              decoration: const InputDecoration(
                labelText: '标签',
                border: OutlineInputBorder(),
                hintText: '用逗号分隔多个标签，如：流行, 轻音乐, 放松',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '状态设置',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: RadioListTile<int>(
                    title: const Text('启用'),
                    subtitle: const Text('音乐可以被访问和播放'),
                    value: 1,
                    groupValue: _status,
                    onChanged: (value) {
                      setState(() {
                        _status = value;
                      });
                    },
                  ),
                ),
                Expanded(
                  child: RadioListTile<int>(
                    title: const Text('禁用'),
                    subtitle: const Text('音乐暂时不可访问'),
                    value: 0,
                    groupValue: _status,
                    onChanged: (value) {
                      setState(() {
                        _status = value;
                      });
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFileInfoCard() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '文件信息',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildInfoRow('文件名', widget.music.fileName),
            _buildInfoRow('原始文件名', widget.music.originalName ?? '未知'),
            _buildInfoRow('文件大小', widget.music.fileSizeDisplay),
            _buildInfoRow('时长', widget.music.durationDisplay),
            _buildInfoRow('MIME类型', widget.music.mimeType ?? '未知'),
            _buildInfoRow('播放次数', widget.music.playCount.toString()),
            _buildInfoRow('上传时间', _formatDate(widget.music.createdAt)),
            _buildInfoRow('最后更新', _formatDate(widget.music.updatedAt)),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} '
           '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
} 