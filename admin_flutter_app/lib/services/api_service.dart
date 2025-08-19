import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';
import '../models/user.dart';
import '../models/music.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final String _baseUrl = AppConstants.baseUrl;
  String? _authToken;

  // 设置认证令牌
  void setAuthToken(String token) {
    _authToken = token;
  }

  // 清除认证令牌
  void clearAuthToken() {
    _authToken = null;
  }

  // 获取请求头
  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    
    return headers;
  }

  // 处理HTTP响应
  Map<String, dynamic> _handleResponse(http.Response response) {
    print('🔍 API响应状态码: ${response.statusCode}');
    print('🔍 API响应URL: ${response.request?.url}');
    print('🔍 API响应体: ${response.body}');
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        final data = json.decode(response.body);
        print('🔍 解析后的数据: $data');
        return data;
      } catch (e) {
        print('❌ JSON解析错误: $e');
        throw Exception('响应数据格式错误: $e');
      }
    } else {
      print('❌ HTTP错误: ${response.statusCode} - ${response.body}');
      throw Exception('HTTP ${response.statusCode}: ${response.body}');
    }
  }

  // 用户登录
  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/users/login'),
        headers: _headers,
        body: json.encode({
          'username': username,
          'password': password,
        }),
      );

      final data = _handleResponse(response);
      
      // 保存认证令牌
      if (data['data'] != null && data['data']['token'] != null) {
        setAuthToken(data['data']['token']);
      }
      
      return data;
    } catch (e) {
      throw Exception('登录失败: $e');
    }
  }

  // 获取用户信息
  Future<User> getUserInfo() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/users/me'),
        headers: _headers,
      );

      final data = _handleResponse(response);
      
      // 检查数据结构
      if (data['data'] == null) {
        throw Exception('响应数据格式错误：缺少data字段');
      }
      
      // /users/me 接口直接返回用户数据，不需要 .user 字段
      return User.fromJson(data['data']);
    } catch (e) {
      throw Exception('获取用户信息失败: $e');
    }
  }

  // 用户登出
  Future<void> logout() async {
    try {
      // 后端没有专门的登出接口，直接清除本地令牌
      clearAuthToken();
    } catch (e) {
      // 即使请求失败也要清除本地令牌
      clearAuthToken();
      throw Exception('登出失败: $e');
    }
  }

  // 获取文章列表
  Future<Map<String, dynamic>> getArticles({
    int page = 1,
    int limit = AppConstants.defaultPageSize,
    String? category,
    String? tag,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (category != null) 'category': category,
        if (tag != null) 'tag': tag,
      };

      final response = await http.get(
        Uri.parse('$_baseUrl/articles').replace(queryParameters: queryParams),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取文章列表失败: $e');
    }
  }

  // 获取分类列表（支持分页和排序）
  Future<Map<String, dynamic>> getCategories({
    int? page,
    int? pageSize,
    String? orderBy,
    String? order,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (page != null) queryParams['page'] = page.toString();
      if (pageSize != null) queryParams['pageSize'] = pageSize.toString();
      if (orderBy != null) queryParams['orderBy'] = orderBy;
      if (order != null) queryParams['order'] = order;

      final response = await http.get(
        Uri.parse('$_baseUrl/categories').replace(queryParameters: queryParams),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取分类列表失败: $e');
    }
  }

  // 获取分类详情
  Future<Map<String, dynamic>> getCategoryDetail(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/categories/$id'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取分类详情失败: $e');
    }
  }

  // 根据别名获取分类详情
  Future<Map<String, dynamic>> getCategoryBySlug(String slug) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/categories/slug/$slug'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取分类详情失败: $e');
    }
  }

  // 获取分类文章统计
  Future<Map<String, dynamic>> getCategoryArticleStats() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/categories/stats/article-count'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取分类统计失败: $e');
    }
  }

  // 获取分类选择项
  Future<Map<String, dynamic>> getCategorySelectOptions() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/categories/options/select'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取分类选择项失败: $e');
    }
  }

  // 检查分类别名可用性
  Future<Map<String, dynamic>> checkCategorySlug(String slug) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/categories/check/slug/$slug'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('检查分类别名失败: $e');
    }
  }

  // 创建分类
  Future<Map<String, dynamic>> createCategory({
    required String name,
    required String slug,
    String? description,
    int? sortOrder,
    String? imageUrl,
  }) async {
    try {
      final data = {
        'name': name,
        'slug': slug,
        if (description != null) 'description': description,
        if (sortOrder != null) 'sort_order': sortOrder,
        if (imageUrl != null) 'image_url': imageUrl,
      };

      final response = await http.post(
        Uri.parse('$_baseUrl/categories'),
        headers: _headers,
        body: json.encode(data),
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('创建分类失败: $e');
    }
  }

  // 更新分类
  Future<Map<String, dynamic>> updateCategory({
    required int id,
    String? name,
    String? slug,
    String? description,
    int? sortOrder,
    String? imageUrl,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (name != null) data['name'] = name;
      if (slug != null) data['slug'] = slug;
      if (description != null) data['description'] = description;
      if (sortOrder != null) data['sort_order'] = sortOrder;
      if (imageUrl != null) data['image_url'] = imageUrl;

      final response = await http.put(
        Uri.parse('$_baseUrl/categories/$id'),
        headers: _headers,
        body: json.encode(data),
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('更新分类失败: $e');
    }
  }

  // 删除分类
  Future<Map<String, dynamic>> deleteCategory(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/categories/$id'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('删除分类失败: $e');
    }
  }

  // 批量排序分类
  Future<Map<String, dynamic>> batchSortCategories(List<Map<String, int>> categories) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/categories/batch/sort'),
        headers: _headers,
        body: json.encode({'categories': categories}),
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('批量排序分类失败: $e');
    }
  }

  // 批量删除分类
  Future<Map<String, dynamic>> batchDeleteCategories(List<int> ids) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/categories/batch/delete'),
        headers: _headers,
        body: json.encode({'ids': ids}),
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('批量删除分类失败: $e');
    }
  }

  // 上传分类图片
  Future<Map<String, dynamic>> uploadCategoryImage(List<int> imageBytes, String fileName) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/categories/upload/image'),
      );

      request.headers.addAll(_headers);
      request.files.add(
        http.MultipartFile.fromBytes(
          'image',
          imageBytes,
          filename: fileName,
        ),
      );

      final response = await request.send();
      final responseData = await response.stream.bytesToString();
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(responseData);
      } else {
        throw Exception('HTTP ${response.statusCode}: $responseData');
      }
    } catch (e) {
      throw Exception('上传分类图片失败: $e');
    }
  }

  // 删除分类图片
  Future<Map<String, dynamic>> deleteCategoryImage(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/categories/$id/image'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('删除分类图片失败: $e');
    }
  }

  // 获取标签列表
  Future<Map<String, dynamic>> getTags() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/tags'),
        headers: _headers,
      );

      final data = _handleResponse(response);
      return data;
    } catch (e) {
      throw Exception('获取标签列表失败: $e');
    }
  }

  // 创建标签
  Future<Map<String, dynamic>> createTag({
    required String name,
    required String slug,
    String? description,
    String? color,
    String? icon,
  }) async {
    try {
      final body = {
        'name': name,
        'slug': slug,
        if (description != null && description.isNotEmpty) 'description': description,
        if (color != null && color.isNotEmpty) 'color': color,
        if (icon != null && icon.isNotEmpty) 'icon': icon,
      };

      final response = await http.post(
        Uri.parse('$_baseUrl/tags'),
        headers: _headers,
        body: json.encode(body),
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('创建标签失败: $e');
    }
  }

  // 更新标签
  Future<Map<String, dynamic>> updateTag({
    required int id,
    String? name,
    String? slug,
    String? description,
    String? color,
    String? icon,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (slug != null) body['slug'] = slug;
      if (description != null) body['description'] = description;
      if (color != null) body['color'] = color;
      if (icon != null) body['icon'] = icon;

      final response = await http.put(
        Uri.parse('$_baseUrl/tags/$id'),
        headers: _headers,
        body: json.encode(body),
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('更新标签失败: $e');
    }
  }

  // 删除标签
  Future<Map<String, dynamic>> deleteTag(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/tags/$id'),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('删除标签失败: $e');
    }
  }

  // 上传图片
  Future<Map<String, dynamic>> uploadImage(
    List<int> imageBytes, 
    String fileName, {
    String? altText,
    String? description,
    List<String>? tags,
    int? relatedId,
    int uploadType = 1,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/images/upload'),
      );

      request.headers.addAll(_headers);
      request.files.add(
        http.MultipartFile.fromBytes(
          'image',
          imageBytes,
          filename: fileName,
        ),
      );

      // 添加其他字段
      if (altText != null && altText.isNotEmpty) {
        request.fields['alt_text'] = altText;
      }
      if (description != null && description.isNotEmpty) {
        request.fields['description'] = description;
      }
      if (tags != null && tags.isNotEmpty) {
        request.fields['tags'] = tags.join(',');
      }
      if (relatedId != null) {
        request.fields['related_id'] = relatedId.toString();
      }
      request.fields['upload_type'] = uploadType.toString();

      final response = await request.send();
      final responseData = await response.stream.bytesToString();
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(responseData);
      } else {
        throw Exception('HTTP ${response.statusCode}: $responseData');
      }
    } catch (e) {
      throw Exception('上传图片失败: $e');
    }
  }

  // 获取系统信息
  Future<Map<String, dynamic>> getSystemInfo() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/info'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取系统信息失败: $e');
    }
  }

  // 获取系统健康状态
  Future<Map<String, dynamic>> getSystemHealth() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/health'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取系统健康状态失败: $e');
    }
  }

  // 获取文章统计信息
  Future<Map<String, dynamic>> getArticleStatistics() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/articles/statistics'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取文章统计信息失败: $e');
    }
  }



  // 创建文章
  Future<Map<String, dynamic>> createArticle({
    required String title,
    required String content,
    String? summary,
    String? coverImage,
    required int categoryId,
    List<String>? tags,
    int status = 0, // 0: 草稿, 1: 发布
  }) async {
    try {
      final data = {
        'title': title,
        'content': content,
        if (summary != null) 'summary': summary,
        if (coverImage != null) 'cover_image': coverImage,
        'category_id': categoryId,
        if (tags != null) 'tags': tags,
        'status': status,
      };

      final response = await http.post(
        Uri.parse('$_baseUrl/articles'),
        headers: _headers,
        body: json.encode(data),
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('创建文章失败: $e');
    }
  }

  // 更新文章
  Future<Map<String, dynamic>> updateArticle({
    required int id,
    String? title,
    String? content,
    String? summary,
    String? coverImage,
    int? categoryId,
    List<String>? tags,
    int? status,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (title != null) data['title'] = title;
      if (content != null) data['content'] = content;
      if (summary != null) data['summary'] = summary;
      if (coverImage != null) data['cover_image'] = coverImage;
      if (categoryId != null) data['category_id'] = categoryId;
      if (tags != null) data['tags'] = tags;
      if (status != null) data['status'] = status;

      final response = await http.put(
        Uri.parse('$_baseUrl/articles/$id'),
        headers: _headers,
        body: json.encode(data),
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('更新文章失败: $e');
    }
  }

  // 删除文章
  Future<Map<String, dynamic>> deleteArticle(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/articles/$id'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('删除文章失败: $e');
    }
  }

  // 批量更新文章状态
  Future<Map<String, dynamic>> batchUpdateArticleStatus(List<int> articleIds, int status) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/articles/batch/status'),
        headers: _headers,
        body: json.encode({
          'article_ids': articleIds,
          'status': status,
        }),
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('批量更新文章状态失败: $e');
    }
  }

  // 批量删除文章
  Future<Map<String, dynamic>> batchDeleteArticles(List<int> articleIds) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/articles/batch'),
        headers: _headers,
        body: json.encode({
          'article_ids': articleIds,
        }),
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('批量删除文章失败: $e');
    }
  }

  // 永久删除文章
  Future<Map<String, dynamic>> permanentDeleteArticle(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/articles/$id/permanent'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('永久删除文章失败: $e');
    }
  }

  // 获取图片列表
  Future<Map<String, dynamic>> getImages({
    int? page,
    int? pageSize,
    int? uploadType,
    String? keyword,
    String? orderBy,
    String? order,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (page != null) queryParams['page'] = page.toString();
      if (pageSize != null) queryParams['pageSize'] = pageSize.toString();
      if (uploadType != null) queryParams['upload_type'] = uploadType.toString();
      if (keyword != null && keyword.isNotEmpty) queryParams['keyword'] = keyword;
      if (orderBy != null) queryParams['orderBy'] = orderBy;
      if (order != null) queryParams['order'] = order;

      final response = await http.get(
        Uri.parse('$_baseUrl/images').replace(queryParameters: queryParams),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取图片列表失败: $e');
    }
  }

  // 获取图片详情
  Future<Map<String, dynamic>> getImageDetail(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/images/$id'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取图片详情失败: $e');
    }
  }

  // 更新图片信息
  Future<Map<String, dynamic>> updateImage(int id, Map<String, dynamic> data) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/images/$id'),
        headers: _headers,
        body: json.encode(data),
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('更新图片信息失败: $e');
    }
  }

  // 删除图片
  Future<Map<String, dynamic>> deleteImage(int id, {bool hardDelete = false}) async {
    try {
      final queryParams = <String, String>{};
      if (hardDelete) queryParams['hardDelete'] = 'true';

      final response = await http.delete(
        Uri.parse('$_baseUrl/images/$id').replace(queryParameters: queryParams),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('删除图片失败: $e');
    }
  }

  // 根据类型和关联ID获取图片
  Future<Map<String, dynamic>> getImagesByTypeAndRelated(int uploadType, int relatedId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/images/type/$uploadType/related/$relatedId'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取关联图片失败: $e');
    }
  }

  // 获取图片统计信息
  Future<Map<String, dynamic>> getImageStatistics() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/images/stats/statistics'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取图片统计信息失败: $e');
    }
  }

  // 获取音乐管理统计信息
  Future<Map<String, dynamic>> getMusicManagementStatistics() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/music/statistics'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取音乐统计信息失败: $e');
    }
  }

  // 获取文件统计信息
  Future<Map<String, dynamic>> getFileStatistics() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/files/stats/overview'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取文件统计信息失败: $e');
    }
  }

  // 获取系统配置
  Future<Map<String, dynamic>> getSystemConfig() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/config'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取系统配置失败: $e');
    }
  }

  // 获取博客设置
  Future<Map<String, dynamic>> getBlogSettings() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/config/blog/settings'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取博客设置失败: $e');
    }
  }

  // 保存博客设置
  Future<Map<String, dynamic>> saveBlogSettings(Map<String, dynamic> settings) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/config/blog/settings'),
        headers: _headers,
        body: json.encode(settings),
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('保存博客设置失败: $e');
    }
  }

  // 获取访问趋势统计
  Future<Map<String, dynamic>> getVisitTrends({int? days}) async {
    try {
      final queryParams = <String, String>{};
      if (days != null) queryParams['days'] = days.toString();
      
      final response = await http.get(
        Uri.parse('$_baseUrl/articles/analytics/trends').replace(queryParameters: queryParams),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取访问趋势统计失败: $e');
    }
  }

  // 获取热门文章统计
  Future<Map<String, dynamic>> getHotArticles({int? limit, int? days}) async {
    try {
      final queryParams = <String, String>{};
      if (limit != null) queryParams['limit'] = limit.toString();
      if (days != null) queryParams['days'] = days.toString();
      
      final response = await http.get(
        Uri.parse('$_baseUrl/articles/analytics/hot').replace(queryParameters: queryParams),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取热门文章统计失败: $e');
    }
  }

  // 获取访问来源统计
  Future<Map<String, dynamic>> getRefererStats({int? days}) async {
    try {
      final queryParams = <String, String>{};
      if (days != null) queryParams['days'] = days.toString();
      
      final response = await http.get(
        Uri.parse('$_baseUrl/articles/analytics/referer').replace(queryParameters: queryParams),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取访问来源统计失败: $e');
    }
  }

  // 获取设备类型统计
  Future<Map<String, dynamic>> getDeviceStats({int? days}) async {
    try {
      final queryParams = <String, String>{};
      if (days != null) queryParams['days'] = days.toString();
      
      final response = await http.get(
        Uri.parse('$_baseUrl/articles/analytics/device').replace(queryParameters: queryParams),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取设备类型统计失败: $e');
    }
  }

  // 获取访问时段统计
  Future<Map<String, dynamic>> getHourlyStats({int? days}) async {
    try {
      final queryParams = <String, String>{};
      if (days != null) queryParams['days'] = days.toString();
      
      final response = await http.get(
        Uri.parse('$_baseUrl/articles/analytics/hourly').replace(queryParameters: queryParams),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取访问时段统计失败: $e');
    }
  }

  // 获取地理位置统计
  Future<Map<String, dynamic>> getLocationStats({int? days}) async {
    try {
      final queryParams = <String, String>{};
      if (days != null) queryParams['days'] = days.toString();
      
      final response = await http.get(
        Uri.parse('$_baseUrl/articles/analytics/location').replace(queryParameters: queryParams),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取地理位置统计失败: $e');
    }
  }

  // 获取国家统计
  Future<Map<String, dynamic>> getCountryStats({int? days}) async {
    try {
      final queryParams = <String, String>{};
      if (days != null) queryParams['days'] = days.toString();
      
      final response = await http.get(
        Uri.parse('$_baseUrl/articles/analytics/country').replace(queryParameters: queryParams),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取国家统计失败: $e');
    }
  }

  // 获取清理统计信息
  Future<Map<String, dynamic>> getCleanupStats() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/articles/analytics/cleanup-stats'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取清理统计信息失败: $e');
    }
  }

  // ==================== 音乐管理接口 ====================

  // 获取音乐列表
  Future<Map<String, dynamic>> getMusicList({
    int page = 1,
    int pageSize = AppConstants.defaultPageSize,
    int? status,
    String? keyword,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'pageSize': pageSize.toString(),
        if (status != null) 'status': status.toString(),
        if (keyword != null && keyword.isNotEmpty) 'keyword': keyword,
      };

      final response = await http.get(
        Uri.parse('$_baseUrl/music').replace(queryParameters: queryParams),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取音乐列表失败: $e');
    }
  }

  // 获取音乐详情
  Future<Music> getMusicDetail(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/music/$id'),
        headers: _headers,
      );

      final data = _handleResponse(response);
      return Music.fromJson(data['data']);
    } catch (e) {
      throw Exception('获取音乐详情失败: $e');
    }
  }

  // 上传单个音乐文件
  Future<Map<String, dynamic>> uploadMusic(
    File file, {
    String? title,
    String? artist,
    String? album,
    String? genre,
    int? year,
    String? description,
    List<String>? tags,
    Function(double)? onProgress,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/music/upload/single'),
      );

      // 为文件上传设置正确的请求头
      final headers = <String, String>{};
      if (_authToken != null) {
        headers['Authorization'] = 'Bearer $_authToken';
      }
      request.headers.addAll(headers);
      
      request.files.add(
        await http.MultipartFile.fromPath('music', file.path),
      );

      if (title != null) request.fields['title'] = title;
      if (artist != null) request.fields['artist'] = artist;
      if (album != null) request.fields['album'] = album;
      if (genre != null) request.fields['genre'] = genre;
      if (year != null) request.fields['year'] = year.toString();
      if (description != null) request.fields['description'] = description;
      if (tags != null) request.fields['tags'] = jsonEncode(tags);

      final response = await request.send();
      final responseData = await response.stream.bytesToString();
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(responseData);
      } else {
        throw Exception('HTTP ${response.statusCode}: $responseData');
      }
    } catch (e) {
      throw Exception('上传音乐失败: $e');
    }
  }

  // 批量上传音乐文件
  Future<Map<String, dynamic>> uploadMultipleMusic(
    List<File> files, {
    String? artist,
    String? album,
    String? genre,
    int? year,
    String? description,
    List<String>? tags,
    Function(double)? onProgress,
  }) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$_baseUrl/music/upload/multiple'),
      );

      // 为文件上传设置正确的请求头
      final headers = <String, String>{};
      if (_authToken != null) {
        headers['Authorization'] = 'Bearer $_authToken';
      }
      request.headers.addAll(headers);
      
      for (final file in files) {
        request.files.add(
          await http.MultipartFile.fromPath('music', file.path),
        );
      }

      if (artist != null) request.fields['artist'] = artist;
      if (album != null) request.fields['album'] = album;
      if (genre != null) request.fields['genre'] = genre;
      if (year != null) request.fields['year'] = year.toString();
      if (description != null) request.fields['description'] = description;
      if (tags != null) request.fields['tags'] = jsonEncode(tags);

      final response = await request.send();
      final responseData = await response.stream.bytesToString();
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return json.decode(responseData);
      } else {
        throw Exception('HTTP ${response.statusCode}: $responseData');
      }
    } catch (e) {
      throw Exception('批量上传音乐失败: $e');
    }
  }

  // 更新音乐信息
  Future<Map<String, dynamic>> updateMusic(
    int id, {
    String? title,
    String? artist,
    String? album,
    String? genre,
    int? year,
    String? description,
    List<String>? tags,
    int? status,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (title != null) body['title'] = title;
      if (artist != null) body['artist'] = artist;
      if (album != null) body['album'] = album;
      if (genre != null) body['genre'] = genre;
      if (year != null) body['year'] = year;
      if (description != null) body['description'] = description;
      if (tags != null) body['tags'] = tags;
      if (status != null) body['status'] = status;

      final response = await http.put(
        Uri.parse('$_baseUrl/music/$id'),
        headers: _headers,
        body: json.encode(body),
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('更新音乐信息失败: $e');
    }
  }

  // 删除音乐
  Future<Map<String, dynamic>> deleteMusic(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/music/$id'),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('删除音乐失败: $e');
    }
  }

  // 切换音乐状态
  Future<Map<String, dynamic>> toggleMusicStatus(int id) async {
    try {
      final response = await http.patch(
        Uri.parse('$_baseUrl/music/$id/toggle'),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('切换音乐状态失败: $e');
    }
  }

  // 验证音乐文件
  Future<Map<String, dynamic>> validateMusic(int id) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/music/$id/validate'),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('验证音乐文件失败: $e');
    }
  }

  // 批量更新状态
  Future<Map<String, dynamic>> batchUpdateMusicStatus(
    List<int> ids,
    int status,
  ) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/music/batch/status'),
        headers: _headers,
        body: json.encode({
          'ids': ids,
          'status': status,
        }),
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('批量更新状态失败: $e');
    }
  }

  // 批量导入音乐
  Future<Map<String, dynamic>> batchImportMusic() async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/music/batch/import'),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('批量导入音乐失败: $e');
    }
  }

  // 批量验证音乐
  Future<Map<String, dynamic>> batchValidateMusic({List<int>? ids}) async {
    try {
      final body = <String, dynamic>{};
      if (ids != null) body['ids'] = ids;

      final response = await http.post(
        Uri.parse('$_baseUrl/music/batch/validate'),
        headers: _headers,
        body: json.encode(body),
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('批量验证音乐失败: $e');
    }
  }

  // 刷新音乐表
  Future<Map<String, dynamic>> refreshMusicTable() async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/music/refresh'),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('刷新音乐表失败: $e');
    }
  }

  // 获取音乐统计信息
  Future<Map<String, dynamic>> getMusicStatistics() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/music/statistics'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      throw Exception('获取音乐统计信息失败: $e');
    }
  }

  // 获取启用的音乐列表（公开接口）
  Future<List<Music>> getEnabledMusicList() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/music/enabled'),
        headers: _headers,
      );

      final data = _handleResponse(response);
      return (data['data'] as List)
          .map((json) => Music.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('获取启用的音乐列表失败: $e');
    }
  }

  // 随机获取音乐
  Future<List<Music>> getRandomMusic({int count = 1}) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/music/random').replace(
          queryParameters: {'count': count.toString()},
        ),
        headers: _headers,
      );

      final data = _handleResponse(response);
      return (data['data'] as List)
          .map((json) => Music.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('获取随机音乐失败: $e');
    }
  }

  // 根据艺术家获取音乐
  Future<Map<String, dynamic>> getMusicByArtist(
    String artist, {
    int page = 1,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      };

      final response = await http.get(
        Uri.parse('$_baseUrl/music/artist/${Uri.encodeComponent(artist)}')
            .replace(queryParameters: queryParams),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('根据艺术家获取音乐失败: $e');
    }
  }

  // 根据专辑获取音乐
  Future<Map<String, dynamic>> getMusicByAlbum(
    String album, {
    int page = 1,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      };

      final response = await http.get(
        Uri.parse('$_baseUrl/music/album/${Uri.encodeComponent(album)}')
            .replace(queryParameters: queryParams),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('根据专辑获取音乐失败: $e');
    }
  }

  // 根据流派获取音乐
  Future<Map<String, dynamic>> getMusicByGenre(
    String genre, {
    int page = 1,
    int pageSize = AppConstants.defaultPageSize,
  }) async {
    try {
      final queryParams = {
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      };

      final response = await http.get(
        Uri.parse('$_baseUrl/music/genre/${Uri.encodeComponent(genre)}')
            .replace(queryParameters: queryParams),
        headers: _headers,
      );

      return _handleResponse(response);
    } catch (e) {
      throw Exception('根据流派获取音乐失败: $e');
    }
  }

  // 获取最热门音乐
  Future<List<Music>> getPopularMusic({int limit = 10}) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/music/popular').replace(
          queryParameters: {'limit': limit.toString()},
        ),
        headers: _headers,
      );

      final data = _handleResponse(response);
      return (data['data'] as List)
          .map((json) => Music.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('获取热门音乐失败: $e');
    }
  }
} 