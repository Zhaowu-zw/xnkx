'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('groupachievements', {
      id: {
        allowNull: false,        // 不允许为空
        autoIncrement: true,     // 自增
        primaryKey: true,        // 主键
        type: Sequelize.INTEGER,
        comment: '成果ID（自增主键）'
      },
      title: {
        type: Sequelize.STRING(100), // 限制长度100，避免过长
        allowNull: false,            // 标题不能为空
        comment: '成果标题'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '成果详细描述'
      },
      activity_time: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '成果完成/开展时间'
      },
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '所属小组ID（关联groups表）',
        // 添加外键约束，关联groups表的id字段
        references: {
          model: 'group_infos', // 关联的表名（需确保groups表已创建）
          key: 'id'        // 关联的字段
        },
        // 外键级联规则：当关联的小组被删除时，设置为NULL（也可根据需求改为CASCADE）
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // 禁止删除有成果关联的小组，避免数据丢失
      },
      image_url: {
        type: Sequelize.STRING(255), // 适配图片路径长度
        allowNull: true,
        comment: '成果图片URL/存储路径'
      },
      status: {
        type: Sequelize.ENUM('completed', 'ongoing'), // 枚举类型，仅允许两个值
        allowNull: false,
        defaultValue: 'completed', // 默认值为已完成
        comment: '成果状态（completed：已完成，ongoing：进行中）'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW, // 默认值为当前时间
        comment: '记录创建时间'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        comment: '记录更新时间'
      }
    }, {
      // 表级配置
      charset: 'utf8mb4', // 支持emoji等特殊字符
      collate: 'utf8mb4_unicode_ci', // 排序规则
      comment: '社团部门核心成果表' // 表注释
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('groupachievements');
  }
};