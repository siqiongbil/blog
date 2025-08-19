import { ImageDao } from '../dao/index.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * 图片控制器
 */
class ImageController {
  /**
   * 上传图片
   */
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的图片文件'
        });
      }

      const { file } = req;
      const { upload_type = 1, related_id, alt_text, description, tags, file_name } = req.body;
      

      
      // 首先修复原始文件名编码
      let correctedOriginalName = file.originalname;
      try {
        correctedOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      } catch (e) {
        console.log('原始文件名编码修复失败');
      }
      
      // 如果用户提供了文件名，重命名文件
      let finalFileName = file.filename;
      let finalFilePath = file.path;
      
      if (file_name && file_name.trim()) {
        try {
          const ext = path.extname(correctedOriginalName);
          const newFileName = file_name.trim() + (ext || '.png');
          const newFilePath = path.join(path.dirname(file.path), newFileName);
          
          // 重命名文件
          await fs.rename(file.path, newFilePath);
          
          finalFileName = newFileName;
          finalFilePath = newFilePath;
        } catch (renameError) {
          console.error('❌ 文件重命名失败:', renameError);
          // 继续使用原文件名
        }
      }
      
      // 构建图片数据
      const imageData = {
        file_name: finalFileName,
        original_name: correctedOriginalName, // 使用修复编码后的原始文件名
        file_path: finalFilePath,
        file_url: `/static/image/${finalFileName}`,
        file_size: file.size,
        mime_type: file.mimetype,
        alt_text: alt_text || null,
        description: description || null,
        tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : null,
        upload_type: parseInt(upload_type),
        related_id: related_id ? parseInt(related_id) : null,
        uploader_id: req.user.id
      };

      // 检查文件名是否已存在
      const existingFile = await ImageDao.findByFileName(finalFileName);
      if (existingFile) {
        // 删除重复的文件
        await fs.unlink(finalFilePath);
        return res.status(400).json({
          success: false,
          message: '该文件名已存在'
        });
      }

      // 保存到数据库
      const result = await ImageDao.create(imageData);

      res.status(201).json({
        success: true,
        message: '图片上传成功',
        data: {
          id: result.insertId,
          ...imageData
        }
      });
    } catch (error) {
      console.error('上传图片错误：', error);
      
      // 如果出错，尝试删除已上传的文件
      if (req.file) {
        try {
          // 尝试删除重命名后的文件，如果不存在则删除原文件
          const fileToDelete = finalFilePath || req.file.path;
          await fs.unlink(fileToDelete);
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
   * 获取图片列表
   */
  static async getImageList(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        upload_type,
        uploader_id,
        orderBy = 'created_at',
        order = 'DESC',
        keyword
      } = req.query;

      const params = {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        upload_type: upload_type ? parseInt(upload_type) : undefined,
        uploader_id: uploader_id ? parseInt(uploader_id) : undefined,
        orderBy,
        order,
        keyword
      };

      const [images, total] = await Promise.all([
        ImageDao.findAll(params),
        ImageDao.count(params)
      ]);

      const totalPages = Math.ceil(total / params.pageSize);

      res.json({
        success: true,
        data: {
          images,
          pagination: {
            page: params.page,
            pageSize: params.pageSize,
            total,
            totalPages
          }
        }
      });
    } catch (error) {
      console.error('获取图片列表错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取图片详情
   */
  static async getImageInfo(req, res) {
    try {
      const { id } = req.params;
      const image = await ImageDao.findById(parseInt(id));

      if (!image) {
        return res.status(404).json({
          success: false,
          message: '图片不存在'
        });
      }

      res.json({
        success: true,
        data: image
      });
    } catch (error) {
      console.error('获取图片信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 更新图片信息
   */
  static async updateImage(req, res) {
    try {
      const { id } = req.params;
      const { alt_text, description, tags, upload_type, related_id } = req.body;

      // 验证图片是否存在
      const existingImage = await ImageDao.findById(parseInt(id));
      if (!existingImage) {
        return res.status(404).json({
          success: false,
          message: '图片不存在'
        });
      }

      const updateData = {};
      if (alt_text !== undefined) updateData.alt_text = alt_text;
      if (description !== undefined) updateData.description = description;
      if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
      if (upload_type !== undefined) updateData.upload_type = parseInt(upload_type);
      if (related_id !== undefined) updateData.related_id = related_id ? parseInt(related_id) : null;

      const result = await ImageDao.update(parseInt(id), updateData);

      if (result.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: '更新失败'
        });
      }

      res.json({
        success: true,
        message: '图片信息更新成功'
      });
    } catch (error) {
      console.error('更新图片信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 删除图片
   */
  static async deleteImage(req, res) {
    try {
      const { id } = req.params;
      const { hardDelete = false } = req.query;

      // 验证图片是否存在
      const existingImage = await ImageDao.findById(parseInt(id));
      if (!existingImage) {
        return res.status(404).json({
          success: false,
          message: '图片不存在'
        });
      }

      if (hardDelete === 'true') {
        // 物理删除文件和数据库记录
        try {
          await fs.unlink(existingImage.file_path);
        } catch (fileError) {
          console.error('删除文件失败：', fileError);
        }
        
        await ImageDao.hardDelete(parseInt(id));
      } else {
        // 软删除
        await ImageDao.delete(parseInt(id));
      }

      res.json({
        success: true,
        message: '图片删除成功'
      });
    } catch (error) {
      console.error('删除图片错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据类型和关联ID获取图片
   */
  static async getImagesByTypeAndRelatedId(req, res) {
    try {
      const { upload_type, related_id } = req.params;

      const images = await ImageDao.findByTypeAndRelatedId(
        parseInt(upload_type),
        parseInt(related_id)
      );

      res.json({
        success: true,
        data: images
      });
    } catch (error) {
      console.error('获取关联图片错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取图片统计信息
   */
  static async getImageStatistics(req, res) {
    try {
      const statistics = await ImageDao.getStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('获取图片统计信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 批量更新图片状态
   */
  static async batchUpdateImageStatus(req, res) {
    try {
      const { ids, status } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要更新的图片ID数组'
        });
      }

      if (![0, 1].includes(parseInt(status))) {
        return res.status(400).json({
          success: false,
          message: '状态值无效'
        });
      }

      const result = await ImageDao.batchUpdateStatus(ids, parseInt(status));

      res.json({
        success: true,
        message: `成功更新 ${result.affectedRows} 张图片的状态`,
        data: {
          affectedRows: result.affectedRows
        }
      });
    } catch (error) {
      console.error('批量更新图片状态错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 批量删除图片
   */
  static async batchDeleteImages(req, res) {
    try {
      const { ids, hardDelete = false } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要删除的图片ID数组'
        });
      }

      const results = [];
      for (const id of ids) {
        try {
          const existingImage = await ImageDao.findById(parseInt(id));
          if (!existingImage) {
            results.push({ id, success: false, error: '图片不存在' });
            continue;
          }

          if (hardDelete) {
            // 物理删除文件和数据库记录
            try {
              await fs.unlink(existingImage.file_path);
            } catch (fileError) {
              console.error('删除文件失败：', fileError);
            }
            
            const result = await ImageDao.hardDelete(parseInt(id));
            results.push({ id, success: result.affectedRows > 0 });
          } else {
            // 软删除
            const result = await ImageDao.delete(parseInt(id));
            results.push({ id, success: result.affectedRows > 0 });
          }
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        message: `成功删除 ${successCount} 张图片`,
        data: {
          results,
          successCount,
          totalCount: ids.length
        }
      });
    } catch (error) {
      console.error('批量删除图片错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

export { ImageController }; 