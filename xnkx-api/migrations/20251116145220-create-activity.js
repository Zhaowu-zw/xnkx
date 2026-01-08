'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      activity_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      image_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
        // 可选：解析为数组的getter
        get() {
          const url = this.getDataValue('image_url');
          return url ? url.split(',') : [];
        },
        // 可选：存储为逗号分隔字符串的setter
        set(value) {
          this.setDataValue('image_url', Array.isArray(value) ? value.join(',') : value);
        }
      },
      creator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'RESTRICT' // 创建人删除时，禁止删除活动（避免数据丢失）
      },
      is_public: {
        type: Sequelize.TINYINT,
        defaultValue: 1,
        allowNull: false,
        validate: {
          isIn: [[0, 1]]
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activities');
  }
};