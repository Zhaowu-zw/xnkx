const accessService = require('./accessService');
const redisClient = require('../utils/redis');
const { sequelize, activity, group_info, user, recruitment, accesssummary, approval, feedback } = require('../models');
const { Op } = require('sequelize');

/**
 * 通用数值格式化函数（保留1位小数，处理0/整数/小数）
 * @param {number} num 原始数值
 * @returns {number} 格式化后数值（1位小数）
 */
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return parseFloat(num.toFixed(1));
    return parseFloat(Number(num).toFixed(1));
};

/**
 * 通用趋势计算函数（环比：(当前值 - 对比值)/对比值 * 100）
 * @param {number} currentValue 当前值
 * @param {number} compareValue 对比值（上月/昨日）
 * @returns {number} 趋势百分比（保留1位小数）
 */
const calculateTrend = (currentValue, compareValue) => {
    if (compareValue === 0) return formatNumber(0);
    const trend = ((currentValue - compareValue) / compareValue) * 100;
    return formatNumber(trend);
};

/**
 * 获取所有统计数据（聚合接口）
 */
const getAllStatData = async () => {
    try {
        // 1. 尝试从Redis获取缓存数据
        const cacheKey = 'stat_all_data';
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('从Redis缓存获取统计数据');
            return JSON.parse(cachedData);
        }

        const now = new Date();
        const todayDateStr = now.toISOString().split('T')[0];
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayDateStr = yesterdayDate.toISOString().split('T')[0];

        // 本月时间范围
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // 上月时间范围
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // ========== 1. 基础数据查询（移除所有create_time相关逻辑） ==========
        const totalUserCount = await user.count();
        const totalActivityCount = await activity.count();

        // 待处理审批数（当前）：从审批表查询所有状态为pending的记录
        const pendingRecruitCount = await approval.count({
            where: { approval_status: 'pending' }
        });

        // 上月待处理审批数（用于环比计算）
        const lastMonthPendingRecruitCount = await approval.count({
            where: { 
                approval_status: 'pending',
                updatedAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] }
            }
        });

        // 未处理反馈（动态计算）：查询状态为0（待处理）的反馈
        const unhandledFeedbackCount = await feedback.count({
            where: { status: 0 }
        });
        
        // 昨日未处理反馈数
        const yesterdayUnhandledFeedbackCount = await feedback.count({
            where: {
                status: 0,
                created_at: { [Op.between]: [yesterdayDate, new Date(now)] }
            }
        });
        
        const trendUnhandledFeedback = calculateTrend(unhandledFeedbackCount, yesterdayUnhandledFeedbackCount);

        const totalAccess = await accessService.getTotalAccessCount();


        
        // 今日访问量：从Redis获取实时数据
        let todayVisitCount = 0;
        const dayAccessKey = `day_access_${todayDateStr}`;
        const todayAccessFromRedis = await redisClient.hgetall(dayAccessKey);
        if (todayAccessFromRedis) {
            todayVisitCount = Object.values(todayAccessFromRedis).reduce((sum, count) => sum + parseInt(count), 0);
        }
        
        // 昨日访问量：从accesssummary表获取
        const yesterdayAccess = await accesssummary.findOne({ where: { statDate: yesterdayDateStr, pagePath: '' } });
        const yesterdayVisitCount = yesterdayAccess ? yesterdayAccess.visitCount : 0;

        // 本月/上月新增用户数
        const monthlyNewUserCount = await user.count({
            where: { createtime: { [Op.between]: [startOfMonth, endOfMonth] } }
        });
        const lastMonthNewUserCount = await user.count({
            where: { createtime: { [Op.between]: [startOfLastMonth, endOfLastMonth] } }
        });

        // ========== 2. 趋势计算所需的对比数据（调整待审批纳新趋势维度） ==========
        const lastMonthTotalUserCount = totalUserCount - monthlyNewUserCount;
        const lastMonthTotalActivityCount = await activity.count({
            where: { createdAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] } }
        });

        // 上月总访问量
        const lastMonthAccessData = await accesssummary.findAll({
            attributes: [[sequelize.fn('SUM', sequelize.col('visitCount')), 'total']],
            where: {
                statDate: { [Op.between]: [startOfLastMonth.toISOString().split('T')[0], endOfLastMonth.toISOString().split('T')[0]] },
                pagePath: ''
            },
            raw: true
        });
        const lastMonthTotalAccess = lastMonthAccessData[0]?.total || 0;

        // ========== 3. 各指标趋势计算（待审批纳新改为环比上月） ==========
        const trendTotalUser = calculateTrend(totalUserCount, lastMonthTotalUserCount);
        const trendTotalActivity = calculateTrend(totalActivityCount, lastMonthTotalActivityCount);
        // 关键调整：待审批纳新趋势 → 环比上月（而非昨日）
        const trendPendingRecruit = calculateTrend(pendingRecruitCount, lastMonthPendingRecruitCount);
        const trendTotalAccess = calculateTrend(totalAccess, lastMonthTotalAccess);
        const trendTodayVisit = calculateTrend(todayVisitCount, yesterdayVisitCount);
        const trendMonthlyNewUser = calculateTrend(monthlyNewUserCount, lastMonthNewUserCount);

        // ========== 4. 角色分布 ==========
        const roleRawData = await user.findAll({
            attributes: [
                'role_name',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['role_name'],
            raw: true
        });
        const getRoleColor = (roleName) => {
            const colorMap = {
                '管理员': '#e6a23c',
                '组长': '#67c23a',
                '组员': '#409eff',
                '指导老师': '#909399',
                '社长': '#722ed1',
                '普通用户': '#536dfe'
            };
            return colorMap[roleName] || '#ccc';
        };
        const roleDistribution = roleRawData.map(item => ({
            roleName: item.role_name,
            count: formatNumber(item.count),
            percentage: formatNumber((parseInt(item.count) / totalUserCount * 100)),
            color: getRoleColor(item.role_name)
        }));

        // ========== 5. 月度活动发布量 ==========
        const activityRawData = await activity.findAll({
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%m月'), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                createdAt: { [Op.gte]: new Date(now.getFullYear(), now.getMonth() - 4, 1) }
            },
            group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%m月')],
            order: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%m月')],
            raw: true
        });
        const monthlyActivity = activityRawData.map((item, index) => {
            const prevItem = activityRawData[index - 1];
            const trend = prevItem ? calculateTrend(parseInt(item.count), parseInt(prevItem.count)) : formatNumber(0);
            return {
                month: item.month,
                count: formatNumber(item.count),
                trend: trend
            };
        });

        // ========== 6. 月度新增用户 ==========
        const newUserRawData = await user.findAll({
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('createtime'), '%m月'), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                createtime: { [Op.gte]: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
            },
            group: [sequelize.fn('DATE_FORMAT', sequelize.col('createtime'), '%m月')],
            order: [sequelize.fn('DATE_FORMAT', sequelize.col('createtime'), '%m月')],
            raw: true
        });
        const monthlyNewUser = newUserRawData.map(item => ({
            month: item.month,
            count: formatNumber(item.count),
            progress: formatNumber(Math.min((item.count / 50) * 100, 100))
        }));

        // ========== 7. 各组今年纳新人数 ==========
        const recruitRawData = await recruitment.findAll({
            attributes: [
                'intention_group_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'recruitCount']
            ],
            group: ['intention_group_id'],
            raw: true
        });
        const groupRecruit = [];
        for (const item of recruitRawData) {
            const group = await group_info.findByPk(item.intention_group_id);
            if (group) {
                groupRecruit.push({
                    groupName: group.group_name,
                    recruitCount: formatNumber(item.recruitCount)
                });
            }
        }

        // ========== 8. 各组人员比例 ==========
        const memberRawData = await user.findAll({
            attributes: [
                'group_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'memberCount']
            ],
            group: ['group_id'],
            raw: true
        });
        const groupMemberRatio = [];
        for (const item of memberRawData) {
            const group = await group_info.findByPk(item.group_id);
            if (group) {
                groupMemberRatio.push({
                    groupName: group.group_name,
                    memberCount: formatNumber(item.memberCount),
                    percentage: formatNumber((parseInt(item.memberCount) / totalUserCount * 100))
                });
            }
        }

        // ========== 9. 访问量数据 ==========
        const dailyVisit = await accessService.getRecent7DaysAccess();
        const formattedDailyVisit = dailyVisit.map(item => ({
            ...item,
            visitCount: formatNumber(item.visitCount),
            trend: formatNumber(item.trend || 0)
        }));

        // ========== 10. 组装返回数据 ==========
        const result = {
            cards: [
                { label: '总用户数', value: formatNumber(totalUserCount), trend: trendTotalUser },
                { label: '总活动数', value: formatNumber(totalActivityCount), trend: trendTotalActivity },
                { label: '待处理审批', value: formatNumber(pendingRecruitCount), trend: trendPendingRecruit },
                { label: '未处理反馈', value: formatNumber(unhandledFeedbackCount), trend: trendUnhandledFeedback },
                { label: '总访问量', value: formatNumber(totalAccess), trend: trendTotalAccess },
                { label: '今日访问量', value: formatNumber(todayVisitCount), trend: trendTodayVisit },
                { label: '本月新增用户', value: formatNumber(monthlyNewUserCount), trend: trendMonthlyNewUser }
            ],
            roleDistribution,
            monthlyActivity,
            dailyVisit: formattedDailyVisit,
            monthlyNewUser,
            groupRecruit,
            groupMemberRatio
        };

        // 11. 将结果存入Redis，设置10分钟过期时间
        await redisClient.set(cacheKey, JSON.stringify(result), 600);
        console.log('统计数据存入Redis缓存');

        return result;
    } catch (error) {
        console.error('===== 获取统计数据完整错误信息 =====');
        console.error('错误类型：', error.name);
        console.error('错误消息：', error.message);
        console.error('执行的SQL：', error.sql);
        console.error('错误参数：', error.parameters);
        console.error('错误堆栈：', error.stack);
        console.error('====================================');
        throw error;
    }
};

module.exports = {
    getAllStatData
};