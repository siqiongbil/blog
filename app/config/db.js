import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT
} = process.env;

// 验证必需的环境变量
const requiredEnvVars = {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`缺少必需的环境变量: ${key}`);
  }
}

// 创建连接池（用于业务操作）
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: parseInt(DB_PORT),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
  timeout: parseInt(process.env.DB_TIMEOUT) || 60000,
  reconnect: process.env.DB_RECONNECT === 'true' || true,
  charset: process.env.DB_CHARSET || 'utf8mb4'
});

// 检查数据库是否存在，不存在则创建并初始化
export async function initDatabase() {
  // 1. 连接到mysql（不指定数据库）
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: parseInt(DB_PORT)
  });
  // 2. 检查数据库是否存在
  const [rows] = await connection.query('SHOW DATABASES LIKE ?', [DB_NAME]);
  if (rows.length === 0) {
    console.log(`数据库 ${DB_NAME} 不存在，正在创建...`);
    await connection.query(`CREATE DATABASE \`${DB_NAME}\``);
    console.log(`数据库 ${DB_NAME} 创建成功。正在初始化表结构...`);
    // 3. 读取并执行 sql 文件
    const sqlPath = path.resolve(process.env.SQL_DIR || 'sql', process.env.SQL_FILE || 'blog.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf-8');
    // 4. 连接到新数据库，执行SQL
    const dbConn = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: parseInt(DB_PORT)
    });
    // 按分号分割执行（简单处理，假设没有复杂嵌套）
    const statements = sqlContent.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await dbConn.query(stmt);
    }
    await dbConn.end();
    console.log('数据库初始化完成！');
  } else {
    console.log(`数据库 ${DB_NAME} 已存在。`);
  }
  await connection.end();
}

// 测试数据库连接
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功！');
    connection.release();
  } catch (error) {
    console.error('数据库连接失败：', error);
  }
};

// 导出连接池
export { pool };

// 通用查询
export const query = async (sql, params) => {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('SQL 查询错误：', error);
    throw error;
  }
}; 