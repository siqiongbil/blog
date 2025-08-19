import { MusicDao } from '../dao/index.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * 音乐控制器
 */
class MusicController {
  
  /**
   * 处理音乐数据的URL字段
   * 如果数据库中没有file_url，则自动生成
   */
  static processMusicUrl(music) {
    if (Array.isArray(music)) {
      return music.map(item => ({
        ...item,
        file_url: item.file_url || `/static/music/${item.file_name}`
      }));
    } else {
      return {
        ...music,
        file_url: music.file_url || `/static/music/${music.file_name}`
      };
    }
  }

  /**
   * 处理原始文件名编码
   */
  static processOriginalName(originalName) {
    // 检测是否包含正常的中文字符
    const hasValidChinese = /[\u4e00-\u9fff]/.test(originalName);
    
    if (!hasValidChinese && originalName.includes('�')) {
      // 只有当文件名包含乱码字符且没有正常中文时才尝试编码修复
      try {
        const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
        // 验证转换结果是否包含有效的中文字符
        if (/[\u4e00-\u9fff]/.test(decoded) && !decoded.includes('�')) {
          return decoded;
        }
      } catch (e) {
        console.warn('原始文件名编码修复失败，使用原始名称:', originalName);
      }
    }
    
    return originalName;
  }

  /**
   * 添加音乐
   */
  static async addMusic(req, res) {
    try {
      const { 
        file_name, 
        original_name,
        file_path,
        file_url,
        file_size,
        mime_type,
        duration,
        title,
        artist,
        album,
        genre,
        year,
        cover_url,
        description,
        tags,
        uploader_id,
        status = 1 
      } = req.body;

      // 基本验证
      if (!file_name || !file_path) {
        return res.status(400).json({
          success: false,
          message: '文件名和文件路径不能为空'
        });
      }

      // 检查文件名是否已存在
      const existingFile = await MusicDao.findByFileName(file_name);
      if (existingFile) {
        return res.status(400).json({
          success: false,
          message: '该文件名已存在'
        });
      }

      // 检查文件路径是否已存在
      const existingPath = await MusicDao.findByFilePath(file_path);
      if (existingPath) {
        return res.status(400).json({
          success: false,
          message: '该文件路径已存在'
        });
      }

      // 验证文件是否实际存在（可选）
      try {
        await fs.access(file_path);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '指定的文件不存在'
        });
      }

      // 添加音乐记录
      const musicData = {
        file_name,
        original_name: original_name || file_name,
        file_path,
        file_url: file_url || `/static/music/${file_name}`,
        file_size,
        mime_type,
        duration,
        title,
        artist,
        album,
        genre,
        year,
        cover_url,
        description,
        tags,
        uploader_id: uploader_id || req.user?.id,
        status
      };

      const result = await MusicDao.create(musicData);

      // 获取创建的音乐记录
      const createdMusic = await MusicDao.findById(result.insertId, true);

