import express from 'express';
import { UserController } from '../controllers/index.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * 用户认证相关路由
 */

// 用户注册（已禁用 - 个人博客不开放注册）
// router.post('/register', UserController.register);

// 用户登录
router.post('/login', UserController.login);

// 获取当前用户信息（需要登录）
router.get('/me', authenticateToken, UserController.getCurrentUser);
router.get('/profile', authenticateToken, UserController.getCurrentUser);

// 修改当前用户密码（需要登录）
router.put('/me/password', authenticateToken, UserController.changePassword);
router.put('/change-password', authenticateToken, UserController.changePassword);

// 更新用户资料（需要登录）
router.put('/profile', authenticateToken, UserController.updateUser);

/**
 * 用户管理相关路由
 */

// 获取用户列表（需要管理员权限）
router.get('/', authenticateToken, requireAdmin, UserController.getUserList);

// 获取指定用户信息
router.get('/:id', UserController.getUserInfo);

// 更新用户信息（需要登录，只能更新自己的信息或管理员权限）
router.put('/:id', authenticateToken, UserController.updateUser);

// 删除用户（需要管理员权限）
router.delete('/:id', authenticateToken, requireAdmin, UserController.deleteUser);

// 修改指定用户密码（需要管理员权限）
router.put('/:id/password', authenticateToken, requireAdmin, UserController.changePassword);

export default router; 