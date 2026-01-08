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
    await queryInterface.bulkInsert('Users', [{
      username: 'Admin',
      password: 'W123456',
      role_name: '管理员',
      email: '2656085338@qq.com',
      createtime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
        username: 'Admin1',
      password: 'W123456',
        role_name: '指导老师',
        email: '2656085339@qq.com',
        createtime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }, {
        username: 'Admin2',
      password: 'W123456',
        role_name: '组长',
        email: '2656085333@qq.com',
        createtime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }, {
        username: 'Admin3',
      password: 'W123456',
        role_name: '组员',
        email: '2656085334@qq.com',
        createtime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }, {
        username: 'Admin4',
      password: 'W123456',
      role_name: '普通用户',
        email: '2656085337@qq.com',
        createtime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Users', [{
      username: 'Admin',
      password: 'Adminpassword',
      role:'管理员',
      email: '2656085338@qq.com',
      createtime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      username: 'Admin1',
      password: 'Adminpassword',
      role:'指导老师',
      email: '2656085339@qq.com',
      createtime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      username: 'Admin2',
      password: 'Adminpassword',
      role:'组长',
      email: '2656085333@qq.com',
      createtime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      username: 'Admin3',
      password: 'Adminpassword',
      role:'组员',
      email: '2656085334@qq.com',
      createtime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      username: 'Admin4',
      password: 'Adminpassword',
      role:'普通用户',
      email: '2656085337@qq.com',
      createtime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    ], {});
  }
};
