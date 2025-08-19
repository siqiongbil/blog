import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT
} = process.env;

async function waitForDatabase() {
  const maxRetries = 60; // 最大重试次数（增加到60次）
  const retryInterval = 2000; // 重试间隔(毫秒)
  
  console.log('⏳ 等待数据库准备就绪...');
  console.log(`📋 连接信息: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
  
  // 验证环境变量
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_PORT) {
    console.error('❌ 数据库环境变量不完整：');
    console.error(`   DB_HOST: ${DB_HOST}`);
    console.error(`   DB_USER: ${DB_USER}`);
    console.error(`   DB_PASSWORD: ${DB_PASSWORD ? '***' : 'undefined'}`);
    console.error(`   DB_PORT: ${DB_PORT}`);
    throw new Error('数据库环境变量不完整');
  }
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // 首先尝试连接到MySQL服务器（不指定数据库）
      const testConnection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        port: parseInt(DB_PORT),
        connectTimeout: 5000,
        acquireTimeout: 5000
      });
      
      // 测试服务器连接
      await testConnection.execute('SELECT 1');
      
      // 检查数据库是否存在
      try {
        await testConnection.execute(`USE \`${DB_NAME}\``);
        console.log(`✅ 数据库 ${DB_NAME} 连接成功！`);
      } catch (dbError) {
        console.log(`📊 数据库 ${DB_NAME} 不存在，稍后将创建`);
      }
      
      await testConnection.end();
      return true;
      
    } catch (error) {
      console.log(`⏳ 等待数据库... (尝试 ${i + 1}/${maxRetries}) - ${error.code || error.message}`);
      
      if (i === maxRetries - 1) {
        console.error('❌ 数据库连接失败，超过最大重试次数');
        console.error('错误详情：', error.message);
        console.error('请检查：');
        console.error('1. MySQL服务是否已启动');
        console.error('2. 数据库连接参数是否正确');
        console.error('3. 网络连接是否正常');
        process.exit(1);
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
}

// 如果直接运行此脚本
const currentFile = import.meta.url;
const isMainScript = process.argv[1] && currentFile.includes(process.argv[1]);

if (isMainScript) {
  waitForDatabase()
    .then(() => {
      console.log('数据库准备完成，可以启动应用');
      process.exit(0);
    })
    .catch((error) => {
      console.error('等待数据库失败：', error);
      process.exit(1);
    });
}

export { waitForDatabase }; 