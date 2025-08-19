#!/usr/bin/env node

/**
 * 自动数据清理脚本
 * 每月自动清理上个月的访问数据
 * 
 * 使用方法：
 * 1. 手动执行：node scripts/auto-cleanup.js
 * 2. 定时任务：添加到 crontab
 *    # 每月1号凌晨2点执行清理
 *    0 2 1 * * cd /path/to/your/app && node scripts/auto-cleanup.js >> logs/cleanup.log 2>&1
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 添加项目根目录到路径
const projectRoot = join(__dirname, '..');
process.chdir(projectRoot);

// 导入数据库配置和 DAO
import { query } from '../config/db.js';

/**
 * 记录日志
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.log(logMessage);
  
  // 写入日志文件
  const logDir = join(projectRoot, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logFile = join(logDir, 'cleanup.log');
  fs.appendFileSync(logFile, logMessage + '\n');
}

/**
 * 清理访问数据
 */
async function cleanupVisitData(months = 1, dryRun = false) {
  try {
    // 计算清理的截止日期
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    // 获取要清理的数据统计
    const countSql = `
      SELECT COUNT(*) as count, 
             MIN(visited_at) as earliest_date,
             MAX(visited_at) as latest_date
      FROM article_visits 
      WHERE visited_at < ?
    `;
    
    const countResult = await query(countSql, [cutoffDate]);
    const { count, earliest_date, latest_date } = countResult[0];
    
    log(`找到 ${count} 条需要清理的记录，时间范围：${earliest_date} 至 ${latest_date}`);
    
    if (dryRun) {
      log('预览模式：不会实际删除数据');
      return {
        dryRun: true,
        months,
        cutoffDate: cutoffDate.toISOString(),
        recordsToDelete: count,
        earliestDate: earliest_date,
        latestDate: latest_date
      };
    }
    
    // 实际清理模式
    const deleteSql = 'DELETE FROM article_visits WHERE visited_at < ?';
    const deleteResult = await query(deleteSql, [cutoffDate]);
    
    log(`成功删除 ${deleteResult.affectedRows} 条记录`);
    
    return {
      dryRun: false,
      months,
      cutoffDate: cutoffDate.toISOString(),
      recordsDeleted: deleteResult.affectedRows,
      earliestDate: earliest_date,
      latestDate: latest_date,
      cleanupTime: new Date().toISOString()
    };
  } catch (error) {
    log(`清理失败: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * 获取清理统计信息
 */
async function getCleanupStats() {
  try {
    // 获取总记录数
    const totalSql = 'SELECT COUNT(*) as total FROM article_visits';
    const totalResult = await query(totalSql, []);
    
    // 获取最早和最晚的访问时间
    const dateRangeSql = `
      SELECT 
        MIN(visited_at) as earliest_date,
        MAX(visited_at) as latest_date
      FROM article_visits
    `;
    const dateRangeResult = await query(dateRangeSql, []);
    
    // 按月份统计数据量
    const monthlyStatsSql = `
      SELECT 
        DATE_FORMAT(visited_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM article_visits 
      GROUP BY DATE_FORMAT(visited_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `;
    const monthlyStats = await query(monthlyStatsSql, []);
    
    return {
      totalRecords: totalResult[0].total,
      earliestDate: dateRangeResult[0].earliest_date,
      latestDate: dateRangeResult[0].latest_date,
      monthlyStats
    };
  } catch (error) {
    log(`获取统计信息失败: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    log('开始执行自动数据清理任务');
    
    // 获取当前统计信息
    const stats = await getCleanupStats();
    log(`当前总记录数: ${stats.totalRecords}`);
    log(`数据时间范围: ${stats.earliestDate} 至 ${stats.latestDate}`);
    
    // 检查是否有需要清理的数据
    if (stats.totalRecords === 0) {
      log('没有需要清理的数据，任务结束');
      return;
    }
    
    // 检查命令行参数
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run') || args.includes('-d');
    const months = parseInt(args.find(arg => arg.startsWith('--months='))?.split('=')[1]) || 1;
    
    if (dryRun) {
      log('运行在预览模式，不会实际删除数据');
    }
    
    // 执行清理
    const result = await cleanupVisitData(months, dryRun);
    
    if (result.dryRun) {
      log(`预览结果：将清理 ${result.recordsToDelete} 条记录`);
    } else {
      log(`清理完成：删除了 ${result.recordsDeleted} 条记录`);
    }
    
    // 清理后的统计
    const afterStats = await getCleanupStats();
    log(`清理后总记录数: ${afterStats.totalRecords}`);
    
    log('自动数据清理任务完成');
    
  } catch (error) {
    log(`任务执行失败: ${error.message}`, 'ERROR');
    process.exit(1);
  } finally {
    // 关闭数据库连接
    process.exit(0);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanupVisitData, getCleanupStats }; 