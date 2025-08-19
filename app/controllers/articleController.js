import { ArticleDao, CategoryDao, UserDao, TagDao } from '../dao/index.js';
import { buildVisitData } from '../utils/visitUtils.js';
import { 
  SKIP_TRACKING_DOMAINS, 
  SKIP_TRACKING_USER_AGENTS, 
  SKIP_TRACKING_IPS 
} from '../config/tracking.js';

/**
 * 文章控制器
 */
class ArticleController {
  /**
   * 创建文章
   */
  static async createArticle(req, res) {
    try {
      const {
        title,
        content,
        content_type = 2,
        raw_content,
        rendered_content,
        summary,
        excerpt,
        cover_image,
        images,
        category_id,
        status = 0,
        tags
      } = req.body;

      // 基本验证
      if (!title || !content || !category_id) {
        return res.status(400).json({
          success: false,
          message: '标题、内容和分类不能为空'
        });
      }

      // 验证分类是否存在
      const category = await CategoryDao.findById(category_id);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: '指定的分类不存在'
        });
      }

      // 获取作者ID（从认证中间件获取）
      const author_id = req.user?.id;
      if (!author_id) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      // 创建文章
      const result = await ArticleDao.create({
        title,
        content,
        content_type,
        raw_content,
        rendered_content,
        summary,
        excerpt,
        cover_image,
        images,
        category_id,
        author_id,
        status,
        tags
      });

      const articleId = result.insertId;

      // 处理标签关联
      if (tags && Array.isArray(tags) && tags.length > 0) {
        // 如果标签是字符串数组（标签名称），则自动创建标签
        if (typeof tags[0] === 'string') {
          await ArticleDao.setArticleTagsByNames(articleId, tags);
        } 
        // 如果标签是数字数组（标签ID），则直接关联
        else if (typeof tags[0] === 'number') {
          await ArticleDao.setArticleTags(articleId, tags);
        }
      }

      res.status(201).json({
        success: true,
        message: '文章创建成功',
        data: {
          id: articleId,
          title,
          category_id,
          status
        }
      });
    } catch (error) {
      console.error('创建文章错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取文章详情
   */
  /**
   * 检查是否应该跳过访问记录
   * @param {Object} req - Express请求对象
   * @returns {boolean} 是否跳过访问记录
   */
  static shouldSkipVisitTracking(req) {
    // 获取请求的Host头、Referer和IP
    const host = req.headers.host || '';
    const referer = req.headers.referer || req.headers.referrer || '';
    const userAgent = req.headers['user-agent'] || '';
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    // 检查Host头
    for (const domain of SKIP_TRACKING_DOMAINS) {
      if (host.includes(domain)) {
        console.log(`跳过访问记录 - Host匹配: ${host}`);
        return true;
      }
    }
    
    // 检查Referer
    for (const domain of SKIP_TRACKING_DOMAINS) {
      if (referer.includes(domain)) {
        console.log(`跳过访问记录 - Referer匹配: ${referer}`);
        return true;
      }
    }
    
    // 检查User-Agent
    for (const pattern of SKIP_TRACKING_USER_AGENTS) {
      if (pattern.test(userAgent)) {
        console.log(`跳过访问记录 - Bot检测: ${userAgent}`);
        return true;
      }
    }
    
    // 检查IP地址
    for (const ip of SKIP_TRACKING_IPS) {
      if (clientIP.includes(ip)) {
        console.log(`跳过访问记录 - IP匹配: ${clientIP}`);
        return true;
      }
    }
    
    return false;
  }

  static async getArticleInfo(req, res) {
    try {
      const { id } = req.params;
      const { includeDetails = true } = req.query;

      const article = await ArticleDao.findByIdWithTags(id);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: '文章不存在'
        });
      }

      // 检查文章状态，只有已发布的文章才能被访问
      if (article.status !== 1) {
        return res.status(404).json({
          success: false,
          message: '文章不存在或未发布'
        });
      }

      // 增加浏览次数并记录访问（只有在状态为已发布时）
      if (article.status === 1) {
        // 检查是否需要跳过访问记录
        const shouldSkipTracking = ArticleController.shouldSkipVisitTracking(req);
        
        if (!shouldSkipTracking) {
          // 记录详细访问信息
          try {
            const visitData = buildVisitData(req, id, article.title);
            const visitResult = await ArticleDao.recordVisit(visitData);
            
            // 只有独立访客才增加浏览次数
            if (visitResult.isUniqueVisitor) {
              await ArticleDao.incrementViewCount(id);
              article.view_count = (article.view_count || 0) + 1;
            }
          } catch (visitError) {
            console.error('记录访问失败:', visitError);
            // 访问记录失败时，仍然增加浏览次数（保持原有逻辑）
            await ArticleDao.incrementViewCount(id);
            article.view_count = (article.view_count || 0) + 1;
          }
        } else {
          // 跳过访问记录，但仍然增加浏览次数
          await ArticleDao.incrementViewCount(id);
          article.view_count = (article.view_count || 0) + 1;
        }
      }

      res.json({
        success: true,
        data: article
      });
    } catch (error) {
      console.error('获取文章详情错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 更新文章
   */
  static async updateArticle(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 验证文章是否存在
      const existingArticle = await ArticleDao.findById(id, false);
      if (!existingArticle) {
        return res.status(404).json({
          success: false,
          message: '文章不存在'
        });
      }

      // 权限检查（只有作者或管理员可以编辑）
      const userId = req.user?.id;
      if (existingArticle.author_id !== userId) {
        // 这里可以添加管理员权限检查
        return res.status(403).json({
          success: false,
          message: '没有权限编辑此文章'
        });
      }

      // 验证分类（如果要更新分类）
      if (updateData.category_id) {
        const category = await CategoryDao.findById(updateData.category_id);
        if (!category) {
          return res.status(400).json({
            success: false,
            message: '指定的分类不存在'
          });
        }
      }



      // 处理标签更新
      const tagsToUpdate = updateData.tags;
      delete updateData.tags; // 从主表更新数据中移除，单独处理

      // 移除不应该被更新的字段
      delete updateData.id;
      delete updateData.author_id;
      delete updateData.created_at;
      delete updateData.updated_at; // 让数据库自动更新
      delete updateData.view_count;
      delete updateData.author_username;
      delete updateData.author_nickname;
      delete updateData.author_avatar;
      delete updateData.category_name;
      delete updateData.category_slug;
      delete updateData.tag_details;

      const result = await ArticleDao.update(id, updateData);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '文章不存在或未进行任何更新'
        });
      }

      // 更新标签关联
      if (tagsToUpdate !== undefined) {
        if (Array.isArray(tagsToUpdate) && tagsToUpdate.length > 0) {
          // 如果标签是字符串数组（标签名称），则自动创建标签
          if (typeof tagsToUpdate[0] === 'string') {
            await ArticleDao.setArticleTagsByNames(id, tagsToUpdate);
          } 
          // 如果标签是数字数组（标签ID），则直接关联
          else if (typeof tagsToUpdate[0] === 'number') {
            await ArticleDao.setArticleTags(id, tagsToUpdate);
          }
        } else {
          // 空数组，清空所有标签
          await ArticleDao.setArticleTags(id, []);
        }
      }

      res.json({
        success: true,
        message: '文章更新成功'
      });
    } catch (error) {
      console.error('更新文章错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 删除文章（软删除）
   */
  static async deleteArticle(req, res) {
    try {
      const { id } = req.params;

      // 验证文章是否存在
      const existingArticle = await ArticleDao.findById(id, false);
      if (!existingArticle) {
        return res.status(404).json({
          success: false,
          message: '文章不存在'
        });
      }

      // 权限检查
      const userId = req.user?.id;
      if (existingArticle.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '没有权限删除此文章'
        });
      }

      const result = await ArticleDao.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '文章不存在'
        });
      }

      res.json({
        success: true,
        message: '文章删除成功'
      });
    } catch (error) {
      console.error('删除文章错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取文章列表
   */
  static async getArticleList(req, res) {
    try {
      const {
        page = 1,
        pageSize = 10,
        status,
        category_id,
        author_id,
        keyword,
        orderBy = 'created_at',
        order = 'DESC',
        tag_ids,
        tag_match_type = 'any'
      } = req.query;

      const options = {
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
        status: status ? parseInt(status) : null,
        category_id: category_id ? parseInt(category_id) : null,
        author_id: author_id ? parseInt(author_id) : null,
        keyword,
        orderBy,
        order
      };

      let articles;
      let total;

      // 如果指定了标签ID，使用标签筛选
      if (tag_ids) {
        const tagIds = Array.isArray(tag_ids) ? tag_ids.map(id => parseInt(id)) : [parseInt(tag_ids)];
        
        // 使用标签筛选，同时支持其他筛选条件
        articles = await ArticleDao.findByTagsWithFilters(tagIds, {
          ...options,
          matchType: tag_match_type
        });
        
        total = await ArticleDao.countByTagsWithFilters(tagIds, {
          status: options.status,
          category_id: options.category_id,
          author_id: options.author_id,
          keyword: options.keyword,
          matchType: tag_match_type
        });
      } else {
        // 普通筛选
        articles = await ArticleDao.findWithPagination(options);
        total = await ArticleDao.count(options);
      }

      res.json({
        success: true,
        data: {
          articles,
          pagination: {
            current: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            total,
            pages: Math.ceil(total / (parseInt(pageSize) || 10))
          }
        }
      });
    } catch (error) {
      console.error('获取文章列表错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取热门文章
   */
  static async getPopularArticles(req, res) {
    try {
      const { limit = 10, days = 30 } = req.query;

      const parsedLimit = Math.max(1, parseInt(limit) || 10);
      const parsedDays = Math.max(1, parseInt(days) || 30);
      
      // 验证参数是否为有效数字
      if (isNaN(parsedLimit) || isNaN(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：limit 和 days 必须是有效的数字'
        });
      }

      const articles = await ArticleDao.findPopular(parsedLimit, parsedDays);

      res.json({
        success: true,
        data: articles
      });
    } catch (error) {
      console.error('获取热门文章错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取最新文章
   */
  static async getLatestArticles(req, res) {
    try {
      const { limit = 10, status = 1 } = req.query;

      const parsedLimit = Math.max(1, parseInt(limit) || 10);
      const parsedStatus = parseInt(status) || 1;
      
      // 验证参数是否为有效数字
      if (isNaN(parsedLimit) || isNaN(parsedStatus)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：limit 和 status 必须是有效的数字'
        });
      }

      const articles = await ArticleDao.findLatest(parsedLimit, parsedStatus);

      res.json({
        success: true,
        data: articles
      });
    } catch (error) {
      console.error('获取最新文章错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取相关文章
   */
  static async getRelatedArticles(req, res) {
    try {
      const { id } = req.params;
      const { limit = 5 } = req.query;

      const parsedId = parseInt(id);
      const parsedLimit = Math.max(1, parseInt(limit) || 5);
      
      // 验证参数是否为有效数字
      if (isNaN(parsedId) || isNaN(parsedLimit)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：id 和 limit 必须是有效的数字'
        });
      }

      // 获取当前文章信息
      const article = await ArticleDao.findById(parsedId, false);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: '文章不存在'
        });
      }

      const relatedArticles = await ArticleDao.findRelated(
        parsedId,
        article.category_id,
        parsedLimit
      );

      // 处理图片列表
      relatedArticles.forEach(article => {
        if (article.images) {
          try {
            article.images = JSON.parse(article.images);
          } catch (e) {
            // 如果解析失败，保持原始字符串
          }
        }
      });

      res.json({
        success: true,
        data: relatedArticles
      });
    } catch (error) {
      console.error('获取相关文章错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据分类获取文章
   */
  static async getArticlesByCategory(req, res) {
    try {
      const { slug } = req.params;
      const { page = 1, pageSize = 10 } = req.query;

      // 验证分类是否存在
      const category = await CategoryDao.findBySlug(slug);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      const articles = await ArticleDao.findByCategory(
        slug,
        parseInt(page),
        parseInt(pageSize)
      );

      // 获取该分类下的文章总数
      const total = await ArticleDao.count({ category_id: category.id, status: 1 });

      // 处理图片列表
      articles.forEach(article => {
        if (article.images) {
          try {
            article.images = JSON.parse(article.images);
          } catch (e) {
            // 如果解析失败，保持原始字符串
          }
        }
      });

      res.json({
        success: true,
        data: {
          category,
          articles,
          pagination: {
            current: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            total,
            pages: Math.ceil(total / (parseInt(pageSize) || 10))
          }
        }
      });
    } catch (error) {
      console.error('根据分类获取文章错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取文章统计信息
   */
  static async getArticleStatistics(req, res) {
    try {
      const statistics = await ArticleDao.getStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('获取文章统计错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 批量更新文章状态
   */
  static async batchUpdateStatus(req, res) {
    try {
      const { ids, status } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要更新的文章ID数组'
        });
      }

      if (![0, 1, 2].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '状态值无效'
        });
      }

      const results = [];
      for (const id of ids) {
        try {
          // 权限检查（可选：只有文章作者或管理员可以更新）
          const result = await ArticleDao.update(id, { status });
          results.push({ id, success: result.affectedRows > 0 });
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        message: `成功更新 ${successCount} 篇文章状态`,
        data: {
          results,
          successCount,
          totalCount: ids.length
        }
      });
    } catch (error) {
      console.error('批量更新文章状态错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 永久删除文章
   */
  static async hardDeleteArticle(req, res) {
    try {
      const { id } = req.params;

      // 验证文章是否存在
      const existingArticle = await ArticleDao.findById(id, false);
      if (!existingArticle) {
        return res.status(404).json({
          success: false,
          message: '文章不存在'
        });
      }

      // 权限检查（通常只有管理员可以永久删除）
      const userId = req.user?.id;
      if (existingArticle.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '没有权限永久删除此文章'
        });
      }

      const result = await ArticleDao.hardDelete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '文章不存在'
        });
      }

      res.json({
        success: true,
        message: '文章永久删除成功'
      });
    } catch (error) {
      console.error('永久删除文章错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 为文章添加标签
   */
  static async addTagsToArticle(req, res) {
    try {
      const { id } = req.params;
      const { tagIds, tagNames } = req.body;

      // 验证文章是否存在
      const article = await ArticleDao.findById(id, false);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: '文章不存在'
        });
      }

      // 权限检查
      const userId = req.user?.id;
      if (article.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '没有权限编辑此文章'
        });
      }

             if (tagNames && Array.isArray(tagNames)) {
         // 根据标签名称添加
         const tagIds = await TagDao.getOrCreateByNames(tagNames);
         await ArticleDao.addTagsToArticle(id, tagIds);
      } else if (tagIds && Array.isArray(tagIds)) {
        // 根据标签ID添加
        await ArticleDao.addTagsToArticle(id, tagIds);
      } else {
        return res.status(400).json({
          success: false,
          message: '请提供有效的标签ID数组或标签名称数组'
        });
      }

      res.json({
        success: true,
        message: '标签添加成功'
      });
    } catch (error) {
      console.error('为文章添加标签错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 从文章移除标签
   */
  static async removeTagsFromArticle(req, res) {
    try {
      const { id } = req.params;
      const { tagIds } = req.body;

      if (!Array.isArray(tagIds) || tagIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要移除的标签ID数组'
        });
      }

      // 验证文章是否存在
      const article = await ArticleDao.findById(id, false);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: '文章不存在'
        });
      }

      // 权限检查
      const userId = req.user?.id;
      if (article.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '没有权限编辑此文章'
        });
      }

      await ArticleDao.removeTagsFromArticle(id, tagIds);

      res.json({
        success: true,
        message: '标签移除成功'
      });
    } catch (error) {
      console.error('从文章移除标签错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 设置文章标签（替换所有现有标签）
   */
  static async setArticleTags(req, res) {
    try {
      const { id } = req.params;
      const { tagIds, tagNames } = req.body;

      // 验证文章是否存在
      const article = await ArticleDao.findById(id, false);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: '文章不存在'
        });
      }

      // 权限检查
      const userId = req.user?.id;
      if (article.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '没有权限编辑此文章'
        });
      }

      if (tagNames && Array.isArray(tagNames)) {
        // 根据标签名称设置
        await ArticleDao.setArticleTagsByNames(id, tagNames);
      } else if (tagIds !== undefined && Array.isArray(tagIds)) {
        // 根据标签ID设置（可以是空数组，表示清空所有标签）
        await ArticleDao.setArticleTags(id, tagIds);
      } else {
        return res.status(400).json({
          success: false,
          message: '请提供有效的标签ID数组或标签名称数组'
        });
      }

      res.json({
        success: true,
        message: '文章标签设置成功'
      });
    } catch (error) {
      console.error('设置文章标签错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取文章的标签
   */
  static async getArticleTags(req, res) {
    try {
      const { id } = req.params;

      // 验证文章是否存在
      const article = await ArticleDao.findById(id, false);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: '文章不存在'
        });
      }

      const tags = await ArticleDao.getArticleTags(id);

      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      console.error('获取文章标签错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据标签查询文章（GET方式）
   */
  static async getArticlesByTagsGet(req, res) {
    try {
      const { tagIds } = req.params;
      const { page = 1, pageSize = 10, matchType = 'any', category_id, author_id, keyword } = req.query;

      // 解析标签ID（支持逗号分隔的字符串）
      const tagIdArray = tagIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

      if (tagIdArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的标签ID'
        });
      }

      const options = {
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
        status: 1, // 只查询已发布的文章
        matchType,
        category_id: category_id ? parseInt(category_id) : null,
        author_id: author_id ? parseInt(author_id) : null,
        keyword
      };

      const articles = await ArticleDao.findByTagsWithFilters(tagIdArray, options);
      const total = await ArticleDao.countByTagsWithFilters(tagIdArray, {
        status: 1,
        category_id: options.category_id,
        author_id: options.author_id,
        keyword: options.keyword,
        matchType
      });

      res.json({
        success: true,
        data: {
          articles,
          pagination: {
            current: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            total,
            pages: Math.ceil(total / (parseInt(pageSize) || 10))
          }
        }
      });
    } catch (error) {
      console.error('根据标签查询文章错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据标签查询文章（POST方式）
   */
  static async getArticlesByTags(req, res) {
    try {
      const { tagIds } = req.body;
      const { page = 1, pageSize = 10, matchType = 'any', category_id, author_id, keyword } = req.query;

      if (!Array.isArray(tagIds) || tagIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的标签ID数组'
        });
      }

      const options = {
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
        status: 1, // 只查询已发布的文章
        matchType,
        category_id: category_id ? parseInt(category_id) : null,
        author_id: author_id ? parseInt(author_id) : null,
        keyword
      };

      const articles = await ArticleDao.findByTagsWithFilters(tagIds, options);
      const total = await ArticleDao.countByTagsWithFilters(tagIds, {
        status: 1,
        category_id: options.category_id,
        author_id: options.author_id,
        keyword: options.keyword,
        matchType
      });

      res.json({
        success: true,
        data: {
          articles,
          pagination: {
            current: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            total,
            pages: Math.ceil(total / (parseInt(pageSize) || 10))
          }
        }
      });
    } catch (error) {
      console.error('根据标签查询文章错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取文章访问统计
   */
  static async getArticleVisitStats(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: '文章ID不能为空'
        });
      }

      const stats = await ArticleDao.getVisitStats(id);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取访问统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取访问统计失败'
      });
    }
  }

  /**
   * 获取访问趋势
   */
  static async getVisitTrends(req, res) {
    try {
      const { days = 90 } = req.query;
      
      const parsedDays = Math.max(1, parseInt(days) || 30);
      
      // 验证参数是否为有效数字
      if (isNaN(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：days 必须是有效的数字'
        });
      }
      
      const trends = await ArticleDao.getVisitTrends(parsedDays);
      
      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error('获取访问趋势失败:', error);
      res.status(500).json({
        success: false,
        message: '获取访问趋势失败'
      });
    }
  }

  /**
   * 获取热门文章排行
   */
  static async getHotArticles(req, res) {
    try {
      const { limit = 10, days = 90 } = req.query;
      
      // 确保传递有效的整数参数
      const parsedLimit = Math.max(1, parseInt(limit) || 10);
      const parsedDays = Math.max(1, parseInt(days) || 7);
      
      // 验证参数是否为有效数字
      if (isNaN(parsedLimit) || isNaN(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：limit 和 days 必须是有效的数字'
        });
      }
      
      const hotArticles = await ArticleDao.getHotArticles(parsedLimit, parsedDays);
      
      res.json({
        success: true,
        data: hotArticles
      });
    } catch (error) {
      console.error('获取热门文章失败:', error);
      res.status(500).json({
        success: false,
        message: '获取热门文章失败'
      });
    }
  }

  /**
   * 获取访问来源统计
   */
  static async getRefererStats(req, res) {
    try {
      const { days = 90 } = req.query;
      
      const parsedDays = Math.max(1, parseInt(days) || 7);
      
      // 验证参数是否为有效数字
      if (isNaN(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：days 必须是有效的数字'
        });
      }
      
      const stats = await ArticleDao.getRefererStats(parsedDays);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取来源统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取来源统计失败'
      });
    }
  }

  /**
   * 获取设备类型统计
   */
  static async getDeviceStats(req, res) {
    try {
      const { days = 90 } = req.query;
      
      const parsedDays = Math.max(1, parseInt(days) || 7);
      
      // 验证参数是否为有效数字
      if (isNaN(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：days 必须是有效的数字'
        });
      }
      
      const stats = await ArticleDao.getDeviceStats(parsedDays);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取设备统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取设备统计失败'
      });
    }
  }

  /**
   * 获取访问时段统计
   */
  static async getHourlyStats(req, res) {
    try {
      const { days = 90 } = req.query;
      
      const parsedDays = Math.max(1, parseInt(days) || 7);
      
      // 验证参数是否为有效数字
      if (isNaN(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：days 必须是有效的数字'
        });
      }
      
      const stats = await ArticleDao.getHourlyStats(parsedDays);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取时段统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取时段统计失败'
      });
    }
  }

  /**
   * 获取文章访问明细
   */
  static async getVisitDetails(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 20 } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: '文章ID不能为空'
        });
      }

      const parsedPage = Math.max(1, parseInt(page) || 1);
      const parsedPageSize = Math.max(1, Math.min(100, parseInt(pageSize) || 20));
      
      // 验证参数是否为有效数字
      if (isNaN(parsedPage) || isNaN(parsedPageSize)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：page 和 pageSize 必须是有效的数字'
        });
      }

      const details = await ArticleDao.getVisitDetails(
        id, 
        parsedPage, 
        parsedPageSize
      );
      
      res.json({
        success: true,
        data: details
      });
    } catch (error) {
      console.error('获取访问明细失败:', error);
      res.status(500).json({
        success: false,
        message: '获取访问明细失败'
      });
    }
  }

  /**
   * 清理访问数据
   */
  static async cleanupVisitData(req, res) {
    try {
      const { months = 1, dryRun = false } = req.body;
      
      // 验证参数
      const validMonths = Math.max(1, Math.min(12, parseInt(months) || 1));
      const isValidDryRun = typeof dryRun === 'boolean' ? dryRun : false;
      
      if (isNaN(validMonths)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：months 必须是有效的数字'
        });
      }

      const result = await ArticleDao.cleanupVisitData(validMonths, isValidDryRun);
      
      res.json({
        success: true,
        data: result,
        message: isValidDryRun 
          ? `预览模式：将清理 ${validMonths} 个月前的访问数据` 
          : `成功清理 ${validMonths} 个月前的访问数据`
      });
    } catch (error) {
      console.error('清理访问数据失败:', error);
      res.status(500).json({
        success: false,
        message: '清理访问数据失败'
      });
    }
  }

  /**
   * 获取数据清理统计信息
   */
  static async getCleanupStats(req, res) {
    try {
      const stats = await ArticleDao.getCleanupStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取清理统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取清理统计失败'
      });
    }
  }

  /**
   * 获取地理位置统计
   */
  static async getLocationStats(req, res) {
    try {
      const { days = 90 } = req.query;
      
      const parsedDays = Math.max(1, parseInt(days) || 7);
      
      // 验证参数是否为有效数字
      if (isNaN(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：days 必须是有效的数字'
        });
      }
      
      const stats = await ArticleDao.getLocationStats(parsedDays);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取地理位置统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取地理位置统计失败'
      });
    }
  }

  /**
   * 获取国家统计
   */
  static async getCountryStats(req, res) {
    try {
      const { days = 90 } = req.query;
      
      const parsedDays = Math.max(1, parseInt(days) || 7);
      
      // 验证参数是否为有效数字
      if (isNaN(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: '参数错误：days 必须是有效的数字'
        });
      }
      
      const stats = await ArticleDao.getCountryStats(parsedDays);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取国家统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取国家统计失败'
      });
    }
  }
}

export { ArticleController };