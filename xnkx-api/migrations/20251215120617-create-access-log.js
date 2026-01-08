'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AccessLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      pagePath: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '页面路径'
      },
      pageName: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '页面名称'
      },
      userId: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'anonymous',
        comment: '用户ID（匿名为anonymous）'
      },
      accessTime: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '访问时间'
      },
      ip: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: '访问IP'
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '设备/浏览器信息'
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

    // 添加索引（提升查询性能）
    await queryInterface.addIndex('AccessLogs', ['accessTime']);
    await queryInterface.addIndex('AccessLogs', ['pagePath']);
    await queryInterface.addIndex('AccessLogs', ['userId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AccessLogs');
  }
};