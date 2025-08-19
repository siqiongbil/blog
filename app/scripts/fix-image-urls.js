import { query } from '../config/db.js';

/**
 * 修复图片URL中的重复扩展名问题
 */
async function fixImageUrls() {
  try {
    console.log('🔍 开始检查图片URL...');
    
    // 获取所有分类
    const categories = await query('SELECT id, name, image_url FROM categories WHERE image_url IS NOT NULL');
    
    console.log(`📊 找到 ${categories.length} 个有图片的分类`);
    
    let fixedCount = 0;
    
    for (const category of categories) {
      const originalUrl = category.image_url;
      
      if (!originalUrl) continue;
      
      // 检查是否有重复扩展名
      const urlParts = originalUrl.split('.');
      if (urlParts.length > 2) {
        // 检查最后两个部分是否相同
        const lastPart = urlParts[urlParts.length - 1];
        const secondLastPart = urlParts[urlParts.length - 2];
        
        if (lastPart === secondLastPart) {
          // 移除重复的扩展名
          const fixedUrl = urlParts.slice(0, -1).join('.');
          
          console.log(`🔧 修复分类 "${category.name}" 的图片URL:`);
          console.log(`   原URL: ${originalUrl}`);
          console.log(`   新URL: ${fixedUrl}`);
          
          // 更新数据库
          await query('UPDATE categories SET image_url = ? WHERE id = ?', [fixedUrl, category.id]);
          fixedCount++;
        }
      }
    }
    
    console.log(`✅ 修复完成！共修复了 ${fixedCount} 个图片URL`);
    
    // 检查图片表中的URL
    console.log('\n🔍 检查图片表中的URL...');
    const images = await query('SELECT id, file_name, file_url FROM images WHERE file_url IS NOT NULL');
    
    console.log(`📊 找到 ${images.length} 个图片记录`);
    
    let imageFixedCount = 0;
    
    for (const image of images) {
      const originalUrl = image.file_url;
      
      if (!originalUrl) continue;
      
      // 检查是否有重复扩展名
      const urlParts = originalUrl.split('.');
      if (urlParts.length > 2) {
        const lastPart = urlParts[urlParts.length - 1];
        const secondLastPart = urlParts[urlParts.length - 2];
        
        if (lastPart === secondLastPart) {
          const fixedUrl = urlParts.slice(0, -1).join('.');
          
          console.log(`🔧 修复图片 "${image.file_name}" 的URL:`);
          console.log(`   原URL: ${originalUrl}`);
          console.log(`   新URL: ${fixedUrl}`);
          
          await query('UPDATE images SET file_url = ? WHERE id = ?', [fixedUrl, image.id]);
          imageFixedCount++;
        }
      }
    }
    
    console.log(`✅ 图片表修复完成！共修复了 ${imageFixedCount} 个图片URL`);
    
    console.log(`\n🎉 总计修复了 ${fixedCount + imageFixedCount} 个URL`);
    
  } catch (error) {
    console.error('❌ 修复图片URL时出错:', error);
  } finally {
    process.exit(0);
  }
}

// 运行修复脚本
fixImageUrls(); 