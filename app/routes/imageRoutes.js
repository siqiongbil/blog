import express from 'express';
import { ImageController } from '../controllers/index.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { uploadSingle, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * 公开访问的图片路由
 */

// 获取图片详情
router.get('/:id', ImageController.getImageInfo);

// 根据类型和关联ID获取图片
router.get('/type/:upload_type/related/:related_id', ImageController.getImagesByTypeAndRelatedId);

/**
 * 需要管理员权限的图片管理路由
 */

// 获取图片列表（管理员）
router.get('/', authenticateToken, requireAdmin, ImageController.getImageList);

// 上传图片
router.post('/upload', authenticateToken, requireAdmin, uploadSingle('image'), handleUploadError, ImageController.uploadImage);

// 更新图片信息
router.put('/:id', authenticateToken, requireAdmin, ImageController.updateImage);

// 删除图片
router.delete('/:id', authenticateToken, requireAdmin, ImageController.deleteImage);

// 获取图片统计信息
router.get('/stats/statistics', authenticateToken, requireAdmin, ImageController.getImageStatistics);

// 批量更新图片状态
router.put('/batch/status', authenticateToken, requireAdmin, ImageController.batchUpdateImageStatus);

// 批量删除图片
router.delete('/batch/delete', authenticateToken, requireAdmin, ImageController.batchDeleteImages);

export default router; 