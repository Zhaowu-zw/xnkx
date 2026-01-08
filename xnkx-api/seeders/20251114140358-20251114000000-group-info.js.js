'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 插入5个小组数据
    await queryInterface.bulkInsert('group_infos', [
      {
        group_name: '网页组',
        group_position: '负责网站开发与维护',
        function_desc: '专注于HTML/CSS/JavaScript技术栈，开发企业官网、内部管理系统等Web应用，保障页面兼容性与加载性能',
        core_achievements: '完成集团官网改版、客户管理系统前端开发，页面加载速度提升40%',
        create_time: new Date('2023-01-15'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        group_name: '虚拟组',
        group_position: '虚拟现实（VR/AR）技术研发',
        function_desc: '基于Unity/Unreal引擎开发虚拟场景，实现沉浸式交互体验，应用于教育培训、产品展示等领域',
        core_achievements: '完成虚拟展厅项目、VR教学系统，服务3家合作企业',
        create_time: new Date('2023-02-05'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        group_name: '维修组',
        group_position: '设备维护与故障修复',
        function_desc: '负责公司硬件设备（电脑、服务器、外设等）的日常保养、故障排查与维修，保障设备正常运行',
        core_achievements: '年度设备故障率降低15%，维修响应时间缩短至2小时内',
        create_time: new Date('2023-01-10'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        group_name: '人工组',
        group_position: '人工智能与机器人',
        function_desc: '对接客户咨询、处理售后问题、收集用户反馈，提供7×12小时在线服务，提升客户满意度',
        core_achievements: '客户满意度评分92分，问题一次性解决率88%',
        create_time: new Date('2023-03-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        group_name: '大数据组',
        group_position: '数据挖掘与分析决策',
        function_desc: '基于Hadoop/Spark技术栈处理海量数据，构建数据分析模型，为业务决策提供数据支持',
        core_achievements: '完成用户行为分析系统、销售预测模型，帮助业务增长12%',
        create_time: new Date('2023-02-28'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  }, 

  async down(queryInterface) {
    // 回滚：删除上述5个小组数据
    await queryInterface.bulkDelete('group_info', {
      group_name: {
        [queryInterface.sequelize.Op.in]: ['网页组', '虚拟组', '维修组', '人工组', '大数据组']
      }
    }, {});
  }
};