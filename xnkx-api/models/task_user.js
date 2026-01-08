'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class task_user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.task_user.belongsTo(models.task, {
        foreignKey: 'task_id',
        as: 'task',
        onDelete: 'CASCADE'
      });
      // 关联用户
      models.task_user.belongsTo(models.user, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE'
      });
    }
  }
  task_user.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    task_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'task',
        key: 'id'
      },
      onDelete: 'CASCADE' // 任务删除时，同步删除关联记录
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE' // 用户删除时，同步删除关联记录
    },
    status: {
      type: DataTypes.ENUM('pending', 'ongoing', 'completed'),
      defaultValue: 'ongoing',
      allowNull: false
    },
    // 添加用户提交的文件、图片和文字字段
    submit_files: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '用户提交的文件，JSON格式存储文件路径数组'
    },
    submit_images: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '用户提交的图片，JSON格式存储图片路径数组'
    },
    submit_content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户提交的文字内容'
    },
    score: {
      type: DataTypes.DECIMAL(5, 2), // 最大99.99分
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    }
  }, {
    sequelize,
    modelName: 'task_user',
    indexes: [
      { fields: ['status'] },
      { fields: ['score'] }
    ]
  });
  return task_user;
};