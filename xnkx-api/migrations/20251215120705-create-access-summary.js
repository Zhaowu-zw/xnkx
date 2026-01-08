'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AccessSummaries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      statDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '统计日期（格式：YYYY-MM-DD）'
      },
      pagePath: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '',
        comment: '页面路径（空字符串表示总访问量）'
      },
      visitCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '访问量'
      },
      trend: {
        type: Sequelize.FLOAT(10, 1),
        allowNull: true,
        comment: '环比趋势（%）'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // 添加联合唯一索引（避免重复汇总）
    await queryInterface.addIndex('AccessSummaries', ['statDate', 'pagePath'], {
      unique: true,
      name: 'idx_statDate_pagePath'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AccessSummaries');
  }
};