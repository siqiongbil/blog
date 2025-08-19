import { pool as db } from '../config/db.js';

/**
 * 文件数据访问层
 */
class FileDao {
  /**
   * 创建文件记录
   */
  static async create(fileData) {
    const {
      file_name,
      original_name,
      file_path,
      file_size,
      mime_type,
      file_type,
      description,
      tags,
      uploader_id,
      related_id,
      status = 1
    } = fileData;

    const sql = `
      INSERT INTO files (
        file_name, original_name, file_path, file_size, mime_type, 
        file_type, description, tags, uploader_id, related_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(sql, [
      file_name,
      original_name,
      file_path,
      file_size,
      mime_type,
      file_type,
      description,
      JSON.stringify(tags || []),
      uploader_id,
      related_id,
      status
    ]);

    return result.insertId;
  }

  /**
   * 根据ID获取文件信息
   */
  static async findById(id) {
    const sql = `
      SELECT f.*, u.username as uploader_username
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      WHERE f.id = ? AND f.status = 1
    `;
    
    const [rows] = await db.execute(sql, [id]);
    if (rows.length > 0) {
      const file = rows[0];
      if (file.tags) {
        try {
          file.tags = JSON.parse(file.tags);
        } catch (e) {
          file.tags = [];
        }
      }
      return file;
    }
    return null;
  }

  /**
   * 分页获取文件列表
   */
  static async findWithPagination(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      file_type,
      mime_type,
      keyword,
      uploader_id,
      orderBy = 'created_at',
      order = 'DESC'
    } = options;

    const offset = (page - 1) * pageSize;
    let conditions = ['f.status = 1'];
    let params = [];

    // 文件类型筛选
    if (file_type) {
      conditions.push('f.file_type = ?');
      params.push(file_type);
    }

    // MIME类型筛选
    if (mime_type) {
      conditions.push('f.mime_type LIKE ?');
      params.push(`%${mime_type}%`);
    }

    // 上传者筛选
    if (uploader_id) {
      conditions.push('f.uploader_id = ?');
      params.push(uploader_id);
    }

    // 关键词搜索
    if (keyword) {
      conditions.push('(f.file_name LIKE ? OR f.original_name LIKE ? OR f.description LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取文件列表
    const sql = `
      SELECT f.*, u.username as uploader_username
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      ${whereClause}
      ORDER BY f.${orderBy} ${order}
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const [rows] = await db.execute(sql, params);
    
    // 处理tags字段
    const files = rows.map(file => {
      if (file.tags) {
        try {
          file.tags = JSON.parse(file.tags);
        } catch (e) {
          file.tags = [];
        }
      }
      return file;
    });

    return files;
  }

  /**
   * 计算总数
   */
  static async count(filters = {}) {
    let conditions = ['status = 1'];
    let params = [];

    // 文件类型筛选
    if (filters.file_type) {
      conditions.push('file_type = ?');
      params.push(filters.file_type);
    }

    // MIME类型筛选
    if (filters.mime_type) {
      conditions.push('mime_type LIKE ?');
      params.push(`%${filters.mime_type}%`);
    }

    // 上传者筛选
    if (filters.uploader_id) {
      conditions.push('uploader_id = ?');
      params.push(filters.uploader_id);
    }

    // 关键词搜索
    if (filters.keyword) {
      conditions.push('(file_name LIKE ? OR original_name LIKE ? OR description LIKE ?)');
      const searchTerm = `%${filters.keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT COUNT(*) as total
      FROM files
      ${whereClause}
    `;
    
    const [rows] = await db.execute(sql, params);
    return rows[0].total;
  }

  /**
   * 获取文件列表（旧方法，保持兼容性）
   */
  static async getFileList(page = 1, pageSize = 20, filters = {}) {
    const offset = (page - 1) * pageSize;
    let conditions = ['f.status = 1'];
    let params = [];

    // 文件类型筛选
    if (filters.file_type) {
      conditions.push('f.file_type = ?');
      params.push(filters.file_type);
    }

    // MIME类型筛选
    if (filters.mime_type) {
      conditions.push('f.mime_type LIKE ?');
      params.push(`%${filters.mime_type}%`);
    }

    // 关键词搜索
    if (filters.keyword) {
      conditions.push('(f.file_name LIKE ? OR f.original_name LIKE ? OR f.description LIKE ?)');
      const searchTerm = `%${filters.keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM files f
      ${whereClause}
    `;
    const [countResult] = await db.execute(countSql, params);
    const total = countResult[0].total;

    // 获取文件列表
    const sql = `
      SELECT f.*, u.username as uploader_username
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const [rows] = await db.execute(sql, params);
    
    // 处理tags字段
    const files = rows.map(file => {
      if (file.tags) {
        try {
          file.tags = JSON.parse(file.tags);
        } catch (e) {
          file.tags = [];
        }
      }
      return file;
    });

    return {
      files,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  /**
   * 更新文件信息
   */
  static async update(id, updateData) {
    const {
      file_name,
      description,
      tags,
      file_type,
      related_id
    } = updateData;

    const sql = `
      UPDATE files 
      SET file_name = ?, description = ?, tags = ?, file_type = ?, related_id = ?, updated_at = NOW()
      WHERE id = ? AND status = 1
    `;

    const [result] = await db.execute(sql, [
      file_name,
      description,
      JSON.stringify(tags || []),
      file_type,
      related_id,
      id
    ]);

    return result;
  }

  /**
   * 删除文件（软删除）
   */
  static async delete(id) {
    const sql = 'UPDATE files SET status = 0, updated_at = NOW() WHERE id = ?';
    const [result] = await db.execute(sql, [id]);
    return result;
  }

  /**
   * 根据文件路径获取文件信息
   */
  static async findByPath(filePath) {
    const sql = `
      SELECT f.*, u.username as uploader_username
      FROM files f
      LEFT JOIN users u ON f.uploader_id = u.id
      WHERE f.file_path = ? AND f.status = 1
    `;
    
    const [rows] = await db.execute(sql, [filePath]);
    if (rows.length > 0) {
      const file = rows[0];
      if (file.tags) {
        try {
          file.tags = JSON.parse(file.tags);
        } catch (e) {
          file.tags = [];
        }
      }
      return file;
    }
    return null;
  }

  /**
   * 获取文件统计信息
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        file_type,
        COUNT(*) as type_count
      FROM files 
      WHERE status = 1
      GROUP BY file_type
    `;
    
    const [rows] = await db.execute(sql);
    
    // 重新组织统计数据的格式
    const stats = {
      total: 0,
      byType: {},
      totalSize: 0,
      averageSize: 0
    };

    if (rows.length > 0) {
      stats.total = rows.reduce((sum, row) => sum + row.type_count, 0);
      stats.totalSize = rows.reduce((sum, row) => sum + (row.total_size || 0), 0);
      stats.averageSize = stats.total > 0 ? Math.round(stats.totalSize / stats.total) : 0;
      
      rows.forEach(row => {
        stats.byType[row.file_type] = row.type_count;
      });
    }

    return stats;
  }

  // 兼容性方法别名
  static async createFile(fileData) {
    return await this.create(fileData);
  }

  static async getFileById(id) {
    return await this.findById(id);
  }

  static async updateFile(id, updateData) {
    return await this.update(id, updateData);
  }

  static async deleteFile(id) {
    return await this.delete(id);
  }

  static async getFileByPath(filePath) {
    return await this.findByPath(filePath);
  }

  static async getFileStats() {
    return await this.getStatistics();
  }
}

export default FileDao; 