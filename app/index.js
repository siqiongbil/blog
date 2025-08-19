import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, testConnection } from './config/db.js';
import { importMusicFiles } from './utils/musicImporter.js';
import { initAdminUser } from './utils/initAdmin.js';
import { waitForDatabase } from './scripts/wait-for-db.js';
import apiRoutes from './routes/index.js';
import sitemapRoutes from './routes/sitemapRoutes.js';

dotenv.config();

const app = express();

// 配置信任代理（重要：在Nginx反向代理环境下必须设置）
if (process.env.NODE_ENV === 'production') {
  // 生产环境：信任Nginx代理
  app.set('trust proxy', true);
  console.log('🔒 生产环境：已启用信任代理模式');
} else {
  // 开发环境：信任本地代理
  app.set('trust proxy', 'loopback');
  console.log('🔒 开发环境：已启用本地代理信任模式');
}

// 中间件配置
// 生产环境禁用后端CORS，由Nginx处理
if (process.env.NODE_ENV !== 'production') {
  const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: process.env.CORS_CREDENTIALS === 'true' || false,
    methods: process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',') : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS ? process.env.CORS_ALLOWED_HEADERS.split(',') : ['Content-Type', 'Authorization']
  };
  app.use(cors(corsOptions));
  console.log('🔄 开发环境：后端CORS已启用');
} else {
  console.log('🚫 生产环境：CORS由Nginx处理，后端CORS已禁用');
}
app.use(express.json({ 
  limit: process.env.JSON_LIMIT || '10mb' 
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: process.env.URL_ENCODED_LIMIT || '10mb'
}));

// 静态文件服务（用于音乐文件）
const musicDir = process.env.MUSIC_DIR || 'music';
const staticMusicPath = process.env.STATIC_MUSIC_PATH || '/static/music';
app.use(staticMusicPath, express.static(musicDir));

// 静态文件服务（用于图片文件）
const imageDir = process.env.IMAGE_DIR || './image';
const staticImagePath = process.env.STATIC_IMAGE_PATH || '/static/image';
app.use(staticImagePath, express.static(imageDir));

// 静态文件服务（用于通用文件）
const fileDir = process.env.FILE_DIR || './files';
const staticFilePath = process.env.STATIC_FILE_PATH || '/static/files';
app.use(staticFilePath, express.static(fileDir));

// Sitemap路由
app.use('/', sitemapRoutes);

// API路由
app.use('/api', apiRoutes);

// 根路径欢迎信息
app.get('/', (req, res) => {
  res.json({
    message: process.env.SITE_NAME || '欢迎使用个人博客API',
    description: process.env.SITE_DESCRIPTION || '个人博客系统API服务',
    version: process.env.APP_VERSION || '1.0.0',
    author: process.env.SITE_AUTHOR || '博主',
    documentation: '/api/info',
    environment: process.env.NODE_ENV || 'development'
  });
});



// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误：', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误'
  });
});

// 启动服务器配置
const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    console.log('🚀 开始启动博客应用...');
    console.log(`🔧 环境信息:`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   DB_USER: ${process.env.DB_USER}`);
    console.log(`   DB_NAME: ${process.env.DB_NAME}`);
    
    // 等待数据库准备就绪
    console.log('⏳ 等待数据库连接...');
    console.log('💤 等待5秒让MySQL完全启动...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await waitForDatabase();
    
    // 初始化数据库
    console.log('📊 初始化数据库...');
    await initDatabase();
    
    // 测试数据库连接
    console.log('🔗 测试数据库连接...');
    await testConnection();
    
    // 初始化管理员账户
    console.log('👤 检查管理员账户...');
    await initAdminUser();
    
    // 导入音乐文件
    console.log('🎵 导入音乐文件...');
    await importMusicFiles();
    
    // 启动服务器
    app.listen(PORT, HOST, () => {
      console.log(`服务器运行在 http://${HOST}:${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`数据库: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    });
  } catch (error) {
    console.error('服务器启动失败：', error);
    process.exit(1);
  }
}

startServer(); 