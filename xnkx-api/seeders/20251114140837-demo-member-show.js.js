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
    // 步骤1：查询user表前6名用户（假设user表存在，主键为id）
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users LIMIT 6',
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (users.length < 6) {
      console.warn('警告：user表中用户不足6个，种子数据可能不完整');
    }

    // 步骤2：查询刚插入的3个小组（通过group_name精准定位）
    const groups = await queryInterface.sequelize.query(
      'SELECT id, group_name FROM group_infos WHERE group_name IN (:names)',
      {
        replacements: { names: ['网页组', '虚拟组', '维修组', '人工组', '大数据组'] },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    // 映射小组名称到ID（方便分配）
    const groupMap = groups.reduce((map, group) => {
      map[group.group_name] = group.id;
      return map;
    }, {});
    // 步骤3：生成成员数据（关联用户ID和新小组ID）
    const memberData = [
      // 网页组
      {
        user_id: users[0]?.id || 1,
        group_id: groupMap['网页组'],
        public_info: JSON.stringify({
          avatar: 'https://example.com/avatars/user1.jpg',
          skills: ['HTML5', 'React', '性能优化']
        }),
        private_info: JSON.stringify({
          phone: '13800138001',
          email: 'web1@example.com'
        }),
        is_show: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id: users[1]?.id || 2,
        group_id: groupMap['网页组'],
        public_info: JSON.stringify({
          avatar: 'https://example.com/avatars/user2.jpg',
          skills: ['Vue', 'Node.js', '全栈开发']
        }),
        private_info: JSON.stringify({
          phone: '13800138002',
          email: 'web2@example.com'
        }),
        is_show: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // 虚拟组
      {
        user_id: users[2]?.id || 3,
        group_id: groupMap['虚拟组'],
        public_info: JSON.stringify({
          avatar: 'https://example.com/avatars/user3.jpg',
          skills: ['Unity', 'VR场景设计', 'C#']
        }),
        private_info: JSON.stringify({
          phone: '13800138003',
          email: 'vr1@example.com'
        }),
        is_show: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // 维修组
      {
        user_id: users[3]?.id || 4,
        group_id: groupMap['维修组'],
        public_info: JSON.stringify({
          avatar: 'https://example.com/avatars/user4.jpg',
          skills: ['硬件维修', '网络调试', '服务器维护']
        }),
        private_info: JSON.stringify({
          phone: '13800138004',
          email: 'repair1@example.com'
        }),
        is_show: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // 人工组
      {
        user_id: users[4]?.id || 5,
        group_id: groupMap['人工组'],
        public_info: JSON.stringify({
          avatar: 'https://example.com/avatars/user5.jpg',
          skills: ['客户沟通', '问题协调', '服务礼仪']
        }),
        private_info: JSON.stringify({
          phone: '13800138005',
          email: 'service1@example.com'
        }),
        is_show: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user_id: users[5]?.id || 6,
        group_id: groupMap['人工组'],
        public_info: JSON.stringify({
          avatar: 'https://example.com/avatars/user6.jpg',
          skills: ['售后处理', '用户调研', '数据分析']
        }),
        private_info: JSON.stringify({
          phone: '13800138006',
          email: 'service2@example.com'
        }),
        is_show: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // 大数据组
      {
        user_id: users[6]?.id || 7,
        group_id: groupMap['大数据组'],
        public_info: JSON.stringify({
          avatar: 'https://example.com/avatars/user7.jpg',
          skills: ['Hadoop', 'Python', '数据建模']
        }),
        private_info: JSON.stringify({
          phone: '13800138007',
          email: 'data1@example.com'
        }),
        is_show: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    queryInterface.bulkInsert('member_shows', memberData, { logging: console.log });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    // 回滚：删除通过种子文件插入的成员（关联上述小组）
    const groups = await queryInterface.sequelize.query(
      'SELECT id FROM group_infos WHERE group_name IN (:names)',
      {
        replacements: { names: ['网页组', '虚拟组', '维修组', '人工组', '大数据组'] },
        type: queryInterface.sequelize.QueryTypes.SELECT
      }
    );
    const groupIds = groups.map(g => g.id);

    await queryInterface.bulkDelete('member_show', {
      group_id: { [queryInterface.sequelize.Op.in]: groupIds }
    }, {});
  
  }
};
