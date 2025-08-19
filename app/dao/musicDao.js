import { query } from '../config/db.js';

/**
 * 音乐DAO层
 */
class MusicDao {
  /**
   * 创建音乐记录
   * @param {Object} music - 音乐信息
   * @param {string} music.file_name - 文件名（作者名-音乐名.mp3）
   * @param {string} music.original_name - 原始文件名
   * @param {string} music.file_path - 文件路径
   * @param {string} music.file_url - 访问URL
   * @param {number} music.file_size - 文件大小（字节）
   * @param {string} music.mime_type - MIME类型
   * @param {number} music.duration - 音乐时长（秒）
   * @param {string} music.title - 音乐标题
   * @param {string} music.artist - 艺术家
   * @param {string} music.album - 专辑名称
   * @param {string} music.genre - 音乐类型
   * @param {number} music.year - 发行年份
   * @param {string} music.cover_url - 专辑封面URL
   * @param {string} music.description - 音乐描述
   * @param {Array} music.tags - 音乐标签
   * @param {number} music.uploader_id - 上传者ID
   * @param {number} music.status - 状态：0-禁用，1-启用
   * @returns {Promise<Object>} 插入结果
   */
  static async create(music) {
    const {
      file_name,
      original_name = null,
      file_path,
      file_url = null,
      file_size = null,
      mime_type = null,
      duration = null,
      title = null,
      artist = null,
      album = null,
      genre = null,
      year = null,
      cover_url = null,
      description = null,
      tags = null,
      uploader_id = null,
      status = 1
    } = music;

    const sql = `
      INSERT INTO music (
        file_name, original_name, file_path, file_url, file_size, 
        mime_type, duration, title, artist, album, genre, year, 
        cover_url, description, tags, uploader_id, status
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return await query(sql, [
      file_name, original_name, file_path, file_url, file_size,
      mime_type, duration, title, artist, album, genre, year,
      cover_url, description, tags ? JSON.stringify(tags) : null, uploader_id, status
    ]);
  }

  /**
   * 根据ID获取音乐
   * @param {number} id - 音乐ID
   * @param {boolean} includeUploader - 是否包含上传者信息
   * @returns {Promise<Object>} 音乐信息
   */
  static async findById(id, includeUploader = false) {
    let sql;
    
    if (includeUploader) {
      sql = `
        SELECT m.*, u.username as uploader_username
        FROM music m
        LEFT JOIN users u ON m.uploader_id = u.id
        WHERE m.id = ?
      `;
    } else {
      sql = 'SELECT * FROM music WHERE id = ?';
    }
    
    const result = await query(sql, [id]);
    const music = result[0] || null;
    
    if (music && music.tags && typeof music.tags === 'string') {
      try {
        music.tags = JSON.parse(music.tags);
      } catch (e) {
        music.tags = [];
      }
    }
    
    return music;
  }

  /**
   * 根据文件名获取音乐
   * @param {string} fileName - 文件名
   * @returns {Promise<Object>} 音乐信息
   */
  static async findByFileName(fileName) {
    const sql = 'SELECT * FROM music WHERE file_name = ?';
    const result = await query(sql, [fileName]);
    return result[0] || null;
  }

  /**
   * 根据文件路径获取音乐
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 音乐信息
   */
  static async findByFilePath(filePath) {
    const sql = 'SELECT * FROM music WHERE file_path = ?';
    const result = await query(sql, [filePath]);
    return result[0] || null;
  }

  /**
   * 更新音乐信息
   * @param {number} id - 音乐ID
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
    const sql = `UPDATE music SET ${fields.join(', ')} WHERE id = ?`;
    
    return await query(sql, values);
  }

  /**
   * 删除音乐
   * @param {number} id - 音乐ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    const sql = 'DELETE FROM music WHERE id = ?';
    return await query(sql, [id]);
  }

  /**
   * 获取音乐列表（分页）
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.pageSize - 每页数量
   * @param {number} options.status - 状态筛选
   * @param {string} options.keyword - 关键词搜索（文件名、标题、艺术家）
   * @param {string} options.artist - 艺术家筛选
   * @param {string} options.album - 专辑筛选
   * @param {string} options.genre - 流派筛选
   * @param {number} options.uploader_id - 上传者ID筛选
   * @param {string} options.orderBy - 排序字段
   * @param {string} options.order - 排序方向
   * @returns {Promise<Array>} 音乐列表
   */
  static async findWithPagination(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      status = null,
      keyword = null,
      artist = null,
      album = null,
      genre = null,
      uploader_id = null,
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
    if (status !== null) {
      conditions.push('m.status = ?');
      params.push(status);
    }

    if (keyword) {
      conditions.push('(m.file_name LIKE ? OR m.title LIKE ? OR m.artist LIKE ? OR m.album LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (artist) {
      conditions.push('m.artist LIKE ?');
      params.push(`%${artist}%`);
    }

    if (album) {
      conditions.push('m.album LIKE ?');
      params.push(`%${album}%`);
    }

    if (genre) {
      conditions.push('m.genre LIKE ?');
      params.push(`%${genre}%`);
    }

    if (uploader_id) {
      conditions.push('m.uploader_id = ?');
      params.push(uploader_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 验证排序字段
    const allowedOrderBy = ['created_at', 'updated_at', 'file_name', 'title', 'artist', 'album', 'play_count', 'status'];
    const allowedOrder = ['ASC', 'DESC'];
    
    const orderBy = allowedOrderBy.includes(rawOrderBy) ? rawOrderBy : 'created_at';
    const order = allowedOrder.includes(rawOrder.toUpperCase()) ? rawOrder.toUpperCase() : 'DESC';

    const sql = `
      SELECT m.*, u.username as uploader_username
      FROM music m
      LEFT JOIN users u ON m.uploader_id = u.id
      ${whereClause}
      ORDER BY m.${orderBy} ${order}
      LIMIT ? OFFSET ?
    `;

    // 替换SQL中的LIMIT和OFFSET占位符
    const finalSql = sql.replace('LIMIT ? OFFSET ?', `LIMIT ${size} OFFSET ${offset}`);
    const result = await query(finalSql, params);
    return this.parseJsonFields(result);
  }

  /**
   * 获取音乐总数
   * @param {Object} options - 查询选项
   * @returns {Promise<number>} 音乐总数
   */
  static async count(options = {}) {
    const {
      status = null,
      keyword = null
    } = options;

    const conditions = [];
    const params = [];

    if (status !== null) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (keyword) {
      conditions.push('file_name LIKE ?');
      params.push(`%${keyword}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as total FROM music ${whereClause}`;
    
    const result = await query(sql, params);
    return result[0].total;
  }

  /**
   * 获取所有启用的音乐
   * @returns {Promise<Array>} 启用的音乐列表
   */
  static async findEnabled() {
    const sql = 'SELECT * FROM music WHERE status = 1 ORDER BY created_at DESC';
    return await query(sql, []);
  }

  /**
   * 获取所有音乐（不分页）
   * @param {string} orderBy - 排序字段
   * @param {string} order - 排序方向
   * @returns {Promise<Array>} 音乐列表
   */
  static async findAll(rawOrderBy = 'created_at', rawOrder = 'DESC') {
    const allowedOrderBy = ['created_at', 'updated_at', 'file_name', 'status'];
    const allowedOrder = ['ASC', 'DESC'];
    
    const orderBy = allowedOrderBy.includes(rawOrderBy) ? rawOrderBy : 'created_at';
    const order = allowedOrder.includes(rawOrder.toUpperCase()) ? rawOrder.toUpperCase() : 'DESC';
    
    const sql = `SELECT * FROM music ORDER BY ${orderBy} ${order}`;
    return await query(sql, []);
  }

  /**
   * 随机获取音乐
   * @param {number} limit - 限制数量
   * @param {number} status - 状态筛选（默认只获取启用的）
   * @returns {Promise<Array>} 随机音乐列表
   */
  static async findRandom(limit = 1, status = 1) {
    // 确保参数是有效的数字类型
    const limitNum = isNaN(parseInt(limit)) ? 1 : Math.max(1, parseInt(limit));
    const statusNum = isNaN(parseInt(status)) ? 1 : parseInt(status);
    
    const sql = `SELECT * FROM music WHERE status = ${statusNum} ORDER BY RAND() LIMIT ${limitNum}`;
    return await query(sql, []);
  }

  /**
   * 切换音乐状态
   * @param {number} id - 音乐ID
   * @returns {Promise<Object>} 更新结果
   */
  static async toggleStatus(id) {
    const sql = 'UPDATE music SET status = 1 - status WHERE id = ?';
    return await query(sql, [id]);
  }

  /**
   * 批量更新状态
   * @param {Array} ids - 音乐ID数组
   * @param {number} status - 新状态
   * @returns {Promise<Object>} 更新结果
   */
  static async batchUpdateStatus(ids, status) {
    if (!ids || ids.length === 0) {
      throw new Error('音乐ID数组不能为空');
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE music SET status = ? WHERE id IN (${placeholders})`;
    
    return await query(sql, [status, ...ids]);
  }

