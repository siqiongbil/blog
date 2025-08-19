import express from 'express';
import { IndexNowController } from '../controllers/indexNowController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * IndexNow API 路由
 * 处理向搜索引擎提交URL更新的请求
 */

/**
 * @swagger
 * tags:
 *   name: IndexNow
 *   description: 搜索引擎索引更新API
 */

/**
 * @swagger
 * /api/indexnow/submit-url:
 *   post:
 *     summary: 提交单个URL到搜索引擎
 *     tags: [IndexNow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - apiKey
 *               - targetHost
 *             properties:
 *               url:
 *                 type: string
 *                 description: 要提交的URL路径或完整URL
 *                 example: "/articles/123"
 *               apiKey:
 *                 type: string
 *                 description: IndexNow API密钥
 *                 example: "7ac2cc80daea498480dba6b6f31c87da"
 *               targetHost:
 *                 type: string
 *                 description: 目标网站域名
 *                 example: "siqiongbiluo.love"
 *     responses:
 *       200:
 *         description: 提交成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 *                 responseData:
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 需要管理员权限
 *       500:
 *         description: 服务器错误
 */
router.post('/submit-url', 
  authenticateToken, 
  requireAdmin, 
  IndexNowController.submitUrl
);

/**
 * @swagger
 * /api/indexnow/submit-urls:
 *   post:
 *     summary: 批量提交URL到搜索引擎
 *     tags: [IndexNow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - urls
 *               - apiKey
 *               - targetHost
 *             properties:
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 要提交的URL列表
 *                 example: ["/", "/articles", "/articles/123"]
 *               apiKey:
 *                 type: string
 *                 description: IndexNow API密钥
 *                 example: "7ac2cc80daea498480dba6b6f31c87da"
 *               targetHost:
 *                 type: string
 *                 description: 目标网站域名
 *                 example: "siqiongbiluo.love"
 *     responses:
 *       200:
 *         description: 提交成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 *                 submittedCount:
 *                   type: integer
 *                 responseData:
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 需要管理员权限
 *       500:
 *         description: 服务器错误
 */
router.post('/submit-urls', 
  authenticateToken, 
  requireAdmin, 
  IndexNowController.submitUrls
);

/**
 * @swagger
 * /api/indexnow/verify-key:
 *   post:
 *     summary: 验证IndexNow密钥文件
 *     tags: [IndexNow]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *               - targetHost
 *             properties:
 *               apiKey:
 *                 type: string
 *                 description: IndexNow API密钥
 *                 example: "7ac2cc80daea498480dba6b6f31c87da"
 *               targetHost:
 *                 type: string
 *                 description: 目标网站域名
 *                 example: "siqiongbiluo.love"
 *     responses:
 *       200:
 *         description: 验证结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 keyFileUrl:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 *                 content:
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       403:
 *         description: 需要管理员权限
 *       500:
 *         description: 服务器错误
 */
router.post('/verify-key', 
  authenticateToken, 
  requireAdmin, 
  IndexNowController.verifyKeyFile
);

/**
 * @swagger
 * /api/indexnow/stats:
 *   get:
 *     summary: 获取IndexNow使用统计
 *     tags: [IndexNow]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取统计成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     todaySubmissions:
 *                       type: integer
 *                     monthSubmissions:
 *                       type: integer
 *                     totalSubmissions:
 *                       type: integer
 *                     lastSubmission:
 *                       type: string
 *                       format: date-time
 *                     recentSubmissions:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: 未授权
 *       403:
 *         description: 需要管理员权限
 *       500:
 *         description: 服务器错误
 */
router.get('/stats', 
  authenticateToken, 
  requireAdmin, 
  IndexNowController.getStats
);

export default router; 