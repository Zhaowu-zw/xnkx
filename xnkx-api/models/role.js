'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      role.belongsToMany(models.user, {
        through: 'user_roles', // 中间表：用户-角色关联表
        foreignKey: 'role_id', // 中间表中关联当前角色表的字段
        otherKey: 'user_id'    // 中间表中关联用户表的字段
      }, { onDelete: 'CASCADE' });
      role.belongsToMany(models.permission, {
      through: 'role_permissions', // 中间表：角色-权限关联表
      foreignKey: 'role_id', // 中间表中关联当前角色表的字段
      otherKey: 'permission_id'    // 中间表中关联权限表的字段
      }, { onDelete: 'CASCADE' });
    }
    
  }
  role.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      comment: '主键ID,无符号自增',
    },
    role_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '角色名称',
      validate: {
        notEmpty: {
          msg: '角色名称不能为空'
        }
      }
    } ,
    permission_desc: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '权限描述',
      validate: {
        len: {
          args: [0, 255],
          msg: '权限描述不能超过255个字符'
        }
      }
    } 
  }, {
    sequelize,
    modelName: 'role',
  });
  return role;
};