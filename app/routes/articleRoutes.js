import express from 'express';
import { ArticleController } from '../controllers/index.js';
import { authenticateToken, optionalAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 公开访问的文章路由
 */

// 获取文章列表（支持多种筛选条件）
router.get('/', ArticleController.getArticleList);

// 获取热门文章
router.get('/popular', ArticleController.getPopularArticles);

// 获取最新文章
router.get('/latest', ArticleController.getLatestArticles);

// 获取文章统计信息
router.get('/statistics', ArticleController.getArticleStatistics);

// 根据分类获取文章
router.get('/category/:slug', ArticleController.getArticlesByCategory);

// 根据标签获取文章（GET方式，通过查询参数）
router.get('/tags/:tagIds', ArticleController.getArticlesByTagsGet);

// 访问统计相关路由（需要管理员权限）
router.get('/analytics/trends', authenticateToken, requireAdmin, ArticleController.getVisitTrends);
router.get('/analytics/hot', authenticateToken, requireAdmin, ArticleController.getHotArticles);
router.get('/analytics/referer', authenticateToken, requireAdmin, ArticleController.getRefererStats);
router.get('/analytics/device', authenticateToken, requireAdmin, ArticleController.getDeviceStats);
router.get('/analytics/hourly', authenticateToken, requireAdmin, ArticleController.getHourlyStats);

// 数据清理相关路由（需要管理员权限）
router.post('/analytics/cleanup', authenticateToken, requireAdmin, ArticleController.cleanupVisitData);
router.get('/analytics/cleanup-stats', authenticateToken, requireAdmin, ArticleController.getCleanupStats);

// 地理位置统计相关路由（需要管理员权限）
router.get('/analytics/location', authenticateToken, requireAdmin, ArticleController.getLocationStats);
router.get('/analytics/country', authenticateToken, requireAdmin, ArticleController.getCountryStats);

// 获取文章详情（自动增加浏览次数）
router.get('/:id', optionalAuth, ArticleController.getArticleInfo);

// 获取相关文章
router.get('/:id/related', ArticleController.getRelatedArticles);

// 获取文章的标签
router.get('/:id/tags', ArticleController.getArticleTags);

// 文章访问统计和明细（需要管理员权限）
router.get('/:id/visit-stats', authenticateToken, requireAdmin, ArticleController.getArticleVisitStats);
router.get('/:id/visit-details', authenticateToken, requireAdmin, ArticleController.getVisitDetails);

// 根据标签查询文章
router.post('/by-tags', ArticleController.getArticlesByTags);

/**
 * 需要登录的文章操作路由
 */

// 创建文章（需要登录）
router.post('/', authenticateToken, ArticleController.createArticle);

// 更新文章（需要登录，只有作者可以编辑）
router.put('/:id', authenticateToken, ArticleController.updateArticle);

// 删除文章（软删除，需要登录，只有作者可以删除）
router.delete('/:id', authenticateToken, ArticleController.deleteArticle);

// 为文章添加标签
router.post('/:id/tags', authenticateToken, ArticleController.addTagsToArticle);

// 从文章移除标签
router.delete('/:id/tags', authenticateToken, ArticleController.removeTagsFromArticle);

// 设置文章标签（替换所有现有标签）
router.put('/:id/tags', authenticateToken, ArticleController.setArticleTags);

/**
 * 需要管理员权限的文章管理路由
 */

// 批量更新文章状态
router.put('/batch/status', authenticateToken, requireAdmin, ArticleController.batchUpdateStatus);

// 永久删除文章（需要管理员权限）
router.delete('/:id/permanent', authenticateToken, requireAdmin, ArticleController.hardDeleteArticle);

export default router; 