'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('group_infos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      group_name: {
        type: Sequelize.STRING(50), // 组名（长度限制）
        allowNull: false, // 非空
        comment: '小组名称'
      },
      group_position: {
        type: Sequelize.STRING(100), // 组定位
        allowNull: false,
        comment: '小组定位/方向'
      },
      function_desc: {
        type: Sequelize.TEXT, // 职能描述（长文本）
        allowNull: true,
        comment: '小组职能详细描述'
      },
      core_achievements: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '核心成果'
      },
      create_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW, // 默认当前时间
        comment: '创建时间'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('group_infos');
  }
};