'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recruitments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // 关联User表（表名通常为复数）
          key: 'id'
        },
        onDelete: 'CASCADE' // 用户删除时，同步删除纳新记录
      },
      intention_group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'group_infos', // 关联Group表
          key: 'id'
        },
        onDelete: 'RESTRICT' // 小组删除时，禁止删除纳新记录（避免数据丢失）
      },
      application_info: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      first_review_status: {
        type: Sequelize.ENUM('pending', 'passed', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      final_review_status: {
        type: Sequelize.ENUM('pending', 'passed', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      reviewer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL' // 审核人删除时，设为NULL
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('recruitments');
  }
};