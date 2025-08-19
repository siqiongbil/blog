import fetch from 'node-fetch';

/**
 * IndexNow API 控制器
 * 处理向搜索引擎提交URL更新的请求
 */
export class IndexNowController {
  
  /**
   * 提交单个URL到IndexNow
   */
  static async submitUrl(req, res) {
    try {
      const { url, apiKey, targetHost } = req.body;

      // 验证必要参数
      if (!url || !apiKey || !targetHost) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：url, apiKey, targetHost'
        });
      }

      // 验证API密钥格式
      if (apiKey.length < 8 || apiKey.length > 128) {
        return res.status(400).json({
          success: false,
          message: 'API密钥长度应在8-128个字符之间'
        });
      }

      if (!/^[a-zA-Z0-9-]+$/.test(apiKey)) {
        return res.status(400).json({
          success: false,
          message: 'API密钥只能包含字母、数字和连字符'
        });
      }

      // 构建完整URL
      const fullUrl = url.startsWith('http') ? url : `https://${targetHost}${url}`;

      // 提交到IndexNow API - 使用GET方式
      const urlParams = new URLSearchParams({
        url: fullUrl,
        key: apiKey
      });
      const indexNowEndpoint = `https://api.indexnow.org/indexnow?${urlParams.toString()}`;
      
      const response = await fetch(indexNowEndpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'Blog-IndexNow-Client/1.0'
        }
      });

      // 检查响应状态
      let result = {
        success: false,
        message: '',
        statusCode: response.status
      };

      if (response.status === 200) {
        result.success = true;
        result.message = 'URL提交成功';
      } else if (response.status === 202) {
        result.success = true;
        result.message = 'URL已接收，正在处理';
      } else if (response.status === 400) {
        result.message = '请求格式错误或无效的URL';
      } else if (response.status === 403) {
        result.message = 'API密钥无效或网站验证失败';
      } else if (response.status === 422) {
        result.message = '请求参数无效';
      } else if (response.status === 429) {
        result.message = '请求过于频繁，请稍后重试';
      } else {
        result.message = `IndexNow服务返回错误状态: ${response.status}`;
      }

      // 尝试获取响应体（可能为空）
      try {
        const responseText = await response.text();
        if (responseText) {
          result.responseData = responseText;
        }
      } catch (err) {
        // 忽略响应体读取错误
      }

      res.json(result);

    } catch (error) {
      console.error('IndexNow submit error:', error);
      res.status(500).json({
        success: false,
        message: '提交失败：' + error.message,
        error: error.message
      });
    }
  }

  /**
   * 批量提交URL到IndexNow
   */
  static async submitUrls(req, res) {
    try {
      const { urls, apiKey, targetHost } = req.body;

      // 验证必要参数
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({
          success: false,
          message: '缺少有效的URL列表'
        });
      }

      if (!apiKey || !targetHost) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：apiKey, targetHost'
        });
      }

      // 验证URL数量限制（IndexNow每次最多10000个URL）
      if (urls.length > 10000) {
        return res.status(400).json({
          success: false,
          message: '单次提交的URL数量不能超过10000个'
        });
      }

      // 验证API密钥格式
      if (apiKey.length < 8 || apiKey.length > 128) {
        return res.status(400).json({
          success: false,
          message: 'API密钥长度应在8-128个字符之间'
        });
      }

      if (!/^[a-zA-Z0-9-]+$/.test(apiKey)) {
        return res.status(400).json({
          success: false,
          message: 'API密钥只能包含字母、数字和连字符'
        });
      }

      // 构建完整URL列表
      const fullUrls = urls.map(url => {
        return url.startsWith('http') ? url : `https://${targetHost}${url}`;
      });

      // 准备提交数据
      const submitData = {
        host: targetHost,
        key: apiKey,
        urlList: fullUrls
      };

      // 提交到IndexNow API - POST方式
      const response = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Host': 'api.indexnow.org',
          'User-Agent': 'Blog-IndexNow-Client/1.0'
        },
        body: JSON.stringify(submitData)
      });

      // 检查响应状态
      let result = {
        success: false,
        message: '',
        statusCode: response.status,
        submittedCount: fullUrls.length
      };

      if (response.status === 200) {
        result.success = true;
        result.message = `成功提交${fullUrls.length}个URL`;
      } else if (response.status === 202) {
        result.success = true;
        result.message = `已接收${fullUrls.length}个URL，正在处理`;
      } else if (response.status === 400) {
        result.message = '请求格式错误或包含无效的URL';
      } else if (response.status === 403) {
        result.message = 'API密钥无效或网站验证失败';
      } else if (response.status === 422) {
        result.message = '请求参数无效';
      } else if (response.status === 429) {
        result.message = '请求过于频繁，请稍后重试';
      } else {
        result.message = `IndexNow服务返回错误状态: ${response.status}`;
      }

      // 尝试获取响应体（可能为空）
      try {
        const responseText = await response.text();
        if (responseText) {
          result.responseData = responseText;
        }
      } catch (err) {
        // 忽略响应体读取错误
      }

      res.json(result);

    } catch (error) {
      console.error('IndexNow batch submit error:', error);
      res.status(500).json({
        success: false,
        message: '批量提交失败：' + error.message,
        error: error.message
      });
    }
  }

  /**
   * 验证密钥文件是否可访问
   */
  static async verifyKeyFile(req, res) {
    try {
      const { apiKey, targetHost } = req.body;

      if (!apiKey || !targetHost) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：apiKey, targetHost'
        });
      }

      // 构建密钥文件URL
      const keyFileUrl = `https://${targetHost}/${apiKey}.txt`;

      try {
        const response = await fetch(keyFileUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Blog-IndexNow-Client/1.0'
          },
          timeout: 10000 // 10秒超时
        });

        if (response.ok) {
          const content = await response.text();
          const isValid = content.trim() === apiKey;

          res.json({
            success: isValid,
            message: isValid ? '密钥文件验证成功' : '密钥文件内容不匹配',
            keyFileUrl,
            statusCode: response.status,
            content: content.trim()
          });
        } else {
          res.json({
            success: false,
            message: `无法访问密钥文件 (HTTP ${response.status})`,
            keyFileUrl,
            statusCode: response.status
          });
        }
      } catch (fetchError) {
        res.json({
          success: false,
          message: '无法访问密钥文件：' + fetchError.message,
          keyFileUrl,
          error: fetchError.message
        });
      }

    } catch (error) {
      console.error('IndexNow verify error:', error);
      res.status(500).json({
        success: false,
        message: '验证失败：' + error.message,
        error: error.message
      });
    }
  }

  /**
   * 获取IndexNow使用统计（可选功能）
   */
  static async getStats(req, res) {
    try {
      // 这里可以实现从数据库获取提交统计
      // 暂时返回模拟数据
      const stats = {
        todaySubmissions: 0,
        monthSubmissions: 0,
        totalSubmissions: 0,
        lastSubmission: null,
        recentSubmissions: []
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('IndexNow stats error:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败：' + error.message,
        error: error.message
      });
    }
  }
}

export default IndexNowController; 