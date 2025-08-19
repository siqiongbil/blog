import { query } from '../config/db.js';
import { TagDao } from './tagDao.js';

/**
 * 文章DAO层
 */
class ArticleDao {
  /**
   * 计算文章字数
   * @param {string} content - 文章内容
   * @returns {number} 字数
   */
  static calculateWordCount(content) {
    if (!content) return 0;
    // 移除HTML标签和Markdown语法，然后计算字数
    const textContent = content
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/[#*`_~\[\]()]/g, '') // 移除Markdown符号
      .replace(/\s+/g, ' ') // 合并空白字符
      .trim();
    
    // 中文字符和英文单词计数
    const chineseChars = (textContent.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (textContent.match(/[a-zA-Z]+/g) || []).length;
    
    return chineseChars + englishWords;
  }

  /**
   * 计算预估阅读时间
   * @param {number} wordCount - 字数
   * @returns {number} 预估阅读时间（分钟）
   */
  static calculateReadTime(wordCount) {
    // 平均阅读速度：中文200字/分钟，英文250词/分钟
    const avgReadingSpeed = 200;
    return Math.ceil(wordCount / avgReadingSpeed) || 1;
  }

  /**
   * 处理文章数据的JSON字段解析
   * @param {Array|Object} articles - 文章数据
   * @returns {Array|Object} 处理后的文章数据
   */
  static parseJsonFields(articles) {
    const parseArticle = (article) => {
      if (!article) return article;
      
      // 解析images字段
      if (article.images && typeof article.images === 'string') {
        try {
          article.images = JSON.parse(article.images);
        } catch (e) {
          article.images = null;
        }
      }
      
      // 解析tags字段
      if (article.tags && typeof article.tags === 'string') {
        try {
          article.tags = JSON.parse(article.tags);
        } catch (e) {
          article.tags = [];
        }
      }
      
      return article;
    };

    if (Array.isArray(articles)) {
      return articles.map(parseArticle);
    } else {
      return parseArticle(articles);
    }
  }

  /**
   * 创建文章
   * @param {Object} article - 文章信息
   * @param {string} article.title - 文章标题
   * @param {string} article.content - 文章内容
   * @param {number} article.content_type - 内容类型：1-纯文本，2-Markdown，3-HTML
   * @param {string} article.summary - 文章摘要
   * @param {string} article.cover_image - 封面图片URL
   * @param {string} article.images - 文章图片URL列表
   * @param {number} article.category_id - 分类ID
   * @param {number} article.author_id - 作者ID
   * @param {number} article.status - 文章状态：0-草稿，1-已发布，2-已删除
   * @returns {Promise<Object>} 插入结果
   */
  static async create(article) {
    const {
      title,
      content,
      content_type = 2,
      raw_content = null,
      rendered_content = null,
      summary = null,
      excerpt = null,
      cover_image = null,
      images = null,
      category_id,
      author_id,
      status = 0,
      tags = null
    } = article;

    // 计算字数和阅读时间
    const word_count = this.calculateWordCount(content);
    const read_time = this.calculateReadTime(word_count);

    // 处理JSON字段
    const imagesJson = images ? JSON.stringify(images) : null;
    const tagsJson = tags ? JSON.stringify(tags) : null;

    const sql = `
      INSERT INTO articles (
        title, content, content_type, raw_content, rendered_content, 
        summary, excerpt, cover_image, images, category_id, author_id, 
        status, word_count, read_time, tags
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return await query(sql, [
      title, content, content_type, raw_content, rendered_content,
      summary, excerpt, cover_image, imagesJson, category_id, author_id,
      status, word_count, read_time, tagsJson
    ]);
  }

  /**
   * 根据ID获取文章
   * @param {number} id - 文章ID
   * @param {boolean} includeDetails - 是否包含关联信息（作者和分类）
   * @returns {Promise<Object>} 文章信息
   */
  static async findById(id, includeDetails = true) {
    let sql;
    
    if (includeDetails) {
      sql = `
        SELECT 
          a.*,
          u.username as author_username,
          u.nickname as author_nickname,
          u.avatar as author_avatar,
          c.name as category_name,
          c.slug as category_slug
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.id = ?
      `;
    } else {
      sql = 'SELECT * FROM articles WHERE id = ?';
    }
    
    const result = await query(sql, [id]);
    const article = result[0] || null;
    
    if (article) {
      // 解析JSON字段
      if (article.images && typeof article.images === 'string') {
        try {
          article.images = JSON.parse(article.images);
        } catch (e) {
          article.images = null;
        }
      }
      if (article.tags && typeof article.tags === 'string') {
        try {
          article.tags = JSON.parse(article.tags);
        } catch (e) {
          article.tags = [];
        }
      }
    }
    
    return article;
  }

  /**
   * 更新文章信息
   * @param {number} id - 文章ID
   * @param {Object} updateData - 要更新的数据
   * @returns {Promise<Object>} 更新结果
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    
    // 处理JSON字段和字数统计
    const processedData = { ...updateData };
    
    // 如果更新了内容，重新计算字数和阅读时间
    if (processedData.content) {
      processedData.word_count = this.calculateWordCount(processedData.content);
      processedData.read_time = this.calculateReadTime(processedData.word_count);
    }
    
    // 处理JSON字段
    if (processedData.images && typeof processedData.images === 'object') {
      processedData.images = JSON.stringify(processedData.images);
    }
    if (processedData.tags && typeof processedData.tags === 'object') {
      processedData.tags = JSON.stringify(processedData.tags);
    }
    
    Object.keys(processedData).forEach(key => {
      if (processedData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(processedData[key]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('没有提供要更新的字段');
    }
    
    values.push(id);
    const sql = `UPDATE articles SET ${fields.join(', ')} WHERE id = ?`;
    
    return await query(sql, values);
  }

  /**
   * 删除文章（软删除）
   * @param {number} id - 文章ID
   * @returns {Promise<Object>} 删除结果
   */
  static async delete(id) {
    const sql = 'UPDATE articles SET status = 2 WHERE id = ?';
    return await query(sql, [id]);
  }

  /**
   * 永久删除文章
   * @param {number} id - 文章ID
   * @returns {Promise<Object>} 删除结果
   */
  static async hardDelete(id) {
    const sql = 'DELETE FROM articles WHERE id = ?';
    return await query(sql, [id]);
  }

  /**
   * 获取文章列表（分页）
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.pageSize - 每页数量
   * @param {number} options.status - 文章状态筛选
   * @param {number} options.category_id - 分类ID筛选
   * @param {number} options.author_id - 作者ID筛选
   * @param {string} options.keyword - 关键词搜索
   * @param {string} options.orderBy - 排序字段
   * @param {string} options.order - 排序方向
   * @returns {Promise<Array>} 文章列表
   */
  static async findWithPagination(options = {}) {
    const {
      page = 1,
      pageSize = 10,
      status = null,
      category_id = null,
      author_id = null,
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
    if (status !== null) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    if (category_id) {
      conditions.push('a.category_id = ?');
      params.push(category_id);
    }

    if (author_id) {
      conditions.push('a.author_id = ?');
      params.push(author_id);
    }

    if (keyword) {
      conditions.push('(a.title LIKE ? OR a.content LIKE ? OR a.summary LIKE ?)');
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 验证排序字段
    const allowedOrderBy = ['created_at', 'updated_at', 'title', 'view_count'];
    const allowedOrder = ['ASC', 'DESC'];
    
    const orderBy = allowedOrderBy.includes(rawOrderBy) ? rawOrderBy : 'created_at';
    const order = allowedOrder.includes(rawOrder.toUpperCase()) ? rawOrder.toUpperCase() : 'DESC';

    const sql = `
      SELECT 
        a.*,
        u.username as author_username,
        u.nickname as author_nickname,
        u.avatar as author_avatar,
        c.name as category_name,
        c.slug as category_slug
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.${orderBy} ${order}
      LIMIT ? OFFSET ?
    `;

    // 替换SQL中的LIMIT和OFFSET占位符
    const finalSql = sql.replace('LIMIT ? OFFSET ?', `LIMIT ${size} OFFSET ${offset}`);
    const articles = await query(finalSql, params);
    
    // 解析JSON字段
    const parsedArticles = this.parseJsonFields(articles);
    
    // 为每篇文章添加标签信息
    for (const article of parsedArticles) {
      article.tags = await this.getArticleTags(article.id);
    }
    
    return parsedArticles;
  }

  /**
   * 获取文章总数
   * @param {Object} options - 查询选项
   * @returns {Promise<number>} 文章总数
   */
  static async count(options = {}) {
    const {
      status = null,
      category_id = null,
      author_id = null,
      keyword = null
    } = options;

    const conditions = [];
    const params = [];

    if (status !== null) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (category_id) {
      conditions.push('category_id = ?');
      params.push(category_id);
    }

    if (author_id) {
      conditions.push('author_id = ?');
      params.push(author_id);
    }

    if (keyword) {
      conditions.push('(title LIKE ? OR content LIKE ? OR summary LIKE ?)');
      const searchKeyword = `%${keyword}%`;
      params.push(searchKeyword, searchKeyword, searchKeyword);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as total FROM articles ${whereClause}`;
    
    const result = await query(sql, params);
    return result[0].total;
  }

  /**
   * 增加文章浏览次数
   * @param {number} id - 文章ID
   * @returns {Promise<Object>} 更新结果
   */
  static async incrementViewCount(id) {
    const sql = 'UPDATE articles SET view_count = view_count + 1 WHERE id = ?';
    return await query(sql, [id]);
  }

  /**
   * 获取热门文章
   * @param {number} limit - 限制数量
   * @param {number} days - 天数范围（默认30天）
   * @returns {Promise<Array>} 热门文章列表
   */
  static async findPopular(limit = 10, days = 30) {
    // 确保参数是有效的数字
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const validDays = Math.max(1, parseInt(days) || 30);
    
    // 验证参数是否为有效数字
    if (isNaN(validLimit) || isNaN(validDays)) {
      throw new Error('Invalid parameters: limit and days must be valid numbers');
    }
    
    const sql = `
      SELECT 
        a.*,
        u.username as author_username,
        u.nickname as author_nickname,
        c.name as category_name,
        c.slug as category_slug
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 1 
        AND a.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY a.view_count DESC, a.created_at DESC
      LIMIT ?
    `;
    
    const articles = await query(sql, [validDays, validLimit]);
    const parsedArticles = this.parseJsonFields(articles);
    
    // 为每篇文章添加标签信息
    for (const article of parsedArticles) {
      article.tags = await this.getArticleTags(article.id);
    }
    
    return parsedArticles;
  }

  /**
   * 获取最新文章
   * @param {number} limit - 限制数量
   * @param {number} status - 文章状态
   * @returns {Promise<Array>} 最新文章列表
   */
  static async findLatest(limit = 10, status = 1) {
    // 确保参数是有效的数字
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const validStatus = parseInt(status) || 1;
    
    // 验证参数是否为有效数字
    if (isNaN(validLimit) || isNaN(validStatus)) {
      throw new Error('Invalid parameters: limit and status must be valid numbers');
    }
    
    const sql = `
      SELECT 
        a.*,
        u.username as author_username,
        u.nickname as author_nickname,
        c.name as category_name,
        c.slug as category_slug
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = ?
      ORDER BY a.created_at DESC
      LIMIT ?
    `;
    
    const articles = await query(sql, [validStatus, validLimit]);
    const parsedArticles = this.parseJsonFields(articles);
    
    // 为每篇文章添加标签信息
    for (const article of parsedArticles) {
      article.tags = await this.getArticleTags(article.id);
    }
    
    return parsedArticles;
  }

  /**
   * 获取相关文章
   * @param {number} articleId - 当前文章ID
   * @param {number} categoryId - 分类ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 相关文章列表
   */
  static async findRelated(articleId, categoryId, limit = 5) {
    // 确保参数是有效的数字
    const validLimit = Math.max(1, Math.min(50, parseInt(limit) || 5));
    const validArticleId = parseInt(articleId);
    const validCategoryId = parseInt(categoryId);
    
    // 验证参数是否为有效数字
    if (isNaN(validLimit) || isNaN(validArticleId) || isNaN(validCategoryId)) {
      throw new Error('Invalid parameters: limit, articleId, and categoryId must be valid numbers');
    }
    
    const sql = `
      SELECT 
        a.*,
        u.username as author_username,
        u.nickname as author_nickname,
        c.name as category_name,
        c.slug as category_slug
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 1 
        AND a.category_id = ? 
        AND a.id != ?
      ORDER BY a.created_at DESC
      LIMIT ?
    `;
    
    const articles = await query(sql, [validCategoryId, validArticleId, validLimit]);
    const parsedArticles = this.parseJsonFields(articles);
    
    // 为每篇文章添加标签信息
    for (const article of parsedArticles) {
      article.tags = await this.getArticleTags(article.id);
    }
    
    return parsedArticles;
  }

  /**
   * 获取文章统计信息
   * @returns {Promise<Object>} 统计信息
   */
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 1 THEN 1 END) as published,
        COUNT(CASE WHEN status = 0 THEN 1 END) as draft,
        COUNT(CASE WHEN status = 2 THEN 1 END) as deleted,
        SUM(view_count) as total_views
      FROM articles
    `;
    
    const result = await query(sql, []);
    return result[0];
  }

  /**
   * 根据分类获取文章
   * @param {string} categorySlug - 分类别名
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Array>} 文章列表
   */
  static async findByCategory(categorySlug, page = 1, pageSize = 10) {
    // 确保参数是有效的数字类型
    const pageNum = isNaN(parseInt(page)) ? 1 : Math.max(1, parseInt(page));
    const size = isNaN(parseInt(pageSize)) ? 10 : Math.max(1, Math.min(100, parseInt(pageSize)));
    const offset = (pageNum - 1) * size;
    
    const sql = `
      SELECT 
        a.*,
        u.username as author_username,
        u.nickname as author_nickname,
        c.name as category_name,
        c.slug as category_slug
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 1 AND c.slug = ?
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const finalSql = sql.replace('LIMIT ? OFFSET ?', `LIMIT ${size} OFFSET ${offset}`);
    const articles = await query(finalSql, [categorySlug]);
    
    // 解析JSON字段
    const parsedArticles = this.parseJsonFields(articles);
    
    // 为每篇文章添加标签信息
    for (const article of parsedArticles) {
      article.tags = await this.getArticleTags(article.id);
    }
    
    return parsedArticles;
  }

