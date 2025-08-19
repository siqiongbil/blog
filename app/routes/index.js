import express from 'express';
import userRoutes from './userRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import articleRoutes from './articleRoutes.js';
import musicRoutes from './musicRoutes.js';
import systemConfigRoutes from './systemConfigRoutes.js';
import tagRoutes from './tagRoutes.js';
import imageRoutes from './imageRoutes.js';
import fileRoutes from './fileRoutes.js';
import indexNowRoutes from './indexNowRoutes.js';

const router = express.Router();

/**
 * API路由配置
 * 所有路由都以 /api 为前缀
 */

// 用户相关路由
router.use('/users', userRoutes);

// 分类相关路由
router.use('/categories', categoryRoutes);

// 文章相关路由
router.use('/articles', articleRoutes);

// 音乐相关路由
router.use('/music', musicRoutes);

// 系统配置相关路由
router.use('/config', systemConfigRoutes);

// 标签相关路由
router.use('/tags', tagRoutes);

// 图片相关路由
router.use('/images', imageRoutes);

// 文件相关路由
router.use('/files', fileRoutes);

// IndexNow相关路由
router.use('/indexnow', indexNowRoutes);

/**
 * API健康检查接口
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * API信息接口
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: '个人博客API',
      version: '1.0.0',
      description: '提供博客系统的完整REST API服务',
      endpoints: {
        users: '/api/users - 用户管理',
        categories: '/api/categories - 分类管理',
        articles: '/api/articles - 文章管理',
        music: '/api/music - 音乐管理',
        config: '/api/config - 系统配置',
        tags: '/api/tags - 标签管理',
        images: '/api/images - 图片管理',
        files: '/api/files - 文件管理'
      }
    }
  });
});

/**
 * 404处理
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的API端点不存在',
    path: req.originalUrl
  });
});

export default router; 