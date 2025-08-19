import fs from 'fs/promises';
import path from 'path';
import { query } from '../config/db.js';

// 获取音乐文件信息
async function getMusicFiles() {
  const musicDir = path.resolve('music');
  try {
    const files = await fs.readdir(musicDir);
    const musicFiles = [];
    
    for (const file of files) {
      const filePath = path.join(musicDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile() && /\.(mp3|wav|flac)$/i.test(file)) {
        musicFiles.push({
          file_name: file,
          file_path: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
          status: 1
        });
      }
    }
    
    return musicFiles;
  } catch (error) {
    console.error('读取音乐文件失败：', error);
    throw error;
  }
}

// 导入音乐文件到数据库
export async function importMusicFiles() {
  try {
    // 检查music表是否存在
    const [tables] = await query('SHOW TABLES LIKE "music"');
    if (tables.length === 0) {
      // 创建music表
      await query(`
        CREATE TABLE music (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          size BIGINT NOT NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          created_at_db TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('创建music表成功');
    }

    // 获取音乐文件
    const musicFiles = await getMusicFiles();
    
    // 导入到数据库
    for (const file of musicFiles) {
      // 检查文件是否已存在
      const existing = await query(
        'SELECT id FROM music WHERE file_name = ?',
        [file.file_name]
      );
      
      if (existing.length === 0) {
        // 插入新记录
        await query(
          `INSERT INTO music (file_name, file_path, status)
           VALUES (?, ?, ?)`,
          [
            file.file_name,
            file.file_path,
            file.status
          ]
        );
        console.log(`导入音乐文件成功：${file.file_name}`);
      } else {
        console.log(`音乐文件已存在：${file.file_name}`);
      }
    }
    
    console.log('音乐文件导入完成');
  } catch (error) {
    console.error('导入音乐文件失败：', error);
    throw error;
  }
} 