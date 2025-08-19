import 'package:flutter/material.dart';
import '../constants/app_constants.dart';
import '../services/api_service.dart';

class MusicBatchView extends StatefulWidget {
  const MusicBatchView({super.key});

  @override
  State<MusicBatchView> createState() => _MusicBatchViewState();
}

class _MusicBatchViewState extends State<MusicBatchView> {
  final ApiService _apiService = ApiService();
  
  bool _isBatchImporting = false;
  bool _isBatchValidating = false;
  bool _isRefreshing = false;
  String? _operationResult;

  Future<void> _batchImportMusic() async {
    setState(() {
      _isBatchImporting = true;
      _operationResult = null;
    });

    try {
      final response = await _apiService.batchImportMusic();
      
      if (response['success']) {
        final data = response['data'];
        final successCount = data['successCount'] ?? 0;
        final failureCount = data['failureCount'] ?? 0;
        final total = data['total'] ?? 0;
        
        setState(() {
          _operationResult = '批量导入完成！\n成功：$successCount个\n失败：$failureCount个\n总计：$total个';
        });
        
        _showSuccessSnackBar('批量导入完成');
      } else {
        throw Exception(response['message'] ?? '批量导入失败');
      }
    } catch (e) {
      setState(() {
        _operationResult = '批量导入失败：$e';
      });
      _showErrorSnackBar('批量导入失败: $e');
    } finally {
      setState(() {
        _isBatchImporting = false;
      });
    }
  }

  Future<void> _batchValidateMusic() async {
    setState(() {
      _isBatchValidating = true;
      _operationResult = null;
    });

    try {
      final response = await _apiService.batchValidateMusic();
      
      if (response['success']) {
        final data = response['data'];
        final successCount = data['successCount'] ?? 0;
        final failureCount = data['failureCount'] ?? 0;
        final total = data['total'] ?? 0;
        
        setState(() {
          _operationResult = '批量验证完成！\n成功：$successCount个\n失败：$failureCount个\n总计：$total个';
        });
        
        _showSuccessSnackBar('批量验证完成');
      } else {
        throw Exception(response['message'] ?? '批量验证失败');
      }
    } catch (e) {
      setState(() {
        _operationResult = '批量验证失败：$e';
      });
      _showErrorSnackBar('批量验证失败: $e');
    } finally {
      setState(() {
        _isBatchValidating = false;
      });
    }
  }

  Future<void> _refreshMusicTable() async {
    setState(() {
      _isRefreshing = true;
      _operationResult = null;
    });

    try {
      final response = await _apiService.refreshMusicTable();
      
      if (response['success']) {
        final data = response['data'];
        final addedFiles = data['addedFiles'] ?? [];
        final skippedFiles = data['skippedFiles'] ?? [];
        final removedFiles = data['removedFiles'] ?? [];
        
        setState(() {
          _operationResult = '音乐表刷新完成！\n新增：${addedFiles.length}个\n跳过：${skippedFiles.length}个\n移除：${removedFiles.length}个';
        });
        
        _showSuccessSnackBar('音乐表刷新完成');
      } else {
        throw Exception(response['message'] ?? '刷新音乐表失败');
      }
    } catch (e) {
      setState(() {
        _operationResult = '刷新音乐表失败：$e';
      });
      _showErrorSnackBar('刷新音乐表失败: $e');
    } finally {
      setState(() {
        _isRefreshing = false;
      });
    }
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
        title: const Text('音乐批量操作'),
        backgroundColor: const Color(AppConstants.primaryColor),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 操作说明
            _buildOperationDescription(),
            const SizedBox(height: 24),
            
            // 批量操作按钮
            _buildBatchOperationButtons(),
            const SizedBox(height: 24),
            
            // 操作结果
            if (_operationResult != null) _buildOperationResult(),
          ],
        ),
      ),
    );
  }

  Widget _buildOperationDescription() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '批量操作说明',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildDescriptionItem(
              '批量导入',
              '扫描音乐目录并自动导入新的音乐文件到数据库',
              Icons.folder_open,
              Colors.blue,
            ),
            _buildDescriptionItem(
              '批量验证',
              '验证所有音乐文件的完整性和可访问性',
              Icons.verified,
              Colors.green,
            ),
            _buildDescriptionItem(
              '刷新音乐表',
              '重新扫描音乐目录，同步文件系统和数据库',
              Icons.refresh,
              Colors.orange,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDescriptionItem(String title, String description, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBatchOperationButtons() {
    return Column(
      children: [
        // 批量导入按钮
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isBatchImporting ? null : _batchImportMusic,
            icon: _isBatchImporting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.folder_open),
            label: Text(_isBatchImporting ? '导入中...' : '批量导入音乐'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
        const SizedBox(height: 16),
        
        // 批量验证按钮
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isBatchValidating ? null : _batchValidateMusic,
            icon: _isBatchValidating
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.verified),
            label: Text(_isBatchValidating ? '验证中...' : '批量验证音乐'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
        const SizedBox(height: 16),
        
        // 刷新音乐表按钮
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isRefreshing ? null : _refreshMusicTable,
            icon: _isRefreshing
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.refresh),
            label: Text(_isRefreshing ? '刷新中...' : '刷新音乐表'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOperationResult() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '操作结果',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _operationResult!.contains('失败') 
                    ? Colors.red.shade50 
                    : Colors.green.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _operationResult!.contains('失败') 
                      ? Colors.red.shade200 
                      : Colors.green.shade200,
                ),
              ),
              child: Text(
                _operationResult!,
                style: TextStyle(
                  color: _operationResult!.contains('失败') 
                      ? Colors.red.shade700 
                      : Colors.green.shade700,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
} 