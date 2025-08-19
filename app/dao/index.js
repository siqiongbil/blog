/**
 * DAO层统一导出
 * 所有数据访问对象的入口文件
 */

import { UserDao } from './userDao.js';
import { CategoryDao } from './categoryDao.js';
import { ArticleDao } from './articleDao.js';
import { MusicDao } from './musicDao.js';
import { SystemConfigDao } from './systemConfigDao.js';
import { TagDao } from './tagDao.js';
import { ImageDao } from './imageDao.js';
import FileDao from './fileDao.js';

export {
  UserDao,
  CategoryDao,
  ArticleDao,
  MusicDao,
  SystemConfigDao,
  TagDao,
  ImageDao,
  FileDao
};

export default {
  UserDao,
  CategoryDao,
  ArticleDao,
  MusicDao,
  SystemConfigDao,
  TagDao,
  ImageDao,
  FileDao
}; 