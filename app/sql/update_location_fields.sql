-- 更新 article_visits 表，添加更多地理位置字段
-- 这个脚本会添加新的地理位置相关字段

-- 添加新的地理位置字段
ALTER TABLE article_visits 
ADD COLUMN country_code VARCHAR(10) NULL COMMENT '国家代码',
ADD COLUMN region VARCHAR(100) NULL COMMENT '地区/省份',
ADD COLUMN region_code VARCHAR(20) NULL COMMENT '地区代码',
ADD COLUMN zip_code VARCHAR(20) NULL COMMENT '邮编',
ADD COLUMN latitude DECIMAL(10, 8) NULL COMMENT '纬度',
ADD COLUMN longitude DECIMAL(11, 8) NULL COMMENT '经度',
ADD COLUMN timezone VARCHAR(50) NULL COMMENT '时区',
ADD COLUMN isp VARCHAR(200) NULL COMMENT '网络服务商',
ADD COLUMN org VARCHAR(200) NULL COMMENT '组织',
ADD COLUMN as_info VARCHAR(100) NULL COMMENT '自治系统',
ADD COLUMN is_mobile BOOLEAN DEFAULT FALSE COMMENT '是否移动网络',
ADD COLUMN is_proxy BOOLEAN DEFAULT FALSE COMMENT '是否代理',
ADD COLUMN is_hosting BOOLEAN DEFAULT FALSE COMMENT '是否托管',
ADD COLUMN location_source VARCHAR(20) DEFAULT 'unknown' COMMENT '地理位置数据来源';

-- 添加索引以提高查询性能
CREATE INDEX idx_article_visits_country_code ON article_visits(country_code);
CREATE INDEX idx_article_visits_region ON article_visits(region);
CREATE INDEX idx_article_visits_city ON article_visits(city);
CREATE INDEX idx_article_visits_location_source ON article_visits(location_source);

-- 更新现有记录的地理位置信息
-- 注意：这里只是示例，实际更新需要根据您的数据情况调整
-- UPDATE article_visits SET location_source = 'manual' WHERE country IS NOT NULL; 