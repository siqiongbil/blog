class Category {
  final int id;
  final String name;
  final String slug;
  final String? description;
  final int? sortOrder;
  final String? imageUrl;
  final int? articleCount; // 添加文章数量字段
  final DateTime createdAt;
  final DateTime updatedAt;

  Category({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.sortOrder,
    this.imageUrl,
    this.articleCount, // 添加文章数量参数
    required this.createdAt,
    required this.updatedAt,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'],
      sortOrder: json['sort_order'] is int ? json['sort_order'] : (json['sort_order'] != null ? int.tryParse(json['sort_order'].toString()) : null),
      imageUrl: json['image_url'],
      articleCount: json['article_count'] is int ? json['article_count'] : (json['article_count'] != null ? int.tryParse(json['article_count'].toString()) : null), // 解析文章数量
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'sort_order': sortOrder,
      'image_url': imageUrl,
      'article_count': articleCount, // 包含文章数量
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  @override
  String toString() {
    return 'Category(id: $id, name: $name, slug: $slug, articleCount: $articleCount)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Category && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
} 