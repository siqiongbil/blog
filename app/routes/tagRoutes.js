import express from 'express';
import { TagController } from '../controllers/index.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 标签路由
 */

// 公开路由（不需要认证）

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: 获取标签列表
 *     tags: [标签管理]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码（可选，不提供则返回所有标签）
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页数量（可选）
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [article_count, created_at, name]
 *           default: article_count
 *         description: 排序字段
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 获取成功
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
 *                     tags:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Tag'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', TagController.getTagList);

/**
 * @swagger
 * /api/tags/select:
 *   get:
 *     summary: 获取标签选择项（用于表单选择器）
 *     tags: [标签管理]
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       color:
 *                         type: string
 *                       article_count:
 *                         type: integer
 */
router.get('/select', TagController.getTagsForSelect);

/**
 * @swagger
 * /api/tags/{id}:
 *   get:
 *     summary: 获取标签详情
 *     tags: [标签管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 标签ID
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       404:
 *         description: 标签不存在
 */
router.get('/:id', TagController.getTagInfo);

/**
 * @swagger
 * /api/tags/slug/{slug}:
 *   get:
 *     summary: 根据别名获取标签详情
 *     tags: [标签管理]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: 标签别名
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       404:
 *         description: 标签不存在
 */
router.get('/slug/:slug', TagController.getTagBySlug);

/**
 * @swagger
 * /api/tags/{id}/articles:
 *   get:
 *     summary: 获取标签的文章列表
 *     tags: [标签管理]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 标签ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 获取成功
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
 *                     tag:
 *                       $ref: '#/components/schemas/Tag'
 *                     articles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Article'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: 标签不存在
 */
router.get('/:id/articles', TagController.getTagArticles);

// 需要认证的路由

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: 创建标签
 *     tags: [标签管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 description: 标签名称
 *               slug:
 *                 type: string
 *                 description: 标签别名（用于URL）
 *               description:
 *                 type: string
 *                 description: 标签描述
 *               color:
 *                 type: string
 *                 description: 标签颜色（十六进制格式）
 *                 default: "#007bff"
 *               icon:
 *                 type: string
 *                 description: 标签图标
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Tag'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/', authenticateToken, requireAdmin, TagController.createTag);

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: 更新标签信息
 *     tags: [标签管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 标签ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 标签名称
 *               slug:
 *                 type: string
 *                 description: 标签别名
 *               description:
 *                 type: string
 *                 description: 标签描述
 *               color:
 *                 type: string
 *                 description: 标签颜色
 *               icon:
 *                 type: string
 *                 description: 标签图标
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 标签不存在
 */
router.put('/:id', authenticateToken, requireAdmin, TagController.updateTag);

/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     summary: 删除标签
 *     tags: [标签管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 标签ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 标签不存在
 */
router.delete('/:id', authenticateToken, requireAdmin, TagController.deleteTag);

/**
 * @swagger
 * /api/tags/{id}/articles/count:
 *   put:
 *     summary: 更新标签文章数量统计
 *     tags: [标签管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 标签ID
 *     responses:
 *       200:
 *         description: 更新成功
 *       401:
 *         description: 未授权
 *       404:
 *         description: 标签不存在
 */
router.put('/:id/articles/count', authenticateToken, requireAdmin, TagController.updateTagArticleCount);

/**
 * @swagger
 * /api/tags/batch/article-count:
 *   put:
 *     summary: 更新所有标签的文章数量统计
 *     tags: [标签管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 更新成功
 *       401:
 *         description: 未授权
 */
router.put('/batch/article-count', authenticateToken, requireAdmin, TagController.updateAllTagsArticleCount);

/**
 * @swagger
 * /api/tags/check/name/{name}:
 *   get:
 *     summary: 检查标签名称是否可用
 *     tags: [标签管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: 标签名称
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *         description: 排除的标签ID（用于更新时检查）
 *     responses:
 *       200:
 *         description: 检查成功
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
 *                     available:
 *                       type: boolean
 *                       description: 是否可用
 *                     name:
 *                       type: string
 *       401:
 *         description: 未授权
 */
router.get('/check/name/:name', authenticateToken, requireAdmin, TagController.checkNameAvailability);

/**
 * @swagger
 * /api/tags/check/slug/{slug}:
 *   get:
 *     summary: 检查标签别名是否可用
 *     tags: [标签管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: 标签别名
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *         description: 排除的标签ID（用于更新时检查）
 *     responses:
 *       200:
 *         description: 检查成功
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
 *                     available:
 *                       type: boolean
 *                       description: 是否可用
 *                     slug:
 *                       type: string
 *       401:
 *         description: 未授权
 */
router.get('/check/slug/:slug', authenticateToken, requireAdmin, TagController.checkSlugAvailability);

/**
 * @swagger
 * /api/tags/batch/delete:
 *   post:
 *     summary: 批量删除标签
 *     tags: [标签管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 要删除的标签ID数组
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           success:
 *                             type: boolean
 *                           error:
 *                             type: string
 *                     successCount:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/batch/delete', authenticateToken, requireAdmin, TagController.batchDeleteTags);

/**
 * @swagger
 * /api/tags/batch/create:
 *   post:
 *     summary: 批量创建标签
 *     tags: [标签管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tags
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - slug
 *                   properties:
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     description:
 *                       type: string
 *                     color:
 *                       type: string
 *                     icon:
 *                       type: string
 *     responses:
 *       201:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           success:
 *                             type: boolean
 *                           data:
 *                             type: object
 *                           error:
 *                             type: string
 *                           tag:
 *                             type: object
 *                     successCount:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/batch/create', authenticateToken, requireAdmin, TagController.batchCreateTags);

/**
 * @swagger
 * /api/tags/batch/get-or-create:
 *   post:
 *     summary: 根据标签名称批量获取或创建标签
 *     tags: [标签管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - names
 *             properties:
 *               names:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 标签名称数组
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     tagIds:
 *                       type: array
 *                       items:
 *                         type: integer
 *                     count:
 *                       type: integer
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/batch/get-or-create', authenticateToken, requireAdmin, TagController.getOrCreateTagsByNames);

export default router; 