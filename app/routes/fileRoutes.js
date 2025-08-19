import express from 'express';
import { FileController } from '../controllers/index.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { uploadSingleFile, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * 文件管理路由
 */

// 上传文件（需要管理员权限）
router.post('/upload', 
  authenticateToken, 
  requireAdmin, 
  uploadSingleFile, 
  handleUploadError, 
  FileController.uploadFile.bind(FileController)
);

// 获取文件列表（需要管理员权限）
router.get('/', 
  authenticateToken, 
  requireAdmin, 
  FileController.getFileList.bind(FileController)
);

// 获取文件详情（需要管理员权限）
router.get('/:id', 
  authenticateToken, 
  requireAdmin, 
  FileController.getFileInfo.bind(FileController)
);

// 更新文件信息（需要管理员权限）
router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  FileController.updateFile.bind(FileController)
);

// 删除文件（需要管理员权限）
router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  FileController.deleteFile.bind(FileController)
);

// 获取文件统计信息（需要管理员权限）
router.get('/stats/overview', 
  authenticateToken, 
  requireAdmin, 
  FileController.getFileStats.bind(FileController)
);

export default router; 