import { UserDao } from '../dao/index.js';
import bcrypt from 'bcryptjs';

/**
 * 初始化管理员账户
 */
export async function initAdminUser() {
  try {
    console.log('👤 检查管理员账户...');
    
    // 检查数据库中是否有任何用户
    console.log('📊 查询用户数量...');
    const userCount = await UserDao.getUserCount();
    console.log(`📈 当前用户数量: ${userCount}`);
    
    // 验证环境变量
    console.log(`🔧 环境变量检查:`);
    console.log(`   ADMIN_USERNAME: ${process.env.ADMIN_USERNAME || 'undefined'}`);
    console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'undefined'}`);
    console.log(`   ADMIN_NICKNAME: ${process.env.ADMIN_NICKNAME || 'undefined'}`);
    
    if (userCount === 0) {
      console.log('🆕 数据库中没有用户，正在创建默认管理员账户...');
      
      // 从环境变量获取管理员信息，如果没有则使用默认值
      const adminUsername = process.env.ADMIN_USERNAME || 'yourusername';
      const adminPassword = process.env.ADMIN_PASSWORD || 'yourpassword';
      const adminEmail = process.env.ADMIN_EMAIL || 'youremail@example.com';
      const adminNickname = process.env.ADMIN_NICKNAME || '管理员';
      
      console.log(`📝 管理员信息:`);
      console.log(`   用户名: ${adminUsername}`);
      console.log(`   邮箱: ${adminEmail}`);
      console.log(`   昵称: ${adminNickname}`);
      
      // 密码加密
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
      
      // 创建管理员账户
      const result = await UserDao.create({
        username: adminUsername,
        password: hashedPassword,
        nickname: adminNickname,
        email: adminEmail,
        role: 1, // 管理员角色
        bio: '系统管理员',
        status: 1 // 激活状态
      });
      
      console.log(`✅ 管理员账户创建成功！`);
      console.log(`   用户名: ${adminUsername}`);
      console.log(`   邮箱: ${adminEmail}`);
      console.log(`   昵称: ${adminNickname}`);
      console.log(`   账户ID: ${result.insertId}`);
      console.log(`⚠️  请及时修改默认密码以确保安全！`);
      
    } else {
      console.log(`✅ 数据库中已存在 ${userCount} 个用户，跳过管理员账户创建`);
    }
    
  } catch (error) {
    console.error('❌ 初始化管理员账户失败：', error);
    throw error;
  }
}

/**
 * 重置管理员密码（仅在开发环境使用）
 */
export async function resetAdminPassword() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  生产环境不允许重置管理员密码');
    return;
  }
  
  try {
    console.log('正在重置管理员密码...');
    
    const adminUsername = process.env.ADMIN_USERNAME || 'yourusername';
    const adminPassword = process.env.ADMIN_PASSWORD || 'yourpassword';
    
    // 查找管理员用户
    const adminUser = await UserDao.findByUsername(adminUsername);
    if (!adminUser) {
      console.log('❌ 未找到管理员用户');
      return;
    }
    
    // 密码加密
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    
    // 更新密码
    await UserDao.update(adminUser.id, {
      password: hashedPassword
    });
    
    console.log('✅ 管理员密码重置成功！');
    
  } catch (error) {
    console.error('❌ 重置管理员密码失败：', error);
    throw error;
  }
}