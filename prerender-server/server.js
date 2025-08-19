const prerender = require('prerender');

const server = prerender({
  port: process.env.PRERENDER_PORT || 3000,
  chromeFlags: [
    '--no-sandbox',
    '--headless',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-domain-reliability',
    '--disable-component-extensions-with-background-pages',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--disable-translate',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--safebrowsing-disable-auto-update',
    '--ignore-certificate-errors',
    '--ignore-ssl-errors',
    '--ignore-certificate-errors-spki-list',
    '--remote-debugging-port=9222',
    '--remote-debugging-address=0.0.0.0',
    '--disable-setuid-sandbox',
    '--disable-background-networking',
    '--metrics-recording-only',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-features=AudioServiceOutOfProcess',
    '--no-default-browser-check',
    '--no-pings',
    '--password-store=basic',
    '--use-mock-keychain',
    '--user-agent=Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
  ],
  chromeLocation: process.env.CHROME_BIN || '/usr/bin/chromium-browser',
  logRequests: true,
  pageLoadTimeout: 30000,
  waitAfterLastRequest: 2000,
  pageDoneCheckTimeout: 1000,
  pageDoneCheckInterval: 100
});

// 添加插件来处理状态码
server.use((req, res, next) => {
  // 等待页面渲染完成后检查状态码
  req.prerender.page.evaluate(() => {
    return window.__PRERENDER_STATUS_CODE || 200;
  }).then((statusCode) => {
    if (statusCode && statusCode !== 200) {
      console.log(`Setting status code to ${statusCode} for ${req.prerender.url}`);
      req.prerender.statusCode = statusCode;
    }
    next();
  }).catch((error) => {
    console.error('Error checking status code:', error);
    next();
  });
});

server.start();
