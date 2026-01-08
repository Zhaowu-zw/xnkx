'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feedback', { // 直接指定表名为 feedback（单数），避免后续模型配置麻烦
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
        comment: '反馈ID（主键）'
      },
      feedback_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '反馈类型：suggestion(功能建议)、bug(BUG反馈)、ui(界面优化)、other(其他问题)'
      },
      rating: {
        type: Sequelize.TINYINT,
        allowNull: false,
        comment: '满意度评分：1-5分（1=非常不满意，5=非常满意）'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '反馈详细内容'
      },
      contact: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '联系方式（手机号/邮箱，选填）'
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: '提交用户ID（已登录用户，关联用户表）'
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '提交用户名（匿名则为"匿名用户"）'
      },
      ip_address: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '提交IP地址'
      },
      device_info: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '设备信息（浏览器/系统版本，可选）'
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0, // 状态默认值：待处理
        comment: '处理状态：0=待处理，1=处理中，2=已解决，3=已驳回'
      },
      handler_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        comment: '处理人ID（关联管理员表）'
      },
      handle_note: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '处理备注'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        comment: '提交时间'
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        onUpdate: Sequelize.NOW,
        comment: '最后更新时间'
      }
    });

    // 添加索引（优化查询）
    await queryInterface.addIndex('feedback', ['user_id'], { name: 'idx_user_id' });
    await queryInterface.addIndex('feedback', ['feedback_type'], { name: 'idx_feedback_type' });
    await queryInterface.addIndex('feedback', ['status'], { name: 'idx_status' });
    await queryInterface.addIndex('feedback', ['created_at'], { name: 'idx_created_at' });
  },

  async down(queryInterface, Sequelize) {
    // 先删索引再删表
    await queryInterface.removeIndex('feedback', 'idx_user_id');
    await queryInterface.removeIndex('feedback', 'idx_feedback_type');
    await queryInterface.removeIndex('feedback', 'idx_status');
    await queryInterface.removeIndex('feedback', 'idx_created_at');
    await queryInterface.dropTable('feedback');
  }
};