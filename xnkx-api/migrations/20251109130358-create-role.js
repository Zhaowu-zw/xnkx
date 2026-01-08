'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        unsinged: true
      },
      role_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '角色名称'
      },
      permission_desc: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '权限描述'
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
    await queryInterface.renameColumn('users', 'role', 'role_name');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('roles');
  }
};