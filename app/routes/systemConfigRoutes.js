import express from 'express';
import { SystemConfigController } from '../controllers/index.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 公开访问的配置路由
 */

// 获取博客基本设置（公开）
router.get('/blog/settings', SystemConfigController.getBlogSettings);

// 获取指定配置值（公开）
router.get('/value/:key', SystemConfigController.getConfigValue);

// 批量获取配置值（公开）
router.post('/values/batch', SystemConfigController.getMultipleConfigValues);

/**
 * 需要管理员权限的配置管理路由
 */

// 获取配置列表
router.get('/', authenticateToken, requireAdmin, SystemConfigController.getConfigList);

// 创建配置项
router.post('/', authenticateToken, requireAdmin, SystemConfigController.createConfig);

// 获取配置统计
router.get('/statistics', authenticateToken, requireAdmin, SystemConfigController.getConfigStatistics);

// 根据ID获取配置项
router.get('/:id', authenticateToken, requireAdmin, SystemConfigController.getConfigInfo);

// 更新配置项
router.put('/:id', authenticateToken, requireAdmin, SystemConfigController.updateConfig);

// 删除配置项
router.delete('/:id', authenticateToken, requireAdmin, SystemConfigController.deleteConfig);

// 根据配置键获取配置项
router.get('/key/:key', authenticateToken, requireAdmin, SystemConfigController.getConfigByKey);

// 设置配置值
router.put('/key/:key', authenticateToken, requireAdmin, SystemConfigController.setConfigValue);

// 根据配置键删除配置项
router.delete('/key/:key', authenticateToken, requireAdmin, SystemConfigController.deleteConfigByKey);

// 检查配置键可用性
router.get('/check/key/:key', authenticateToken, requireAdmin, SystemConfigController.checkKeyAvailability);

// 根据类型获取配置项
router.get('/type/:type', authenticateToken, requireAdmin, SystemConfigController.getConfigsByType);

// 批量设置配置值
router.post('/batch/set', authenticateToken, requireAdmin, SystemConfigController.setMultipleConfigValues);

// 保存博客设置
router.put('/blog/settings', authenticateToken, requireAdmin, SystemConfigController.saveBlogSettings);

// 重置配置到默认值
router.post('/reset/defaults', authenticateToken, requireAdmin, SystemConfigController.resetToDefaults);

export default router; 