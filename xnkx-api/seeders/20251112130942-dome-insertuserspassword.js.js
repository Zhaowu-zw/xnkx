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
    //将所有用户的密码重新加密存储
    const bcrypt = require('bcryptjs');
    const users = await queryInterface.sequelize.query(
      `SELECT id, password FROM users;`
    );
    const userRows = users[0];
    for (const user of userRows) {
      const hashedPassword =  bcrypt.hashSync(user.password, 10);
      await queryInterface.sequelize.query(
        `UPDATE users SET password='${hashedPassword}' WHERE id=${user.id};`
      );
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    //无法还原密码加密操作
  }
};