  /**
   * 为文章设置标签（替换所有现有标签）
   * @param {number} articleId - 文章ID
   * @param {Array<number>} tagIds - 标签ID数组
   * @returns {Promise<void>}
   */
  static async setArticleTags(articleId, tagIds) {
    // 先删除所有现有标签
    await TagDao.removeAllTagsFromArticle(articleId);
    
    // 添加新标签
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      await TagDao.addTagsToArticle(articleId, tagIds);
    }
    
    // 更新相关标签的文章数量
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await TagDao.updateArticleCount(tagId);
      }
    }
  }

  /**
   * 获取文章的标签
   * @param {number} articleId - 文章ID
   * @returns {Promise<Array>} 标签列表
   */
  static async getArticleTags(articleId) {
    return await TagDao.getArticleTags(articleId);
  }

  /**
   * 为文章添加标签
   * @param {number} articleId - 文章ID
   * @param {Array<number>} tagIds - 标签ID数组
   * @returns {Promise<void>}
   */
  static async addTagsToArticle(articleId, tagIds) {
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      await TagDao.addTagsToArticle(articleId, tagIds);
      
      // 更新标签的文章数量
      for (const tagId of tagIds) {
        await TagDao.updateArticleCount(tagId);
      }
    }
  }

  /**
   * 从文章移除标签
   * @param {number} articleId - 文章ID
   * @param {Array<number>} tagIds - 标签ID数组
   * @returns {Promise<void>}
   */
  static async removeTagsFromArticle(articleId, tagIds) {
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      await TagDao.removeTagsFromArticle(articleId, tagIds);
      
      // 更新标签的文章数量
      for (const tagId of tagIds) {
        await TagDao.updateArticleCount(tagId);
      }
    }
  }

  /**
   * 根据标签名称为文章设置标签（自动创建不存在的标签）
   * @param {number} articleId - 文章ID
   * @param {Array<string>} tagNames - 标签名称数组
   * @returns {Promise<void>}
   */
  static async setArticleTagsByNames(articleId, tagNames) {
    if (!Array.isArray(tagNames) || tagNames.length === 0) {
      // 清空所有标签
      await TagDao.removeAllTagsFromArticle(articleId);
      return;
    }
    
    // 获取或创建标签
    const tagIds = await TagDao.getOrCreateByNames(tagNames);
    
    // 设置文章标签
    await this.setArticleTags(articleId, tagIds);
  }

  /**
   * 获取包含标签信息的文章详情
   * @param {number} id - 文章ID
   * @returns {Promise<Object>} 文章信息（包含标签）
   */
  static async findByIdWithTags(id) {
    const article = await this.findById(id, true);
    if (!article) return null;
    
    // 获取标签信息
    const tags = await this.getArticleTags(id);
    article.tag_details = tags;
    
    return article;
  }

  /**
   * 根据标签查询文章
   * @param {Array<number>} tagIds - 标签ID数组
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 文章列表
   */
  static async findByTags(tagIds, options = {}) {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return [];
    }
    
    const {
      page = 1,
      pageSize = 10,
      status = 1,
      matchType = 'any' // 'any' 或 'all'
    } = options;
    
    const pageNum = Math.max(1, parseInt(page));
    const size = Math.max(1, Math.min(100, parseInt(pageSize)));
    const offset = (pageNum - 1) * size;
    
    const placeholders = tagIds.map(() => '?').join(',');
    
    let sql;
    if (matchType === 'all') {
      // 必须包含所有指定标签
      sql = `
        SELECT DISTINCT
          a.*,
          u.username as author_username,
          u.nickname as author_nickname,
          c.name as category_name,
          c.slug as category_slug
        FROM articles a
        INNER JOIN article_tags at ON a.id = at.article_id
        INNER JOIN users u ON a.author_id = u.id
        INNER JOIN categories c ON a.category_id = c.id
        WHERE a.status = ? AND at.tag_id IN (${placeholders})
        GROUP BY a.id
        HAVING COUNT(DISTINCT at.tag_id) = ?
        ORDER BY a.created_at DESC
        LIMIT ${size} OFFSET ${offset}
      `;
    } else {
      // 包含任意一个指定标签
      sql = `
        SELECT DISTINCT
          a.*,
          u.username as author_username,
          u.nickname as author_nickname,
          c.name as category_name,
          c.slug as category_slug
        FROM articles a
        INNER JOIN article_tags at ON a.id = at.article_id
        INNER JOIN users u ON a.author_id = u.id
        INNER JOIN categories c ON a.category_id = c.id
        WHERE a.status = ? AND at.tag_id IN (${placeholders})
        ORDER BY a.created_at DESC
        LIMIT ${size} OFFSET ${offset}
      `;
    }
    
    const params = [status, ...tagIds];
    if (matchType === 'all') {
      params.push(tagIds.length);
    }
    
    const articles = await query(sql, params);
    const parsedArticles = this.parseJsonFields(articles);
    
    // 为每篇文章添加标签信息
    for (const article of parsedArticles) {
      article.tags = await this.getArticleTags(article.id);
    }
    
    return parsedArticles;
  }

  /**
   * 获取文章的标签统计
   * @param {number} articleId - 文章ID
   * @returns {Promise<Object>} 标签统计信息
   */
  static async getArticleTagStats(articleId) {
    const sql = `
      SELECT 
        COUNT(*) as tag_count
      FROM article_tags 
      WHERE article_id = ?
    `;
    
    const result = await query(sql, [articleId]);
    return {
      tag_count: result[0].tag_count
    };
  }

  /**
   * 根据标签查询文章（支持其他筛选条件）
   * @param {Array<number>} tagIds - 标签ID数组
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 文章列表
   */
  static async findByTagsWithFilters(tagIds, options = {}) {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return [];
    }
    
    const {
      page = 1,
      pageSize = 10,
      status = 1,
      category_id,
      author_id,
      keyword,
      matchType = 'any',
      orderBy = 'created_at',
      order = 'DESC'
    } = options;
    
    // 确保分页参数是有效的数字
    const pageNum = Math.max(1, parseInt(page) || 1);
    const size = Math.max(1, Math.min(100, parseInt(pageSize) || 10));
    const offset = (pageNum - 1) * size;
    
    const tagPlaceholders = tagIds.map(() => '?').join(',');
    
    // 构建基础查询
    let sql = `
      SELECT DISTINCT
        a.*,
        u.username as author_username,
        u.nickname as author_nickname,
        c.name as category_name,
        c.slug as category_slug
      FROM articles a
      INNER JOIN article_tags at ON a.id = at.article_id
      INNER JOIN users u ON a.author_id = u.id
      INNER JOIN categories c ON a.category_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // 添加状态筛选
    if (status !== null && status !== undefined) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    
    // 添加分类筛选
    if (category_id) {
      sql += ' AND a.category_id = ?';
      params.push(category_id);
    }
    
    // 添加作者筛选
    if (author_id) {
      sql += ' AND a.author_id = ?';
      params.push(author_id);
    }
    
    // 添加关键词搜索
    if (keyword) {
      sql += ' AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }
    
    // 添加标签筛选
    sql += ` AND at.tag_id IN (${tagPlaceholders})`;
    params.push(...tagIds);
    
    // 如果是匹配所有标签，需要分组和having条件
    if (matchType === 'all') {
      sql += ' GROUP BY a.id HAVING COUNT(DISTINCT at.tag_id) = ?';
      params.push(tagIds.length);
    }
    
    // 添加排序
    const validOrderColumns = ['created_at', 'updated_at', 'title', 'view_count'];
    const validOrderDirections = ['ASC', 'DESC'];
    
    const orderColumn = validOrderColumns.includes(orderBy) ? orderBy : 'created_at';
    const orderDirection = validOrderDirections.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
    
    sql += ` ORDER BY a.${orderColumn} ${orderDirection}`;
    sql += ` LIMIT ${size} OFFSET ${offset}`;
    
    const articles = await query(sql, params);
    const parsedArticles = this.parseJsonFields(articles);
    
    // 为每篇文章添加标签信息
    for (const article of parsedArticles) {
      article.tags = await this.getArticleTags(article.id);
    }
    
    return parsedArticles;
  }

  /**
   * 根据标签统计文章数量（支持其他筛选条件）
   * @param {Array<number>} tagIds - 标签ID数组
   * @param {Object} options - 查询选项
   * @returns {Promise<number>} 文章总数
   */
  static async countByTagsWithFilters(tagIds, options = {}) {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return 0;
    }
    
    const {
      status = 1,
      category_id,
      author_id,
      keyword,
      matchType = 'any'
    } = options;
    
    const tagPlaceholders = tagIds.map(() => '?').join(',');
    
    // 构建基础查询
    let sql = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM articles a
      INNER JOIN article_tags at ON a.id = at.article_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // 添加状态筛选
    if (status !== null && status !== undefined) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    
    // 添加分类筛选
    if (category_id) {
      sql += ' AND a.category_id = ?';
      params.push(category_id);
    }
    
    // 添加作者筛选
    if (author_id) {
      sql += ' AND a.author_id = ?';
      params.push(author_id);
    }
    
    // 添加关键词搜索
    if (keyword) {
      sql += ' AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }
    
    // 添加标签筛选
    sql += ` AND at.tag_id IN (${tagPlaceholders})`;
    params.push(...tagIds);
    
    // 如果是匹配所有标签，需要特殊处理
    if (matchType === 'all') {
      sql = `
        SELECT COUNT(*) as total
        FROM (
          SELECT a.id
          FROM articles a
          INNER JOIN article_tags at ON a.id = at.article_id
          WHERE 1=1
      `;
      
      const innerParams = [];
      
      // 重新添加筛选条件
      if (status !== null && status !== undefined) {
        sql += ' AND a.status = ?';
        innerParams.push(status);
      }
      
      if (category_id) {
        sql += ' AND a.category_id = ?';
        innerParams.push(category_id);
      }
      
      if (author_id) {
        sql += ' AND a.author_id = ?';
        innerParams.push(author_id);
      }
      
      if (keyword) {
        sql += ' AND (a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)';
        const keywordPattern = `%${keyword}%`;
        innerParams.push(keywordPattern, keywordPattern, keywordPattern);
      }
      
      sql += ` AND at.tag_id IN (${tagPlaceholders})`;
      innerParams.push(...tagIds);
      
      sql += ' GROUP BY a.id HAVING COUNT(DISTINCT at.tag_id) = ?';
      innerParams.push(tagIds.length);
      
      sql += ') as filtered_articles';
      
      params.length = 0;
      params.push(...innerParams);
    }
    
    const result = await query(sql, params);
    return result[0].total;
  }

  /**
   * 记录文章访问
   * @param {Object} visitData - 访问数据
   * @returns {Promise<Object>} 插入结果
   */
  static async recordVisit(visitData) {
    const {
      articleId,
      articleTitle,
      visitorIp,
      userAgent,
      referer,
      deviceType,
      browser,
      os,
      sessionId
    } = visitData;

    // 获取IP地理位置信息
    const location = await this.getLocationFromIP(visitorIp);

    // 检查是否为独立访客（24小时内同IP同文章首次访问）
    const uniqueCheckSql = `
      SELECT COUNT(*) as count
      FROM article_visits 
      WHERE article_id = ? 
        AND visitor_ip = ? 
        AND visited_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    const uniqueResult = await query(uniqueCheckSql, [articleId, visitorIp]);
    const isUniqueVisitor = uniqueResult[0].count === 0;

    // 插入访问记录
    const insertSql = `
      INSERT INTO article_visits (
        article_id, article_title, visitor_ip, user_agent, referer, 
        device_type, browser, os, session_id, is_unique_visitor,
        country, city, country_code, region, region_code, zip_code,
        latitude, longitude, timezone, isp, org, as_info,
        is_mobile, is_proxy, is_hosting, location_source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await query(insertSql, [
      articleId, articleTitle, visitorIp, userAgent, referer,
      deviceType, browser, os, sessionId, isUniqueVisitor,
      location.country, location.city, location.countryCode, location.region, location.regionCode, location.zip,
      location.latitude, location.longitude, location.timezone, location.isp, location.org, location.as,
      location.mobile, location.proxy, location.hosting, location.source
    ]);

    return { success: true, isUniqueVisitor, visitId: result.insertId };
  }

  /**
   * 获取IP地理位置信息
   * @param {string} ip - IP地址
   * @returns {Promise<Object>} 地理位置信息
   */
  static async getLocationFromIP(ip) {
    try {
      const { getLocationFromIP } = await import('../utils/ipLocationService.js');
      return await getLocationFromIP(ip);
    } catch (error) {
      console.error(`获取IP ${ip} 地理位置失败:`, error.message);
      // 降级到本地规则
      if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
        return { country: '中国', city: '本地' };
      }
      if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
        return { country: '中国', city: '内网' };
      }
      return { country: '未知', city: '未知' };
    }
  }

  /**
   * 获取文章访问统计
   * @param {number} articleId - 文章ID
   * @returns {Promise<Object>} 访问统计数据
   */
  static async getVisitStats(articleId) {
    const sql = `
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT visitor_ip) as unique_visitors,
        COUNT(CASE WHEN DATE(visited_at) = CURDATE() THEN 1 END) as today_visits,
        COUNT(CASE WHEN DATE(visited_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_visits,
        COUNT(CASE WHEN DATE(visited_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as month_visits,
        MAX(visited_at) as last_visit_time
      FROM article_visits 
      WHERE article_id = ?
    `;
    const result = await query(sql, [articleId]);
    return result[0];
  }

  /**
   * 获取访问趋势数据
   * @param {number} days - 统计天数
   * @returns {Promise<Array>} 趋势数据
   */
  static async getVisitTrends(days = 90) {
    // 确保参数是有效的数字
    const validDays = Math.max(1, parseInt(days) || 30);
    
    // 验证参数是否为有效数字
    if (isNaN(validDays)) {
      throw new Error('Invalid parameter: days must be a valid number');
    }

    const sql = `
      SELECT 
        DATE(visited_at) as date,
        COUNT(*) as total_visits,
        COUNT(DISTINCT visitor_ip) as unique_visitors
      FROM article_visits 
      WHERE visited_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(visited_at)
      ORDER BY date DESC
    `;
    return await query(sql, [validDays]);
  }

  /**
   * 获取热门文章排行
   * @param {number} limit - 返回数量
   * @param {number} days - 统计天数
   * @returns {Promise<Array>} 热门文章列表
   */
  static async getHotArticles(limit = 10, days = 90) {
    // 确保参数是有效的数字，并且不为 NaN
    const validDays = Math.max(1, parseInt(days) || 7);
    const validLimit = Math.max(1, parseInt(limit) || 10);

    // 验证参数是否为有效数字
    if (isNaN(validDays) || isNaN(validLimit)) {
      throw new Error('Invalid parameters: days and limit must be valid numbers');
    }

    // 如果 article_visits 表为空，返回空数组
    const checkSql = 'SELECT COUNT(*) as count FROM article_visits';
    const checkResult = await query(checkSql, []);
    
    if (checkResult[0].count === 0) {
      return [];
    }

    // 使用更简单的查询，避免复杂的 GROUP BY
    try {
      const sql = `
        SELECT 
          article_id,
          article_title,
          COUNT(*) as visit_count
        FROM article_visits 
        WHERE visited_at >= DATE_SUB(NOW(), INTERVAL ${validDays} DAY)
        GROUP BY article_id, article_title
        ORDER BY visit_count DESC
        LIMIT ${validLimit}
      `;
      
      const results = await query(sql, []);
      
      // 如果需要 unique_visitors，单独查询
      const resultsWithUnique = await Promise.all(
        results.map(async (row) => {
          const uniqueSql = `
            SELECT COUNT(DISTINCT visitor_ip) as unique_visitors
            FROM article_visits 
            WHERE article_id = ${row.article_id}
              AND visited_at >= DATE_SUB(NOW(), INTERVAL ${validDays} DAY)
          `;
          const uniqueResult = await query(uniqueSql, []);
          return {
            ...row,
            unique_visitors: uniqueResult[0].unique_visitors
          };
        })
      );
      
      return resultsWithUnique;
    } catch (error) {
      console.error('getHotArticles 查询失败:', error);
      // 如果复杂查询失败，返回空数组
      return [];
    }
  }

  /**
   * 获取访问来源统计
   * @param {number} days - 统计天数
   * @returns {Promise<Array>} 来源统计
   */
  static async getRefererStats(days = 90) {
    // 确保参数是有效的数字
    const validDays = Math.max(1, parseInt(days) || 7);
    
    // 验证参数是否为有效数字
    if (isNaN(validDays)) {
      throw new Error('Invalid parameter: days must be a valid number');
    }

    const sql = `
      SELECT 
        CASE 
          WHEN referer IS NULL OR referer = '' THEN '直接访问'
          WHEN referer LIKE '%google%' THEN 'Google搜索'
          WHEN referer LIKE '%baidu%' THEN '百度搜索'
          WHEN referer LIKE '%bing%' THEN 'Bing搜索'
          ELSE SUBSTRING_INDEX(SUBSTRING_INDEX(referer, '/', 3), '/', -1)
        END as source,
        COUNT(*) as visit_count
      FROM article_visits 
      WHERE visited_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY source
      ORDER BY visit_count DESC
    `;
    return await query(sql, [validDays]);
  }

  /**
   * 获取设备类型统计
   * @param {number} days - 统计天数
   * @returns {Promise<Array>} 设备统计
   */
  static async getDeviceStats(days = 90) {
    // 确保参数是有效的数字
    const validDays = Math.max(1, parseInt(days) || 7);
    
    // 验证参数是否为有效数字
    if (isNaN(validDays)) {
      throw new Error('Invalid parameter: days must be a valid number');
    }

    const sql = `
      SELECT 
        CASE device_type
          WHEN 1 THEN '桌面'
          WHEN 2 THEN '平板'
          WHEN 3 THEN '手机'
          ELSE '未知'
        END as device,
        COUNT(*) as visit_count,
        ROUND(COUNT(*) * 100.0 / (
          SELECT COUNT(*) FROM article_visits 
          WHERE visited_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        ), 2) as percentage
      FROM article_visits 
      WHERE visited_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY device_type
      ORDER BY visit_count DESC
    `;
    return await query(sql, [validDays, validDays]);
  }

  /**
   * 获取访问时段统计
   * @param {number} days - 统计天数
   * @returns {Promise<Array>} 时段统计
   */
  static async getHourlyStats(days = 90) {
    // 确保参数是有效的数字
    const validDays = Math.max(1, parseInt(days) || 7);
    
    // 验证参数是否为有效数字
    if (isNaN(validDays)) {
      throw new Error('Invalid parameter: days must be a valid number');
    }

    const sql = `
      SELECT 
        HOUR(visited_at) as hour,
        COUNT(*) as visit_count
      FROM article_visits 
      WHERE visited_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY HOUR(visited_at)
      ORDER BY hour
    `;
    return await query(sql, [validDays]);
  }

  /**
   * 获取文章访问明细
   * @param {number} articleId - 文章ID
   * @param {number} page - 页码
   * @param {number} pageSize - 每页大小
   * @returns {Promise<Object>} 访问明细
   */
  static async getVisitDetails(articleId, page = 1, pageSize = 20) {
    // 确保参数是有效的数字
    const validArticleId = parseInt(articleId);
    const validPage = Math.max(1, parseInt(page) || 1);
    const validPageSize = Math.max(1, Math.min(100, parseInt(pageSize) || 20));
    
    // 验证参数是否为有效数字
    if (isNaN(validArticleId) || isNaN(validPage) || isNaN(validPageSize)) {
      throw new Error('Invalid parameters: articleId, page, and pageSize must be valid numbers');
    }
    
    const offset = (validPage - 1) * validPageSize;
    
    const countSql = 'SELECT COUNT(*) as total FROM article_visits WHERE article_id = ?';
    const dataSql = `
      SELECT 
        visitor_ip,
        user_agent,
        referer,
        CASE device_type
          WHEN 1 THEN '桌面'
          WHEN 2 THEN '平板'  
          WHEN 3 THEN '手机'
          ELSE '未知'
        END as device,
        browser,
        os,
        country,
        city,
        is_unique_visitor,
        visited_at
      FROM article_visits 
      WHERE article_id = ?
      ORDER BY visited_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [countResult, dataResult] = await Promise.all([
      query(countSql, [validArticleId]),
      query(dataSql, [validArticleId, validPageSize, offset])
    ]);
    
    return {
      total: countResult[0].total,
      page: validPage,
      pageSize: validPageSize,
      data: dataResult
    };
  }

  /**
   * 清理访问数据
   * @param {number} months - 清理几个月前的数据
   * @param {boolean} dryRun - 是否为预览模式
   * @returns {Promise<Object>} 清理结果
   */
  static async cleanupVisitData(months = 1, dryRun = false) {
    // 计算清理的截止日期
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    // 获取要清理的数据统计
    const countSql = `
      SELECT COUNT(*) as count, 
             MIN(visited_at) as earliest_date,
             MAX(visited_at) as latest_date
      FROM article_visits 
      WHERE visited_at < ?
    `;
    
    const countResult = await query(countSql, [cutoffDate]);
    const { count, earliest_date, latest_date } = countResult[0];
    
    if (dryRun) {
      // 预览模式，只返回统计信息
      return {
        dryRun: true,
        months,
        cutoffDate: cutoffDate.toISOString(),
        recordsToDelete: count,
        earliestDate: earliest_date,
        latestDate: latest_date,
        estimatedSpaceSaved: Math.round(count * 0.5) // 估算每条记录约0.5KB
      };
    }
    
    // 实际清理模式
    const deleteSql = 'DELETE FROM article_visits WHERE visited_at < ?';
    const deleteResult = await query(deleteSql, [cutoffDate]);
    
    return {
      dryRun: false,
      months,
      cutoffDate: cutoffDate.toISOString(),
      recordsDeleted: deleteResult.affectedRows,
      earliestDate: earliest_date,
      latestDate: latest_date,
      cleanupTime: new Date().toISOString()
    };
  }

  /**
   * 获取数据清理统计信息
   * @returns {Promise<Object>} 清理统计信息
   */
  static async getCleanupStats() {
    // 获取总记录数
    const totalSql = 'SELECT COUNT(*) as total FROM article_visits';
    const totalResult = await query(totalSql, []);
    
    // 获取最早和最晚的访问时间
    const dateRangeSql = `
      SELECT 
        MIN(visited_at) as earliest_date,
        MAX(visited_at) as latest_date
      FROM article_visits
    `;
    const dateRangeResult = await query(dateRangeSql, []);
    
    // 按月份统计数据量
    const monthlyStatsSql = `
      SELECT 
        DATE_FORMAT(visited_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM article_visits 
      GROUP BY DATE_FORMAT(visited_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `;
    const monthlyStats = await query(monthlyStatsSql, []);
    
    // 计算各个月份的清理建议
    const cleanupSuggestions = monthlyStats.map(stat => {
      const [year, month] = stat.month.split('-');
      const statDate = new Date(parseInt(year), parseInt(month) - 1);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - statDate.getFullYear()) * 12 + 
                        (now.getMonth() - statDate.getMonth());
      
      return {
        month: stat.month,
        count: stat.count,
        monthsOld: monthsDiff,
        canCleanup: monthsDiff >= 1,
        estimatedSpace: Math.round(stat.count * 0.5) // KB
      };
    });
    
    return {
      totalRecords: totalResult[0].total,
      earliestDate: dateRangeResult[0].earliest_date,
      latestDate: dateRangeResult[0].latest_date,
      monthlyStats,
      cleanupSuggestions,
      estimatedTotalSpace: Math.round(totalResult[0].total * 0.5) // KB
    };
  }

  /**
   * 获取地理位置统计
   * @param {number} days - 统计天数
   * @returns {Promise<Array>} 地理位置统计数据
   */
  static async getLocationStats(days = 90) {
    const validDays = Math.max(1, parseInt(days) || 7);
    
    if (isNaN(validDays)) {
      throw new Error('Invalid parameter: days must be a valid number');
    }

    // 首先获取总访问量，避免除零错误
    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM article_visits 
      WHERE visited_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [validDays]);
    
    const totalVisits = totalResult[0].total;
    
    // 如果没有访问数据，返回空数组
    if (totalVisits === 0) {
      return [];
    }

    const sql = `
      SELECT 
        COALESCE(country, '未知') as country,
        COALESCE(country_code, '') as country_code,
        COALESCE(region, '') as region,
        COALESCE(region_code, '') as region_code,
        COALESCE(city, '未知') as city,
        COALESCE(zip_code, '') as zip_code,
        COUNT(*) as visit_count,
        COUNT(DISTINCT visitor_ip) as unique_visitors,
        ROUND(COUNT(*) * 100.0 / ?, 2) as percentage,
        location_source,
        COUNT(CASE WHEN is_mobile = 1 THEN 1 END) as mobile_visits,
        COUNT(CASE WHEN is_proxy = 1 THEN 1 END) as proxy_visits,
        COUNT(CASE WHEN is_hosting = 1 THEN 1 END) as hosting_visits
      FROM article_visits 
      WHERE visited_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY country, country_code, region, region_code, city, zip_code, location_source
      ORDER BY visit_count DESC
      LIMIT 50
    `;
    
    const result = await query(sql, [totalVisits, validDays]);
    return result;
  }

  /**
   * 获取国家统计（汇总城市数据）
   * @param {number} days - 统计天数
   * @returns {Promise<Array>} 国家统计数据
   */
  static async getCountryStats(days = 90) {
    const validDays = Math.max(1, parseInt(days) || 7);
    
    if (isNaN(validDays)) {
      throw new Error('Invalid parameter: days must be a valid number');
    }

    // 首先获取总访问量，避免除零错误
    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM article_visits 
      WHERE visited_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [validDays]);
    
    const totalVisits = totalResult[0].total;
    
    // 如果没有访问数据，返回空数组
    if (totalVisits === 0) {
      return [];
    }

    const sql = `
      SELECT 
        COALESCE(country, '未知') as country,
        COALESCE(country_code, '') as country_code,
        COUNT(*) as visit_count,
        COUNT(DISTINCT visitor_ip) as unique_visitors,
        COUNT(DISTINCT city) as city_count,
        COUNT(DISTINCT region) as region_count,
        ROUND(COUNT(*) * 100.0 / ?, 2) as percentage,
        location_source,
        COUNT(CASE WHEN is_mobile = 1 THEN 1 END) as mobile_visits,
        COUNT(CASE WHEN is_proxy = 1 THEN 1 END) as proxy_visits,
        COUNT(CASE WHEN is_hosting = 1 THEN 1 END) as hosting_visits
      FROM article_visits 
      WHERE visited_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY country, country_code, location_source
      ORDER BY visit_count DESC
      LIMIT 20
    `;
    
    const result = await query(sql, [totalVisits, validDays]);
    return result;
  }
}

export { ArticleDao }; 