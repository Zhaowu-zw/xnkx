'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class system_configs extends Model {
    static associate(models) {
      // 暂无关联关系，留空即可
    }
  }
  system_configs.init({
    // 配置键
    key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
      comment: '配置键'
    },
    // 配置值
    value: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '配置值'
    },
    // 配置描述
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '配置描述'
    },
    // 更新时间
    update_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    modelName: 'system_configs',
    sequelize,
    timestamps: false,
    indexes: [
      { fields: ['key'] },
      { fields: ['update_time'] }
    ]
  });
  return system_configs;
};