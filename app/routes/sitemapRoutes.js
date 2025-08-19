import express from 'express';
import { ArticleDao } from '../dao/articleDao.js';
import { CategoryDao } from '../dao/categoryDao.js';
import { TagDao } from '../dao/tagDao.js';

const router = express.Router();

/**
 * 生成网站地图
 * GET /sitemap.xml
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    // 设置响应头为XML格式
    res.set('Content-Type', 'application/xml');
    
    // 获取网站基础URL，优先使用环境变量，否则使用默认值
    const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    
    // 获取最新已发布的文章（限制1000篇避免文件过大）
    const articles = await ArticleDao.findLatest(1000, 1);
    
    // 获取所有分类
    const categories = await CategoryDao.findAll();
    
    // 获取所有标签
    const tags = await TagDao.findAll();
    
    // 生成当前时间戳
    const now = new Date().toISOString();
    
    // 开始构建XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 首页 -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // 添加文章页面
    articles.forEach(article => {
      const articleUrl = `${baseUrl}/article/${article.id}`;
      const lastmod = new Date(article.updated_at || article.created_at).toISOString();
      
      xml += `  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    // 添加文章列表页
    xml += `  <url>
    <loc>${baseUrl}/posts</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

    // 添加分类页面（使用查询参数格式）
    categories.forEach(category => {
      const categoryUrl = `${baseUrl}/posts?category=${category.id}`;
      
      xml += `  <url>
    <loc>${categoryUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    });

    // 添加标签页面（使用查询参数格式）
    tags.forEach(tag => {
      const tagUrl = `${baseUrl}/posts?tag=${tag.id}`;
      
      xml += `  <url>
    <loc>${tagUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
`;
    });

    // 添加其他静态页面（仅添加真实存在的页面）
    const staticPages = [
      // 注释掉可能不存在的页面，请根据实际情况取消注释
      // { path: '/about', priority: '0.5' },
      // { path: '/contact', priority: '0.5' },
      // { path: '/archive', priority: '0.7' }
    ];

    staticPages.forEach(page => {
      xml += `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // 结束XML
    xml += '</urlset>';

    // 发送XML响应
    res.send(xml);
    
    console.log(`✅ 生成sitemap成功，包含 ${articles.length} 篇文章、${categories.length} 个分类和 ${tags.length} 个标签`);
    
  } catch (error) {
    console.error('生成sitemap失败：', error);
    res.status(500).json({
      success: false,
      message: '生成网站地图失败'
    });
  }
});

export default router; 