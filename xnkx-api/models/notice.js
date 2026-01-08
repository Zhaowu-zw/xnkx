'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class notice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.notice.belongsTo(models.user, {
        foreignKey: 'receiver_id',
        as: 'receiver',
        onDelete: 'CASCADE'
      });
    }
  }
  notice.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    notice_type: {
      type: DataTypes.ENUM('system', 'task', 'approval', 'recruit'),
      allowNull: false
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE' // 接收人删除时，同步删除通知
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_read: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      allowNull: false,
      validate: {
        isIn: [[0, 1]] // 仅允许0或1
      }
    },
    send_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'notice',
    indexes: [
      { fields: ['notice_type'] },
      { fields: ['receiver_id'] },
      { fields: ['is_read'] },
      { fields: ['send_time'] }
    ]
  });
  return notice;
};