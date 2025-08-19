import { SystemConfigDao } from '../dao/index.js';

/**
 * 系统配置控制器
 */
class SystemConfigController {
  /**
   * 创建配置项
   */
  static async createConfig(req, res) {
    try {
      const { config_key, config_value, config_type = 1, description } = req.body;

      // 基本验证
      if (!config_key) {
        return res.status(400).json({
          success: false,
          message: '配置键不能为空'
        });
      }

      // 检查配置键是否已存在
      const existingConfig = await SystemConfigDao.findByKey(config_key);
      if (existingConfig) {
        return res.status(400).json({
          success: false,
          message: '该配置键已存在'
        });
      }

      // 验证配置类型
      if (![1, 2, 3, 4].includes(config_type)) {
        return res.status(400).json({
          success: false,
          message: '配置类型无效，只能是1-4之间的值'
        });
      }

      // 创建配置项
      const result = await SystemConfigDao.create({
        config_key,
        config_value,
        config_type,
        description
      });

      res.status(201).json({
        success: true,
        message: '配置项创建成功',
        data: {
          id: result.insertId,
          config_key,
          config_value,
          config_type,
          description
        }
      });
    } catch (error) {
      console.error('创建配置项错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取配置项信息
   */
  static async getConfigInfo(req, res) {
    try {
      const { id } = req.params;

      const config = await SystemConfigDao.findById(id);
      if (!config) {
        return res.status(404).json({
          success: false,
          message: '配置项不存在'
        });
      }

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('获取配置项信息错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据配置键获取配置项
   */
  static async getConfigByKey(req, res) {
    try {
      const { key } = req.params;

      const config = await SystemConfigDao.findByKey(key);
      if (!config) {
        return res.status(404).json({
          success: false,
          message: '配置项不存在'
        });
      }

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('获取配置项错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取配置值
   */
  static async getConfigValue(req, res) {
    try {
      const { key } = req.params;
      const { defaultValue } = req.query;

      const value = await SystemConfigDao.getValue(key, defaultValue);

      res.json({
        success: true,
        data: {
          key,
          value
        }
      });
    } catch (error) {
      console.error('获取配置值错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 设置配置值
   */
  static async setConfigValue(req, res) {
    try {
      const { key } = req.params;
      const { value, config_type = 1, description } = req.body;

      // 验证配置类型
      if (![1, 2, 3, 4].includes(config_type)) {
        return res.status(400).json({
          success: false,
          message: '配置类型无效，只能是1-4之间的值'
        });
      }

      await SystemConfigDao.setValue(key, value, config_type, description);

      res.json({
        success: true,
        message: '配置设置成功',
        data: {
          key,
          value,
          config_type
        }
      });
    } catch (error) {
      console.error('设置配置值错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 更新配置项
   */
  static async updateConfig(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 验证配置项是否存在
      const existingConfig = await SystemConfigDao.findById(id);
      if (!existingConfig) {
        return res.status(404).json({
          success: false,
          message: '配置项不存在'
        });
      }

      // 如果要更新配置键，检查是否重复
      if (updateData.config_key && updateData.config_key !== existingConfig.config_key) {
        const keyExists = await SystemConfigDao.isKeyExists(updateData.config_key, id);
        if (keyExists) {
          return res.status(400).json({
            success: false,
            message: '该配置键已存在'
          });
        }
      }

      // 验证配置类型
      if (updateData.config_type && ![1, 2, 3, 4].includes(updateData.config_type)) {
        return res.status(400).json({
          success: false,
          message: '配置类型无效，只能是1-4之间的值'
        });
      }

      // 移除不应该被更新的字段
      delete updateData.id;
      delete updateData.created_at;

      const result = await SystemConfigDao.update(id, updateData);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '配置项不存在或未进行任何更新'
        });
      }

      res.json({
        success: true,
        message: '配置项更新成功'
      });
    } catch (error) {
      console.error('更新配置项错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 删除配置项
   */
  static async deleteConfig(req, res) {
    try {
      const { id } = req.params;

      // 验证配置项是否存在
      const existingConfig = await SystemConfigDao.findById(id);
      if (!existingConfig) {
        return res.status(404).json({
          success: false,
          message: '配置项不存在'
        });
      }

      const result = await SystemConfigDao.delete(id);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '配置项不存在'
        });
      }

      res.json({
        success: true,
        message: '配置项删除成功'
      });
    } catch (error) {
      console.error('删除配置项错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据配置键删除配置项
   */
  static async deleteConfigByKey(req, res) {
    try {
      const { key } = req.params;

      // 验证配置项是否存在
      const existingConfig = await SystemConfigDao.findByKey(key);
      if (!existingConfig) {
        return res.status(404).json({
          success: false,
          message: '配置项不存在'
        });
      }

      const result = await SystemConfigDao.deleteByKey(key);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '配置项不存在'
        });
      }

      res.json({
        success: true,
        message: '配置项删除成功'
      });
    } catch (error) {
      console.error('删除配置项错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取配置项列表
   */
  static async getConfigList(req, res) {
    try {
      const {
        page,
        pageSize,
        config_type,
        keyword,
        orderBy = 'created_at',
        order = 'DESC'
      } = req.query;

      let configs;
      let total = null;

      const options = {
        config_type: config_type ? parseInt(config_type) : null,
        keyword,
        orderBy,
        order
      };

      if (page && pageSize) {
        // 分页查询
        const pageNum = parseInt(page);
        const size = parseInt(pageSize);

        options.page = pageNum;
        options.pageSize = size;

        configs = await SystemConfigDao.findWithPagination(options);
        total = await SystemConfigDao.count(options);
      } else {
        // 获取所有配置
        configs = await SystemConfigDao.findAll(orderBy, order);
      }

      const responseData = {
        configs
      };

      if (total !== null) {
        responseData.pagination = {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          pages: Math.ceil(total / parseInt(pageSize))
        };
      }

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('获取配置项列表错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 根据类型获取配置项
   */
  static async getConfigsByType(req, res) {
    try {
      const { type } = req.params;
      const configType = parseInt(type);

      if (![1, 2, 3, 4].includes(configType)) {
        return res.status(400).json({
          success: false,
          message: '配置类型无效'
        });
      }

      const configs = await SystemConfigDao.findByType(configType);

      res.json({
        success: true,
        data: configs
      });
    } catch (error) {
      console.error('根据类型获取配置错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 批量获取配置值
   */
  static async getMultipleConfigValues(req, res) {
    try {
      const { keys } = req.body;

      if (!Array.isArray(keys) || keys.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供配置键数组'
        });
      }

      const configs = await SystemConfigDao.getMultipleValues(keys);

      res.json({
        success: true,
        data: configs
      });
    } catch (error) {
      console.error('批量获取配置值错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 批量设置配置值
   */
  static async setMultipleConfigValues(req, res) {
    try {
      const { configs } = req.body;

      if (!Array.isArray(configs) || configs.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供配置数组'
        });
      }

      // 验证配置格式
      for (const config of configs) {
        if (!config.key) {
          return res.status(400).json({
            success: false,
            message: '每个配置项必须包含key字段'
          });
        }

        if (config.type && ![1, 2, 3, 4].includes(config.type)) {
          return res.status(400).json({
            success: false,
            message: `配置项 ${config.key} 的类型无效`
          });
        }
      }

      await SystemConfigDao.setMultipleValues(configs);

      res.json({
        success: true,
        message: `成功设置 ${configs.length} 个配置项`,
        data: {
          count: configs.length
        }
      });
    } catch (error) {
      console.error('批量设置配置值错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 检查配置键是否可用
   */
  static async checkKeyAvailability(req, res) {
    try {
      const { key } = req.params;
      const { excludeId } = req.query;

      const exists = await SystemConfigDao.isKeyExists(key, excludeId);

      res.json({
        success: true,
        data: {
          available: !exists,
          key
        }
      });
    } catch (error) {
      console.error('检查配置键可用性错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取配置统计信息
   */
  static async getConfigStatistics(req, res) {
    try {
      const statistics = await SystemConfigDao.getStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('获取配置统计错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 获取博客基本设置
   */
  static async getBlogSettings(req, res) {
    try {
      const settingKeys = [
        'site_name',
        'site_description',
        'site_keywords',
        'site_author',
        'site_logo',
        'site_favicon',
        'icp_number',
        'analytics_code'
      ];

      const settings = await SystemConfigDao.getMultipleValues(settingKeys);

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('获取博客设置错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 保存博客基本设置
   */
  static async saveBlogSettings(req, res) {
    try {
      const settings = req.body;
      
      const allowedSettings = [
        'site_name',
        'site_description',
        'site_keywords',
        'site_author',
        'site_logo',
        'site_favicon',
        'icp_number',
        'analytics_code'
      ];

      const configsToSave = [];
      
      for (const [key, value] of Object.entries(settings)) {
        if (allowedSettings.includes(key)) {
          configsToSave.push({
            key,
            value,
            type: 1, // 字符串类型
            description: `博客${key}设置`
          });
        }
      }

      if (configsToSave.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有有效的设置项'
        });
      }

      await SystemConfigDao.setMultipleValues(configsToSave);

      res.json({
        success: true,
        message: '博客设置保存成功',
        data: {
          count: configsToSave.length
        }
      });
    } catch (error) {
      console.error('保存博客设置错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  /**
   * 重置所有配置到默认值
   */
  static async resetToDefaults(req, res) {
    try {
      const { confirmReset } = req.body;

      if (!confirmReset) {
        return res.status(400).json({
          success: false,
          message: '请确认要重置所有配置'
        });
      }

      // 删除所有现有配置
      const configs = await SystemConfigDao.findAll();
      
      for (const config of configs) {
        await SystemConfigDao.delete(config.id);
      }

      // 创建默认配置
      const defaultConfigs = [
        { key: 'site_name', value: '我的博客', type: 1, description: '网站名称' },
        { key: 'site_description', value: '一个简单的个人博客', type: 1, description: '网站描述' },
        { key: 'site_keywords', value: '博客,个人,技术', type: 1, description: '网站关键词' },
        { key: 'site_author', value: '博主', type: 1, description: '网站作者' },
        { key: 'posts_per_page', value: 10, type: 2, description: '每页文章数量' },
        { key: 'allow_comments', value: true, type: 4, description: '是否允许评论' },
        { key: 'music_enabled', value: true, type: 4, description: '是否启用背景音乐' }
      ];

      await SystemConfigDao.setMultipleValues(defaultConfigs);

      res.json({
        success: true,
        message: '配置已重置为默认值',
        data: {
          resetCount: configs.length,
          defaultCount: defaultConfigs.length
        }
      });
    } catch (error) {
      console.error('重置配置错误：', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

export { SystemConfigController }; 