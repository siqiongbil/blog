import { query } from '../config/db.js';

/**
 * 系统配置DAO层
 */
class SystemConfigDao {
  /**
   * 创建配置项
   * @param {Object} config - 配置信息
   * @param {string} config.config_key - 配置键
   * @param {string} config.config_value - 配置值
   * @param {number} config.config_type - 配置类型：1-字符串，2-数字，3-JSON，4-布尔值
   * @param {string} config.description - 配置说明
   * @returns {Promise<Object>} 插入结果
   */
  static async create(config) {
    const {
      config_key,
      config_value = null,
      config_type = 1,
      description = null
    } = config;

    const sql = `
      INSERT INTO system_config (config_key, config_value, config_type, description) 
      VALUES (?, ?, ?, ?)
    `;
    
    return await query(sql, [config_key, config_value, config_type, description]);
  }

  /**
   * 根据ID获取配置
   * @param {number} id - 配置ID
   * @returns {Promise<Object>} 配置信息
   */
  static async findById(id) {
    const sql = 'SELECT * FROM system_config WHERE id = ?';
    const result = await query(sql, [id]);
    return result[0] || null;
  }

  /**
   * 根据配置键获取配置
   * @param {string} configKey - 配置键
   * @returns {Promise<Object>} 配置信息
   */
  static async findByKey(configKey) {
    const sql = 'SELECT * FROM system_config WHERE config_key = ?';
    const result = await query(sql, [configKey]);
    return result[0] || null;
  }

  /**
   * 根据配置键获取配置值
   * @param {string} configKey - 配置键
   * @param {any} defaultValue - 默认值
   * @returns {Promise<any>} 配置值（根据类型转换）
   */
  static async getValue(configKey, defaultValue = null) {
    const config = await this.findByKey(configKey);
    
    if (!config || config.config_value === null) {
      return defaultValue;
    }

    // 根据配置类型进行转换
    switch (config.config_type) {
      case 1: // 字符串
        return config.config_value;
      case 2: // 数字
        return Number(config.config_value);
      case 3: // JSON
        try {
          return JSON.parse(config.config_value);
        } catch (e) {
          return defaultValue;
        }
      case 4: // 布尔值
        return config.config_value === 'true' || config.config_value === '1';
      default:
        return config.config_value;
    }
  }

  /**
   * 设置配置值
   * @param {string} configKey - 配置键
   * @param {any} value - 配置值
   * @param {number} configType - 配置类型
   * @param {string} description - 配置说明
   * @returns {Promise<Object>} 更新结果
   */
  static async setValue(configKey, value, configType = 1, description = null) {
    // 转换值为字符串存储
    let configValue;
    switch (configType) {
      case 1: // 字符串
        configValue = String(value);
        break;
      case 2: // 数字
        configValue = String(Number(value));
        break;
      case 3: // JSON
        configValue = JSON.stringify(value);
        break;
      case 4: // 布尔值
        configValue = value ? 'true' : 'false';
        break;
      default:
        configValue = String(value);
    }

    // 检查配置是否存在
    const existingConfig = await this.findByKey(configKey);
    
    if (existingConfig) {
      // 更新现有配置
      const sql = 'UPDATE system_config SET config_value = ?, config_type = ?, description = ? WHERE config_key = ?';
      return await query(sql, [configValue, configType, description, configKey]);
    } else {
      // 创建新配置
      return await this.create({
        config_key: configKey,
        config_value: configValue,
        config_type: configType,
        description: description
      });
    }
  }

  /**
   * 更新配置信息
   * @param {number} id - 配置ID
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
    const sql = `UPDATE system_config SET ${fields.join(', ')} WHERE id = ?`;
    
    return await query(sql, values);
  }

  /**
   * 删除配置
   * @param {number} id - 配置ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    const sql = 'DELETE FROM system_config WHERE id = ?';
    return await query(sql, [id]);
  }

  /**
   * 根据配置键删除配置
   * @param {string} configKey - 配置键
   * @returns {Promise<Object>} 删除结果
   */
  static async deleteByKey(configKey) {
    const sql = 'DELETE FROM system_config WHERE config_key = ?';
    return await query(sql, [configKey]);
  }

  /**
   * 获取配置列表（分页）
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.pageSize - 每页数量
   * @param {number} options.config_type - 配置类型筛选
   * @param {string} options.keyword - 关键词搜索
   * @param {string} options.orderBy - 排序字段
   * @param {string} options.order - 排序方向
   * @returns {Promise<Array>} 配置列表
   */
  static async findWithPagination(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      config_type = null,
      keyword = null,
      orderBy: rawOrderBy = 'created_at',
      order: rawOrder = 'DESC'
    } = options;

    // 确保参数是有效的数字类型
    const pageNum = isNaN(parseInt(page)) ? 1 : Math.max(1, parseInt(page));
    const size = isNaN(parseInt(pageSize)) ? 10 : Math.max(1, Math.min(100, parseInt(pageSize)));
    const offset = (pageNum - 1) * size;
    const conditions = [];
    const params = [];

