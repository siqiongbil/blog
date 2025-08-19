/**
 * 控制器层统一导出
 * 所有控制器的入口文件
 */

import { UserController } from './userController.js';
import { CategoryController } from './categoryController.js';
import { ArticleController } from './articleController.js';
import { MusicController } from './musicController.js';
import { SystemConfigController } from './systemConfigController.js';
import { TagController } from './tagController.js';
import { ImageController } from './imageController.js';
import FileController from './fileController.js';
import { IndexNowController } from './indexNowController.js';

export {
  UserController,
  CategoryController,
  ArticleController,
  MusicController,
  SystemConfigController,
  TagController,
  ImageController,
  FileController,
  IndexNowController
};

export default {
  UserController,
  CategoryController,
  ArticleController,
  MusicController,
  SystemConfigController,
  TagController,
  ImageController,
  FileController,
  IndexNowController
}; 