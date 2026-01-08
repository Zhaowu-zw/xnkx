'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     * 
     */
    await queryInterface.changeColumn('Users', 'id', {   
      unsigned: true,
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
    });
    await queryInterface.changeColumn('Users', 'group_id', {
      unsigned: true,
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn('Users', 'id', {   
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,

    });
    await queryInterface.changeColumn('Users', 'group_id', {
      type: Sequelize.INTEGER,
      allowNull: true,

    });
  }
};
