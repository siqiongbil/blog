-- 创建用户表（博主信息）
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    nickname VARCHAR(50) NOT NULL COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像URL',
    email VARCHAR(100) COMMENT '邮箱',
    bio TEXT COMMENT '个人简介',
    website VARCHAR(255) COMMENT '个人网站',
    role TINYINT NOT NULL DEFAULT 1 COMMENT '角色：1-管理员，2-博主，3-普通用户',
    github VARCHAR(255) COMMENT 'GitHub地址',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表（博主信息）';

-- 创建文章分类表
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    slug VARCHAR(50) NOT NULL UNIQUE COMMENT '分类别名（用于URL）',
    description VARCHAR(255) COMMENT '分类描述',
    sort_order INT UNSIGNED DEFAULT 0 COMMENT '排序顺序',
    image_url VARCHAR(255) COMMENT '分类图片URL',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章分类表';

-- 创建文章表
CREATE TABLE IF NOT EXISTS articles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '文章标题',
    content LONGTEXT NOT NULL COMMENT '文章内容（富文本：Markdown/HTML）',
    content_type TINYINT NOT NULL DEFAULT 2 COMMENT '内容类型：1-纯文本，2-Markdown，3-HTML',
    raw_content LONGTEXT COMMENT '原始内容（Markdown源码）',
    rendered_content LONGTEXT COMMENT '渲染后的HTML内容',
    summary TEXT COMMENT '文章摘要',
    excerpt TEXT COMMENT '文章摘录（自动提取）',
    cover_image VARCHAR(255) COMMENT '封面图片URL',
    images JSON COMMENT '文章图片信息，JSON格式：[{"url": "图片URL", "alt": "替代文本", "caption": "说明"}]',
    category_id BIGINT UNSIGNED NOT NULL COMMENT '分类ID',
    author_id BIGINT UNSIGNED NOT NULL COMMENT '作者ID',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '文章状态：0-草稿，1-已发布，2-已删除',
    view_count INT UNSIGNED DEFAULT 0 COMMENT '浏览次数',
    word_count INT UNSIGNED DEFAULT 0 COMMENT '字数统计',
    read_time INT UNSIGNED DEFAULT 0 COMMENT '预估阅读时间（分钟）',
    tags JSON COMMENT '文章标签，JSON格式：["标签1", "标签2"]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_author (author_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_content_type (content_type),
    CONSTRAINT fk_article_author FOREIGN KEY (author_id) REFERENCES users(id),
    CONSTRAINT fk_article_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- 创建音乐表
