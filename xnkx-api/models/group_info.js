'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class group_info extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.group_info.hasMany(models.member_show, {
        foreignKey: 'group_id', // 外键字段
        sourceKey: 'id', // 小组表的主键
      }, { onDelete: 'CASCADE' });
      models.group_info.hasMany(models.user, {
        foreignKey: 'group_id', // 外键字段
        sourceKey: 'id', // 小组表的主键
      }, { onDelete: 'CASCADE' });
      models.group_info.hasMany(models.groupachievement, {
        foreignKey: 'group_id',
        as: 'groupachievement'
      });

      models.group_info.hasOne(models.recruitment, { foreignKey: 'intention_group_id', onDelete: 'RESTRICT' });
      models.group_info.hasOne(models.task, { foreignKey: 'group_id', onDelete: 'RESTRICT' });
      models.group_info.hasOne(models.activity, { foreignKey: 'group_id', onDelete: 'RESTRICT' });
    }
  }
  group_info.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      comment: '主键ID,无符号自增',
    },
    group_name: {
      type: DataTypes.STRING(50), // 组名（长度限制）
      allowNull: false, // 非空
      unique:true,
      comment: '小组名称',
      vlidate: {
        notEmpty: true,
      }
    },
    group_position: {
      type: DataTypes.STRING(100), // 组定位
      allowNull: false,
      comment: '小组定位/方向',
      vlidate: {
        notEmpty: true,
      }
    },
    function_desc: {
      type: DataTypes.TEXT, // 职能描述（长文本）
      allowNull: true,
      comment: '小组职能详细描述',
      vlidate: {
        notEmpty: true,
      }
    },
    core_achievements: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '核心成果',
      vlidate: {
        notEmpty: true,
      }
    },
    create_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // 默认当前时间
      comment: '创建时间'
    }
  }, {
    sequelize,
    modelName: 'group_info',
  });
  return group_info;
};