  /**
   * 检查文件名是否存在
   * @param {string} fileName - 文件名
   * @param {number} excludeId - 排除的ID（用于更新时检查）
   * @returns {Promise<boolean>} 是否存在
   */
  static async isFileNameExists(fileName, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM music WHERE file_name = ?';
    let params = [fileName];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result[0].count > 0;
  }

  /**
   * 检查文件路径是否存在
   * @param {string} filePath - 文件路径
   * @param {number} excludeId - 排除的ID（用于更新时检查）
   * @returns {Promise<boolean>} 是否存在
   */
  static async isFilePathExists(filePath, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM music WHERE file_path = ?';
    let params = [filePath];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await query(sql, params);
    return result[0].count > 0;
  }

  /**
   * 获取音乐统计信息
   * @returns {Promise<Object>} 统计信息
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 1 THEN 1 END) as enabled,
        COUNT(CASE WHEN status = 0 THEN 1 END) as disabled,
        SUM(COALESCE(file_size, 0)) as totalSize,
        AVG(COALESCE(file_size, 0)) as averageSize,
        SUM(COALESCE(play_count, 0)) as totalPlays
      FROM music
    `;
    
    const result = await query(sql, []);
    return result[0];
  }

  /**
   * 增加播放次数
   * @param {number} id - 音乐ID
   * @returns {Promise<Object>} 更新结果
   */
  static async incrementPlayCount(id) {
    const sql = 'UPDATE music SET play_count = COALESCE(play_count, 0) + 1 WHERE id = ?';
    return await query(sql, [id]);
  }

