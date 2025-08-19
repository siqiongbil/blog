/**
 * 访问统计相关工具函数
 */

/**
 * 解析User-Agent获取设备类型
 * @param {string} userAgent - User-Agent字符串
 * @returns {number} 设备类型 1-桌面 2-平板 3-手机
 */
function getDeviceType(userAgent) {
  if (!userAgent) return 0;
  
  const ua = userAgent.toLowerCase();
  
  // 手机设备检测
  const mobilePatterns = [
    /android.*mobile/, /iphone/, /ipod/, /blackberry/, /windows phone/,
    /mobile/, /phone/, /android.*(?!.*mobile)/, /webos/
  ];
  
  // 平板设备检测  
  const tabletPatterns = [
    /ipad/, /android(?!.*mobile)/, /tablet/, /kindle/, /silk/, /playbook/
  ];
  
  // 检查是否为平板
  for (let pattern of tabletPatterns) {
    if (pattern.test(ua)) return 2;
  }
  
  // 检查是否为手机
  for (let pattern of mobilePatterns) {
    if (pattern.test(ua)) return 3;
  }
  
  // 默认为桌面设备
  return 1;
}

/**
 * 解析User-Agent获取浏览器信息
 * @param {string} userAgent - User-Agent字符串
 * @returns {string} 浏览器名称
 */
function getBrowser(userAgent) {
  if (!userAgent) return '未知';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('edge')) return 'Microsoft Edge';
  if (ua.includes('opr') || ua.includes('opera')) return 'Opera';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('msie') || ua.includes('trident')) return 'Internet Explorer';
  
  return '其他';
}

/**
 * 解析User-Agent获取操作系统信息
 * @param {string} userAgent - User-Agent字符串
 * @returns {string} 操作系统名称
 */
function getOperatingSystem(userAgent) {
  if (!userAgent) return '未知';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('windows nt 10')) return 'Windows 10';
  if (ua.includes('windows nt 6.3')) return 'Windows 8.1';
  if (ua.includes('windows nt 6.2')) return 'Windows 8';
  if (ua.includes('windows nt 6.1')) return 'Windows 7';
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os x')) return 'macOS';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'iOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('ubuntu')) return 'Ubuntu';
  
  return '其他';
}

/**
 * 获取客户端IP地址
 * @param {Object} req - Express请求对象
 * @returns {string} IP地址
 */
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         '127.0.0.1';
}

/**
 * 生成会话ID
 * @returns {string} 会话ID
 */
function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2);
}

/**
 * 构建访问数据对象
 * @param {Object} req - Express请求对象
 * @param {number} articleId - 文章ID
 * @param {string} articleTitle - 文章标题
 * @param {string} sessionId - 会话ID（可选）
 * @returns {Object} 访问数据对象
 */
function buildVisitData(req, articleId, articleTitle, sessionId = null) {
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers.referer || req.headers.referrer || '';
  const visitorIp = getClientIP(req);
  
  return {
    articleId,
    articleTitle,
    visitorIp,
    userAgent,
    referer,
    deviceType: getDeviceType(userAgent),
    browser: getBrowser(userAgent),
    os: getOperatingSystem(userAgent),
    sessionId: sessionId || generateSessionId()
  };
}

export {
  getDeviceType,
  getBrowser,
  getOperatingSystem,
  getClientIP,
  generateSessionId,
  buildVisitData
};