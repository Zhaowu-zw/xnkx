'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add missing indexes to feedbacks table (plural name)
    await queryInterface.addIndex('feedbacks', ['handler_id'], { name: 'idx_feedback_handler_id' });
    await queryInterface.addIndex('feedbacks', ['updated_at'], { name: 'idx_feedback_updated_at' });
    await queryInterface.addIndex('feedbacks', ['status'], { name: 'idx_feedback_status' });

    // Check if foreign keys are already added
    try {
      // Add foreign key from feedbacks.user_id to users.id
      await queryInterface.addConstraint('feedbacks', {
        fields: ['user_id'],
        type: 'foreign key',
        name: 'fk_feedback_user_id',
        references: {
          table: 'users',
          field: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      // Add foreign key from feedbacks.handler_id to users.id
      await queryInterface.addConstraint('feedbacks', {
        fields: ['handler_id'],
        type: 'foreign key',
        name: 'fk_feedback_handler_id',
        references: {
          table: 'users',
          field: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    } catch (error) {
      console.log('Foreign key constraint error (may already exist):', error.message);
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove foreign keys if they exist
    try {
      await queryInterface.removeConstraint('feedbacks', 'fk_feedback_user_id');
      await queryInterface.removeConstraint('feedbacks', 'fk_feedback_handler_id');
    } catch (error) {
      console.log('Error removing foreign keys (may not exist):', error.message);
    }

    // Remove indexes we added
    await queryInterface.removeIndex('feedbacks', 'idx_feedback_handler_id');
    await queryInterface.removeIndex('feedbacks', 'idx_feedback_updated_at');
    await queryInterface.removeIndex('feedbacks', 'idx_feedback_status');
  }
};
