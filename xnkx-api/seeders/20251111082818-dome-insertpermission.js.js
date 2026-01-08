'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   permission_name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('permissions', [
     // 权限数据数组（按模块分组）

      // 一、用户与权限管理
      {
        permission_name: '查看用户列表',
        action: 'user:view',
        description: '允许查看所有用户的基础信息（user表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看用户详情',
        action: 'user:view:detail',
        description: '允许查看用户的个人信息（含userinfo表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '创建用户',
        action: 'user:create',
        description: '允许新增用户（如管理员后台创建）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '编辑用户信息',
        action: 'user:edit',
        description: '允许修改用户的用户名、联系方式等',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '修改用户角色',
        action: 'user:edit:role',
        description: '允许为用户分配/移除角色（操作user_role表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '删除用户',
        action: 'user:delete',
        description: '允许从系统中删除用户',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看用户角色',
        action: 'user:view:role',
        description: '允许查看用户关联的角色列表',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 二、角色与权限配置
      {
        permission_name: '查看角色列表',
        action: 'role:view',
        description: '允许查看所有角色（role表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '创建角色',
        action: 'role:create',
        description: '允许新增自定义角色（如“副组长”）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '编辑角色信息',
        action: 'role:edit',
        description: '允许修改角色名称、权限描述',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '删除角色',
        action: 'role:delete',
        description: '允许移除自定义角色',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '分配角色权限',
        action: 'role:assign:permission',
        description: '允许为角色添加/移除权限（操作role_permission表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看权限列表',
        action: 'permission:view',
        description: '允许查看所有权限（permission表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 三、社团（小组）管理
      {
        permission_name: '查看小组列表',
        action: 'group:view',
        description: '允许查看所有小组（group_info表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看小组详情',
        action: 'group:view:detail',
        description: '允许查看小组的定位、成果等详细信息',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '创建小组',
        action: 'group:create',
        description: '允许新增小组（group_info表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '编辑小组信息',
        action: 'group:edit',
        description: '允许修改组名、定位、职能描述等',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '解散小组',
        action: 'group:delete',
        description: '允许从系统中删除小组',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看人员展示',
        action: 'member_show:view',
        description: '允许查看小组成员的公开信息（member_show表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '编辑人员展示',
        action: 'member_show:edit',
        description: '允许修改成员的公开信息、是否展示',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看隐私信息',
        action: 'member_show:view:private',
        description: '允许查看成员的联系方式等隐私信息',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 四、流程与任务管理 - 纳新管理
      {
        permission_name: '查看纳新列表',
        action: 'recruitment:view',
        description: '允许查看所有报名信息（recruitment表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看个人报名',
        action: 'recruitment:view:own',
        description: '允许查看自己的报名记录',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '提交纳新报名',
        action: 'recruitment:create',
        description: '允许申请加入小组（创建recruitment记录）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '编辑个人报名',
        action: 'recruitment:edit:own',
        description: '允许修改自己的报名信息（未审核时）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '初审纳新报名',
        action: 'recruitment:review:first',
        description: '允许更新初审状态（通过/驳回）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '终审纳新报名',
        action: 'recruitment:review:final',
        description: '允许更新终审状态（通过/驳回）',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 四、流程与任务管理 - 任务管理
      {
        permission_name: '查看任务列表',
        action: 'task:view',
        description: '允许查看所有任务（task表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看组内任务',
        action: 'task:view:group',
        description: '允许查看所属组的任务',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看个人任务',
        action: 'task:view:own',
        description: '允许查看分配给自己的任务（task_user表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '创建任务',
        action: 'task:create',
        description: '允许发布新任务（社团级/组内）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '编辑任务信息',
        action: 'task:edit',
        description: '允许修改任务描述、截止时间、考核标准等',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '删除任务',
        action: 'task:delete',
        description: '允许移除已发布的任务',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '分配任务给用户',
        action: 'task:assign',
        description: '允许将任务关联到用户（操作task_user表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '更新任务状态',
        action: 'task_user:update:status',
        description: '允许修改任务状态（待完成/进行中/已完成）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '提交任务成果',
        action: 'task_user:submit:result',
        description: '允许上传成果链接（仅任务执行人）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '评分任务成果',
        action: 'task_user:score',
        description: '允许为任务执行人打分（仅发布人/管理员）',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 四、流程与任务管理 - 审批管理
      {
        permission_name: '查看审批列表',
        action: 'approval:view',
        description: '允许查看所有审批记录（approval表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看个人审批',
        action: 'approval:view:own',
        description: '允许查看自己发起或待审批的记录',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '发起审批',
        action: 'approval:create',
        description: '允许提交审批申请（纳新/权限交接等）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '处理审批',
        action: 'approval:approve',
        description: '允许更新审批状态（通过/驳回）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看审批历史',
        action: 'approval:view:history',
        description: '允许查看已完成的审批记录',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 五、内容与互动管理 - 消息通知
      {
        permission_name: '查看通知列表',
        action: 'notice:view',
        description: '允许查看自己的通知（notice表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看所有通知',
        action: 'notice:view:all',
        description: '允许查看系统中所有通知（仅管理员）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '发送通知',
        action: 'notice:create',
        description: '允许向用户发送通知（如管理员发布系统通知）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '标记通知已读',
        action: 'notice:mark:read',
        description: '允许更新通知的“已读”状态',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '删除通知',
        action: 'notice:delete',
        description: '允许移除已读/过期通知',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 五、内容与互动管理 - 留言管理
      {
        permission_name: '查看留言列表',
        action: 'comment:view',
        description: '允许查看所有留言（comment表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '发布留言',
        action: 'comment:create',
        description: '允许提交新留言（访客/成员）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '编辑个人留言',
        action: 'comment:edit:own',
        description: '允许修改自己发布的留言',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '删除个人留言',
        action: 'comment:delete:own',
        description: '允许移除自己发布的留言',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '审核留言',
        action: 'comment:review',
        description: '允许更新留言的审核状态（通过/驳回）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '回复留言',
        action: 'comment:reply',
        description: '允许对留言进行回复（仅管理员/成员）',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 五、内容与互动管理 - 活动动态
      {
        permission_name: '查看活动列表',
        action: 'activity:view',
        description: '允许查看所有公开/私有活动（activity表）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '查看私有活动',
        action: 'activity:view:private',
        description: '允许查看非公开的活动（仅成员/管理员）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '创建活动动态',
        action: 'activity:create',
        description: '允许发布新活动（含标题、图片等）',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '编辑个人活动',
        action: 'activity:edit:own',
        description: '允许修改自己发布的活动信息',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '删除个人活动',
        action: 'activity:delete:own',
        description: '允许移除自己发布的活动',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        permission_name: '修改活动公开状态',
        action: 'activity:edit:public',
        description: '允许切换活动的“是否公开”属性',
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // 补充：查看仪表盘
      {
        permission_name: '查看仪表盘',
        action: 'view_dashboard',
        description: '允许用户查看系统仪表盘',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // 批量创建权限的示例代码（使用Sequelize）
    // const { permission } = require('../models');
    // async function initPermissions() {
    //   await permission.bulkCreate(permissions);
    //   console.log('权限初始化完成');
    // }
    // initPermissions();

    , {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
