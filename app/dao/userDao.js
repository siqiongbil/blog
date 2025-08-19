import { query } from '../config/db.js';

/**
 * 用户DAO层
 */
class UserDao {
  /**
   * 创建用户
   * @param {Object} user - 用户信息
   * @param {string} user.username - 用户名
   * @param {string} user.password - 密码
   * @param {string} user.nickname - 昵称
   * @param {string} user.avatar - 头像URL
   * @param {string} user.email - 邮箱
   * @param {string} user.bio - 个人简介
   * @param {string} user.website - 个人网站
   * @param {string} user.github - GitHub地址
   * @returns {Promise<Object>} 插入结果
   */
  static async create(user) {
    const {
      username,
      password,
      nickname,
      avatar = null,
      email = null,
      bio = null,
      website = null,
      github = null
    } = user;

    const sql = `
      INSERT INTO users (username, password, nickname, avatar, email, bio, website, github) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return await query(sql, [username, password, nickname, avatar, email, bio, website, github]);
  }

  /**
   * 根据ID获取用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const result = await query(sql, [id]);
    return result[0] || null;
  }

  /**
   * 根据用户名获取用户
   * @param {string} username - 用户名
   * @returns {Promise<Object>} 用户信息
   */
  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const result = await query(sql, [username]);
    return result[0] || null;
  }

  /**
   * 根据邮箱获取用户
   * @param {string} email - 邮箱
   * @returns {Promise<Object>} 用户信息
   */
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const result = await query(sql, [email]);
    return result[0] || null;
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} updateData - 要更新的数据
   * @returns {Promise<Object>} 更新结果
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('没有提供要更新的字段');
    }
    
    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    return await query(sql, values);
  }

  /**
   * 删除用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    return await query(sql, [id]);
  }

  /**
   * 获取所有用户列表
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Array>} 用户列表
   */
  static async findAll(page = 1, pageSize = 10) {
    // 确保参数是有效的数字类型
    const pageNum = isNaN(parseInt(page)) ? 1 : parseInt(page);
    const size = isNaN(parseInt(pageSize)) ? 10 : parseInt(pageSize);
    const offset = (pageNum - 1) * size;
    
    // 确保参数为正数
    const validSize = Math.max(1, size);
    const validOffset = Math.max(0, offset);
    
    // 使用字符串拼接来避免 prepared statement 问题
    const sql = `SELECT * FROM users ORDER BY created_at DESC LIMIT ${validSize} OFFSET ${validOffset}`;
    return await query(sql, []);
  }

  /**
   * 获取用户总数
   * @returns {Promise<number>} 用户总数
   */
  static async count() {
    const sql = 'SELECT COUNT(*) as total FROM users';
    const result = await query(sql, []);
    return result[0].total;
  }

  /**
   * 检查用户名是否存在
   * @param {string} username - 用户名
   * @returns {Promise<boolean>} 是否存在
   */
  static async isUsernameExists(username) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
    const result = await query(sql, [username]);
    return result[0].count > 0;
  }

  /**
   * 检查邮箱是否存在
   * @param {string} email - 邮箱
   * @returns {Promise<boolean>} 是否存在
   */
  static async isEmailExists(email) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    const result = await query(sql, [email]);
    return result[0].count > 0;
  }

  /**
   * 获取用户总数
   * @returns {Promise<number>} 用户总数
   */
  static async getUserCount() {
    const sql = 'SELECT COUNT(*) as count FROM users';
    const result = await query(sql, []);
    return result[0].count;
  }
}

export { UserDao }; 