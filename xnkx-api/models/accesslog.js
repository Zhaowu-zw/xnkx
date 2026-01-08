'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class accesslog extends Model {
    static associate(models) {
      // 暂无关联关系，留空即可
    }
  }

  accesslog.init({
    // 页面路径（必填，无默认值）
    pagePath: {
      type: DataTypes.STRING(255), // 与迁移文件的varchar(255)匹配
      allowNull: false,
      comment: '页面路径' // 字段注释，与迁移文件一致
    },
    // 页面名称（可选）
    pageName: {
      type: DataTypes.STRING(100), // 与迁移文件的varchar(100)匹配
      allowNull: true,
      comment: '页面名称'
    },
    // 用户ID（默认匿名）
    userId: {
      type: DataTypes.STRING(64), // 与迁移文件的varchar(64)匹配
      allowNull: false,
      defaultValue: 'anonymous', // 与迁移文件的默认值一致
      comment: '用户ID（匿名为anonymous）'
    },
    // 访问时间
    accessTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '访问时间'
    },
    // 访问IP
    ip: {
      type: DataTypes.STRING(64), // 与迁移文件的varchar(64)匹配
      allowNull: true,
      comment: '访问IP'
    },
    // 设备/浏览器信息
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '设备/浏览器信息'
    }
  }, {
    sequelize,
    modelName: 'accesslog',
    tableName: 'accesslogs', // 显式指定表名，与迁移文件一致
    comment: '访问日志表', // 表注释
    timestamps: true, // 保留createdAt/updatedAt（Sequelize默认）
    charset: 'utf8mb4', // 支持emoji等特殊字符
    collate: 'utf8mb4_unicode_ci'
  });

  return accesslog;
};