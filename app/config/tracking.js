/**
 * 访问记录跟踪配置
 */

// 需要跳过访问记录的域名配置
export const SKIP_TRACKING_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'admin.example.com',    // 管理后台域名
  'preview.example.com',  // 预览域名
  'test.example.com',     // 测试环境域名
  // 可以根据需要添加更多域名
];

// 需要跳过访问记录的User-Agent模式
export const SKIP_TRACKING_USER_AGENTS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /postman/i,
  /insomnia/i,
  /httpie/i,
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i
];

// 需要跳过访问记录的IP地址范围
export const SKIP_TRACKING_IPS = [
  '127.0.0.1',
  '::1',
  // 可以添加内网IP范围
  // '192.168.',
  // '10.',
  // '172.16.',
];