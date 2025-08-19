/**
 * 音乐表结构迁移脚本
 * 添加缺失的字段以匹配API文档定义
 */

import { pool } from '../config/db.js';

async function migrateMusicTable() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('开始迁移music表结构...');
    
    // 添加缺失的字段
    const alterQueries = [
      // 基本文件信息
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS original_name VARCHAR(255) COMMENT '原始文件名' AFTER file_name`,
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS file_url VARCHAR(255) COMMENT '访问URL' AFTER file_path`,
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS file_size INT UNSIGNED COMMENT '文件大小（字节）' AFTER file_url`,
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS mime_type VARCHAR(50) COMMENT 'MIME类型' AFTER file_size`,
      
      // 音乐元数据
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS duration DECIMAL(10,2) COMMENT '音乐时长（秒）' AFTER mime_type`,
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS title VARCHAR(255) COMMENT '音乐标题' AFTER duration`,
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS artist VARCHAR(255) COMMENT '艺术家' AFTER title`,
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS album VARCHAR(255) COMMENT '专辑名称' AFTER artist`,
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS genre VARCHAR(100) COMMENT '音乐类型' AFTER album`,
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS year INT COMMENT '发行年份' AFTER genre`,
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS cover_url VARCHAR(255) COMMENT '专辑封面URL' AFTER year`,
      
      // 描述和标签
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS description TEXT COMMENT '音乐描述' AFTER cover_url`,
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS tags JSON COMMENT '音乐标签' AFTER description`,
      
      // 统计和用户信息
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS play_count INT UNSIGNED DEFAULT 0 COMMENT '播放次数' AFTER tags`,
      `ALTER TABLE music ADD COLUMN IF NOT EXISTS uploader_id BIGINT UNSIGNED COMMENT '上传者ID' AFTER play_count`,
    ];
    
    // 执行字段添加
    for (const query of alterQueries) {
      try {
        await connection.execute(query);
        console.log('✓ 执行成功:', query.split('ADD COLUMN IF NOT EXISTS')[1]?.split(' COMMENT')[0] || query);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('- 字段已存在，跳过:', query.split('ADD COLUMN IF NOT EXISTS')[1]?.split(' COMMENT')[0] || query);
        } else {
          throw error;
        }
      }
    }
    
    // 添加索引
    const indexQueries = [
      `ALTER TABLE music ADD INDEX IF NOT EXISTS idx_uploader_id (uploader_id)`,
      `ALTER TABLE music ADD INDEX IF NOT EXISTS idx_title (title)`,
      `ALTER TABLE music ADD INDEX IF NOT EXISTS idx_artist (artist)`,
      `ALTER TABLE music ADD INDEX IF NOT EXISTS idx_album (album)`,
      `ALTER TABLE music ADD INDEX IF NOT EXISTS idx_play_count (play_count)`,
    ];
    
    for (const query of indexQueries) {
      try {
        await connection.execute(query);
        console.log('✓ 索引添加成功:', query.split('ADD INDEX IF NOT EXISTS')[1]?.split(' (')[0] || query);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log('- 索引已存在，跳过:', query.split('ADD INDEX IF NOT EXISTS')[1]?.split(' (')[0] || query);
        } else {
          throw error;
        }
      }
    }
    
    // 添加外键约束（如果uploader_id字段存在且users表存在）
    try {
      await connection.execute(`
        ALTER TABLE music 
        ADD CONSTRAINT IF NOT EXISTS fk_music_uploader 
        FOREIGN KEY (uploader_id) REFERENCES users(id)
      `);
      console.log('✓ 外键约束添加成功: fk_music_uploader');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_FK_DUP_NAME') {
        console.log('- 外键约束已存在，跳过');
      } else {
        console.log('⚠ 外键约束添加失败:', error.message);
      }
    }
    
    // 更新现有记录的默认值
    await connection.execute(`
      UPDATE music 
      SET 
        original_name = COALESCE(original_name, file_name),
        file_url = COALESCE(file_url, CONCAT('/static/music/', file_name)),
        play_count = COALESCE(play_count, 0)
      WHERE original_name IS NULL OR file_url IS NULL OR play_count IS NULL
    `);
    
    await connection.commit();
    console.log('🎉 music表迁移完成!');
    
    // 显示更新后的表结构
    const [columns] = await connection.execute('DESCRIBE music');
    console.log('\n📋 更新后的music表结构:');
    columns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'YES' ? '(可空)' : '(必需)'} ${col.Comment ? `// ${col.Comment}` : ''}`);
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ 迁移失败:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateMusicTable()
    .then(() => {
      console.log('迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移脚本执行失败:', error);
      process.exit(1);
    });
}

export default migrateMusicTable; 