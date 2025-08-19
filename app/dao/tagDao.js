import { query } from '../config/db.js';

/**
 * 标签DAO层
 */
class TagDao {
  /**
   * 创建标签
   * @param {Object} tag - 标签信息
   * @param {string} tag.name - 标签名称
   * @param {string} tag.slug - 标签别名
   * @param {string} tag.description - 标签描述
   * @param {string} tag.color - 标签颜色
   * @param {string} tag.icon - 标签图标
   * @returns {Promise<Object>} 插入结果
   */
  static async create(tag) {
    const {
      name,
      slug,
      description = null,
      color = '#007bff',
      icon = null
    } = tag;

    const sql = `
      INSERT INTO tags (name, slug, description, color, icon) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return await query(sql, [name, slug, description, color, icon]);
  }

  /**
   * 根据ID获取标签
   * @param {number} id - 标签ID
   * @returns {Promise<Object>} 标签信息
   */
  static async findById(id) {
    const sql = 'SELECT * FROM tags WHERE id = ?';
    const result = await query(sql, [id]);
    return result[0] || null;
  }

  /**
   * 根据名称获取标签
   * @param {string} name - 标签名称
   * @returns {Promise<Object>} 标签信息
   */
  static async findByName(name) {
    const sql = 'SELECT * FROM tags WHERE name = ?';
    const result = await query(sql, [name]);
    return result[0] || null;
  }

  /**
   * 根据别名获取标签
   * @param {string} slug - 标签别名
   * @returns {Promise<Object>} 标签信息
   */
  static async findBySlug(slug) {
    const sql = 'SELECT * FROM tags WHERE slug = ?';
    const result = await query(sql, [slug]);
    return result[0] || null;
  }

  /**
   * 更新标签信息
   * @param {number} id - 标签ID
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
    const sql = `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`;
    
    return await query(sql, values);
  }

  /**
   * 删除标签
   * @param {number} id - 标签ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    const sql = 'DELETE FROM tags WHERE id = ?';
    return await query(sql, [id]);
  }

  /**
   * 获取所有标签列表
   * @param {string} orderBy - 排序字段
   * @param {string} order - 排序方向
   * @returns {Promise<Array>} 标签列表
   */
  static async findAll(rawOrderBy = 'article_count', rawOrder = 'DESC') {
    const allowedOrderBy = ['article_count', 'created_at', 'name'];
    const allowedOrder = ['ASC', 'DESC'];
    
    const orderBy = allowedOrderBy.includes(rawOrderBy) ? rawOrderBy : 'article_count';
    const order = allowedOrder.includes(rawOrder.toUpperCase()) ? rawOrder.toUpperCase() : 'DESC';
    
    const sql = `SELECT * FROM tags ORDER BY ${orderBy} ${order}`;
    return await query(sql, []);
  }

  /**
   * 获取标签列表（分页）
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {string} orderBy - 排序字段
   * @param {string} order - 排序方向
   * @returns {Promise<Array>} 标签列表
   */
  static async findWithPagination(page = 1, pageSize = 10, rawOrderBy = 'article_count', rawOrder = 'DESC') {
    const pageNum = isNaN(parseInt(page)) ? 1 : Math.max(1, parseInt(page));
    const size = isNaN(parseInt(pageSize)) ? 10 : Math.max(1, Math.min(100, parseInt(pageSize)));
    const offset = (pageNum - 1) * size;
    
    const allowedOrderBy = ['article_count', 'created_at', 'name'];
    const allowedOrder = ['ASC', 'DESC'];
    
    const orderBy = allowedOrderBy.includes(rawOrderBy) ? rawOrderBy : 'article_count';
    const order = allowedOrder.includes(rawOrder.toUpperCase()) ? rawOrder.toUpperCase() : 'DESC';
    
    const sql = `SELECT * FROM tags ORDER BY ${orderBy} ${order} LIMIT ${size} OFFSET ${offset}`;
    return await query(sql, []);
  }

  /**
   * 获取标签总数
   * @returns {Promise<number>} 标签总数
   */
  static async count() {
    const sql = 'SELECT COUNT(*) as total FROM tags';
    const result = await query(sql, []);
    return result[0].total;
  }

  /**
   * 检查标签名称是否存在
   * @param {string} name - 标签名称
   * @param {number} excludeId - 排除的ID（用于更新时检查）
   * @returns {Promise<boolean>} 是否存在
   */
  static async isNameExists(name, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM tags WHERE name = ?';
    let params = [name];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result[0].count > 0;
  }

  /**
   * 检查标签别名是否存在
   * @param {string} slug - 标签别名
   * @param {number} excludeId - 排除的ID（用于更新时检查）
   * @returns {Promise<boolean>} 是否存在
   */
  static async isSlugExists(slug, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM tags WHERE slug = ?';
    let params = [slug];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result[0].count > 0;
  }

  /**
   * 为文章添加标签
   * @param {number} articleId - 文章ID
   * @param {Array<number>} tagIds - 标签ID数组
   * @returns {Promise<Array>} 插入结果
   */
  static async addTagsToArticle(articleId, tagIds) {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return [];
    }
    
    // 构建批量插入的占位符
    const placeholders = tagIds.map(() => '(?, ?)').join(',');
    const sql = `INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES ${placeholders}`;
    
    // 展开参数数组
    const values = [];
    for (const tagId of tagIds) {
      values.push(articleId, tagId);
    }
    
    return await query(sql, values);
  }

  /**
   * 移除文章的所有标签
   * @param {number} articleId - 文章ID
   * @returns {Promise<Object>} 删除结果
   */
  static async removeAllTagsFromArticle(articleId) {
    const sql = 'DELETE FROM article_tags WHERE article_id = ?';
    return await query(sql, [articleId]);
  }

  /**
   * 移除文章的指定标签
   * @param {number} articleId - 文章ID
   * @param {Array<number>} tagIds - 标签ID数组
   * @returns {Promise<Object>} 删除结果
   */
  static async removeTagsFromArticle(articleId, tagIds) {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return { affectedRows: 0 };
    }
    
    const placeholders = tagIds.map(() => '?').join(',');
    const sql = `DELETE FROM article_tags WHERE article_id = ? AND tag_id IN (${placeholders})`;
    const params = [articleId, ...tagIds];
    
    return await query(sql, params);
  }

  /**
   * 获取文章的标签
   * @param {number} articleId - 文章ID
   * @returns {Promise<Array>} 标签列表
   */
  static async getArticleTags(articleId) {
    const sql = `
      SELECT t.* 
      FROM tags t
      INNER JOIN article_tags at ON t.id = at.tag_id
      WHERE at.article_id = ?
      ORDER BY t.name ASC
    `;
    
    return await query(sql, [articleId]);
  }

  /**
   * 获取标签的文章
   * @param {number} tagId - 标签ID
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Array>} 文章列表
   */
  static async getTagArticles(tagId, page = 1, pageSize = 10) {
    const pageNum = isNaN(parseInt(page)) ? 1 : Math.max(1, parseInt(page));
    const size = isNaN(parseInt(pageSize)) ? 10 : Math.max(1, Math.min(100, parseInt(pageSize)));
    const offset = (pageNum - 1) * size;
    
    const sql = `
      SELECT a.*, u.username as author_username, u.nickname as author_nickname, c.name as category_name, c.slug as category_slug
      FROM articles a
      INNER JOIN article_tags at ON a.id = at.article_id
      INNER JOIN users u ON a.author_id = u.id
      INNER JOIN categories c ON a.category_id = c.id
      WHERE at.tag_id = ? AND a.status = 1
      ORDER BY a.created_at DESC
      LIMIT ${size} OFFSET ${offset}
    `;
    
    return await query(sql, [tagId]);
  }

  /**
   * 更新标签的文章数量
   * @param {number} tagId - 标签ID
   * @returns {Promise<Object>} 更新结果
   */
  static async updateArticleCount(tagId) {
    const sql = `
      UPDATE tags 
      SET article_count = (
        SELECT COUNT(*) 
        FROM article_tags at 
        INNER JOIN articles a ON at.article_id = a.id 
        WHERE at.tag_id = ? AND a.status = 1
      )
      WHERE id = ?
    `;
    
    return await query(sql, [tagId, tagId]);
  }

  /**
   * 更新所有标签的文章数量
   * @returns {Promise<Object>} 更新结果
   */
  static async updateAllArticleCounts() {
    const sql = `
      UPDATE tags 
      SET article_count = (
        SELECT COUNT(*) 
        FROM article_tags at 
        INNER JOIN articles a ON at.article_id = a.id 
        WHERE at.tag_id = tags.id AND a.status = 1
      )
    `;
    
    return await query(sql, []);
  }

  /**
   * 批量创建标签
   * @param {Array<Object>} tags - 标签数组
   * @returns {Promise<Array>} 创建结果
   */
  static async batchCreate(tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      return [];
    }
    
    const results = [];
    for (const tag of tags) {
      try {
        const result = await this.create(tag);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message, tag });
      }
    }
    
    return results;
  }

  /**
   * 根据名称批量获取或创建标签
   * @param {Array<string>} tagNames - 标签名称数组
   * @returns {Promise<Array>} 标签ID数组
   */
  static async getOrCreateByNames(tagNames) {
    if (!Array.isArray(tagNames) || tagNames.length === 0) {
      return [];
    }
    
    const tagIds = [];
    
    for (const name of tagNames) {
      const trimmedName = name.trim();
      if (!trimmedName) continue;
      
      // 尝试查找现有标签
      let tag = await this.findByName(trimmedName);
      
      if (!tag) {
        // 创建新标签
        const slug = trimmedName.toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        try {
          const result = await this.create({
            name: trimmedName,
            slug: slug || `tag-${Date.now()}`,
            description: null,
            color: '#007bff',
            icon: null
          });
          
          tag = { id: result.insertId };
        } catch (error) {
          console.error('创建标签失败：', error);
          continue;
        }
      }
      
      tagIds.push(tag.id);
    }
    
    return tagIds;
  }
}

export { TagDao }; 