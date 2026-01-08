'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class clubAchievement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  clubAchievement.init({
    // 主键（自增）
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '成就序号'
    },
    // 年份
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '获奖年份'
    },
    // 参与人员（多个用逗号分隔）
    participants: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '参与人员'
    },
    // 赛事名称
    competition_name: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '赛事名称'
    },
    // 参赛性质（个人/团队/个人及团队）
    participation_type: {
      type: DataTypes.ENUM('个人', '团队', '个人及团队'),
      allowNull: false,
      comment: '参赛性质'
    },
    // 等级（学院级/省级/国家级/国际）
    level: {
      type: DataTypes.ENUM('学院级', '省级', '国家级', '国际'),
      allowNull: false,
      comment: '成就等级'
    },
    // 描述
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '成就描述'
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '成果图片路径'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    sequelize,
    modelName: 'clubAchievement',
    charset: 'utf8mb4', // 支持emoji等特殊字符
    collate: 'utf8mb4_unicode_ci',
    timestamps: true, // 自动生成createdAt/updatedAt字段
  });
  return clubAchievement;
};