  /**
   * 根据艺术家搜索音乐
   * @param {string} artist - 艺术家名称
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 音乐列表
   */
  static async findByArtist(artist, limit = 10) {
    const sql = `
      SELECT * FROM music 
      WHERE artist LIKE ? AND status = 1 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const result = await query(sql, [`%${artist}%`, limit]);
    return this.parseJsonFields(result);
  }

  /**
   * 根据专辑搜索音乐
   * @param {string} album - 专辑名称
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 音乐列表
   */
  static async findByAlbum(album, limit = 10) {
    const sql = `
      SELECT * FROM music 
      WHERE album LIKE ? AND status = 1 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const result = await query(sql, [`%${album}%`, limit]);
    return this.parseJsonFields(result);
  }

  /**
   * 根据流派搜索音乐
   * @param {string} genre - 音乐流派
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 音乐列表
   */
  static async findByGenre(genre, limit = 10) {
    const sql = `
      SELECT * FROM music 
      WHERE genre LIKE ? AND status = 1 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const result = await query(sql, [`%${genre}%`, limit]);
    return this.parseJsonFields(result);
  }

  /**
   * 获取最受欢迎的音乐（按播放次数）
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 音乐列表
   */
  static async findMostPlayed(limit = 10) {
    const sql = `
      SELECT * FROM music 
      WHERE status = 1 
      ORDER BY COALESCE(play_count, 0) DESC, created_at DESC 
      LIMIT ?
    `;
    const result = await query(sql, [limit]);
    return this.parseJsonFields(result);
  }

  /**
   * 处理JSON字段解析
   * @param {Array|Object} music - 音乐数据
   * @returns {Array|Object} 处理后的音乐数据
   */
  static parseJsonFields(music) {
    const parseMusic = (item) => {
      if (!item) return item;
      
      if (item.tags && typeof item.tags === 'string') {
        try {
          item.tags = JSON.parse(item.tags);
        } catch (e) {
          item.tags = [];
        }
      }
      
      return item;
    };

    if (Array.isArray(music)) {
      return music.map(parseMusic);
    } else {
      return parseMusic(music);
    }
  }

  /**
   * 根据上传者获取音乐
   * @param {number} uploaderId - 上传者ID
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Array>} 音乐列表
   */
  static async findByUploader(uploaderId, page = 1, pageSize = 10) {
    const pageNum = Math.max(1, parseInt(page));
    const size = Math.max(1, Math.min(100, parseInt(pageSize)));
    const offset = (pageNum - 1) * size;

    const sql = `
      SELECT m.*, u.username as uploader_username
      FROM music m
      LEFT JOIN users u ON m.uploader_id = u.id
      WHERE m.uploader_id = ? AND m.status = 1
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const finalSql = sql.replace('LIMIT ? OFFSET ?', `LIMIT ${size} OFFSET ${offset}`);
    const result = await query(finalSql, [uploaderId]);
    return this.parseJsonFields(result);
  }
}

export { MusicDao }; 