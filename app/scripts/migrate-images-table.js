import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createConnection = async () => {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };
  
  console.log('连接配置:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database
  });
  
  return await mysql.createConnection(config);
};

const migrateImagesTable = async () => {
  let connection;
  
  try {
    console.log('🚀 开始迁移图片表...');
    
    connection = await createConnection();
    
    // 创建图片表
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS images (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL COMMENT '文件名',
        original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
        file_path VARCHAR(255) NOT NULL COMMENT '文件路径',
        file_url VARCHAR(255) NOT NULL COMMENT '访问URL',
        file_size INT UNSIGNED NOT NULL COMMENT '文件大小（字节）',
        mime_type VARCHAR(50) NOT NULL COMMENT 'MIME类型',
        width INT UNSIGNED COMMENT '图片宽度（像素）',
        height INT UNSIGNED COMMENT '图片高度（像素）',
        alt_text VARCHAR(255) COMMENT '替代文本',
        description TEXT COMMENT '图片描述',
        tags JSON COMMENT '图片标签，JSON格式：["标签1", "标签2"]',
        upload_type TINYINT NOT NULL DEFAULT 1 COMMENT '上传类型：1-分类图片，2-文章图片，3-用户头像，4-其他',
        related_id BIGINT UNSIGNED COMMENT '关联ID（分类ID、文章ID等）',
        uploader_id BIGINT UNSIGNED NOT NULL COMMENT '上传者ID',
        status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-删除，1-正常',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_file_name (file_name),
        INDEX idx_upload_type (upload_type),
        INDEX idx_related_id (related_id),
        INDEX idx_uploader_id (uploader_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        CONSTRAINT fk_image_uploader FOREIGN KEY (uploader_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图片管理表'
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ 图片表创建成功');
    
    // 检查表是否创建成功
    const [tables] = await connection.execute(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'images'",
      [process.env.DB_NAME]
    );
    
    if (tables.length > 0) {
      console.log('✅ 图片表验证成功');
      
      // 显示表结构
      const [columns] = await connection.execute('DESCRIBE images');
      console.log('📋 图片表结构：');
      columns.forEach(column => {
        console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Comment}`);
      });
    } else {
      throw new Error('图片表创建失败');
    }
    
    console.log('🎉 图片表迁移完成！');
    
  } catch (error) {
    console.error('❌ 图片表迁移失败：', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// 如果是直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateImagesTable()
    .then(() => {
      console.log('✅ 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移脚本执行失败：', error);
      process.exit(1);
    });
}

export { migrateImagesTable }; 