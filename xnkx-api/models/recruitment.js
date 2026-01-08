'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class recruitment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
     models.recruitment.belongsTo(models.user, {
        foreignKey: 'user_id',
       as: 'applicant',
       onDelete: 'CASCADE'
      });
      // 关联意向小组
      models.recruitment.belongsTo(models.group_info, {
        foreignKey: 'intention_group_id',
        as: 'intentionGroup',
        onDelete: 'RESTRICT'
      });
      // 关联审核人
      models.recruitment.belongsTo(models.user, {
        foreignKey: 'reviewer_id',
        as: 'reviewer',
        onDelete: 'SET NULL'
      });
    }
  }
  recruitment.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // 关联User表（表名通常为复数）
        key: 'id'
      },
      onDelete: 'CASCADE' // 用户删除时，同步删除纳新记录
    },
    intention_group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'group_infos', // 关联Group表
        key: 'id'
      },
      onDelete: 'RESTRICT' // 小组删除时，禁止删除纳新记录（避免数据丢失）
    },
    application_info: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    first_review_status: {
      type: DataTypes.ENUM('pending', 'passed', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    final_review_status: {
      type: DataTypes.ENUM('pending', 'passed', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    },
    reviewer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL' // 审核人删除时，设为NULL
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: { args: [2, 15], msg: "昵称长度必须在2到15个字符之间" },
        is: {
          args: /^[\u4e00-\u9fa5]+$/,
          msg: "用户名只能包含中文"
        },
      },
    },
    sno: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: { args: [0, 30], msg: "学号长度不能超过30个字符" }
      }
    },
    iphone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: /^1[3-9]\d{9}$/,
          msg: "电话号码格式不正确"
        }
      }
    },
    update_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    modelName: 'recruitment',
    sequelize,
    timestamps: false ,// 新增：禁用自动时间戳
    indexes: [
      { fields: ['user_id'] },
      { fields: ['intention_group_id'] },
      { fields: ['first_review_status'] },
      { fields: ['final_review_status'] },
      { fields: ['reviewer_id'] }
    ]
  });
  return recruitment;
};