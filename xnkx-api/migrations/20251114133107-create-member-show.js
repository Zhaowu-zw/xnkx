'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('member_shows', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        unsigned: true
      },
      user_id: {
        type: Sequelize.INTEGER, // 关联用户表的 ID（假设用户表主键为整数）
        allowNull: false,
        comment: '关联的用户ID',
        unsigned: true,
          references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      group_id: {
        type: Sequelize.INTEGER, // 关联小组表的 ID
        allowNull: false,
        comment: '所属小组ID',
        unsigned: true,
        references: {
          model: 'group_infos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      public_info: {
        type: Sequelize.JSON, // 公开信息（头像、技能等，用 JSON 存储更灵活）
        allowNull: true,
        comment: '公开信息（头像URL、擅长技能等）'
        // 示例值：{ avatar: "xxx.png", skills: ["JS", "UI"] }
      },
      private_info: {
        type: Sequelize.JSON, // 隐私信息（联系方式等）
        allowNull: true,
        comment: '隐私信息（手机号、邮箱等）'
      },
      is_show: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true, // 默认展示
        comment: '是否对外展示（true/false）'
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
    await queryInterface.dropTable('member_shows');
  }
};