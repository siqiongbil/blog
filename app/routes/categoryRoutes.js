import express from 'express';
import { CategoryController } from '../controllers/index.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * 公开访问的分类路由
 */

// 获取分类列表（支持分页和不分页）
router.get('/', CategoryController.getCategoryList);

// 根据ID获取分类信息
router.get('/:id', CategoryController.getCategoryInfo);

// 根据别名获取分类信息
router.get('/slug/:slug', CategoryController.getCategoryBySlug);

// 获取分类及其文章数量统计
router.get('/stats/article-count', CategoryController.getCategoriesWithArticleCount);

// 获取分类选择项（用于下拉选择）
router.get('/options/select', CategoryController.getCategoriesForSelect);

// 检查分类别名是否可用
router.get('/check/slug/:slug', CategoryController.checkSlugAvailability);

/**
 * 需要管理员权限的分类管理路由
 */

// 创建分类
router.post('/', authenticateToken, requireAdmin, CategoryController.createCategory);

// 更新分类信息
router.put('/:id', authenticateToken, requireAdmin, CategoryController.updateCategory);

// 删除分类
router.delete('/:id', authenticateToken, requireAdmin, CategoryController.deleteCategory);

// 更新分类排序
router.put('/batch/sort', authenticateToken, requireAdmin, CategoryController.updateCategorySort);

// 批量删除分类
router.delete('/batch/delete', authenticateToken, requireAdmin, CategoryController.batchDeleteCategories);

// 上传分类图片
router.post('/upload/image', authenticateToken, requireAdmin, uploadSingle('image'), CategoryController.uploadCategoryImage);

// 删除分类图片
router.delete('/:id/image', authenticateToken, requireAdmin, CategoryController.deleteCategoryImage);

export default router; 