      res.status(201).json({
        success: true,
        message: '音乐添加成功',
        data: createdMusic
      });
    } catch (error) {
      console.error('添加音乐错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取音乐信息
   */
  static async getMusicInfo(req, res) {
    try {
      const { id } = req.params;

      // 包含上传者信息
      const music = await MusicDao.findById(id, true);
      if (!music) {
        return res.status(404).json({
          success: false,
          message: '音乐不存在'
        });
      }

      // 增加播放次数
      await MusicDao.incrementPlayCount(id);

      res.json({
        success: true,
        data: MusicController.processMusicUrl(music)
      });
    } catch (error) {
      console.error('获取音乐信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 更新音乐信息
   */
  static async updateMusic(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 验证音乐是否存在
      const existingMusic = await MusicDao.findById(id);
      if (!existingMusic) {
        return res.status(404).json({
          success: false,
          message: '音乐不存在'
        });
      }

      // 如果要更新文件名，检查是否重复
      if (updateData.file_name && updateData.file_name !== existingMusic.file_name) {
        const fileNameExists = await MusicDao.isFileNameExists(updateData.file_name, id);
        if (fileNameExists) {
          return res.status(400).json({
            success: false,
            message: '该文件名已存在'
          });
        }
      }

      // 如果要更新文件路径，检查是否重复
      if (updateData.file_path && updateData.file_path !== existingMusic.file_path) {
        const filePathExists = await MusicDao.isFilePathExists(updateData.file_path, id);
        if (filePathExists) {
          return res.status(400).json({
            success: false,
            message: '该文件路径已存在'
          });
        }

        // 验证新文件是否存在
        try {
          await fs.access(updateData.file_path);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: '指定的文件不存在'
          });
        }
      }

      // 移除不应该被更新的字段
      delete updateData.id;
      delete updateData.created_at;

      const result = await MusicDao.update(id, updateData);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '音乐不存在或未进行任何更新'
        });
      }

      res.json({
        success: true,
        message: '音乐信息更新成功'
      });
    } catch (error) {
      console.error('更新音乐信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 删除音乐
   */
  static async deleteMusic(req, res) {
    try {
      const { id } = req.params;

      // 验证音乐是否存在
      const existingMusic = await MusicDao.findById(id);
      if (!existingMusic) {
        return res.status(404).json({
          success: false,
          message: '音乐不存在'
        });
      }

      const result = await MusicDao.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '音乐不存在'
        });
      }

      res.json({
        success: true,
        message: '音乐删除成功'
      });
    } catch (error) {
      console.error('删除音乐错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取音乐列表
   */
  static async getMusicList(req, res) {
    try {
      const {
        page,
        pageSize,
        status,
        keyword,
        artist,
        album,
        genre,
        uploader_id,
        orderBy = 'created_at',
        order = 'DESC'
      } = req.query;

      let music;
      let total = null;

      const options = {
        status: status ? parseInt(status) : null,
        keyword,
        artist,
        album,
        genre,
        uploader_id: uploader_id ? parseInt(uploader_id) : null,
        orderBy,
        order
      };

      if (page && pageSize) {
        // 分页查询
        const pageNum = parseInt(page);
        const size = parseInt(pageSize);

        options.page = pageNum;
        options.pageSize = size;

        music = await MusicDao.findWithPagination(options);
        total = await MusicDao.count(options);
      } else {
        // 获取所有音乐
        music = await MusicDao.findAll(orderBy, order);
      }

      const responseData = {
        music: MusicController.processMusicUrl(music)
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
      console.error('获取音乐列表错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取启用的音乐列表
   */
  static async getEnabledMusic(req, res) {
    try {
      const music = await MusicDao.findEnabled();

      res.json({
        success: true,
        data: MusicController.processMusicUrl(music)
      });
    } catch (error) {
      console.error('获取启用音乐列表错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 随机获取音乐
   */
  static async getRandomMusic(req, res) {
    try {
      const { limit = 1, status = 1 } = req.query;

      const music = await MusicDao.findRandom(parseInt(limit), parseInt(status));

      res.json({
        success: true,
        data: MusicController.processMusicUrl(music)
      });
    } catch (error) {
      console.error('获取随机音乐错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 切换音乐状态
   */
  static async toggleMusicStatus(req, res) {
    try {
      const { id } = req.params;

      // 验证音乐是否存在
      const existingMusic = await MusicDao.findById(id);
      if (!existingMusic) {
        return res.status(404).json({
          success: false,
          message: '音乐不存在'
        });
      }

      const result = await MusicDao.toggleStatus(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '音乐不存在'
        });
      }

      const newStatus = existingMusic.status === 1 ? 0 : 1;

      res.json({
        success: true,
        message: '音乐状态切换成功',
        data: {
          id,
          status: newStatus
        }
      });
    } catch (error) {
      console.error('切换音乐状态错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 批量更新音乐状态
   */
  static async batchUpdateStatus(req, res) {
    try {
      const { ids, status } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要更新的音乐ID数组'
        });
      }

      if (![0, 1].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '状态值无效，只能是0或1'
        });
      }

      const result = await MusicDao.batchUpdateStatus(ids, status);

      res.json({
        success: true,
        message: `成功更新 ${result.affectedRows} 个音乐文件状态`,
        data: {
          affectedCount: result.affectedRows,
          totalCount: ids.length
        }
      });
    } catch (error) {
      console.error('批量更新音乐状态错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取音乐统计信息
   */
  static async getMusicStatistics(req, res) {
    try {
      const statistics = await MusicDao.getStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('获取音乐统计错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 扫描音乐目录并批量导入
   */
  static async scanAndImportMusic(req, res) {
    try {
      const { musicDir = './music' } = req.body;

      // 验证目录是否存在
      try {
        const stats = await fs.stat(musicDir);
        if (!stats.isDirectory()) {
          return res.status(400).json({
            success: false,
            message: '指定路径不是目录'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '指定的目录不存在'
        });
      }

      // 读取目录下的音乐文件
      const files = await fs.readdir(musicDir);
      const musicFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext);
      });

      const results = [];
      let successCount = 0;
      let skipCount = 0;

      for (const file of musicFiles) {
        const filePath = path.join(musicDir, file);
        
        try {
          // 检查文件是否已存在
          const existingFile = await MusicDao.findByFileName(file);
          if (existingFile) {
            results.push({ file, status: 'skipped', reason: '文件已存在' });
            skipCount++;
            continue;
          }

          // 添加音乐记录
          const result = await MusicDao.create({
            file_name: file,
            file_path: filePath,
            status: 1
          });

          results.push({ 
            file, 
            status: 'success', 
            id: result.insertId 
          });
          successCount++;
        } catch (error) {
          results.push({ 
            file, 
            status: 'error', 
            reason: error.message 
          });
        }
      }

      res.json({
        success: true,
        message: `扫描完成，成功导入 ${successCount} 个文件，跳过 ${skipCount} 个文件`,
        data: {
          totalFiles: musicFiles.length,
          successCount,
          skipCount,
          errorCount: musicFiles.length - successCount - skipCount,
          results
        }
      });
    } catch (error) {
      console.error('扫描导入音乐错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 验证音乐文件是否存在
   */
  static async validateMusicFile(req, res) {
    try {
      const { id } = req.params;

      const music = await MusicDao.findById(id);
      if (!music) {
        return res.status(404).json({
          success: false,
          message: '音乐记录不存在'
        });
      }

      let fileExists = false;
      try {
        await fs.access(music.file_path);
        fileExists = true;
      } catch (error) {
        // 文件不存在
      }

      res.json({
        success: true,
        data: {
          id: music.id,
          file_name: music.file_name,
          file_path: music.file_path,
          file_exists: fileExists
        }
      });
    } catch (error) {
      console.error('验证音乐文件错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 批量验证音乐文件
   */
  static async batchValidateMusicFiles(req, res) {
    try {
      const music = await MusicDao.findAll();
      const results = [];

      for (const item of music) {
        let fileExists = false;
        try {
          await fs.access(item.file_path);
          fileExists = true;
        } catch (error) {
          // 文件不存在
        }

        results.push({
          id: item.id,
          file_name: item.file_name,
          file_path: item.file_path,
          file_exists: fileExists
        });
      }

      const existingCount = results.filter(r => r.file_exists).length;
      const missingCount = results.filter(r => !r.file_exists).length;

      res.json({
        success: true,
        message: `验证完成，${existingCount} 个文件存在，${missingCount} 个文件缺失`,
        data: {
          total: results.length,
          existing: existingCount,
          missing: missingCount,
          results
        }
      });
    } catch (error) {
      console.error('批量验证音乐文件错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 上传单个音乐文件
   */
  static async uploadSingleMusic(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的音乐文件'
        });
      }

      const { file } = req;
      const file_name = file.filename;
      const file_path = file.path;

      // 从请求体中获取可选的元数据字段
      const {
        title,
        artist,
        album,
        genre,
        year,
        cover_url,
        description,
        tags
      } = req.body;

      // 检查文件名是否已存在于数据库
      const existingFile = await MusicDao.findByFileName(file_name);
      if (existingFile) {
        // 如果数据库中已存在，删除刚上传的文件
        await fs.unlink(file_path);
        return res.status(400).json({
          success: false,
          message: '该文件名已存在'
        });
      }

      // 检查文件路径是否已存在于数据库
      const existingPath = await MusicDao.findByFilePath(file_path);
      if (existingPath) {
        // 如果数据库中已存在，删除刚上传的文件
        await fs.unlink(file_path);
        return res.status(400).json({
          success: false,
          message: '该文件路径已存在'
        });
      }

      // 构造完整的音乐数据
      const musicData = {
        file_name,
        original_name: MusicController.processOriginalName(file.originalname),
        file_path,
        file_url: `/static/music/${file_name}`,
        file_size: file.size,
        mime_type: file.mimetype,
        duration: null, // 需要音频处理库来获取，暂时设为null
        title: title || null,
        artist: artist || null,
        album: album || null,
        genre: genre || null,
        year: year ? parseInt(year) : null,
        cover_url: cover_url || null,
        description: description || null,
        tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : null,
        uploader_id: req.user?.id || null,
        status: 1 // 默认启用
      };

      // 添加音乐记录到数据库
      const result = await MusicDao.create(musicData);

      // 获取完整的音乐记录（包含上传者信息）
      const createdMusic = await MusicDao.findById(result.insertId, true);

      res.status(201).json({
        success: true,
        message: '音乐文件上传成功',
        data: MusicController.processMusicUrl(createdMusic)
      });
    } catch (error) {
      console.error('上传音乐文件错误：', error);
      
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
   * 批量上传音乐文件
   */
  static async uploadMultipleMusic(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的音乐文件'
        });
      }

      const uploadResults = [];
      const errorResults = [];

      for (const file of req.files) {
        try {
          const file_name = file.filename;
          const file_path = file.path;

          // 检查文件名是否已存在于数据库
          const existingFile = await MusicDao.findByFileName(file_name);
          if (existingFile) {
            // 删除重复的文件
            await fs.unlink(file_path);
            errorResults.push({
              original_name: MusicController.processOriginalName(file.originalname),
              error: '该文件名已存在'
            });
            continue;
          }

          // 检查文件路径是否已存在于数据库
          const existingPath = await MusicDao.findByFilePath(file_path);
          if (existingPath) {
            // 删除重复的文件
            await fs.unlink(file_path);
            errorResults.push({
              original_name: MusicController.processOriginalName(file.originalname),
              error: '该文件路径已存在'
            });
            continue;
          }

          // 构造完整的音乐数据
          const musicData = {
            file_name,
            original_name: MusicController.processOriginalName(file.originalname),
            file_path,
            file_url: `/static/music/${file_name}`,
            file_size: file.size,
            mime_type: file.mimetype,
            duration: null, // 需要音频处理库来获取，暂时设为null
            title: null, // 批量上传时不设置元数据，后续可手动编辑
            artist: null,
            album: null,
            genre: null,
            year: null,
            cover_url: null,
            description: null,
            tags: null,
            uploader_id: req.user?.id || null,
            status: 1 // 默认启用
          };

          // 添加音乐记录到数据库
          const result = await MusicDao.create(musicData);

          // 获取完整的音乐记录
          const createdMusic = await MusicDao.findById(result.insertId, true);
          uploadResults.push(createdMusic);

        } catch (error) {
          console.error('处理文件错误：', error);
          
          // 删除处理失败的文件
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('删除文件错误：', unlinkError);
          }

          errorResults.push({
            original_name: MusicController.processOriginalName(file.originalname),
            error: '处理文件时发生错误'
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `批量上传完成。成功：${uploadResults.length}个，失败：${errorResults.length}个`,
        data: {
          successful: MusicController.processMusicUrl(uploadResults),
          failed: errorResults,
          total: req.files.length,
          successCount: uploadResults.length,
          failureCount: errorResults.length
        }
      });
    } catch (error) {
      console.error('批量上传音乐文件错误：', error);
      
      // 如果出错，尝试删除所有已上传的文件
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('删除上传文件错误：', unlinkError);
          }
        }
      }

      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 刷新音乐表（重新扫描音乐目录并更新数据库）
   */
  static async refreshMusicTable(req, res) {
    try {
      const musicDir = process.env.MUSIC_DIR;
    if (!musicDir) {
      return res.status(500).json({
        success: false,
        message: '音乐目录未配置'
      });
    }
      
      // 检查音乐目录是否存在
      try {
        await fs.access(musicDir);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '音乐目录不存在'
        });
      }

      // 获取音乐文件扩展名
      const allowedExtensions = process.env.MUSIC_EXTENSIONS 
      ? process.env.MUSIC_EXTENSIONS.split(',')
      : ['.mp3', '.wav', '.flac', '.m4a', '.aac'];
      
      // 扫描目录中的所有音乐文件
      const files = await fs.readdir(musicDir);
      const musicFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return allowedExtensions.includes(ext);
      });

      // 获取数据库中现有的音乐记录
      const existingMusic = await MusicDao.findAll();
      const existingPaths = new Set(existingMusic.map(music => music.file_path));

      const addedFiles = [];
      const skippedFiles = [];

      // 添加新发现的音乐文件
      for (const fileName of musicFiles) {
        const filePath = path.join(musicDir, fileName);
        
        if (!existingPaths.has(filePath)) {
          try {
            // 检查文件名是否已存在
            const existingFile = await MusicDao.findByFileName(fileName);
            if (!existingFile) {
              const result = await MusicDao.create({
                file_name: fileName,
                file_path: filePath,
                status: 1
              });
              
              addedFiles.push({
                id: result.insertId,
                file_name: fileName,
                file_path: filePath
              });
            } else {
              skippedFiles.push({
                file_name: fileName,
                reason: '文件名已存在'
              });
            }
          } catch (error) {
            console.error('添加音乐文件错误：', error);
            skippedFiles.push({
              file_name: fileName,
              reason: '添加失败'
            });
          }
        } else {
          skippedFiles.push({
            file_name: fileName,
            reason: '文件已存在于数据库'
          });
        }
      }

      res.json({
        success: true,
        message: '音乐表刷新完成',
        data: {
          scannedFiles: musicFiles.length,
          addedFiles: addedFiles.length,
          skippedFiles: skippedFiles.length,
          added: MusicController.processMusicUrl(addedFiles),
          skipped: skippedFiles
        }
      });
    } catch (error) {
      console.error('刷新音乐表错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据艺术家获取音乐
   */
  static async getMusicByArtist(req, res) {
    try {
      const { artist } = req.params;
      const { limit = 10 } = req.query;

      const music = await MusicDao.findByArtist(artist, parseInt(limit));

      res.json({
        success: true,
        data: MusicController.processMusicUrl(music)
      });
    } catch (error) {
      console.error('根据艺术家获取音乐错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据专辑获取音乐
   */
  static async getMusicByAlbum(req, res) {
    try {
      const { album } = req.params;
      const { limit = 10 } = req.query;

      const music = await MusicDao.findByAlbum(album, parseInt(limit));

      res.json({
        success: true,
        data: MusicController.processMusicUrl(music)
      });
    } catch (error) {
      console.error('根据专辑获取音乐错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据流派获取音乐
   */
  static async getMusicByGenre(req, res) {
    try {
      const { genre } = req.params;
      const { limit = 10 } = req.query;

      const music = await MusicDao.findByGenre(genre, parseInt(limit));

      res.json({
        success: true,
        data: MusicController.processMusicUrl(music)
      });
    } catch (error) {
      console.error('根据流派获取音乐错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取最受欢迎的音乐
   */
  static async getMostPlayedMusic(req, res) {
    try {
      const { limit = 10 } = req.query;

      const music = await MusicDao.findMostPlayed(parseInt(limit));

      res.json({
        success: true,
        data: MusicController.processMusicUrl(music)
      });
    } catch (error) {
      console.error('获取最受欢迎音乐错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据上传者获取音乐
   */
  static async getMusicByUploader(req, res) {
    try {
      const { uploaderId } = req.params;
      const { page = 1, pageSize = 10 } = req.query;

      const music = await MusicDao.findByUploader(
        parseInt(uploaderId), 
        parseInt(page), 
        parseInt(pageSize)
      );

      res.json({
        success: true,
        data: MusicController.processMusicUrl(music)
      });
    } catch (error) {
      console.error('根据上传者获取音乐错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

export { MusicController }; 