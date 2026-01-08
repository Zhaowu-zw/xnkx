'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // 关联发布人
      models.task.belongsTo(models.user, {
        foreignKey: 'publisher_id',
        as: 'publisher',
        onDelete: 'RESTRICT'
      });
      // 关联所属小组
      models.task.belongsTo(models.group_info, {
        foreignKey: 'group_id',
        as: 'group',
        onDelete: 'RESTRICT'
      });
      // 关联任务-用户关联表（一对多）
      models.task.hasMany(models.task_user, {
        foreignKey: 'task_id',
        as: 'taskUsers',
        sourceKey: 'id',
        onDelete: 'CASCADE'
      });
    }
  }
  task.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    task_type: {
      type: DataTypes.ENUM('club', 'group'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        // 1. 先校验是否是合法Date，再校验格式（更严格）
        isDate: {
          msg: "截止时间必须是合法的日期格式（如：2025-11-28 23:59:59）"
        },
        // 2. 可选：强制格式为 YYYY-MM-DD HH:mm:ss（避免模糊格式）
        isAfterNow(value) {
          const date = new Date(value);
          if (date <= new Date()) {
            throw new Error("截止时间必须晚于当前时间");
          }
        }
      },
      set(value) {
        // 转换前先校验，避免写入Invalid Date
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error(`截止时间格式错误，收到：${value}`);
        }
        this.setDataValue('deadline', date);
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'ongoing', 'completed'),
      defaultValue: 'ongoing',
      allowNull: false
    },
    publisher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'RESTRICT'
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'group_infos',
        key: 'id'
      },
      onDelete: 'RESTRICT'
    },
    assessment_criteria: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // 添加任务文件和图片字段
    task_files: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '任务相关文件，JSON格式存储文件路径数组'
    },
    task_images: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '任务相关图片，JSON格式存储图片路径数组'
    },

  },{
    sequelize,
    modelName: 'task',
    indexes: [
      { fields: ['task_type'] },
      { fields: ['deadline'] },
      { fields: ['publisher_id'] },
      { fields: ['group_id'] }
    ]
  });
  return task;
};