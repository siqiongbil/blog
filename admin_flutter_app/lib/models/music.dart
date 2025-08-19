import 'dart:convert';

class Music {
  final int id;
  final String fileName;
  final String? originalName;
  final String filePath;
  final String? fileUrl;
  final int? fileSize;
  final String? mimeType;
  final double? duration;
  final String? title;
  final String? artist;
  final String? album;
  final String? genre;
  final int? year;
  final String? coverUrl;
  final String? description;
  final List<String>? tags;
  final int playCount;
  final int? uploaderId;
  final int status;
  final DateTime createdAt;
  final DateTime updatedAt;

  Music({
    required this.id,
    required this.fileName,
    this.originalName,
    required this.filePath,
    this.fileUrl,
    this.fileSize,
    this.mimeType,
    this.duration,
    this.title,
    this.artist,
    this.album,
    this.genre,
    this.year,
    this.coverUrl,
    this.description,
    this.tags,
    this.playCount = 0,
    this.uploaderId,
    this.status = 1,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Music.fromJson(Map<String, dynamic> json) {
    return Music(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      fileName: json['file_name'] ?? '',
      originalName: json['original_name'],
      filePath: json['file_path'] ?? '',
      fileUrl: json['file_url'],
      fileSize: json['file_size'] is int ? json['file_size'] : (json['file_size'] != null ? int.tryParse(json['file_size'].toString()) : null),
      mimeType: json['mime_type'],
      duration: json['duration'] is double ? json['duration'] : (json['duration'] != null ? double.tryParse(json['duration'].toString()) : null),
      title: json['title'],
      artist: json['artist'],
      album: json['album'],
      genre: json['genre'],
      year: json['year'] is int ? json['year'] : (json['year'] != null ? int.tryParse(json['year'].toString()) : null),
      coverUrl: json['cover_url'],
      description: json['description'],
      tags: json['tags'] != null 
          ? List<String>.from(json['tags'] is String 
              ? jsonDecode(json['tags']) 
              : json['tags'])
          : null,
      playCount: json['play_count'] is int ? json['play_count'] : int.parse(json['play_count']?.toString() ?? '0'),
      uploaderId: json['uploader_id'] is int ? json['uploader_id'] : (json['uploader_id'] != null ? int.tryParse(json['uploader_id'].toString()) : null),
      status: json['status'] is int ? json['status'] : int.parse(json['status']?.toString() ?? '1'),
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'file_name': fileName,
      'original_name': originalName,
      'file_path': filePath,
      'file_url': fileUrl,
      'file_size': fileSize,
      'mime_type': mimeType,
      'duration': duration,
      'title': title,
      'artist': artist,
      'album': album,
      'genre': genre,
      'year': year,
      'cover_url': coverUrl,
      'description': description,
      'tags': tags,
      'play_count': playCount,
      'uploader_id': uploaderId,
      'status': status,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  // 获取显示名称
  String get displayName {
    if (title != null && title!.isNotEmpty) {
      return title!;
    }
    if (artist != null && artist!.isNotEmpty) {
      return '$artist - ${fileName.replaceAll(RegExp(r'\.(mp3|wav|flac|ogg|m4a)$'), '')}';
    }
    return fileName.replaceAll(RegExp(r'\.(mp3|wav|flac|ogg|m4a)$'), '');
  }

  // 获取艺术家显示名称
  String get artistDisplayName {
    return artist ?? '未知艺术家';
  }

  // 获取专辑显示名称
  String get albumDisplayName {
    return album ?? '未知专辑';
  }

  // 获取时长显示
  String get durationDisplay {
    if (duration == null) return '未知';
    final minutes = (duration! / 60).floor();
    final seconds = (duration! % 60).floor();
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  // 获取文件大小显示
  String get fileSizeDisplay {
    if (fileSize == null) return '未知';
    if (fileSize! < 1024) {
      return '${fileSize} B';
    } else if (fileSize! < 1024 * 1024) {
      return '${(fileSize! / 1024).toStringAsFixed(1)} KB';
    } else {
      return '${(fileSize! / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
  }

  // 获取状态显示
  String get statusDisplay {
    return status == 1 ? '启用' : '禁用';
  }

  // 获取状态颜色
  bool get isEnabled {
    return status == 1;
  }

  // 复制并更新
  Music copyWith({
    int? id,
    String? fileName,
    String? originalName,
    String? filePath,
    String? fileUrl,
    int? fileSize,
    String? mimeType,
    double? duration,
    String? title,
    String? artist,
    String? album,
    String? genre,
    int? year,
    String? coverUrl,
    String? description,
    List<String>? tags,
    int? playCount,
    int? uploaderId,
    int? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Music(
      id: id ?? this.id,
      fileName: fileName ?? this.fileName,
      originalName: originalName ?? this.originalName,
      filePath: filePath ?? this.filePath,
      fileUrl: fileUrl ?? this.fileUrl,
      fileSize: fileSize ?? this.fileSize,
      mimeType: mimeType ?? this.mimeType,
      duration: duration ?? this.duration,
      title: title ?? this.title,
      artist: artist ?? this.artist,
      album: album ?? this.album,
      genre: genre ?? this.genre,
      year: year ?? this.year,
      coverUrl: coverUrl ?? this.coverUrl,
      description: description ?? this.description,
      tags: tags ?? this.tags,
      playCount: playCount ?? this.playCount,
      uploaderId: uploaderId ?? this.uploaderId,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'Music(id: $id, fileName: $fileName, title: $title, artist: $artist, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Music && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
} 