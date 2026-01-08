'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('permissions', [
      {
        permission_name: '查看用户',
        action: 'view_user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '编辑用户',
        action: 'edit_user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '删除用户',
        action: 'delete_user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '创建用户',
        action: 'create_user',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('permissions', null, {});
  }
};
