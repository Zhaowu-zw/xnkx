'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 查询角色（id, role_name）和权限（id, action）
    const [rolesRows] = await queryInterface.sequelize.query(`SELECT id, role_name FROM roles;`);
    const [permissionsRows] = await queryInterface.sequelize.query(`SELECT id, action FROM permissions;`);

    if (rolesRows.length === 0 || permissionsRows.length === 0) {
      throw new Error('roles 表或 permissions 表无数据，无法插入关联记录');
    }

    // 将权限按 action 建立索引
    const permByAction = {};
    permissionsRows.forEach(p => { permByAction[p.action] = p.id; });

    // 将角色按名称建立索引
    const roleByName = {};
    rolesRows.forEach(r => { roleByName[r.role_name] = r.id; });

    // 定义每个角色应具有的权限 action 列表（可根据需要调整）
    const rolePermissionActions = {
      // 管理员：全部权限
      '管理员': Object.keys(permByAction),

      // 社长：社团/小组/活动/任务相关，以及仪表盘查看和通知
      '社长': Object.keys(permByAction).filter(a => a.startsWith('group') || a.startsWith('activity') || a.startsWith('task') || a.startsWith('recruitment') || a.startsWith('member_show') || a === 'view_dashboard' || a.startsWith('notice')),

      // 指导老师：审批、查看相关（审批/纳新/查看活动/仪表盘）
      '指导老师': Object.keys(permByAction).filter(a => a.startsWith('approval') || a.startsWith('recruitment') || a.startsWith('activity') || a === 'view_dashboard' || a.startsWith('notice')),

      // 组长：组内管理、任务分配、活动编辑、成员展示
      '组长': Object.keys(permByAction).filter(a => a.startsWith('group') || a.startsWith('task') || a.startsWith('member_show') || a.startsWith('activity')),

      // 组员：查看、参与、提交任务/报名/评论
      '组员': Object.keys(permByAction).filter(a => a.endsWith(':create') || a.endsWith(':submit:result') || a.endsWith(':view:own') || a.endsWith(':view') || a === 'view_dashboard' || a.startsWith('comment')),

      // 普通用户：仅能查看公开信息与提交个人申请/评论
      '普通用户': Object.keys(permByAction).filter(a => a.endsWith(':create') || a.endsWith(':view:own') || a.endsWith(':view') || a.startsWith('comment') || a === 'view_dashboard')
    };

    // 生成插入数组（去重）
    const inserts = [];
    const seen = new Set();

    for (const [roleName, actions] of Object.entries(rolePermissionActions)) {
      const rid = roleByName[roleName];
      if (!rid) continue; // 如果角色不存在则跳过

      // 如果管理员策略是全部权限，直接插入所有 permission id
      if (roleName === '管理员') {
        permissionsRows.forEach(p => {
          const key = `${rid}_${p.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            inserts.push({ role_id: rid, permission_id: p.id, createdAt: new Date(), updatedAt: new Date() });
          }
        });
        continue;
      }

      actions.forEach(action => {
        const pid = permByAction[action];
        if (!pid) return; // 权限 action 不存在则跳过
        const key = `${rid}_${pid}`;
        if (!seen.has(key)) {
          seen.add(key);
          inserts.push({ role_id: rid, permission_id: pid, createdAt: new Date(), updatedAt: new Date() });
        }
      });
    }

    if (inserts.length === 0) {
      throw new Error('未生成任何 role_permissions 插入数据，请检查 role 名称与 permissions 的 action 是否匹配');
    }

    await queryInterface.bulkInsert('role_permissions', inserts, {});
  },

  async down(queryInterface) {
    // 回滚：删除 role_permissions 表的所有数据
    await queryInterface.bulkDelete('role_permissions', null, {});
  }
};