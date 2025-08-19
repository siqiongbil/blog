import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import '../models/music.dart';
import '../constants/app_constants.dart';

class MusicPlayer extends StatefulWidget {
  final Music music;
  final VoidCallback? onClose;

  const MusicPlayer({
    super.key,
    required this.music,
    this.onClose,
  });

  @override
  State<MusicPlayer> createState() => _MusicPlayerState();
}

class _MusicPlayerState extends State<MusicPlayer> {
  late AudioPlayer _audioPlayer;
  bool _isPlaying = false;
  bool _isLoading = true;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _audioPlayer = AudioPlayer();
    _initializePlayer();
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  Future<void> _initializePlayer() async {
    try {
      // 设置播放完成监听器
      _audioPlayer.onPlayerComplete.listen((_) {
        setState(() {
          _isPlaying = false;
          _position = Duration.zero;
        });
      });

      // 设置播放状态监听器
      _audioPlayer.onPlayerStateChanged.listen((state) {
        setState(() {
          // 在 audioplayers 5.2.1 中，没有 loading 状态，使用 stopped 状态来判断
          _isLoading = false;
        });
      });

      // 设置位置监听器
      _audioPlayer.onPositionChanged.listen((position) {
        setState(() {
          _position = position;
        });
      });

      // 设置时长监听器
      _audioPlayer.onDurationChanged.listen((duration) {
        setState(() {
          _duration = duration;
        });
      });

      // 在 audioplayers 5.2.1 中没有 onPlayerError 监听器
      // 错误处理通过 try-catch 块来实现

      // 设置音频源
      final musicUrl = '${AppConstants.staticBaseUrl}${widget.music.fileUrl}';
      await _audioPlayer.setSourceUrl(musicUrl);
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = '初始化播放器失败: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _playPause() async {
    if (_errorMessage != null) return;

    try {
      if (_isPlaying) {
        await _audioPlayer.pause();
        setState(() {
          _isPlaying = false;
        });
      } else {
        await _audioPlayer.resume();
        setState(() {
          _isPlaying = true;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = '播放控制失败: $e';
      });
    }
  }

  Future<void> _stop() async {
    try {
      await _audioPlayer.stop();
      setState(() {
        _isPlaying = false;
        _position = Duration.zero;
      });
    } catch (e) {
      setState(() {
        _errorMessage = '停止播放失败: $e';
      });
    }
  }

  Future<void> _seekTo(Duration position) async {
    try {
      await _audioPlayer.seek(position);
    } catch (e) {
      setState(() {
        _errorMessage = '跳转失败: $e';
      });
    }
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 8,
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // 标题栏
            Row(
              children: [
                Icon(
                  Icons.music_note,
                  color: const Color(AppConstants.primaryColor),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.music.displayName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (widget.onClose != null)
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: widget.onClose,
                    iconSize: 20,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            
            // 艺术家和专辑信息
            if (widget.music.artist != null || widget.music.album != null)
              Text(
                '${widget.music.artistDisplayName} • ${widget.music.albumDisplayName}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            const SizedBox(height: 16),

            // 错误信息
            if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(8),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error, color: Colors.red.shade600, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: TextStyle(
                          color: Colors.red.shade600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // 进度条
            if (_errorMessage == null) ...[
              Slider(
                value: _position.inSeconds.toDouble(),
                max: _duration.inSeconds.toDouble(),
                onChanged: _isLoading ? null : (value) {
                  _seekTo(Duration(seconds: value.toInt()));
                },
                activeColor: const Color(AppConstants.primaryColor),
              ),
              
              // 时间显示
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _formatDuration(_position),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  Text(
                    _formatDuration(_duration),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],

            // 控制按钮
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  onPressed: _isLoading || _errorMessage != null ? null : _stop,
                  icon: const Icon(Icons.stop),
                  iconSize: 32,
                  color: Colors.grey.shade600,
                ),
                const SizedBox(width: 16),
                IconButton(
                  onPressed: _isLoading || _errorMessage != null ? null : _playPause,
                  icon: Icon(_isPlaying ? Icons.pause : Icons.play_arrow),
                  iconSize: 48,
                  color: const Color(AppConstants.primaryColor),
                ),
                const SizedBox(width: 16),
                IconButton(
                  onPressed: _isLoading || _errorMessage != null ? null : () {
                    // 重新加载
                    _initializePlayer();
                  },
                  icon: const Icon(Icons.refresh),
                  iconSize: 32,
                  color: Colors.grey.shade600,
                ),
              ],
            ),

            // 加载指示器
            if (_isLoading)
              const Padding(
                padding: EdgeInsets.only(top: 16),
                child: CircularProgressIndicator(),
              ),
          ],
        ),
      ),
    );
  }
} 