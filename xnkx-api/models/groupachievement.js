'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class groupachievement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      groupachievement.belongsTo(models.group_info, {
        foreignKey: 'group_id',
        as: 'group'  // 关联别名，查询时用
      });
    }
  }
  groupachievement.init({
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,  // 标题不能为空
      comment: '成果标题'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '成果描述'
    },
    activity_time: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '成果完成时间'
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '所属小组ID（外键）',
      references: {
        model: 'group_info',  // 关联的表名（sequelize自动复数）
        key: 'id'
      }
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '成果图片路径'
    },
    status: {
      type: DataTypes.ENUM('completed','ongoing'),
      defaultValue: 'completed',
      comment: '成果状态（completed/ongoing）'
    }
  }, {
    sequelize,
    modelName: 'groupachievement',
    comment: '部门核心成果表'
  });
  return groupachievement;
};