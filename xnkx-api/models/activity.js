'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class activity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // 关联创建人
      models.activity.belongsTo(models.user, {
        foreignKey: 'creator_id',
        as: 'creator',
        onDelete: 'RESTRICT'
      });

      models.activity.belongsTo(models.group_info, {
        foreignKey: 'group_id',
        as: 'groupid',
        onDelete: 'RESTRICT'
      });
    }
  }
  activity.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    brief: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    activity_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      // 可选：解析为数组的getter
      get() {
        const url = this.getDataValue('image_url');
        return url ? url.split(',') : [];
      },
      // 可选：存储为逗号分隔字符串的setter
      set(value) {
        this.setDataValue('image_url', Array.isArray(value) ? value.join(',') : value);
      }
    },
    creator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'RESTRICT' // 创建人删除时，禁止删除活动（避免数据丢失）
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'group_infos',
        key: 'id'
      },
      onDelete: 'RESTRICT'
    }
  }, {
    sequelize,
    modelName: 'activity',
    indexes: [
      { fields: ['title'] }, // 支持标题模糊查询
      { fields: ['activity_time'] },
      { fields: ['creator_id'] },
      { fields: ['is_public'] }
    ]
  });
  return activity;
};