/**
 * IP地理位置服务
 * 使用免费的 ip-api.com API
 */

// 缓存对象，避免重复请求相同IP
const ipCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时缓存

/**
 * 从ip-api.com获取IP地理位置信息
 * @param {string} ip - IP地址
 * @returns {Promise<Object>} 地理位置信息
 */
async function getLocationFromIPAPI(ip) {
  try {
    // 检查缓存
    const cached = ipCache.get(ip);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // 首先尝试 ip-api.com
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,query`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'success') {
          const location = {
            // 基础地理位置信息
            country: data.country || '未知',
            countryCode: data.countryCode || '',
            region: data.regionName || '',
            regionCode: data.region || '',
            city: data.city || '未知',
            zip: data.zip || '',
            
            // 坐标信息
            latitude: data.lat,
            longitude: data.lon,
            
            // 时区信息
            timezone: data.timezone || '',
            
            // 网络信息
            isp: data.isp || '',
            org: data.org || '',
            as: data.as || '',
            
            // 网络类型
            mobile: data.mobile || false,
            proxy: data.proxy || false,
            hosting: data.hosting || false,
            
            // 数据来源
            source: 'ip-api.com'
          };
          
          // 缓存结果
          ipCache.set(ip, {
            data: location,
            timestamp: Date.now()
          });
          
          return location;
        }
      }
    } catch (error) {
      console.warn(`ip-api.com 查询失败，尝试 ipapi.co: ${error.message}`);
    }

    // 备用：尝试 ipapi.co
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.country) {
          const location = {
            // 基础地理位置信息
            country: data.country_name || data.country || '未知',
            countryCode: data.country_code || data.country || '',
            region: data.region || '',
            regionCode: data.region_code || '',
            city: data.city || '未知',
            zip: data.postal || '',
            
            // 坐标信息
            latitude: data.latitude,
            longitude: data.longitude,
            
            // 时区信息
            timezone: data.timezone || '',
            utcOffset: data.utc_offset || '',
            
            // 网络信息
            isp: data.org || '',
            org: data.org || '',
            as: data.asn || '',
            
            // 网络类型
            mobile: false, // ipapi.co 不提供此信息
            proxy: false,  // ipapi.co 不提供此信息
            hosting: false, // ipapi.co 不提供此信息
            
            // 额外信息
            continent: data.continent_code || '',
            currency: data.currency || '',
            languages: data.languages || '',
            
            // 数据来源
            source: 'ipapi.co'
          };
          
          // 缓存结果
          ipCache.set(ip, {
            data: location,
            timestamp: Date.now()
          });
          
          return location;
        }
      }
    } catch (error) {
      console.warn(`ipapi.co 查询也失败: ${error.message}`);
    }

    // 所有API都失败
    console.warn(`IP ${ip} 地理位置查询失败: 所有API都无法访问`);
    return { country: '未知', city: '未知', source: 'fallback' };
  } catch (error) {
    console.error(`获取IP ${ip} 地理位置失败:`, error.message);
    return { country: '未知', city: '未知', source: 'error' };
  }
}

/**
 * 获取IP地理位置信息（带本地规则）
 * @param {string} ip - IP地址
 * @returns {Promise<Object>} 地理位置信息
 */
async function getLocationFromIP(ip) {
  // 本地IP规则
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
    return { country: '中国', city: '本地' };
  }
  
  // 内网IP规则
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { country: '中国', city: '内网' };
  }
  
  // 特殊IP规则
  const specialIPs = {
    '8.8.8.8': { country: '美国', city: 'Google DNS' },
    '1.1.1.1': { country: '美国', city: 'Cloudflare DNS' },
    '114.114.114.114': { country: '中国', city: '114 DNS' },
    '223.5.5.5': { country: '中国', city: '阿里DNS' },
    '119.29.29.29': { country: '中国', city: '腾讯DNS' }
  };
  
  if (specialIPs[ip]) {
    return specialIPs[ip];
  }
  
  // 调用真实API
  return await getLocationFromIPAPI(ip);
}

/**
 * 批量获取IP地理位置信息
 * @param {Array<string>} ips - IP地址数组
 * @returns {Promise<Array>} 地理位置信息数组
 */
async function getBatchLocationFromIPs(ips) {
  const results = [];
  
  for (const ip of ips) {
    try {
      const location = await getLocationFromIP(ip);
      results.push({ ip, ...location });
    } catch (error) {
      console.error(`批量获取IP ${ip} 地理位置失败:`, error.message);
      results.push({ ip, country: '未知', city: '未知' });
    }
  }
  
  return results;
}

/**
 * 清除IP缓存
 * @param {string} ip - 特定IP（可选，不传则清除所有缓存）
 */
function clearIPCache(ip = null) {
  if (ip) {
    ipCache.delete(ip);
  } else {
    ipCache.clear();
  }
}

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计
 */
function getCacheStats() {
  return {
    size: ipCache.size,
    entries: Array.from(ipCache.entries()).map(([ip, data]) => ({
      ip,
      timestamp: data.timestamp,
      age: Date.now() - data.timestamp
    }))
  };
}

export {
  getLocationFromIP,
  getBatchLocationFromIPs,
  clearIPCache,
  getCacheStats
}; 