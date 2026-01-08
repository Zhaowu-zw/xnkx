'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class feedback extends Model {
    static associate(models) {
      // 关联用户表（如果项目有 User 模型）
      if (models.user) {
        feedback.belongsTo(models.user, {
          foreignKey: 'user_id',
          as: 'submitUser',
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
      }
      // 关联管理员表（如果项目有 Admin 模型）
      if (models.user) {
        feedback.belongsTo(models.user, {
          foreignKey: 'handler_id',
          as: 'handler',
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
      }
    }
  }

  feedback.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    feedback_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '反馈类型：suggestion(功能建议)、bug(BUG反馈)、ui(界面优化)、other(其他问题)',
      validate: {
        isIn: [['suggestion', 'bug', 'ui', 'other']] // 限制输入值范围
      }
    },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '满意度评分：1-5分（1=非常不满意，5=非常满意）',
      validate: {
        min: 1,
        max: 5 // 限制评分1-5分
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '反馈详细内容'
    },
    contact: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '联系方式（手机号/邮箱，选填）'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '提交用户ID（已登录用户，关联用户表）'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '提交用户名（匿名则为"匿名用户"）'
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '提交IP地址'
    },
    device_info: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '设备信息（浏览器/系统版本，可选）'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '处理状态：0=待处理，1=处理中，2=已解决',
      validate: {
        isIn: [[0, 1, 2]] // 限制状态值范围
      }
    },
    handler_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '处理人ID（关联管理员表）'
    },
    handle_note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '处理备注'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '提交时间'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '最后更新时间'
    }
  }, {
    sequelize,
    modelName: 'feedback',
    timestamps: true,
    createdAt: 'created_at', // 映射数据库字段 created_at
    updatedAt: 'updated_at', // 映射数据库字段 updated_at
    underscored: true, // 启用下划线命名（匹配数据库字段风格）
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  });

  return feedback;
};