    // 构建查询条件
    if (config_type !== null) {
      conditions.push('config_type = ?');
      params.push(config_type);
    }

    if (keyword) {
      conditions.push('(config_key LIKE ? OR description LIKE ?)');
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 验证排序字段
    const allowedOrderBy = ['created_at', 'updated_at', 'config_key', 'config_type'];
    const allowedOrder = ['ASC', 'DESC'];
    
    const orderBy = allowedOrderBy.includes(rawOrderBy) ? rawOrderBy : 'created_at';
    const order = allowedOrder.includes(rawOrder.toUpperCase()) ? rawOrder.toUpperCase() : 'DESC';

    const sql = `
      SELECT * FROM system_config 
      ${whereClause}
      ORDER BY ${orderBy} ${order}
      LIMIT ? OFFSET ?
    `;

    // 替换SQL中的LIMIT和OFFSET占位符
    const finalSql = sql.replace('LIMIT ? OFFSET ?', `LIMIT ${size} OFFSET ${offset}`);
    return await query(finalSql, params);
  }

  /**
   * 获取配置总数
   * @param {Object} options - 查询选项
   * @returns {Promise<number>} 配置总数
   */
  static async count(options = {}) {
    const {
      config_type = null,
      keyword = null
    } = options;

    const conditions = [];
    const params = [];

    if (config_type !== null) {
      conditions.push('config_type = ?');
      params.push(config_type);
    }

    if (keyword) {
      conditions.push('(config_key LIKE ? OR description LIKE ?)');
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as total FROM system_config ${whereClause}`;
    
    const result = await query(sql, params);
    return result[0].total;
  }

  /**
   * 获取所有配置（不分页）
   * @param {string} orderBy - 排序字段
   * @param {string} order - 排序方向
   * @returns {Promise<Array>} 配置列表
   */
  static async findAll(rawOrderBy = 'config_key', rawOrder = 'ASC') {
    const allowedOrderBy = ['created_at', 'updated_at', 'config_key', 'config_type'];
    const allowedOrder = ['ASC', 'DESC'];
    
    const orderBy = allowedOrderBy.includes(rawOrderBy) ? rawOrderBy : 'config_key';
    const order = allowedOrder.includes(rawOrder.toUpperCase()) ? rawOrder.toUpperCase() : 'ASC';
    
    const sql = `SELECT * FROM system_config ORDER BY ${orderBy} ${order}`;
    return await query(sql, []);
  }

  /**
   * 获取指定类型的配置
   * @param {number} configType - 配置类型
   * @returns {Promise<Array>} 配置列表
   */
  static async findByType(configType) {
    const sql = 'SELECT * FROM system_config WHERE config_type = ? ORDER BY config_key ASC';
    return await query(sql, [configType]);
  }

  /**
   * 批量获取配置值
   * @param {Array} configKeys - 配置键数组
   * @returns {Promise<Object>} 配置对象 { key: value }
   */
  static async getMultipleValues(configKeys) {
    if (!configKeys || configKeys.length === 0) {
      return {};
    }

    const placeholders = configKeys.map(() => '?').join(',');
    const sql = `SELECT config_key, config_value, config_type FROM system_config WHERE config_key IN (${placeholders})`;
    
    const results = await query(sql, configKeys);
    const configs = {};

    results.forEach(config => {
      // 根据配置类型进行转换
      let value;
      switch (config.config_type) {
        case 1: // 字符串
          value = config.config_value;
          break;
        case 2: // 数字
          value = Number(config.config_value);
          break;
        case 3: // JSON
          try {
            value = JSON.parse(config.config_value);
          } catch (e) {
            value = config.config_value;
          }
          break;
        case 4: // 布尔值
          value = config.config_value === 'true' || config.config_value === '1';
          break;
        default:
          value = config.config_value;
      }
      configs[config.config_key] = value;
    });

    return configs;
  }

  /**
   * 批量设置配置
   * @param {Array} configs - 配置数组 [{ key, value, type, description }, ...]
   * @returns {Promise<Array>} 更新结果
   */
  static async setMultipleValues(configs) {
    const promises = configs.map(config => {
      return this.setValue(config.key, config.value, config.type, config.description);
    });
    
    return await Promise.all(promises);
  }

  /**
   * 检查配置键是否存在
   * @param {string} configKey - 配置键
   * @param {number} excludeId - 排除的ID（用于更新时检查）
   * @returns {Promise<boolean>} 是否存在
   */
  static async isKeyExists(configKey, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM system_config WHERE config_key = ?';
    let params = [configKey];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result[0].count > 0;
  }

  /**
   * 获取配置统计信息
   * @returns {Promise<Object>} 统计信息
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN config_type = 1 THEN 1 END) as string_count,
        COUNT(CASE WHEN config_type = 2 THEN 1 END) as number_count,
        COUNT(CASE WHEN config_type = 3 THEN 1 END) as json_count,
        COUNT(CASE WHEN config_type = 4 THEN 1 END) as boolean_count
      FROM system_config
    `;
    
    const result = await query(sql, []);
    return result[0];
  }
}

export { SystemConfigDao }; 