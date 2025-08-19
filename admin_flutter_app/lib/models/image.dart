import 'dart:math';

class ImageModel {
  final int id;
  final String fileName;
  final String originalName;
  final String fileUrl;
  final String? altText;
  final String? description;
  final List<String>? tags;
  final int uploadType;
  final int? relatedId;
  final int fileSize;
  final int? width;
  final int? height;
  final String mimeType;
  final DateTime createdAt;
  final DateTime updatedAt;

  ImageModel({
    required this.id,
    required this.fileName,
    required this.originalName,
    required this.fileUrl,
    this.altText,
    this.description,
    this.tags,
    required this.uploadType,
    this.relatedId,
    required this.fileSize,
    this.width,
    this.height,
    required this.mimeType,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ImageModel.fromJson(Map<String, dynamic> json) {
    return ImageModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      fileName: json['file_name'] ?? '',
      originalName: json['original_name'] ?? '',
      fileUrl: json['file_url'] ?? '',
      altText: json['alt_text'],
      description: json['description'],
      tags: _parseTags(json['tags']),
      uploadType: json['upload_type'] ?? 1,
      relatedId: _parseRelatedId(json['related_id']),
      fileSize: json['file_size'] ?? 0,
      width: _parseDimension(json['width']),
      height: _parseDimension(json['height']),
      mimeType: json['mime_type'] ?? '',
      createdAt: _parseDateTime(json['created_at']),
      updatedAt: _parseDateTime(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'file_name': fileName,
      'original_name': originalName,
      'file_url': fileUrl,
      'alt_text': altText,
      'description': description,
      'tags': tags,
      'upload_type': uploadType,
      'related_id': relatedId,
      'file_size': fileSize,
      'width': width,
      'height': height,
      'mime_type': mimeType,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  // 获取上传类型标签
  String get uploadTypeLabel {
    const labels = {
      1: '分类图片',
      2: '文章图片',
      3: '用户头像',
      4: '其他'
    };
    return labels[uploadType] ?? '未知';
  }

  // 获取上传类型标签颜色
  String get uploadTypeTagColor {
    const colors = {
      1: 'primary',
      2: 'success',
      3: 'warning',
      4: 'info'
    };
    return colors[uploadType] ?? 'default';
  }

  // 格式化文件大小
  String get formattedFileSize {
    if (fileSize == 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    final i = (log(fileSize) / log(k)).floor();
    final clampedIndex = i.clamp(0, sizes.length - 1);
    return '${(fileSize / pow(k, clampedIndex)).toStringAsFixed(2)} ${sizes[clampedIndex]}';
  }

  // 格式化创建时间
  String get formattedCreatedAt {
    return '${createdAt.year}-${createdAt.month.toString().padLeft(2, '0')}-${createdAt.day.toString().padLeft(2, '0')}';
  }

  // 获取图片尺寸字符串
  String get dimensionsString {
    if (width != null && height != null) {
      return '${width} × ${height}';
    }
    return '未知';
  }

  @override
  String toString() {
    return 'ImageModel(id: $id, fileName: $fileName, originalName: $originalName)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ImageModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  // 解析标签字段
  static List<String>? _parseTags(dynamic tags) {
    if (tags == null) return null;
    
    if (tags is List) {
      return tags.map((tag) => tag.toString()).toList();
    } else if (tags is String) {
      // 如果是字符串，按逗号分割
      return tags.split(',').map((tag) => tag.trim()).where((tag) => tag.isNotEmpty).toList();
    } else {
      // 其他类型，尝试转换为字符串
      return [tags.toString()];
    }
  }

  // 解析关联ID字段
  static int? _parseRelatedId(dynamic relatedId) {
    if (relatedId == null) return null;
    
    if (relatedId is int) {
      return relatedId;
    } else if (relatedId is String) {
      return int.tryParse(relatedId);
    } else {
      return int.tryParse(relatedId.toString());
    }
  }

  // 解析尺寸字段
  static int? _parseDimension(dynamic dimension) {
    if (dimension == null) return null;
    
    if (dimension is int) {
      return dimension;
    } else if (dimension is String) {
      return int.tryParse(dimension);
    } else {
      return int.tryParse(dimension.toString());
    }
  }

  // 解析日期时间字段
  static DateTime _parseDateTime(dynamic dateTime) {
    if (dateTime is DateTime) {
      return dateTime;
    } else if (dateTime is String) {
      return DateTime.parse(dateTime);
    } else {
      // 如果是时间戳或其他格式，尝试解析
      return DateTime.now(); // 默认返回当前时间
    }
  }
} 