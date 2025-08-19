class Tag {
  final int id;
  final String name;
  final String slug;
  final String? description;
  final String? color;
  final String? icon;
  final int? articleCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  Tag({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.color,
    this.icon,
    this.articleCount,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Tag.fromJson(Map<String, dynamic> json) {
    return Tag(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'],
      color: json['color'],
      icon: json['icon'],
      articleCount: json['article_count'],
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
      'color': color,
      'icon': icon,
      'article_count': articleCount,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  @override
  String toString() {
    return 'Tag(id: $id, name: $name, slug: $slug)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Tag && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
} 