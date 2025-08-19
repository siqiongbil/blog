import { UserDao } from '../dao/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../middleware/authMiddleware.js';

/**
 * 用户控制器
 */
class UserController {
  /**
   * 创建用户（内部使用，不对外暴露）
   */
  static async register(req, res) {
    try {
      const { username, password, nickname, email, bio, website, github } = req.body;

      // 基本验证
      if (!username || !password || !nickname) {
        return res.status(400).json({
          success: false,
          message: '用户名、密码和昵称不能为空'
        });
      }

      // 检查用户名是否已存在
      const existingUser = await UserDao.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }

      // 检查邮箱是否已存在
      if (email) {
        const existingEmail = await UserDao.findByEmail(email);
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: '邮箱已存在'
          });
        }
      }

      // 密码加密
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 创建用户
      const result = await UserDao.create({
        username,
        password: hashedPassword,
        nickname,
        email,
        bio,
        website,
        github
      });

      res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: {
          id: result.insertId,
          username,
          nickname,
          email
        }
      });
    } catch (error) {
      console.error('注册用户错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 用户登录
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名和密码不能为空'
        });
      }

      // 查找用户
      const user = await UserDao.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 生成JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          nickname: user.nickname,
          role: user.role
        },
        jwtConfig.secret,
        { 
          expiresIn: jwtConfig.expiresIn,
          algorithm: jwtConfig.algorithm
        }
      );

      // 移除敏感信息
      const { password: _, ...userInfo } = user;

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: userInfo,
          token
        }
      });
    } catch (error) {
      console.error('用户登录错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(req, res) {
    try {
      const { id } = req.params;

      const user = await UserDao.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 移除敏感信息
      const { password, ...userInfo } = user;

      res.json({
        success: true,
        data: userInfo
      });
    } catch (error) {
      console.error('获取用户信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 验证用户是否存在
      const existingUser = await UserDao.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 如果要更新用户名，检查是否重复
      if (updateData.username && updateData.username !== existingUser.username) {
        const usernameExists = await UserDao.isUsernameExists(updateData.username);
        if (usernameExists) {
          return res.status(400).json({
            success: false,
            message: '用户名已存在'
          });
        }
      }

      // 如果要更新邮箱，检查是否重复
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await UserDao.isEmailExists(updateData.email);
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: '邮箱已存在'
          });
        }
      }

      // 如果要更新密码，进行加密
      if (updateData.password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }

      // 移除不应该被更新的字段
      delete updateData.id;
      delete updateData.created_at;

      const result = await UserDao.update(id, updateData);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在或未进行任何更新'
        });
      }

      res.json({
        success: true,
        message: '用户信息更新成功'
      });
    } catch (error) {
      console.error('更新用户信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 删除用户
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // 验证用户是否存在
      const existingUser = await UserDao.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const result = await UserDao.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        message: '用户删除成功'
      });
    } catch (error) {
      console.error('删除用户错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取用户列表
   */
  static async getUserList(req, res) {
    try {
      const {
        page = 1,
        pageSize = 10
      } = req.query;

      // 确保参数是有效的数字类型
      const pageNum = isNaN(parseInt(page)) ? 1 : Math.max(1, parseInt(page));
      const size = isNaN(parseInt(pageSize)) ? 10 : Math.max(1, Math.min(100, parseInt(pageSize)));

      // 获取用户列表
      const users = await UserDao.findAll(pageNum, size);
      const total = await UserDao.count();

      // 移除密码字段
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });

      res.json({
        success: true,
        data: {
          users: safeUsers,
          pagination: {
            current: pageNum,
            pageSize: size,
            total,
            pages: Math.ceil(total / size)
          }
        }
      });
    } catch (error) {
      console.error('获取用户列表错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '旧密码和新密码不能为空'
        });
      }

      // 获取用户信息
      const user = await UserDao.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 验证旧密码
      const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isOldPasswordValid) {
        return res.status(400).json({
          success: false,
          message: '旧密码错误'
        });
      }

      // 加密新密码
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // 更新密码
      await UserDao.update(id, { password: hashedNewPassword });

      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error) {
      console.error('修改密码错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取当前用户信息（通过token）
   */
  static async getCurrentUser(req, res) {
    try {
      const userId = req.user.id;

      const user = await UserDao.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 移除敏感信息
      const { password, ...userInfo } = user;

      res.json({
        success: true,
        data: userInfo
      });
    } catch (error) {
      console.error('获取当前用户信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

export { UserController }; 