CREATE TABLE IF NOT EXISTS music (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL COMMENT '文件名（作者名-音乐名.mp3）',
    original_name VARCHAR(255) COMMENT '原始文件名',
    file_path VARCHAR(255) NOT NULL COMMENT '文件路径',
    file_url VARCHAR(255) COMMENT '访问URL',
    file_size INT UNSIGNED COMMENT '文件大小（字节）',
    mime_type VARCHAR(50) COMMENT 'MIME类型',
    duration DECIMAL(10,2) COMMENT '音乐时长（秒）',
    title VARCHAR(255) COMMENT '音乐标题',
    artist VARCHAR(255) COMMENT '艺术家',
    album VARCHAR(255) COMMENT '专辑名称',
    genre VARCHAR(100) COMMENT '音乐类型',
    year INT COMMENT '发行年份',
    cover_url VARCHAR(255) COMMENT '专辑封面URL',
    description TEXT COMMENT '音乐描述',
    tags JSON COMMENT '音乐标签',
    play_count INT UNSIGNED DEFAULT 0 COMMENT '播放次数',
    uploader_id BIGINT UNSIGNED COMMENT '上传者ID',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_title (title),
    INDEX idx_artist (artist),
    INDEX idx_album (album),
    INDEX idx_play_count (play_count),
    CONSTRAINT fk_music_uploader FOREIGN KEY (uploader_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='音乐表';

-- 创建标签表
CREATE TABLE IF NOT EXISTS tags (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
    slug VARCHAR(50) NOT NULL UNIQUE COMMENT '标签别名（用于URL）',
    description VARCHAR(255) COMMENT '标签描述',
    color VARCHAR(7) DEFAULT '#007bff' COMMENT '标签颜色（十六进制色值）',
    icon VARCHAR(50) COMMENT '标签图标（CSS类名或图标名）',
    article_count INT UNSIGNED DEFAULT 0 COMMENT '文章数量（冗余字段，便于查询）',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name),
    INDEX idx_slug (slug),
    INDEX idx_article_count (article_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- 创建文章标签关联表
CREATE TABLE IF NOT EXISTS article_tags (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id BIGINT UNSIGNED NOT NULL COMMENT '文章ID',
    tag_id BIGINT UNSIGNED NOT NULL COMMENT '标签ID',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_article_tag (article_id, tag_id),
    INDEX idx_article_id (article_id),
    INDEX idx_tag_id (tag_id),
    CONSTRAINT fk_article_tag_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_article_tag_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章标签关联表';

-- 创建图片表
CREATE TABLE IF NOT EXISTS images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL COMMENT '文件名',
    original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_path VARCHAR(255) NOT NULL COMMENT '文件路径',
    file_url VARCHAR(255) NOT NULL COMMENT '访问URL',
    file_size INT UNSIGNED NOT NULL COMMENT '文件大小（字节）',
    mime_type VARCHAR(50) NOT NULL COMMENT 'MIME类型',
    width INT UNSIGNED COMMENT '图片宽度（像素）',
    height INT UNSIGNED COMMENT '图片高度（像素）',
    alt_text VARCHAR(255) COMMENT '替代文本',
    description TEXT COMMENT '图片描述',
    tags JSON COMMENT '图片标签，JSON格式：["标签1", "标签2"]',
    upload_type TINYINT NOT NULL DEFAULT 1 COMMENT '上传类型：1-分类图片，2-文章图片，3-用户头像，4-其他',
    related_id BIGINT UNSIGNED COMMENT '关联ID（分类ID、文章ID等）',
    uploader_id BIGINT UNSIGNED NOT NULL COMMENT '上传者ID',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-删除，1-正常',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_file_name (file_name),
    INDEX idx_upload_type (upload_type),
    INDEX idx_related_id (related_id),
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图片管理表';

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(50) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type TINYINT NOT NULL DEFAULT 1 COMMENT '配置类型：1-字符串，2-数字，3-JSON，4-布尔值',
    description VARCHAR(255) COMMENT '配置说明',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 创建通用文件表
CREATE TABLE IF NOT EXISTS files (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL COMMENT '文件名',
    original_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_path VARCHAR(255) NOT NULL COMMENT '文件路径',
    file_size BIGINT UNSIGNED NOT NULL COMMENT '文件大小（字节）',
    mime_type VARCHAR(100) NOT NULL COMMENT 'MIME类型',
    file_type VARCHAR(20) NOT NULL DEFAULT 'document' COMMENT '文件类型：document, video, audio, archive, other',
    description TEXT COMMENT '文件描述',
    tags JSON COMMENT '文件标签，JSON格式：["标签1", "标签2"]',
    uploader_id BIGINT UNSIGNED NOT NULL COMMENT '上传者ID',
    related_id BIGINT UNSIGNED COMMENT '关联ID（文章ID、分类ID等）',
    download_count INT UNSIGNED DEFAULT 0 COMMENT '下载次数',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-删除，1-正常',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_file_name (file_name),
    INDEX idx_file_type (file_type),
    INDEX idx_mime_type (mime_type),
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_related_id (related_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    CONSTRAINT fk_file_uploader FOREIGN KEY (uploader_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通用文件管理表';

-- 创建访问留痕表
CREATE TABLE IF NOT EXISTS article_visits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    article_id BIGINT UNSIGNED NOT NULL COMMENT '文章ID',
    article_title VARCHAR(255) NOT NULL COMMENT '文章标题（冗余字段，便于统计）',
    visitor_ip VARCHAR(45) NOT NULL COMMENT '访问者IP地址（支持IPv4和IPv6）',
    user_agent TEXT COMMENT '用户代理字符串（浏览器信息）',
    referer VARCHAR(500) COMMENT '来源页面URL',
    device_type TINYINT DEFAULT 0 COMMENT '设备类型：0-未知，1-桌面，2-平板，3-手机',
    browser VARCHAR(50) COMMENT '浏览器名称',
    os VARCHAR(50) COMMENT '操作系统',
    country VARCHAR(50) COMMENT '国家（可通过IP解析）',
    city VARCHAR(100) COMMENT '城市（可通过IP解析）',
    visit_duration INT UNSIGNED DEFAULT 0 COMMENT '访问时长（秒）',
    is_unique_visitor BOOLEAN DEFAULT TRUE COMMENT '是否为独立访客（24小时内同IP同文章首次访问）',
    session_id VARCHAR(100) COMMENT '会话ID（用于追踪用户行为）',
    visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
    
    -- 索引优化
    INDEX idx_article_id (article_id),
    INDEX idx_visitor_ip (visitor_ip),
    INDEX idx_visited_at (visited_at),
    INDEX idx_article_ip_date (article_id, visitor_ip, visited_at),
    INDEX idx_unique_visitor (is_unique_visitor),
    INDEX idx_device_type (device_type),
    
    -- 外键约束
    CONSTRAINT fk_visit_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章访问留痕表';

-- 创建访问统计视图（便于查询统计数据）
CREATE OR REPLACE VIEW article_visit_stats AS
SELECT 
    a.id as article_id,
    a.title as article_title,
    COUNT(av.id) as total_visits,
    COUNT(DISTINCT av.visitor_ip) as unique_visitors,
    COUNT(CASE WHEN DATE(av.visited_at) = CURDATE() THEN 1 END) as today_visits,
    COUNT(CASE WHEN DATE(av.visited_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_visits,
    COUNT(CASE WHEN DATE(av.visited_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as month_visits,
    MAX(av.visited_at) as last_visit_time
FROM articles a
LEFT JOIN article_visits av ON a.id = av.article_id
WHERE a.status = 1  -- 只统计已发布的文章
GROUP BY a.id, a.title;

-- 插入一些初始的系统配置（用于访问统计功能）
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('visit_tracking_enabled', 'true', 4, '是否启用访问统计功能'),
('visit_ip_anonymize', 'false', 4, '是否匿名化IP地址（隐私保护）'),
('visit_retention_days', '365', 2, '访问记录保留天数（0表示永久保留）'),
('visit_unique_threshold_hours', '24', 2, '独立访客判定时间阈值（小时）')
ON DUPLICATE KEY UPDATE 
config_value = VALUES(config_value),
updated_at = CURRENT_TIMESTAMP;
