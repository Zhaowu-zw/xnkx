'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        unsigned: true,
        comment: '主键ID,无符号自增'
      },
      user_id: {
        type: Sequelize.INTEGER,
        unsigned: true,
        allowNull: false,
        reference: { model: 'users',
          key: 'id'
        },
        comment: '用户ID'
      },
      role_id: {
        type: Sequelize.INTEGER,
        unsigned: true,
        allowNull: false,
        reference: { model: 'roles',
          key: 'id'
        },
        comment: '角色ID'
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
    await queryInterface.dropTable('user_roles');
  }
};