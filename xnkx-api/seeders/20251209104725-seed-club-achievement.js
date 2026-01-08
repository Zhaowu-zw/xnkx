'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // 批量插入社团成就数据
    await queryInterface.bulkInsert('clubAchievements', [
      {
        year: 2013,
        participants: '张辰云、费立雪',
        competition_name: '河北省电子信息职业技能大赛计算机装调项目',
        participation_type: '个人及团队',
        level: '省级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2014,
        participants: '张辰云',
        competition_name: '第四届全国大学生计算机应用能力与信息素养大赛海峡两岸赛（北京）高职组',
        participation_type: '个人',
        level: '国家级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2017,
        participants: '段治刚、高梦琪等5人',
        competition_name: '学院第三届“互联网+”大学生创新创业大赛创意组',
        participation_type: '团队',
        level: '学院级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2017,
        participants: '苏新宇',
        competition_name: '第六届中国创新创业大赛（河北赛区）暨河北省第五届创新创业大赛',
        participation_type: '个人',
        level: '省级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2017,
        participants: '苏新宇、段治刚、宋福顺',
        competition_name: '河北省电子信息职业技能大赛计算机调试项目',
        participation_type: '个人及团队',
        level: '省级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2018,
        participants: '刘泽胜',
        competition_name: '第八届全国大学生计算机应用能力与信息素养大赛Excel模块高职组',
        participation_type: '个人',
        level: '国家级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2018,
        participants: '刘泽胜、程佳宝、纪明月',
        competition_name: '河北省电子信息职业技能大赛虚拟化技术及应用项目',
        participation_type: '团队',
        level: '省级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2019,
        participants: '“小快修社”团队',
        competition_name: '第九届全省教育系统优秀志愿服务组织',
        participation_type: '团队',
        level: '省级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2019,
        participants: '崔虎成',
        competition_name: '第五届“互联网+”大学生创业大赛校赛',
        participation_type: '个人',
        level: '学院级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2019,
        participants: '崔虎成、王文宣、李想',
        competition_name: '河北省高等职业院校学生技能比赛虚拟现实（VR）设计与制作项目',
        participation_type: '团队',
        level: '省级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2021,
        participants: '张潇益',
        competition_name: '第九届全国高校数字艺术设计大赛河北赛区',
        participation_type: '个人',
        level: '省级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2021,
        participants: '唐润宇、郭一瑾、王雅如',
        competition_name: '学院第七届互联网+大学生创新创业创意组',
        participation_type: '团队',
        level: '学院级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2022,
        participants: '席天宇、李明远等5人',
        competition_name: '2022年“挑战杯”河北省大学生创业计划竞赛',
        participation_type: '团队',
        level: '省级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2022,
        participants: '杜紫冉、席天宇等5人',
        competition_name: '第四届国际青年人工智能大赛人工智能文化艺术创新比赛',
        participation_type: '团队',
        level: '国际',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2022,
        participants: '席天宇、陈烁杭等5人',
        competition_name: '第四届国际青年人工智能大赛人工智能应用与技能创新比赛',
        participation_type: '团队',
        level: '国际',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2022,
        participants: '席天宇',
        competition_name: '2022年金砖国家职业技能大赛河北省选拔赛人工智能计算机视觉应用赛项',
        participation_type: '个人',
        level: '省级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2022,
        participants: '席天宇',
        competition_name: '河北省行业职业技能竞赛·数字经济产业新技术人工智能工程技术人员赛项',
        participation_type: '个人',
        level: '省级',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        year: 2022,
        participants: '席天宇',
        competition_name: '全国电子企业职业技能竞赛计算机程序设计员（人机协同技术应用）赛项学生组',
        participation_type: '个人',
        level: '国家级',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface) {
    // 回滚：清空数据表（软删除场景可改为逻辑删除）
    await queryInterface.bulkDelete('clubAchievements', null, {});
  }
};