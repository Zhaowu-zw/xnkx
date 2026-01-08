'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class permission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here 
      // console.log(models)
      models.permission.belongsToMany(models.role, {
        through: 'role_permissions', // 中间表：角色-权限关联表
        foreignKey: 'permission_id', // 中间表中关联当前权限表的字段
        otherKey: 'role_id'           // 中间表中关联角色表的字段
      }, { onDelete: 'CASCADE', onUpdate:'CASCADE' });
    }
  }
 
  permission.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      comment: '主键ID,无符号自增',
    },
    permission_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '权限名称'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '权限动作标识'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '权限描述'
    }
  }, {
    sequelize,
    modelName: 'permission',
  });
  return permission;
};