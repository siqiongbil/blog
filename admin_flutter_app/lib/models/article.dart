class Article {
  final int id;
  final String title;
  final String content;
  final String? summary;
  final String? coverImage;
  final int categoryId;
  final String categoryName;
  final int authorId;
  final String authorName;
  final int status;
  final int viewCount;
  final List<String> tags;
  final DateTime createdAt;
  final DateTime updatedAt;

  Article({
    required this.id,
    required this.title,
    required this.content,
    this.summary,
    this.coverImage,
    required this.categoryId,
    required this.categoryName,
    required this.authorId,
    required this.authorName,
    required this.status,
    required this.viewCount,
    required this.tags,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Article.fromJson(Map<String, dynamic> json) {
    return Article(
      id: json['id'],
      title: json['title'],
      content: json['content'],
      summary: json['summary'],
      coverImage: json['cover_image'],
      categoryId: json['category_id'],
      categoryName: json['category_name'] ?? '',
      authorId: json['author_id'],
      authorName: json['author_name'] ?? '',
      status: json['status'],
      viewCount: json['view_count'] ?? 0,
      tags: json['tags'] != null 
          ? (json['tags'] as List).map((tag) => tag is String ? tag : (tag as Map<String, dynamic>)['name'] ?? '').cast<String>().toList()
          : [],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'summary': summary,
      'cover_image': coverImage,
      'category_id': categoryId,
      'category_name': categoryName,
      'author_id': authorId,
      'author_name': authorName,
      'status': status,
      'view_count': viewCount,
      'tags': tags,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Article copyWith({
    int? id,
    String? title,
    String? content,
    String? summary,
    String? coverImage,
    int? categoryId,
    String? categoryName,
    int? authorId,
    String? authorName,
    int? status,
    int? viewCount,
    List<String>? tags,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Article(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      summary: summary ?? this.summary,
      coverImage: coverImage ?? this.coverImage,
      categoryId: categoryId ?? this.categoryId,
      categoryName: categoryName ?? this.categoryName,
      authorId: authorId ?? this.authorId,
      authorName: authorName ?? this.authorName,
      status: status ?? this.status,
      viewCount: viewCount ?? this.viewCount,
      tags: tags ?? this.tags,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String get statusText {
    switch (status) {
      case 0:
        return '草稿';
      case 1:
        return '已发布';
      case 2:
        return '已删除';
      default:
        return '未知';
    }
  }

  bool get isPublished => status == 1;
  bool get isDraft => status == 0;
  bool get isDeleted => status == 2;

  @override
  String toString() {
    return 'Article(id: $id, title: $title, status: $statusText)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Article && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
} 