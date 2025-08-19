import { FileDao } from '../dao/index.js';
import fs from 'fs';
import path from 'path';

/**
 * 文件管理控制器
 */
class FileController {
  
  /**
   * 添加文件URL前缀的辅助方法
   */
  addFileUrl(file) {
    if (!file) return file;
    
    return {
      ...file,
      file_url: `/static/files/${file.file_name}`
    };
  }

  /**
   * 上传文件
   */
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的文件'
        });
      }

      const file = req.file;
      const {
        file_type = 'document', // 文件类型：document, video, audio, archive, other
        description,
        tags,
        related_id
      } = req.body;

      // 处理自定义文件名
      let finalFileName = file.filename;
      const customFileName = req.body.file_name || req.body.fileName;
      
      if (customFileName && customFileName !== file.filename) {
        try {
          // 修复中文文件名编码
          const decodedFileName = Buffer.from(customFileName, 'latin1').toString('utf8');
          const ext = path.extname(file.filename);
          const newFileName = decodedFileName.includes('.') ? decodedFileName : `${decodedFileName}${ext}`;
          
          const oldPath = file.path;
          const newPath = path.join(path.dirname(oldPath), newFileName);
          
          // 重命名文件
          fs.renameSync(oldPath, newPath);
          finalFileName = newFileName;
        } catch (error) {
          console.warn('文件重命名失败，使用原文件名:', error.message);
        }
      }

      // 获取文件的基本信息
      let originalName = file.originalname;
      try {
        originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      } catch (e) {
        // 编码修复失败，使用原始名称
      }

      // 解析tags
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (e) {
          parsedTags = [];
        }
      }

      // 保存文件信息到数据库
      const fileData = {
        file_name: finalFileName,
        original_name: originalName,
        file_path: file.path.replace(/\\/g, '/'),
        file_size: file.size,
        mime_type: file.mimetype,
        file_type,
        description: description || null,
        tags: parsedTags,
        uploader_id: req.user.id,
        related_id: related_id ? parseInt(related_id) : null
      };

      const fileId = await FileDao.create(fileData);
      const savedFile = await FileDao.findById(fileId);

      res.status(201).json({
        success: true,
        message: '文件上传成功',
        data: this.addFileUrl(savedFile)
      });
    } catch (error) {
      console.error('文件上传失败:', error);
      res.status(500).json({
        success: false,
        message: '文件上传失败'
      });
    }
  }

  /**
   * 获取文件列表
   */
  async getFileList(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      
      const filters = {};
      if (req.query.file_type) filters.file_type = req.query.file_type;
      if (req.query.mime_type) filters.mime_type = req.query.mime_type;
      if (req.query.keyword) filters.keyword = req.query.keyword;
      if (req.query.uploader_id) filters.uploader_id = req.query.uploader_id;

      const files = await FileDao.findWithPagination({
        page,
        pageSize,
        orderBy: req.query.orderBy || 'created_at',
        order: req.query.order || 'DESC',
        ...filters
      });
      
      const total = await FileDao.count(filters);
      
      // 添加文件URL
      const filesWithUrl = files.map(file => this.addFileUrl(file));

      res.json({
        success: true,
        data: {
          files: filesWithUrl,
          pagination: {
            current: page,
            pageSize,
            total,
            pages: Math.ceil(total / pageSize)
          }
        }
      });
    } catch (error) {
      console.error('获取文件列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取文件列表失败'
      });
    }
  }

  /**
   * 获取文件详情
   */
  async getFileInfo(req, res) {
    try {
      const { id } = req.params;
      const file = await FileDao.findById(id);

      if (!file) {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        });
      }

      res.json({
        success: true,
        data: this.addFileUrl(file)
      });
    } catch (error) {
      console.error('获取文件信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取文件信息失败'
      });
    }
  }

  /**
   * 更新文件信息
   */
  async updateFile(req, res) {
    try {
      const { id } = req.params;
      const {
        file_name,
        description,
        tags,
        file_type,
        related_id
      } = req.body;

      // 检查文件是否存在
      const existingFile = await FileDao.findById(id);
      if (!existingFile) {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        });
      }

      // 解析tags
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (e) {
          parsedTags = [];
        }
      }

      const updateData = {
        file_name: file_name || existingFile.file_name,
        description,
        tags: parsedTags,
        file_type: file_type || existingFile.file_type,
        related_id: related_id ? parseInt(related_id) : null
      };

      const result = await FileDao.update(id, updateData);
      
      if (result.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: '更新文件信息失败'
        });
      }

      // 返回更新后的文件信息
      const updatedFile = await FileDao.findById(id);
      res.json({
        success: true,
        message: '文件信息更新成功',
        data: this.addFileUrl(updatedFile)
      });
    } catch (error) {
      console.error('更新文件信息失败:', error);
      res.status(500).json({
        success: false,
        message: '更新文件信息失败'
      });
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(req, res) {
    try {
      const { id } = req.params;

      // 检查文件是否存在
      const file = await FileDao.findById(id);
      if (!file) {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        });
      }

      // 软删除数据库记录
      const result = await FileDao.delete(id);
      
      if (result.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: '删除文件失败'
        });
      }

      // 可选：删除物理文件
      try {
        if (fs.existsSync(file.file_path)) {
          fs.unlinkSync(file.file_path);
        }
      } catch (error) {
        console.warn('删除物理文件失败:', error.message);
      }

      res.json({
        success: true,
        message: '文件删除成功'
      });
    } catch (error) {
      console.error('删除文件失败:', error);
      res.status(500).json({
        success: false,
        message: '删除文件失败'
      });
    }
  }

  /**
   * 获取文件统计信息
   */
  async getFileStats(req, res) {
    try {
      const stats = await FileDao.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取文件统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取文件统计失败'
      });
    }
  }
}

const fileController = new FileController();
export { fileController as FileController };
export default fileController; 