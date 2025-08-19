import { TagDao } from '../dao/index.js';

/**
 * 验证颜色格式
 * @param {string} color - 颜色值
 * @returns {boolean} 是否有效
 */
function isValidColor(color) {
  if (!color || typeof color !== 'string') return false;
  
  // 十六进制颜色格式验证
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}

/**
 * 标签控制器
 */
class TagController {
  /**
   * 创建标签
   */
  static async createTag(req, res) {
    try {
      const { name, slug, description, color, icon } = req.body;

      // 基本验证
      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message: '标签名称和别名不能为空'
        });
      }

      // 验证颜色格式（如果提供了的话）
      if (color && !isValidColor(color)) {
        return res.status(400).json({
          success: false,
          message: '颜色格式不正确，请使用十六进制格式（如#007bff）'
        });
      }

      // 检查名称是否已存在
      const existingNameTag = await TagDao.findByName(name);
      if (existingNameTag) {
        return res.status(400).json({
          success: false,
          message: '标签名称已存在'
        });
      }

      // 检查别名是否已存在
      const existingSlugTag = await TagDao.findBySlug(slug);
      if (existingSlugTag) {
        return res.status(400).json({
          success: false,
          message: '标签别名已存在'
        });
      }

      // 创建标签
      const result = await TagDao.create({
        name,
        slug,
        description,
        color: color || '#007bff',
        icon
      });

      res.status(201).json({
        success: true,
        message: '标签创建成功',
        data: {
          id: result.insertId,
          name,
          slug,
          description,
          color: color || '#007bff',
          icon
        }
      });
    } catch (error) {
      console.error('创建标签错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取标签信息
   */
  static async getTagInfo(req, res) {
    try {
      const { id } = req.params;

      const tag = await TagDao.findById(id);
      if (!tag) {
        return res.status(404).json({
          success: false,
          message: '标签不存在'
        });
      }

      res.json({
        success: true,
        data: tag
      });
    } catch (error) {
      console.error('获取标签信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据别名获取标签信息
   */
  static async getTagBySlug(req, res) {
    try {
      const { slug } = req.params;

      const tag = await TagDao.findBySlug(slug);
      if (!tag) {
        return res.status(404).json({
          success: false,
          message: '标签不存在'
        });
      }

      res.json({
        success: true,
        data: tag
      });
    } catch (error) {
      console.error('获取标签信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 更新标签信息
   */
  static async updateTag(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 验证标签是否存在
      const existingTag = await TagDao.findById(id);
      if (!existingTag) {
        return res.status(404).json({
          success: false,
          message: '标签不存在'
        });
      }

      // 如果要更新名称，检查是否重复
      if (updateData.name && updateData.name !== existingTag.name) {
        const nameExists = await TagDao.isNameExists(updateData.name, id);
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: '标签名称已存在'
          });
        }
      }

      // 如果要更新别名，检查是否重复
      if (updateData.slug && updateData.slug !== existingTag.slug) {
        const slugExists = await TagDao.isSlugExists(updateData.slug, id);
        if (slugExists) {
          return res.status(400).json({
            success: false,
            message: '标签别名已存在'
          });
        }
      }

      // 验证颜色格式
      if (updateData.color && !isValidColor(updateData.color)) {
        return res.status(400).json({
          success: false,
          message: '颜色格式不正确，请使用十六进制格式（如#007bff）'
        });
      }

      // 移除不应该被更新的字段
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.article_count;

      const result = await TagDao.update(id, updateData);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '标签不存在或未进行任何更新'
        });
      }

      res.json({
        success: true,
        message: '标签更新成功'
      });
    } catch (error) {
      console.error('更新标签错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 删除标签
   */
  static async deleteTag(req, res) {
    try {
      const { id } = req.params;

      // 验证标签是否存在
      const existingTag = await TagDao.findById(id);
      if (!existingTag) {
        return res.status(404).json({
          success: false,
          message: '标签不存在'
        });
      }

      const result = await TagDao.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '标签不存在'
        });
      }

      res.json({
        success: true,
        message: '标签删除成功'
      });
    } catch (error) {
      console.error('删除标签错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取标签列表
   */
  static async getTagList(req, res) {
    try {
      const { page, pageSize, orderBy = 'article_count', order = 'DESC' } = req.query;

      let tags;
      let total = null;

      if (page && pageSize) {
        // 分页查询
        const pageNum = parseInt(page);
        const size = parseInt(pageSize);

        tags = await TagDao.findWithPagination(pageNum, size, orderBy, order);
        total = await TagDao.count();
      } else {
        // 获取所有标签
        tags = await TagDao.findAll(orderBy, order);
      }

      const responseData = {
        tags
      };

      if (total !== null) {
        responseData.pagination = {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          pages: Math.ceil(total / parseInt(pageSize))
        };
      }

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('获取标签列表错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取标签的文章列表
   */
  static async getTagArticles(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 10 } = req.query;

      // 验证标签是否存在
      const tag = await TagDao.findById(id);
      if (!tag) {
        return res.status(404).json({
          success: false,
          message: '标签不存在'
        });
      }

      const articles = await TagDao.getTagArticles(id, page, pageSize);

      res.json({
        success: true,
        data: {
          tag,
          articles,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(pageSize)
          }
        }
      });
    } catch (error) {
      console.error('获取标签文章列表错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 更新标签文章数量统计
   */
  static async updateTagArticleCount(req, res) {
    try {
      const { id } = req.params;

      // 验证标签是否存在
      const existingTag = await TagDao.findById(id);
      if (!existingTag) {
        return res.status(404).json({
          success: false,
          message: '标签不存在'
        });
      }

      await TagDao.updateArticleCount(id);

      res.json({
        success: true,
        message: '标签文章数量更新成功'
      });
    } catch (error) {
      console.error('更新标签文章数量错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 更新所有标签的文章数量统计
   */
  static async updateAllTagsArticleCount(req, res) {
    try {
      await TagDao.updateAllArticleCounts();

      res.json({
        success: true,
        message: '所有标签文章数量更新成功'
      });
    } catch (error) {
      console.error('更新所有标签文章数量错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 检查标签名称是否可用
   */
  static async checkNameAvailability(req, res) {
    try {
      const { name } = req.params;
      const { excludeId } = req.query;

      const exists = await TagDao.isNameExists(name, excludeId);

      res.json({
        success: true,
        data: {
          available: !exists,
          name
        }
      });
    } catch (error) {
      console.error('检查标签名称可用性错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 检查标签别名是否可用
   */
  static async checkSlugAvailability(req, res) {
    try {
      const { slug } = req.params;
      const { excludeId } = req.query;

      const exists = await TagDao.isSlugExists(slug, excludeId);

      res.json({
        success: true,
        data: {
          available: !exists,
          slug
        }
      });
    } catch (error) {
      console.error('检查标签别名可用性错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 批量删除标签
   */
  static async batchDeleteTags(req, res) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要删除的标签ID数组'
        });
      }

      const results = [];
      for (const id of ids) {
        try {
          const result = await TagDao.delete(id);
          results.push({ id, success: result.affectedRows > 0 });
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        message: `成功删除 ${successCount} 个标签`,
        data: {
          results,
          successCount,
          totalCount: ids.length
        }
      });
    } catch (error) {
      console.error('批量删除标签错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取所有标签（用于选择器）
   */
  static async getTagsForSelect(req, res) {
    try {
      const tags = await TagDao.findAll('name', 'ASC');

      // 只返回必要字段
      const selectOptions = tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        article_count: tag.article_count
      }));

      res.json({
        success: true,
        data: selectOptions
      });
    } catch (error) {
      console.error('获取标签选择项错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 批量创建标签
   */
  static async batchCreateTags(req, res) {
    try {
      const { tags } = req.body;

      if (!Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要创建的标签数组'
        });
      }

      const results = await TagDao.batchCreate(tags);
      const successCount = results.filter(r => r.success).length;

      res.status(201).json({
        success: true,
        message: `成功创建 ${successCount} 个标签`,
        data: {
          results,
          successCount,
          totalCount: tags.length
        }
      });
    } catch (error) {
      console.error('批量创建标签错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据标签名称获取或创建标签
   */
  static async getOrCreateTagsByNames(req, res) {
    try {
      const { names } = req.body;

      if (!Array.isArray(names) || names.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供标签名称数组'
        });
      }

      const tagIds = await TagDao.getOrCreateByNames(names);

      res.json({
        success: true,
        message: '标签获取或创建成功',
        data: {
          tagIds,
          count: tagIds.length
        }
      });
    } catch (error) {
      console.error('根据名称获取或创建标签错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

export { TagController }; 