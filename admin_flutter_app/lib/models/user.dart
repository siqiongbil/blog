class User {
  final int id;
  final String username;
  final String nickname;
  final String? avatar;
  final String email;
  final String? bio;
  final String? website;
  final int role;
  final String? github;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.username,
    required this.nickname,
    this.avatar,
    required this.email,
    this.bio,
    this.website,
    required this.role,
    this.github,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: _parseInt(json['id']),
      username: _parseString(json['username']),
      nickname: _parseString(json['nickname']),
      avatar: _parseString(json['avatar']),
      email: _parseString(json['email']),
      bio: _parseString(json['bio']),
      website: _parseString(json['website']),
      role: _parseInt(json['role']),
      github: _parseString(json['github']),
      createdAt: _parseDateTime(json['created_at']),
      updatedAt: _parseDateTime(json['updated_at']),
    );
  }

  // 辅助方法：安全解析整数
  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  // 辅助方法：安全解析字符串
  static String _parseString(dynamic value) {
    if (value == null) return '';
    if (value is String) return value;
    return value.toString();
  }

  // 辅助方法：安全解析日期时间
  static DateTime _parseDateTime(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is DateTime) return value;
    if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        return DateTime.now();
      }
    }
    return DateTime.now();
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'nickname': nickname,
      'avatar': avatar,
      'email': email,
      'bio': bio,
      'website': website,
      'role': role,
      'github': github,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  User copyWith({
    int? id,
    String? username,
    String? nickname,
    String? avatar,
    String? email,
    String? bio,
    String? website,
    int? role,
    String? github,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      nickname: nickname ?? this.nickname,
      avatar: avatar ?? this.avatar,
      email: email ?? this.email,
      bio: bio ?? this.bio,
      website: website ?? this.website,
      role: role ?? this.role,
      github: github ?? this.github,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'User(id: $id, username: $username, nickname: $nickname, email: $email, role: $role)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is User && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
} 