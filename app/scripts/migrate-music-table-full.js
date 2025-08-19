import { query } from '../config/db.js';

/**
 * Music表结构迁移脚本
 * 从简化版本迁移到完整版本
 */

async function migrateMusicTable() {
  console.log('开始迁移music表结构...');

  try {
    // 检查当前表结构
    console.log('检查当前music表结构...');
    const currentStructure = await query('DESCRIBE music');
    console.log('当前字段：', currentStructure.map(row => row.Field));

    // 需要添加的字段列表
    const fieldsToAdd = [
      {
        name: 'original_name',
        definition: 'VARCHAR(255) COMMENT \'原始文件名\''
      },
      {
        name: 'file_url',
        definition: 'VARCHAR(255) COMMENT \'访问URL\''
      },
      {
        name: 'file_size',
        definition: 'INT UNSIGNED COMMENT \'文件大小（字节）\''
      },
      {
        name: 'mime_type',
        definition: 'VARCHAR(50) COMMENT \'MIME类型\''
      },
      {
        name: 'duration',
        definition: 'DECIMAL(10,2) COMMENT \'音乐时长（秒）\''
      },
      {
        name: 'title',
        definition: 'VARCHAR(255) COMMENT \'音乐标题\''
      },
      {
        name: 'artist',
        definition: 'VARCHAR(255) COMMENT \'艺术家\''
      },
      {
        name: 'album',
        definition: 'VARCHAR(255) COMMENT \'专辑名称\''
      },
      {
        name: 'genre',
        definition: 'VARCHAR(100) COMMENT \'音乐类型\''
      },
      {
        name: 'year',
        definition: 'INT COMMENT \'发行年份\''
      },
      {
        name: 'cover_url',
        definition: 'VARCHAR(255) COMMENT \'专辑封面URL\''
      },
      {
        name: 'description',
        definition: 'TEXT COMMENT \'音乐描述\''
      },
      {
        name: 'tags',
        definition: 'JSON COMMENT \'音乐标签\''
      },
      {
        name: 'play_count',
        definition: 'INT UNSIGNED DEFAULT 0 COMMENT \'播放次数\''
      },
      {
        name: 'uploader_id',
        definition: 'BIGINT UNSIGNED COMMENT \'上传者ID\''
      }
    ];

    // 检查哪些字段需要添加
    const existingFields = currentStructure.map(row => row.Field);
    const fieldsToAddFiltered = fieldsToAdd.filter(field => !existingFields.includes(field.name));

    if (fieldsToAddFiltered.length === 0) {
      console.log('所有字段都已存在，无需迁移');
      return;
    }

    console.log(`需要添加的字段：${fieldsToAddFiltered.map(f => f.name).join(', ')}`);

    // 逐个添加字段
    for (const field of fieldsToAddFiltered) {
      try {
        console.log(`添加字段：${field.name}`);
        await query(`ALTER TABLE music ADD COLUMN ${field.name} ${field.definition}`);
        console.log(`✓ 成功添加字段：${field.name}`);
      } catch (error) {
        console.error(`✗ 添加字段失败：${field.name}`, error.message);
      }
    }

    // 添加索引
    console.log('添加索引...');
    const indexesToAdd = [
      'CREATE INDEX idx_uploader_id ON music(uploader_id)',
      'CREATE INDEX idx_title ON music(title)',
      'CREATE INDEX idx_artist ON music(artist)',
      'CREATE INDEX idx_album ON music(album)',
      'CREATE INDEX idx_play_count ON music(play_count)'
    ];

    for (const indexSql of indexesToAdd) {
      try {
        await query(indexSql);
        console.log(`✓ 索引创建成功：${indexSql.split(' ')[2]}`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`索引已存在：${indexSql.split(' ')[2]}`);
        } else {
          console.error(`索引创建失败：`, error.message);
        }
      }
    }

    // 添加外键约束（如果users表存在）
    try {
      console.log('添加外键约束...');
      await query('ALTER TABLE music ADD CONSTRAINT fk_music_uploader FOREIGN KEY (uploader_id) REFERENCES users(id)');
      console.log('✓ 外键约束添加成功');
    } catch (error) {
      if (error.code === 'ER_FK_CANNOT_DELETE_PARENT') {
        console.log('外键约束已存在');
      } else {
        console.error('外键约束添加失败：', error.message);
      }
    }

    console.log('Music表迁移完成！');

    // 显示迁移后的表结构
    console.log('\n迁移后的表结构：');
    const newStructure = await query('DESCRIBE music');
    console.table(newStructure);

  } catch (error) {
    console.error('迁移失败：', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateMusicTable()
    .then(() => {
      console.log('迁移完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败：', error);
      process.exit(1);
    });
}

export { migrateMusicTable }; 