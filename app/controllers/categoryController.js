import { CategoryDao, ImageDao } from '../dao/index.js';
import fs from 'fs/promises';

/**
 * 验证图片URL格式
 * @param {string} url - 图片URL
 * @returns {boolean} 是否有效
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // 基本URL格式验证
  try {
    new URL(url);
  } catch {
    return false;
  }
  
  // 检查是否是常见的图片格式
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
  const isImageExtension = imageExtensions.test(url);
  
  // 允许没有扩展名的URL（可能是动态生成的图片）
  const hasNoExtension = !url.split('/').pop().includes('.');
  
  return isImageExtension || hasNoExtension;
}

/**
 * 分类控制器
 */
class CategoryController {
  /**
   * 创建分类
   */
  static async createCategory(req, res) {
    try {
      const { name, slug, description, sort_order, image_url } = req.body;

      // 基本验证
      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message: '分类名称和别名不能为空'
        });
      }

      // 验证图片URL格式（如果提供了的话）
      if (image_url && !isValidImageUrl(image_url)) {
        return res.status(400).json({
          success: false,
          message: '图片URL格式不正确'
        });
      }

      // 检查别名是否已存在
      const existingCategory = await CategoryDao.findBySlug(slug);
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: '分类别名已存在'
        });
      }

      // 创建分类
      const result = await CategoryDao.create({
        name,
        slug,
        description,
        sort_order: sort_order || 0,
        image_url
      });

      res.status(201).json({
        success: true,
        message: '分类创建成功',
        data: {
          id: result.insertId,
          name,
          slug,
          description,
          sort_order,
          image_url
        }
      });
    } catch (error) {
      console.error('创建分类错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取分类信息
   */
  static async getCategoryInfo(req, res) {
    try {
      const { id } = req.params;

      const category = await CategoryDao.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('获取分类信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据别名获取分类信息
   */
  static async getCategoryBySlug(req, res) {
    try {
      const { slug } = req.params;

      const category = await CategoryDao.findBySlug(slug);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('获取分类信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 更新分类信息
   */
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 验证分类是否存在
      const existingCategory = await CategoryDao.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      // 如果要更新别名，检查是否重复
      if (updateData.slug && updateData.slug !== existingCategory.slug) {
        const slugExists = await CategoryDao.isSlugExists(updateData.slug, id);
        if (slugExists) {
          return res.status(400).json({
            success: false,
            message: '分类别名已存在'
          });
        }
      }

      // 移除不应该被更新的字段
      delete updateData.id;
      delete updateData.created_at;

      const result = await CategoryDao.update(id, updateData);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '分类不存在或未进行任何更新'
        });
      }

      res.json({
        success: true,
        message: '分类更新成功'
      });
    } catch (error) {
      console.error('更新分类错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 删除分类
   */
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // 验证分类是否存在
      const existingCategory = await CategoryDao.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      const result = await CategoryDao.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      res.json({
        success: true,
        message: '分类删除成功'
      });
    } catch (error) {
      console.error('删除分类错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取分类列表
   */
  static async getCategoryList(req, res) {
    try {
      const {
        page,
        pageSize,
        orderBy = 'sort_order',
        order = 'ASC'
      } = req.query;

      let categories;
      let total = null;

      if (page && pageSize) {
        // 分页查询
        const pageNum = parseInt(page);
        const size = parseInt(pageSize);

        categories = await CategoryDao.findWithPagination(pageNum, size, orderBy, order);
        total = await CategoryDao.count();
      } else {
        // 获取所有分类
        categories = await CategoryDao.findAll(orderBy, order);
      }

      const responseData = {
        categories
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
      console.error('获取分类列表错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取分类及其文章数量
   */
  static async getCategoriesWithArticleCount(req, res) {
    try {
      const categories = await CategoryDao.findWithArticleCount();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('获取分类文章统计错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 更新分类排序
   */
  static async updateCategorySort(req, res) {
    try {
      const { sortData } = req.body;

      if (!Array.isArray(sortData) || sortData.length === 0) {
        return res.status(400).json({
          success: false,
          message: '排序数据格式错误'
        });
      }

      // 验证排序数据格式
      for (const item of sortData) {
        if (!item.id || typeof item.sort_order !== 'number') {
          return res.status(400).json({
            success: false,
            message: '排序数据格式错误，需要包含id和sort_order字段'
          });
        }
      }

      await CategoryDao.updateSort(sortData);

      res.json({
        success: true,
        message: '分类排序更新成功'
      });
    } catch (error) {
      console.error('更新分类排序错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 检查分类别名是否可用
   */
  static async checkSlugAvailability(req, res) {
    try {
      const { slug } = req.params;
      const { excludeId } = req.query;

      const exists = await CategoryDao.isSlugExists(slug, excludeId);

      res.json({
        success: true,
        data: {
          available: !exists,
          slug
        }
      });
    } catch (error) {
      console.error('检查分类别名可用性错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 批量删除分类
   */
  static async batchDeleteCategories(req, res) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要删除的分类ID数组'
        });
      }

      const results = [];
      for (const id of ids) {
        try {
          const result = await CategoryDao.delete(id);
          results.push({ id, success: result.affectedRows > 0 });
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        message: `成功删除 ${successCount} 个分类`,
        data: {
          results,
          successCount,
          totalCount: ids.length
        }
      });
    } catch (error) {
      console.error('批量删除分类错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取所有分类（用于选择器）
   */
  static async getCategoriesForSelect(req, res) {
    try {
      const categories = await CategoryDao.findAll('sort_order', 'ASC');

      // 只返回必要字段
      const selectOptions = categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug
      }));

      res.json({
        success: true,
        data: selectOptions
      });
    } catch (error) {
      console.error('获取分类选择项错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 上传分类图片
   */
  static async uploadCategoryImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的图片文件'
        });
      }

      const { file } = req;
      const { alt_text, description } = req.body;

      // 构建图片URL
      const imageUrl = `/static/image/${file.filename}`;

      // 检查文件名是否已存在于图片表
      const existingImage = await ImageDao.findByFileName(file.filename);
      if (existingImage) {
        // 删除重复的文件
        await fs.unlink(file.path);
        return res.status(400).json({
          success: false,
          message: '该文件名已存在'
        });
      }

      // 将图片信息保存到图片表
      const imageData = {
        file_name: file.filename,
        original_name: file.originalname,
        file_path: file.path,
        file_url: imageUrl,
        file_size: file.size,
        mime_type: file.mimetype,
        alt_text: alt_text || null,
        description: description || null,
        upload_type: 1, // 1-分类图片
        uploader_id: req.user.id
      };

      const imageResult = await ImageDao.create(imageData);

      res.json({
        success: true,
        message: '图片上传成功',
        data: {
          image_id: imageResult.insertId,
          image_url: imageUrl,
          original_name: file.originalname,
          size: file.size
        }
      });
    } catch (error) {
      console.error('上传分类图片错误：', error);
      
      // 如果出错，尝试删除已上传的文件
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('删除上传文件错误：', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 删除分类图片
   */
  static async deleteCategoryImage(req, res) {
    try {
      const { id } = req.params;

      // 验证分类是否存在
      const existingCategory = await CategoryDao.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      // 删除图片字段
      await CategoryDao.update(id, { image_url: null });

      res.json({
        success: true,
        message: '分类图片删除成功'
      });
    } catch (error) {
      console.error('删除分类图片错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

export { CategoryController }; 