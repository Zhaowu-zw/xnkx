'use strict';

const role = require('../models/role');

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
    await queryInterface.bulkInsert('roles', [
      {
        role_name: '管理员',
        permission_desc: '系统管理员，拥有所有权限',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        role_name: "社长",
        permission_desc: '管理整个社团，负责组织和协调各项活动',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        role_name:"指导老师",
        permission_desc: '负责指导和监督社团活动的老师',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        role_name: "组长",
        permission_desc: '负责小组的管理和任务分配',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        role_name: "组员",
        permission_desc: '参与社团活动的普通成员',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        role_name: "普通用户",
        permission_desc: '仅能浏览公开信息的用户',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {}
      )
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('roles', null, {});
  }
};
