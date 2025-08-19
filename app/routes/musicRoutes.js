import express from 'express';
import { MusicController } from '../controllers/index.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import { uploadSingleMusic, uploadMultipleMusic, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// 获取启用的音乐列表
router.get('/enabled', MusicController.getEnabledMusic);

// 随机获取音乐
router.get('/random', MusicController.getRandomMusic);

// 获取音乐统计信息
router.get('/statistics', MusicController.getMusicStatistics);

// 根据艺术家获取音乐
router.get('/artist/:artist', MusicController.getMusicByArtist);

// 根据专辑获取音乐
router.get('/album/:album', MusicController.getMusicByAlbum);

// 根据流派获取音乐
router.get('/genre/:genre', MusicController.getMusicByGenre);

// 获取最热门音乐
router.get('/popular', MusicController.getMostPlayedMusic);

// 根据上传者获取音乐
router.get('/uploader/:uploaderId', MusicController.getMusicByUploader);

// 获取音乐列表（管理员）
router.get('/', authenticateToken, requireAdmin, MusicController.getMusicList);

// 添加音乐
router.post('/', authenticateToken, requireAdmin, MusicController.addMusic);

// 获取指定音乐信息
router.get('/:id', MusicController.getMusicInfo);

// 更新音乐信息
router.put('/:id', authenticateToken, requireAdmin, MusicController.updateMusic);

// 删除音乐
router.delete('/:id', authenticateToken, requireAdmin, MusicController.deleteMusic);

// 切换音乐状态
router.patch('/:id/toggle', authenticateToken, requireAdmin, MusicController.toggleMusicStatus);

// 验证音乐文件
router.get('/:id/validate', authenticateToken, requireAdmin, MusicController.validateMusicFile);

// 批量更新状态
router.put('/batch/status', authenticateToken, requireAdmin, MusicController.batchUpdateStatus);

// 批量导入音乐
router.post('/batch/import', authenticateToken, requireAdmin, MusicController.scanAndImportMusic);

// 批量验证文件
router.post('/batch/validate', authenticateToken, requireAdmin, MusicController.batchValidateMusicFiles);

// 上传音乐文件（单个文件，默认路径）
router.post('/upload', authenticateToken, requireAdmin, uploadSingleMusic, handleUploadError, MusicController.uploadSingleMusic);

// 上传单个音乐文件
router.post('/upload/single', authenticateToken, requireAdmin, uploadSingleMusic, handleUploadError, MusicController.uploadSingleMusic);

// 批量上传音乐文件
router.post('/upload/multiple', authenticateToken, requireAdmin, uploadMultipleMusic, handleUploadError, MusicController.uploadMultipleMusic);

// 刷新音乐表
router.post('/refresh', authenticateToken, requireAdmin, MusicController.refreshMusicTable);

export default router; 