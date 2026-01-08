'use strict';
const {
  Model
} = require('sequelize');
const bcrypt = require('bcryptjs');
const { on } = require('../app');

module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.user.hasOne(models.userinfo, { foreignKey: 'user_id' ,onDelete:'CASCADE'});
      models.user.belongsToMany(models.role, {
        through: 'user_roles', // 中间表：用户-角色关联表
        foreignKey: 'user_id', // 中间表中关联当前用户表的字段
        otherKey: 'role_id'    // 中间表中关联角色表的字段
      },{ onDelete: 'CASCADE' });
      models.user.belongsTo(models.group_info, { foreignKey: 'group_id', targetKey: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
      models.user.hasOne(models.approval, { foreignKey: 'applicant_id', onDelete: 'RESTRICT' });
      models.user.hasOne(models.approval, { foreignKey: 'approver_id', onDelete: 'SET NULL' });
      models.user.hasOne(models.recruitment, { foreignKey: 'reviewer_id', onDelete: 'SET NULL' });
      models.user.hasOne(models.recruitment, { foreignKey: 'user_id', onDelete: 'CASCADE' });
      models.user.hasOne(models.task, { foreignKey: 'publisher_id', onDelete: 'RESTRICT' });
      models.user.hasOne(models.task, { foreignKey: 'task_id', onDelete: 'CASCADE' });
      models.task.hasMany(models.task_user, {
        foreignKey: 'user_id',
        as: 'Users',
        sourceKey: 'id',
        onDelete: 'CASCADE'
      });
      models.user.hasOne(models.activity, { foreignKey: 'creator_id', onDelete: 'RESTRICT' });
      models.user.hasOne(models.feedback, { foreignKey: 'handler_id', onDelete: 'SET NULL' });
      models.user.hasOne(models.feedback, { foreignKey: 'user_id', onDelete: 'SET NULL' });
      models.user.hasOne(models.notice, { foreignKey: 'receiver_id', onDelete: 'CASCADE' });
      
    }
  }
  user.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
  comment: '主键ID,无符号自增',
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, 
      validate: {
        notNull: { msg: "用户名必须填写" },
        notEmpty: { msg: "用户名不能为空" },
        len: { args: [2, 15], msg: "用户名长度必须在2到15个字符之间" },
        is: {
          args: /^[A-Z][a-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/,
          msg: "用户名必须以大写字母开头，可包含小写字母、数字及特殊符号"
        },
        async isUnique(value)  {
          const condition = { where: { username: value } };
          const existingUser = await user.findOne(condition);
          if (existingUser) {
            throw new Error('用户名已存在');
          }
        }
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "密码必须填写" },
        notEmpty: { msg: "密码不能为空" },
      },
      set(value) {
        if (value.length >= 6 && value.length <= 20) {
          const hashedPassword = bcrypt.hashSync(value, 10);
          this.setDataValue('password', hashedPassword);
        } else {
          throw new Error('密码长度必须在6到12个字符之间');
        }

      }
    },
    role_name: {
      type: DataTypes.ENUM("普通用户", "组员", "组长", "指导老师", "社长","管理员"),
      allowNull: false,
      defaultValue: "普通用户",
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'group_infos', // 关联的表名（与 member_show 一致）
        key: 'id'             // 关联 group_info 表的主键
      },
      onDelete: 'SET NULL',  // 小组删除时，user.group_id 设为 NULL（与 member_show 统一）
      onUpdate: 'CASCADE'  
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: "邮箱必须填写" },
        notEmpty: { msg: "邮箱不能为空" },
        isEmail: { msg: "邮箱格式不正确" },
        async isUnique(value) {
          const existingEmail = await this.sequelize.models.user.findOne({
            where: { email: value }
          });
          if (existingEmail) {
            throw new Error('邮箱已存在');
          }
        }
      }, 
    },
    createtime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'user',
    indexes: [
      { fields: ['role_name'] },
      { fields: ['group_id'] },
    ]
  });
  return user;
};