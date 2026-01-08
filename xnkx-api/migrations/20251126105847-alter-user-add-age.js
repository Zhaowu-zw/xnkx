'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('userinfos', 'department', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '院系'
    });
    await queryInterface.addColumn('userinfos', 'grade', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '年级'
    });
    await queryInterface.addColumn('userinfos', 'student_number', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '学号'
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('userinfos', 'student_number');
    await queryInterface.removeColumn('userinfos', 'grade');
    await queryInterface.removeColumn('userinfos', 'department');
  }
};
