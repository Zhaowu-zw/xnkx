'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class accesssummary extends Model {
    static associate(models) {
      // 暂无关联关系，留空即可
    }
  }

  accesssummary.init({
    // 统计日期（仅日期，无时间）
    statDate: {
      type: DataTypes.DATEONLY, // 关键修复：与迁移文件的DATEONLY匹配
      allowNull: false,
      comment: '统计日期（格式：YYYY-MM-DD）'
    },
    // 页面路径（空字符串表示总访问量）
    pagePath: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '', // 与迁移文件的默认值一致
      comment: '页面路径（空字符串表示总访问量）'
    },
    // 当日访问量
    visitCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // 与迁移文件的默认值一致
      comment: '访问量'
    },
    // 环比趋势（%，保留1位小数）
    trend: {
      type: DataTypes.FLOAT(10, 1), // 与迁移文件的FLOAT(10,1)匹配
      allowNull: true,
      comment: '环比趋势（%）'
    }
  }, {
    sequelize,
    modelName: 'accesssummary',
    tableName: 'accesssummaries', // 显式指定表名，与迁移文件一致
    comment: '访问量汇总表', // 表注释
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    // 增加联合唯一索引（与迁移文件的idx_statDate_pagePath一致）
    indexes: [
      {
        name: 'idx_statDate_pagePath',
        unique: true,
        fields: ['statDate', 'pagePath']
      }
    ]
  });

  return accesssummary;
};