-- 文章访问留痕功能 - 示例查询和工具

-- 1. 记录访问的示例（在你的后端代码中使用）
-- 当用户访问文章时调用
INSERT INTO article_visits (
    article_id, 
    article_title, 
    visitor_ip, 
    user_agent, 
    referer, 
    device_type, 
    browser, 
    os,
    session_id,
    is_unique_visitor
) VALUES (
    ?, -- 文章ID
    ?, -- 文章标题
    ?, -- 访问者IP
    ?, -- User-Agent
    ?, -- Referer
    ?, -- 设备类型
    ?, -- 浏览器
    ?, -- 操作系统
    ?, -- 会话ID
    ? -- 是否独立访客
);

-- 2. 检查是否为独立访客的查询
-- 检查24小时内同IP是否访问过同一文章
SELECT COUNT(*) = 0 AS is_unique
FROM article_visits 
WHERE article_id = ? 
  AND visitor_ip = ? 
  AND visited_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- 3. 更新文章浏览数的触发器
DELIMITER ;;
CREATE TRIGGER update_article_view_count 
AFTER INSERT ON article_visits
FOR EACH ROW
BEGIN
    -- 只有独立访客才增加浏览数
    IF NEW.is_unique_visitor = TRUE THEN
        UPDATE articles 
        SET view_count = view_count + 1 
        WHERE id = NEW.article_id;
    END IF;
END;;
DELIMITER ;

-- 4. 常用统计查询示例

-- 获取最受欢迎的文章（按总访问量）
SELECT 
    article_id,
    article_title,
    total_visits,
    unique_visitors,
    today_visits,
    week_visits,
    month_visits
FROM article_visit_stats 
ORDER BY total_visits DESC 
LIMIT 10;

-- 获取今日热门文章
SELECT 
    av.article_id,
    av.article_title,
    COUNT(*) as today_visits,
    COUNT(DISTINCT av.visitor_ip) as unique_visitors_today
FROM article_visits av
WHERE DATE(av.visited_at) = CURDATE()
GROUP BY av.article_id, av.article_title
ORDER BY today_visits DESC
LIMIT 10;

-- 获取访问来源统计
SELECT 
    CASE 
        WHEN referer IS NULL OR referer = '' THEN '直接访问'
        WHEN referer LIKE '%google%' THEN 'Google搜索'
        WHEN referer LIKE '%baidu%' THEN '百度搜索'
        WHEN referer LIKE '%bing%' THEN 'Bing搜索'
        ELSE SUBSTRING_INDEX(SUBSTRING_INDEX(referer, '/', 3), '/', -1)
    END as source,
    COUNT(*) as visit_count
FROM article_visits 
WHERE visited_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY source
ORDER BY visit_count DESC;

-- 获取设备类型统计
SELECT 
    CASE device_type
        WHEN 1 THEN '桌面'
        WHEN 2 THEN '平板'
        WHEN 3 THEN '手机'
        ELSE '未知'
    END as device,
    COUNT(*) as visit_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM article_visits WHERE visited_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)), 2) as percentage
FROM article_visits 
WHERE visited_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY device_type
ORDER BY visit_count DESC;

-- 获取每小时访问量统计（用于分析访问高峰）
SELECT 
    HOUR(visited_at) as hour,
    COUNT(*) as visit_count
FROM article_visits 
WHERE DATE(visited_at) = CURDATE()
GROUP BY HOUR(visited_at)
ORDER BY hour;

-- 获取地理位置统计（如果你记录了地理信息）
SELECT 
    COALESCE(country, '未知') as country,
    COALESCE(city, '未知') as city,
    COUNT(*) as visit_count
FROM article_visits 
WHERE visited_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND country IS NOT NULL
GROUP BY country, city
ORDER BY visit_count DESC
LIMIT 20;

-- 5. 数据清理和维护

-- 清理超过指定天数的访问记录（根据系统配置）
DELETE av FROM article_visits av
INNER JOIN system_config sc ON sc.config_key = 'visit_retention_days'
WHERE sc.config_value != '0' 
  AND av.visited_at < DATE_SUB(NOW(), INTERVAL CAST(sc.config_value AS UNSIGNED) DAY);

-- 6. 性能优化建议

-- 创建分区表（按月分区，适用于大量数据）
-- ALTER TABLE article_visits 
-- PARTITION BY RANGE (YEAR(visited_at) * 100 + MONTH(visited_at)) (
--     PARTITION p202401 VALUES LESS THAN (202402),
--     PARTITION p202402 VALUES LESS THAN (202403),
--     -- 继续添加更多分区...
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- 7. 实用的存储过程

DELIMITER ;;
-- 记录访问的存储过程
CREATE PROCEDURE RecordArticleVisit(
    IN p_article_id BIGINT UNSIGNED,
    IN p_visitor_ip VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_referer VARCHAR(500),
    IN p_session_id VARCHAR(100)
)
BEGIN
    DECLARE v_article_title VARCHAR(255);
    DECLARE v_is_unique BOOLEAN DEFAULT TRUE;
    
    -- 获取文章标题
    SELECT title INTO v_article_title 
    FROM articles 
    WHERE id = p_article_id AND status = 1;
    
    -- 如果文章不存在或未发布，直接返回
    IF v_article_title IS NULL THEN
        LEAVE;
    END IF;
    
    -- 检查是否为独立访客
    SELECT COUNT(*) = 0 INTO v_is_unique
    FROM article_visits 
    WHERE article_id = p_article_id 
      AND visitor_ip = p_visitor_ip 
      AND visited_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
    
    -- 插入访问记录
    INSERT INTO article_visits (
        article_id, 
        article_title, 
        visitor_ip, 
        user_agent, 
        referer, 
        session_id,
        is_unique_visitor
    ) VALUES (
        p_article_id,
        v_article_title,
        p_visitor_ip,
        p_user_agent,
        p_referer,
        p_session_id,
        v_is_unique
    );
END;;
DELIMITER ;

-- 使用示例：
-- CALL RecordArticleVisit(1, '192.168.1.100', 'Mozilla/5.0...', 'https://google.com', 'session123');