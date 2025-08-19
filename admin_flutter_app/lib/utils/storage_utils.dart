import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../models/user.dart';

class StorageUtils {
  static final StorageUtils _instance = StorageUtils._internal();
  factory StorageUtils() => _instance;
  StorageUtils._internal();

  static SharedPreferences? _prefs;

  // 初始化SharedPreferences
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // 保存字符串
  static Future<bool> setString(String key, String value) async {
    if (_prefs == null) await init();
    return await _prefs!.setString(key, value);
  }

  // 获取字符串
  static String? getString(String key) {
    return _prefs?.getString(key);
  }

  // 保存布尔值
  static Future<bool> setBool(String key, bool value) async {
    if (_prefs == null) await init();
    return await _prefs!.setBool(key, value);
  }

  // 获取布尔值
  static bool? getBool(String key) {
    return _prefs?.getBool(key);
  }

  // 保存整数
  static Future<bool> setInt(String key, int value) async {
    if (_prefs == null) await init();
    return await _prefs!.setInt(key, value);
  }

  // 获取整数
  static int? getInt(String key) {
    return _prefs?.getInt(key);
  }

  // 保存对象（JSON格式）
  static Future<bool> setObject(String key, Map<String, dynamic> value) async {
    if (_prefs == null) await init();
    return await _prefs!.setString(key, json.encode(value));
  }

  // 获取对象（JSON格式）
  static Map<String, dynamic>? getObject(String key) {
    final jsonString = _prefs?.getString(key);
    if (jsonString != null) {
      try {
        return json.decode(jsonString) as Map<String, dynamic>;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // 删除指定键
  static Future<bool> remove(String key) async {
    if (_prefs == null) await init();
    return await _prefs!.remove(key);
  }

  // 清除所有数据
  static Future<bool> clear() async {
    if (_prefs == null) await init();
    return await _prefs!.clear();
  }

  // 保存认证令牌
  static Future<bool> saveAuthToken(String token) async {
    return await setString(AppConstants.tokenKey, token);
  }

  // 获取认证令牌
  static String? getAuthToken() {
    return getString(AppConstants.tokenKey);
  }

  // 删除认证令牌
  static Future<bool> removeAuthToken() async {
    return await remove(AppConstants.tokenKey);
  }

  // 保存用户信息
  static Future<bool> saveUser(User user) async {
    return await setObject(AppConstants.userKey, user.toJson());
  }

  // 获取用户信息
  static User? getUser() {
    final userData = getObject(AppConstants.userKey);
    if (userData != null) {
      try {
        return User.fromJson(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // 删除用户信息
  static Future<bool> removeUser() async {
    return await remove(AppConstants.userKey);
  }

  // 保存主题设置
  static Future<bool> saveTheme(String theme) async {
    return await setString(AppConstants.themeKey, theme);
  }

  // 获取主题设置
  static String? getTheme() {
    return getString(AppConstants.themeKey);
  }

  // 保存语言设置
  static Future<bool> saveLanguage(String language) async {
    return await setString(AppConstants.languageKey, language);
  }

  // 获取语言设置
  static String? getLanguage() {
    return getString(AppConstants.languageKey);
  }

  // 检查是否已登录
  static bool isLoggedIn() {
    return getAuthToken() != null && getUser() != null;
  }

  // 清除所有认证相关数据
  static Future<bool> clearAuthData() async {
    await removeAuthToken();
    await removeUser();
    return true;
  }

  // 记住我功能相关方法
  
  // 保存记住我状态
  static Future<bool> saveRememberMe(bool rememberMe) async {
    return await setBool('remember_me', rememberMe);
  }

  // 获取记住我状态
  static bool? getRememberMe() {
    return getBool('remember_me');
  }

  // 保存用户名
  static Future<bool> saveUsername(String username) async {
    return await setString('saved_username', username);
  }

  // 获取保存的用户名
  static String? getSavedUsername() {
    return getString('saved_username');
  }

  // 保存密码
  static Future<bool> savePassword(String password) async {
    return await setString('saved_password', password);
  }

  // 获取保存的密码
  static String? getSavedPassword() {
    return getString('saved_password');
  }

  // 清除保存的登录信息
  static Future<bool> clearSavedLoginInfo() async {
    await remove('saved_username');
    await remove('saved_password');
    await remove('remember_me');
    return true;
  }
} 