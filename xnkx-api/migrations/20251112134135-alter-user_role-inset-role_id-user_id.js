'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 给 user_roles.role_id 添加外键（关联 roles.id）
    await queryInterface.changeColumn('user_roles', 'role_id', {
      type: Sequelize.INTEGER, // 必须指定字段类型（与 roles.id 一致）
      allowNull: false, // 通常外键字段不允许为 null
      references: {
        model: 'roles', // 关联的表名（注意是数据库中的实际表名，可能小写）
        key: 'id'       // 关联表的字段
      },
      onDelete: 'CASCADE', // 可选：当 roles 表中对应记录被删除时，级联删除 user_roles 中的记录
      onUpdate: 'CASCADE'  // 可选：当 roles 表中 id 被更新时，级联更新 user_roles 中的 role_id
    });

    // 给 user_roles.user_id 添加外键（关联 users.id）
    await queryInterface.changeColumn('user_roles', 'user_id', {
      type: Sequelize.INTEGER, // 与 users.id 类型一致
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // 移除外键约束（需要先删除约束，再修改字段）
    // 注意：如果数据库自动生成了约束名，需要替换为实际名称（可通过数据库查询）
    await queryInterface.removeConstraint('user_roles', 'user_roles_role_id_roles_fk');
    await queryInterface.removeConstraint('user_roles', 'user_roles_user_id_users_fk');

    // 恢复字段配置（移除外键关联，保留原始类型）
    await queryInterface.changeColumn('user_roles', 'role_id', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    await queryInterface.changeColumn('user_roles', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  }
};