import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * 文件上传中间件
 */

// 验证文件名安全性
const validateFileName = (fileName) => {
  if (!fileName) {
    throw new Error('文件名不能为空');
  }
  
  // 移除危险字符，但保留中文字符
  const sanitized = fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // 移除Windows不允许的字符和控制字符
    .replace(/\.\./g, '')                   // 移除路径遍历
    .replace(/^\./, '')                     // 移除开头的点
    .replace(/\.$/, '')                     // 移除结尾的点
    .trim();
  
  // 确保文件名不为空且不超过255字节
  if (!sanitized) {
    throw new Error('文件名无效：包含过多非法字符');
  }
  
  // 检查文件名长度（考虑UTF-8编码，中文字符占3字节）
  const byteLength = Buffer.from(sanitized, 'utf8').length;
  if (byteLength > 255) {
    throw new Error('文件名过长：超过255字节限制');
  }
  
  // 检查是否为保留文件名（Windows）
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  const nameWithoutExt = path.parse(sanitized).name.toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    throw new Error('文件名无效：使用了系统保留名称');
  }
  
  return sanitized;
};

// 确保音乐上传目录存在
const ensureMusicUploadDir = () => {
  const uploadDir = process.env.MUSIC_DIR || './music';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// 确保图片上传目录存在
const ensureImageUploadDir = () => {
  const uploadDir = process.env.IMAGE_DIR || './image';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// 确保文件上传目录存在
const ensureFileUploadDir = () => {
  const uploadDir = process.env.FILE_DIR || './files';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// 音乐文件存储配置
const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = ensureMusicUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    try {
      // 处理文件名编码问题
      let originalName = file.originalname;
      
      // 检测是否需要编码修复
      // 如果原始文件名包含正常的中文字符，就不需要转换
      const hasValidChinese = /[\u4e00-\u9fff]/.test(originalName);
      
      if (!hasValidChinese && originalName.includes('')) {
        // 只有当文件名包含乱码字符且没有正常中文时才尝试编码修复
        try {
          const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
          // 验证转换结果是否包含有效的中文字符
          if (/[\u4e00-\u9fff]/.test(decoded) && !decoded.includes('')) {
            originalName = decoded;
          }
        } catch (e) {
          console.warn('文件名编码修复失败，使用原始名称:', originalName);
        }
      }
      
      // 使用前端传递的文件名，如果没有则使用处理后的原始文件名
      let fileName = req.body.file_name || req.body.fileName;
      
      if (!fileName) {
        // 如果前端没有传递文件名，尝试使用原始文件名
        const originalBaseName = path.basename(originalName, path.extname(originalName));
        if (originalBaseName && originalBaseName !== 'undefined' && originalBaseName.trim()) {
          fileName = originalBaseName;
        } else {
          // 生成唯一文件名
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 8);
          fileName = `music_${timestamp}_${randomString}`;
        }
      }
      
      // 验证文件名安全性
      fileName = validateFileName(fileName);
      
      // 确保文件名包含正确的扩展名
      const originalExt = path.extname(originalName).toLowerCase();
      const providedExt = path.extname(fileName).toLowerCase();
      
      if (!providedExt && originalExt) {
        fileName = fileName + originalExt;
      }
      
      // 最终验证生成的文件名
      if (!fileName || fileName.trim() === '') {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        fileName = `music_${timestamp}_${randomString}${originalExt}`;
      }
      
      console.log('音乐文件名处理:', {
        original: file.originalname,
        processed: originalName,
        final: fileName
      });
      
      cb(null, fileName);
    } catch (error) {
      console.error('音乐文件名处理错误:', error);
      // 发生错误时生成安全的默认文件名
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
      const safeName = `music_${timestamp}_${randomString}${ext}`;
      cb(null, safeName);
    }
  }
});

// 图片文件存储配置
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = ensureImageUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    try {
      // 处理文件名编码问题
      let originalName = file.originalname;
      
      // 检测是否需要编码修复
      const hasValidChinese = /[\u4e00-\u9fff]/.test(originalName);
      
      if (!hasValidChinese && originalName.includes('�')) {
        // 只有当文件名包含乱码字符且没有正常中文时才尝试编码修复
        try {
          const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
          if (/[\u4e00-\u9fff]/.test(decoded) && !decoded.includes('�')) {
            originalName = decoded;
          }
        } catch (e) {
          console.warn('图片文件名编码修复失败，使用原始名称:', originalName);
        }
      }
      
      // 图片文件名处理
      let fileName = req.body.file_name || req.body.fileName;
      
      if (!fileName) {
        // 如果前端没有传递文件名，尝试使用原始文件名
        const originalBaseName = path.basename(originalName, path.extname(originalName));
        if (originalBaseName && originalBaseName !== 'undefined') {
          fileName = originalBaseName;
        } else {
          // 生成唯一文件名
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 8);
          fileName = `${timestamp}_${randomString}`;
        }
      }
      
      // 验证文件名安全性
      fileName = validateFileName(fileName);
      
      // 确保文件名包含正确的扩展名
      const originalExt = path.extname(originalName).toLowerCase();
      const providedExt = path.extname(fileName).toLowerCase();
      
      if (!providedExt && originalExt) {
        fileName = fileName + originalExt;
      }
      
              cb(null, fileName);
      } catch (error) {
        cb(error, null);
      }
  }
});

