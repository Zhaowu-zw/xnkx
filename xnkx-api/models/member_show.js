'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class member_show extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.member_show.belongsTo(models.group_info, {
        foreignKey: 'group_id',
        targetKey: 'id',
       onDelete: 'CASCADE' 
      });
      models.member_show.belongsTo(models.user, {
        foreignKey: 'user_id',
        targetKey: 'id',
        onDelete: 'CASCADE'
      });
    }
  }
  member_show.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      comment: '主键ID,无符号自增',
    },
    user_id: {
      type: DataTypes.INTEGER, // 关联用户表的 ID（假设用户表主键为整数）
      allowNull: false,
      comment: '关联的用户ID'
    },
    group_id: {
      type: DataTypes.INTEGER, // 关联小组表的 ID
      allowNull: false,
      comment: '所属小组ID'
    },
    is_show: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // 默认展示
      comment: '是否对外展示（true/false）'
    }
  }, {
    sequelize,
    modelName: 'member_show',
  });
  return member_show;
};