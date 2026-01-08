'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 1. 查询用户表（表名小写，只需要 id）
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users;`
    );
    // 2. 查询角色表（表名小写，需要 id 和 role_name）
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, role_name FROM roles;`
    );

    const userRows = users;
    const roleRows = roles;
    const userRoles = [];

    // 分配角色时增加容错判断（避免数组越界）
    if (userRows.length > 0 && roleRows.length > 0) {
      // 查找“管理员”角色
      const adminRole = roleRows.find(role => role.role_name === '管理员');
      if (adminRole) {  // 确保找到角色再添加
        userRoles.push({
          user_id: userRows[0].id,
          role_id: adminRole.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (userRows.length > 1 && roleRows.length > 0) {
      // 查找“社长”和“组长”角色
      const leaderRole = roleRows.find(role => role.role_name === '社长');
      const groupRole = roleRows.find(role => role.role_name === '组长');

      if (leaderRole) {
        userRoles.push({
          user_id: userRows[1].id,
          role_id: leaderRole.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      if (groupRole) {
        userRoles.push({
          user_id: userRows[1].id,
          role_id: groupRole.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // 批量插入关联数据
    await queryInterface.bulkInsert('user_roles', userRoles, {});
  },

  async down(queryInterface) {
    // 回滚：删除 user_roles 表的所有数据
    await queryInterface.bulkDelete('user_roles', null, {});
  }
};