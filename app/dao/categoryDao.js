import { query } from '../config/db.js';

/**
 * 分类DAO层
 */
class CategoryDao {
  /**
   * 创建分类
   * @param {Object} category - 分类信息
   * @param {string} category.name - 分类名称
   * @param {string} category.slug - 分类别名
   * @param {string} category.description - 分类描述
   * @param {number} category.sort_order - 排序顺序
   * @param {string} category.image_url - 分类图片URL
   * @returns {Promise<Object>} 插入结果
   */
  static async create(category) {
    const {
      name,
      slug,
      description = null,
      sort_order = 0,
      image_url = null
    } = category;

    const sql = `
      INSERT INTO categories (name, slug, description, sort_order, image_url) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return await query(sql, [name, slug, description, sort_order, image_url]);
  }

  /**
   * 根据ID获取分类
   * @param {number} id - 分类ID
   * @returns {Promise<Object>} 分类信息
   */
  static async findById(id) {
    const sql = 'SELECT * FROM categories WHERE id = ?';
    const result = await query(sql, [id]);
    return result[0] || null;
  }

  /**
   * 根据别名获取分类
   * @param {string} slug - 分类别名
   * @returns {Promise<Object>} 分类信息
   */
  static async findBySlug(slug) {
    const sql = 'SELECT * FROM categories WHERE slug = ?';
    const result = await query(sql, [slug]);
    return result[0] || null;
  }

  /**
   * 更新分类信息
   * @param {number} id - 分类ID
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
    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    
    return await query(sql, values);
  }

  /**
   * 删除分类
   * @param {number} id - 分类ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    const sql = 'DELETE FROM categories WHERE id = ?';
    return await query(sql, [id]);
  }

  /**
   * 获取所有分类列表
   * @param {string} orderBy - 排序字段（sort_order 或 created_at）
   * @param {string} order - 排序方向（ASC 或 DESC）
   * @returns {Promise<Array>} 分类列表
   */
  static async findAll(rawOrderBy = 'sort_order', rawOrder = 'ASC') {
    const allowedOrderBy = ['sort_order', 'created_at', 'name'];
    const allowedOrder = ['ASC', 'DESC'];
    
    const orderBy = allowedOrderBy.includes(rawOrderBy) ? rawOrderBy : 'sort_order';
    const order = allowedOrder.includes(rawOrder.toUpperCase()) ? rawOrder.toUpperCase() : 'ASC';
    
    const sql = `SELECT * FROM categories ORDER BY ${orderBy} ${order}`;
    return await query(sql, []);
  }

  /**
   * 获取分类列表（分页）
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {string} orderBy - 排序字段
   * @param {string} order - 排序方向
   * @returns {Promise<Array>} 分类列表
   */
  static async findWithPagination(page = 1, pageSize = 10, rawOrderBy = 'sort_order', rawOrder = 'ASC') {
    // 确保参数是有效的数字类型
    const pageNum = isNaN(parseInt(page)) ? 1 : Math.max(1, parseInt(page));
    const size = isNaN(parseInt(pageSize)) ? 10 : Math.max(1, Math.min(100, parseInt(pageSize)));
    const offset = (pageNum - 1) * size;
    
    const allowedOrderBy = ['sort_order', 'created_at', 'name'];
    const allowedOrder = ['ASC', 'DESC'];
    
    const orderBy = allowedOrderBy.includes(rawOrderBy) ? rawOrderBy : 'sort_order';
    const order = allowedOrder.includes(rawOrder.toUpperCase()) ? rawOrder.toUpperCase() : 'ASC';
    
    const sql = `SELECT * FROM categories ORDER BY ${orderBy} ${order} LIMIT ${size} OFFSET ${offset}`;
    return await query(sql, []);
  }

  /**
   * 获取分类总数
   * @returns {Promise<number>} 分类总数
   */
  static async count() {
    const sql = 'SELECT COUNT(*) as total FROM categories';
    const result = await query(sql, []);
    return result[0].total;
  }

  /**
   * 检查分类别名是否存在
   * @param {string} slug - 分类别名
   * @param {number} excludeId - 排除的ID（用于更新时检查）
   * @returns {Promise<boolean>} 是否存在
   */
  static async isSlugExists(slug, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM categories WHERE slug = ?';
    let params = [slug];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result[0].count > 0;
  }

  /**
   * 获取分类及其文章数量
   * @returns {Promise<Array>} 分类列表（包含文章数量）
   */
  static async findWithArticleCount() {
    const sql = `
      SELECT 
        c.*,
        COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.status = 1
      GROUP BY c.id
      ORDER BY c.sort_order ASC
    `;
    return await query(sql, []);
  }

  /**
   * 更新分类排序
   * @param {Array} sortData - 排序数据 [{ id, sort_order }, ...]
   * @returns {Promise<Array>} 更新结果
   */
  static async updateSort(sortData) {
    const promises = sortData.map(item => {
      const sql = 'UPDATE categories SET sort_order = ? WHERE id = ?';
      return query(sql, [item.sort_order, item.id]);
    });
    
    return await Promise.all(promises);
  }
}

export { CategoryDao }; 