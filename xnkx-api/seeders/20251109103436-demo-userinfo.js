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
    
    await queryInterface.bulkInsert('userinfos', [
      {
        user_id: 17,
        nickname: '朝雾',
        age: 30,
        sex: '男',
        hobbit: '打游戏',
        avatar: 'https://example.com/avatar1.png',
        description: '喜欢系统管理员，负责管理和维护系统。',
        telephone: '1234567890',
        department: '计算机学院',
        grade: '2023级',
        student_number: '202312345',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id: 18,
        nickname: '朝雾1',
        age: 28,  
        sex: '女',
        hobbit: '组织协调',
        avatar: 'https://example.com/avatar2.png',
        description: '项目组组长，负责团队管理和任务分配。',
        telephone: '0987654321',
        department: '软件学院',
        grade: '2023级',
        student_number: 'G20230001',
        createdAt: new Date(),
        updatedAt: new Date()
      }, {
        user_id: 19,
        nickname: '朝雾2',
        department: null,
        grade: null,
        student_number: null,
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
    await queryInterface.bulkDelete('userinfos', null, {});
  }
};