// 通用文件存储配置
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = ensureFileUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    try {
      // 处理文件名编码问题
      let originalName = file.originalname;
      
      // 检测是否需要编码修复
      const hasValidChinese = /[\u4e00-\u9fff]/.test(originalName);
      
      if (!hasValidChinese && originalName.includes('�')) {
        // 只有当文件名包含乱码字符且没有正常中文时才尝试编码修复
        try {
          const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
          if (/[\u4e00-\u9fff]/.test(decoded) && !decoded.includes('�')) {
            originalName = decoded;
          }
        } catch (e) {
          console.warn('通用文件名编码修复失败，使用原始名称:', originalName);
        }
      }
      
      // 使用前端传递的文件名，如果没有则使用处理后的原始文件名
      let fileName = req.body.file_name || req.body.fileName;
      
      if (!fileName) {
        // 如果前端没有传递文件名，尝试使用原始文件名
        const originalBaseName = path.basename(originalName, path.extname(originalName));
        if (originalBaseName && originalBaseName !== 'undefined') {
          fileName = originalBaseName;
        } else {
          // 生成唯一文件名
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 8);
          fileName = `${timestamp}_${randomString}`;
        }
      }
      
      // 验证文件名安全性
      fileName = validateFileName(fileName);
      
      // 确保文件名包含正确的扩展名
      const originalExt = path.extname(originalName).toLowerCase();
      const providedExt = path.extname(fileName).toLowerCase();
      
      if (!providedExt && originalExt) {
        fileName = fileName + originalExt;
      }
      
      cb(null, fileName);
    } catch (error) {
      cb(error, null);
    }
  }
});

// 音乐文件过滤器
const musicFileFilter = (req, file, cb) => {
  const allowedExtensions = (process.env.MUSIC_EXTENSIONS || '.mp3,.wav,.flac,.m4a,.aac').split(',');
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    const error = new Error(`不支持的文件格式。仅支持: ${allowedExtensions.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// 图片文件过滤器
const imageFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    const error = new Error(`不支持的图片格式。仅支持: ${allowedExtensions.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// 音乐文件上传配置
const musicUpload = multer({
  storage: musicStorage,
  fileFilter: musicFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_MUSIC_FILE_SIZE) || 50 * 1024 * 1024, // 默认50MB
    files: 5 // 最多同时上传5个文件
  }
});

// 图片文件上传配置
const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_FILE_SIZE) || 10 * 1024 * 1024, // 默认10MB
    files: 1 // 单个图片上传
  }
});

// 通用文件上传配置
const fileUpload = multer({
  storage: fileStorage,
  // 不设置fileFilter，允许所有文件类型
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 默认100MB
    files: 1 // 单个文件上传
  }
});

/**
 * 单个音乐文件上传
 */
export const uploadSingleMusic = musicUpload.single('music');

/**
 * 多个音乐文件上传
 */
export const uploadMultipleMusic = musicUpload.array('music', 5);

/**
 * 单个图片文件上传
 */
export const uploadSingle = (fieldName = 'image') => imageUpload.single(fieldName);

/**
 * 单个通用文件上传
 */
export const uploadSingleFile = fileUpload.single('file');

/**
 * 上传错误处理中间件
 */
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        // 根据字段名判断文件类型
        let maxSize;
        if (req.file) {
          switch (req.file.fieldname) {
            case 'music':
              maxSize = process.env.MAX_MUSIC_FILE_SIZE || (50 * 1024 * 1024);
              break;
            case 'image':
              maxSize = process.env.MAX_IMAGE_FILE_SIZE || (10 * 1024 * 1024);
              break;
            case 'file':
              maxSize = process.env.MAX_FILE_SIZE || (100 * 1024 * 1024);
              break;
            default:
              maxSize = process.env.MAX_FILE_SIZE || (100 * 1024 * 1024);
          }
        } else {
          maxSize = process.env.MAX_FILE_SIZE || (100 * 1024 * 1024);
        }
        
        return res.status(400).json({
          success: false,
          message: '文件大小超过限制',
          maxSize: maxSize.toString()
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: '上传文件数量超过限制'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: '意外的文件字段'
        });
      default:
        return res.status(400).json({
          success: false,
          message: '文件上传错误'
        });
    }
  }
  
  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  if (error.message === '文件名无效或过长') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
}; 