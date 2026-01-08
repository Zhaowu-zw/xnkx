'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user_role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  user_role.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      comment: '主键ID,无符号自增',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',
      comment: '角色状态：active（活跃）、pending（待审批）、inactive（已失效）'
    }
  }, {
    sequelize,
    modelName: 'user_role',
    indexes: [
      { fields: ['role_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['user_id', 'status'] },
      { fields: ['role_id', 'status'] }
    ]
  });
  return user_role;
};