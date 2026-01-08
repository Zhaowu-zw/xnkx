'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class role_permission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  role_permission.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      comment: '主键ID,无符号自增',
    },
    role_id: {
      type: DataTypes.INTEGER,
      unsingned: true,
      allowNull: false,
    },
    permission_id: {
      type: DataTypes.INTEGER,
      unsingned: true,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'role_permission',
    indexes: [
      { fields: ['role_id'] },
      { fields: ['permission_id'] },
    ]
  });
  return role_permission;
};