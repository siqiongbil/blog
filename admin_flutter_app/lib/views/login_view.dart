import 'package:flutter/material.dart';
import '../constants/app_constants.dart';
import '../services/api_service.dart';
import '../utils/storage_utils.dart';
import '../models/user.dart';

class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _rememberMe = false; // 记住我状态
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    
    _animationController.forward();
    
    // 加载保存的登录信息
    _loadSavedLoginInfo();
  }

  // 加载保存的登录信息
  Future<void> _loadSavedLoginInfo() async {
    try {
      final savedUsername = await StorageUtils.getSavedUsername();
      final savedPassword = await StorageUtils.getSavedPassword();
      final rememberMe = await StorageUtils.getRememberMe();
      
      print('加载保存的登录信息:');
      print('用户名: $savedUsername');
      print('密码: ${savedPassword != null ? '已保存' : '未保存'}');
      print('记住我: $rememberMe');
      
      if (mounted) {
        setState(() {
          if (savedUsername != null) {
            _usernameController.text = savedUsername;
          }
          if (savedPassword != null) {
            _passwordController.text = savedPassword;
          }
          _rememberMe = rememberMe ?? false;
        });
      }
    } catch (e) {
      print('加载保存的登录信息失败: $e');
    }
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final apiService = ApiService();
      final response = await apiService.login(
        _usernameController.text,
        _passwordController.text,
      );
      
      // 保存认证令牌和用户信息
      if (response['data'] != null && response['data']['token'] != null) {
        await StorageUtils.saveAuthToken(response['data']['token']);
      }
      
      if (response['data'] != null && response['data']['user'] != null) {
        try {
          final user = User.fromJson(response['data']['user']);
          await StorageUtils.saveUser(user);
        } catch (e) {
          throw Exception('用户数据格式错误: $e');
        }
      }

      // 根据记住我状态保存登录信息
      if (_rememberMe) {
        await StorageUtils.saveUsername(_usernameController.text);
        await StorageUtils.savePassword(_passwordController.text);
        await StorageUtils.saveRememberMe(true);
      } else {
        // 如果未勾选记住我，清除保存的登录信息
        await StorageUtils.clearSavedLoginInfo();
      }
      
      if (mounted) {
        Navigator.pushReplacementNamed(context, AppConstants.dashboardRoute);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('登录失败: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // 获取屏幕尺寸和主题信息
    final screenSize = MediaQuery.of(context).size;
    final brightness = MediaQuery.of(context).platformBrightness;
    final isDarkMode = brightness == Brightness.dark;
    
    // 响应式背景色配置
    final backgroundColors = _getResponsiveBackgroundColors(screenSize, isDarkMode);
    
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: backgroundColors,
            stops: _getGradientStops(screenSize),
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: screenSize.width * 0.06, 
                  vertical: screenSize.height * 0.02
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo和标题区域
                    _buildHeader(),
                    SizedBox(height: screenSize.height * 0.03),
                    
                    // 登录表单
                    _buildLoginForm(),
                    SizedBox(height: screenSize.height * 0.025),
                    
                    // 其他选项
                    _buildAdditionalOptions(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // 响应式背景色配置
  List<Color> _getResponsiveBackgroundColors(Size screenSize, bool isDarkMode) {
    // 根据屏幕尺寸调整颜色
    if (screenSize.width < 600) {
      // 手机端 - 更鲜艳的颜色
      return isDarkMode 
        ? [
            const Color(0xFF1a1a2e),
            const Color(0xFF16213e),
            const Color(0xFF0f3460),
          ]
        : [
            const Color(0xFF667eea),
            const Color(0xFF764ba2),
            const Color(0xFFf093fb),
          ];
    } else if (screenSize.width < 1200) {
      // 平板端 - 中等饱和度
      return isDarkMode
        ? [
            const Color(0xFF2d3748),
            const Color(0xFF4a5568),
            const Color(0xFF2c5282),
          ]
        : [
            const Color(0xFF667eea),
            const Color(0xFF764ba2),
          ];
    } else {
      // 桌面端 - 更柔和的颜色
      return isDarkMode
        ? [
            const Color(0xFF2d3748),
            const Color(0xFF4a5568),
          ]
        : [
            const Color(0xFF667eea).withValues(alpha: 0.9),
            const Color(0xFF764ba2).withValues(alpha: 0.8),
          ];
    }
  }

  // 响应式渐变停止点
  List<double> _getGradientStops(Size screenSize) {
    if (screenSize.width < 600) {
      // 手机端 - 三色渐变
      return [0.0, 0.5, 1.0];
    } else {
      // 平板和桌面端 - 双色渐变
      return [0.0, 1.0];
    }
  }

  Widget _buildHeader() {
    final screenSize = MediaQuery.of(context).size;
    final isSmallScreen = screenSize.width < 600;
    
    return Column(
      children: [
        // 动态Logo - 使用自定义应用图标
        Container(
          width: isSmallScreen ? 50 : 60,
          height: isSmallScreen ? 50 : 60,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(isSmallScreen ? 14 : 16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: isSmallScreen ? 14 : 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(isSmallScreen ? 14 : 16),
            child: Image.asset(
              'assets/app_icon/app_icon.png',
              width: isSmallScreen ? 50 : 60,
              height: isSmallScreen ? 50 : 60,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                // 如果图片加载失败，显示默认图标
                return Icon(
                  Icons.admin_panel_settings,
                  size: isSmallScreen ? 25 : 30,
                  color: Colors.white,
                );
              },
            ),
          ),
        ),
        SizedBox(height: isSmallScreen ? 12 : 16),
        
        // 标题
        Text(
          '博客管理系统',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.white,
            fontSize: isSmallScreen ? 20 : 22,
          ),
        ),
        const SizedBox(height: 6),
        
        // 副标题
        Text(
          '欢迎回来，请登录您的账户',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: Colors.white.withValues(alpha: 0.8),
            fontSize: isSmallScreen ? 12 : 13,
          ),
        ),
      ],
    );
  }

  Widget _buildLoginForm() {
    final screenSize = MediaQuery.of(context).size;
    final isSmallScreen = screenSize.width < 600;
    
    return Container(
      width: double.infinity,
      constraints: BoxConstraints(
        maxWidth: isSmallScreen ? double.infinity : 400,
      ),
      padding: EdgeInsets.all(isSmallScreen ? 20 : 22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(isSmallScreen ? 16 : 20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: isSmallScreen ? 20 : 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 表单标题
            Text(
              '登录',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: const Color(0xFF2D3748),
                fontSize: isSmallScreen ? 20 : 22,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '请输入您的凭据',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
                fontSize: isSmallScreen ? 13 : 14,
              ),
            ),
            SizedBox(height: isSmallScreen ? 16 : 20),

            // 用户名输入框
            _buildTextField(
              controller: _usernameController,
              label: '用户名',
              icon: Icons.person_outline,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入用户名';
                }
                return null;
              },
            ),
            SizedBox(height: isSmallScreen ? 12 : 14),

            // 密码输入框
            _buildTextField(
              controller: _passwordController,
              label: '密码',
              icon: Icons.lock_outline,
              obscureText: _obscurePassword,
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  color: Colors.grey[600],
                ),
                onPressed: () {
                  setState(() {
                    _obscurePassword = !_obscurePassword;
                  });
                },
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入密码';
                }
                if (value.length < 6) {
                  return '密码长度至少6位';
                }
                return null;
              },
            ),
            SizedBox(height: isSmallScreen ? 16 : 18),

            // 登录按钮
            SizedBox(
              width: double.infinity,
              height: isSmallScreen ? 44 : 46,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF667eea),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(isSmallScreen ? 14 : 16),
                  ),
                  shadowColor: const Color(0xFF667eea).withValues(alpha: 0.3),
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.login, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            '登录',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              fontSize: isSmallScreen ? 15 : 16,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    final screenSize = MediaQuery.of(context).size;
    final isSmallScreen = screenSize.width < 600;
    
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.grey[600]),
        suffixIcon: suffixIcon,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(isSmallScreen ? 10 : 12),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(isSmallScreen ? 10 : 12),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(isSmallScreen ? 10 : 12),
          borderSide: const BorderSide(color: Color(0xFF667eea), width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(isSmallScreen ? 10 : 12),
          borderSide: BorderSide(color: Colors.red[300]!),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(isSmallScreen ? 10 : 12),
          borderSide: BorderSide(color: Colors.red[400]!, width: 2),
        ),
        filled: true,
        fillColor: Colors.grey[50],
        contentPadding: EdgeInsets.symmetric(
          horizontal: isSmallScreen ? 14 : 16, 
          vertical: isSmallScreen ? 14 : 16
        ),
        labelStyle: TextStyle(
          fontSize: isSmallScreen ? 14 : 16,
        ),
      ),
      style: TextStyle(
        fontSize: isSmallScreen ? 14 : 16,
      ),
      validator: validator,
    );
  }

  Widget _buildAdditionalOptions() {
    return Column(
      children: [
        // 记住我选项
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Checkbox(
              value: _rememberMe,
              onChanged: (value) async {
                setState(() {
                  _rememberMe = value ?? false;
                });
                
                // 异步保存记住我状态
                if (value == true) {
                  await StorageUtils.saveRememberMe(true);
                } else {
                  await StorageUtils.saveRememberMe(false);
                  // 如果取消记住我，清除保存的登录信息
                  await StorageUtils.clearSavedLoginInfo();
                }
              },
              activeColor: const Color(0xFF667eea),
            ),
            Text(
              '记住我',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8),
                fontSize: 13,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        
        // 版本信息
        Text(
          '版本 ${AppConstants.appVersion}',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.6),
            fontSize: 10,
          ),
        ),
      ],
    );
  }
} 