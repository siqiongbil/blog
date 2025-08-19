import { pool } from '../config/db.js';

/**
 * 图片数据访问对象
 */
class ImageDao {
  /**
   * 创建图片记录
   */
  static async create(imageData) {
    const {
      file_name,
      original_name,
      file_path,
      file_url,
      file_size,
      mime_type,
      width,
      height,
      alt_text,
      description,
      tags,
      upload_type = 1,
      related_id,
      uploader_id
    } = imageData;

    const query = `
      INSERT INTO images (
        file_name, original_name, file_path, file_url, file_size, 
        mime_type, width, height, alt_text, description, tags, 
        upload_type, related_id, uploader_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      file_name,
      original_name,
      file_path,
      file_url,
      file_size,
      mime_type,
      width || null,
      height || null,
      alt_text || null,
      description || null,
      tags ? JSON.stringify(tags) : null,
      upload_type,
      related_id || null,
      uploader_id
    ]);

    return result;
  }

  /**
   * 根据ID查找图片
   */
  static async findById(id) {
    const query = `
      SELECT i.*, u.username as uploader_username 
      FROM images i
      LEFT JOIN users u ON i.uploader_id = u.id
      WHERE i.id = ? AND i.status = 1
    `;
    const [rows] = await pool.execute(query, [id]);
    
    if (rows.length > 0 && rows[0].tags) {
      try {
        rows[0].tags = JSON.parse(rows[0].tags);
      } catch (e) {
        rows[0].tags = [];
      }
    }
    
    return rows[0] || null;
  }

  /**
   * 根据文件名查找图片
   */
  static async findByFileName(fileName) {
    const query = 'SELECT * FROM images WHERE file_name = ? AND status = 1';
    const [rows] = await pool.execute(query, [fileName]);
    return rows[0] || null;
  }

  /**
   * 根据文件路径查找图片
   */
  static async findByFilePath(filePath) {
    const query = 'SELECT * FROM images WHERE file_path = ? AND status = 1';
    const [rows] = await pool.execute(query, [filePath]);
    return rows[0] || null;
  }

  /**
   * 获取图片列表（分页）
   */
  static async findAll(params = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        upload_type,
        uploader_id,
        orderBy = 'created_at',
        order = 'DESC',
        keyword
      } = params;

      // 确保参数是整数类型
      const pageNum = Math.max(1, Math.floor(parseInt(page) || 1));
      const pageSizeNum = Math.max(1, Math.min(100, Math.floor(parseInt(pageSize) || 20)));
      const offset = Math.floor((pageNum - 1) * pageSizeNum);

      let query = `SELECT * FROM images WHERE status = 1`;
      const queryParams = [];

      // 按上传类型筛选
      if (upload_type !== undefined && upload_type !== null && upload_type !== '') {
        const uploadTypeNum = parseInt(upload_type);
        if (!isNaN(uploadTypeNum)) {
          query += ' AND i.upload_type = ?';
          queryParams.push(uploadTypeNum);
        }
      }

      // 按上传者筛选
      if (uploader_id) {
        const uploaderIdNum = parseInt(uploader_id);
        if (!isNaN(uploaderIdNum)) {
          query += ' AND i.uploader_id = ?';
          queryParams.push(uploaderIdNum);
        }
      }

      // 关键词搜索
      if (keyword && keyword.trim()) {
        query += ' AND (i.file_name LIKE ? OR i.original_name LIKE ? OR i.alt_text LIKE ? OR i.description LIKE ?)';
        const searchTerm = `%${keyword.trim()}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // 排序
      const allowedOrderBy = ['created_at', 'updated_at', 'file_size', 'file_name'];
      const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'created_at';
      const safeOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
      
      query += ` ORDER BY ${safeOrderBy} ${safeOrder}`;
      query += ` LIMIT ${pageSizeNum} OFFSET ${offset}`;

      const [rows] = await pool.execute(query, queryParams);

      // 解析JSON字段
      rows.forEach(row => {
        if (row.tags) {
          try {
            row.tags = JSON.parse(row.tags);
          } catch (e) {
            row.tags = [];
          }
        }
      });

      return rows;
    } catch (error) {
      console.error('ImageDao.findAll 错误:', error);
      throw error;
    }
  }

  /**
   * 获取图片总数
   */
  static async count(params = {}) {
    const { upload_type, uploader_id, keyword } = params;

    let query = 'SELECT COUNT(*) as total FROM images WHERE status = 1';
    const queryParams = [];

    if (upload_type !== undefined && upload_type !== null && upload_type !== '') {
      const uploadTypeNum = parseInt(upload_type);
      if (!isNaN(uploadTypeNum)) {
        query += ' AND upload_type = ?';
        queryParams.push(uploadTypeNum);
      }
    }

    if (uploader_id) {
      const uploaderIdNum = parseInt(uploader_id);
      if (!isNaN(uploaderIdNum)) {
        query += ' AND uploader_id = ?';
        queryParams.push(uploaderIdNum);
      }
    }

    if (keyword) {
      query += ' AND (file_name LIKE ? OR original_name LIKE ? OR alt_text LIKE ? OR description LIKE ?)';
      const searchTerm = `%${keyword}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const [rows] = await pool.execute(query, queryParams);
    return rows[0].total;
  }

  /**
   * 更新图片信息
   */
  static async update(id, updateData) {
    const allowedFields = [
      'alt_text', 'description', 'tags', 'upload_type', 'related_id', 'status'
    ];
    
    const fields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        if (key === 'tags' && updateData[key]) {
          values.push(JSON.stringify(updateData[key]));
        } else {
          values.push(updateData[key]);
        }
      }
    });
    
    if (fields.length === 0) {
      throw new Error('没有可更新的字段');
    }
    
    values.push(id);
    
    const query = `UPDATE images SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    
    return result;
  }

  /**
   * 删除图片（软删除）
   */
  static async delete(id) {
    const query = 'UPDATE images SET status = 0 WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result;
  }

  /**
   * 物理删除图片
   */
  static async hardDelete(id) {
    const query = 'DELETE FROM images WHERE id = ?';
    const [result] = await pool.execute(query, [id]);
    return result;
  }

  /**
   * 根据上传类型和关联ID获取图片
   */
  static async findByTypeAndRelatedId(uploadType, relatedId) {
    const query = `
      SELECT * FROM images 
      WHERE upload_type = ? AND related_id = ? AND status = 1 
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query, [uploadType, relatedId]);
    
    rows.forEach(row => {
      if (row.tags) {
        try {
          row.tags = JSON.parse(row.tags);
        } catch (e) {
          row.tags = [];
        }
      }
    });
    
    return rows;
  }

  /**
   * 获取图片统计信息
   */
  static async getStatistics() {
    const queries = [
      'SELECT COUNT(*) as total FROM images WHERE status = 1',
      'SELECT upload_type, COUNT(*) as count FROM images WHERE status = 1 GROUP BY upload_type',
      'SELECT SUM(file_size) as total_size FROM images WHERE status = 1',
      'SELECT AVG(file_size) as avg_size FROM images WHERE status = 1'
    ];

    const [totalResult] = await pool.execute(queries[0]);
    const [typeResult] = await pool.execute(queries[1]);
    const [sizeResult] = await pool.execute(queries[2]);
    const [avgResult] = await pool.execute(queries[3]);

    const typeStats = {};
    typeResult.forEach(row => {
      typeStats[row.upload_type] = row.count;
    });

    return {
      total: totalResult[0].total,
      byType: typeStats,
      totalSize: sizeResult[0].total_size || 0,
      averageSize: Math.round(avgResult[0].avg_size || 0)
    };
  }

  /**
   * 批量更新图片状态
   */
  static async batchUpdateStatus(ids, status) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('图片ID数组不能为空');
    }

    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE images SET status = ? WHERE id IN (${placeholders})`;
    const [result] = await pool.execute(query, [status, ...ids]);
    
    return result;
  }
}

export { ImageDao }; 