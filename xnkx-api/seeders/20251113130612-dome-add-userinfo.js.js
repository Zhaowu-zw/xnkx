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
        user_id: 55,
        nickname: '张三',
        age: 20,
        sex: '男',
        hobbit: '阿U会从爱你',
        avatar: 'https://example.com/avatar1.png',
        description: '西餐哦啊爱上大大CAD千秋万代去',
        telephone: '1234567890',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id: 56,
        nickname: '李四',
        age: 33,
        sex: '男',
        hobbit: '喜欢吃草',
        avatar: 'https://example.com/avatar1.png',
        description: '你从啊超耐磨啊煤矿机械不凑巧',
        telephone: '1234567890',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id: 57,
        nickname: '李丽',
        age: 20,
        sex: '女',
        hobbit: '追剧',
        avatar: 'https://example.com/avatar1.png',
        description: '性格活泼开朗，具有良好的学习能力和心理素质',
        telephone: '1234567890',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id: 58,
        nickname: '王五',
        age: 18,
        sex: '男',
        hobbit: '游戏',
        avatar: 'https://example.com/avatar1.png',
        description: '这人很懒',
        telephone: '1234567890',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id: 59,
        nickname: '不死狗',
        age: 30,
        sex: '男',
        hobbit: '狗叫',
        avatar: 'https://example.com/avatar1.png',
        description: '汪汪汪汪',
        telephone: '1234567890',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {})
    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('People', null, {});
  }
};
