import jwt from 'jsonwebtoken';

// JWT配置验证
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET环境变量未设置');
}

if (JWT_SECRET.length < 32) {
  console.warn('警告: JWT_SECRET长度过短，建议使用至少32个字符的密钥');
}

/**
 * JWT身份验证中间件
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: process.env.AUTH_MISSING_TOKEN_MSG || '访问令牌缺失'
    });
  }

  jwt.verify(token, JWT_SECRET, { algorithm: JWT_ALGORITHM }, (err, user) => {
    if (err) {
      let message = process.env.AUTH_INVALID_TOKEN_MSG || '访问令牌无效或已过期';
      
      // 根据错误类型提供更具体的错误信息
      if (process.env.NODE_ENV === 'development') {
        if (err.name === 'TokenExpiredError') {
          message = '访问令牌已过期';
        } else if (err.name === 'JsonWebTokenError') {
          message = '访问令牌格式无效';
        } else if (err.name === 'NotBeforeError') {
          message = '访问令牌尚未生效';
        }
      }

      return res.status(403).json({
        success: false,
        message
      });
    }

    req.user = user;
    next();
  });
};

/**
 * 可选的身份验证中间件（不强制要求登录）
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, { algorithm: JWT_ALGORITHM }, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

/**
 * 管理员权限检查中间件
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: process.env.AUTH_LOGIN_REQUIRED_MSG || '需要登录'
    });
  }

  // 从环境变量获取管理员角色值
  const adminRole = parseInt(process.env.ADMIN_ROLE) || 1;
  
  if (req.user.role !== adminRole) {
    return res.status(403).json({
      success: false,
      message: process.env.AUTH_ADMIN_REQUIRED_MSG || '需要管理员权限'
    });
  }

  next();
};

// 导出JWT配置供其他模块使用
export const jwtConfig = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN,
  algorithm: JWT_ALGORITHM
}; 