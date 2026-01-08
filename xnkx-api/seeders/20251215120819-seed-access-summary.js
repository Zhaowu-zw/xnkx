'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 插入近7天总访问量测试数据
    const today = new Date();
    const seedData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const statDate = date.toISOString().split('T')[0];
      // 随机访问量（300-350）
      const visitCount = Math.floor(Math.random() * 50) + 300;
      // 随机趋势（-5~10）
      const trend = (Math.random() * 15 - 5).toFixed(1);

      seedData.push({
        statDate,
        pagePath: '',
        visitCount,
        trend,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    await queryInterface.bulkInsert('AccessSummaries', seedData, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('AccessSummaries', { pagePath: '' }, {});
  }
};