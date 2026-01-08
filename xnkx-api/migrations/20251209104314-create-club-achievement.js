'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, DataTypes) {
    // 创建 club_achievements 表
    await queryInterface.createTable('clubAchievements', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '成就序号'
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '获奖年份'
      },
      participants: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: '参与人员'
      },
      competition_name: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: '赛事名称'
      },
      participation_type: {
        type: DataTypes.ENUM('个人', '团队', '个人及团队'),
        allowNull: false,
        comment: '参赛性质'
      },
      level: {
        type: DataTypes.ENUM('学院级', '省级', '国家级', '国际'),
        allowNull: false,
        comment: '成就等级'
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW // 默认当前时间
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '软删除时间'
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });
  },

  async down(queryInterface) {
    // 回滚：删除数据表
    await queryInterface.dropTable('clubAchievements');
  }
};