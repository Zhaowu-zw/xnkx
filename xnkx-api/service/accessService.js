const { accesslog, accesssummary } = require('../models');
const redisClient = require('../utils/redis');
const dateUtil = require('../utils/dateUtil');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

/**
 * 上报访问日志
 * @param {Object} logData 访问日志数据
 */
const reportaccesslog = async (logData) => {
    try {
        // 1. 写入访问日志表（异步，不阻塞返回）
        await accesslog.create({
            pagePath: logData.pagePath,
            pageName: logData.pageName || '',
            userId: logData.userId || 'anonymous',
            accessTime: new Date(logData.timestamp),
            ip: logData.ip || '',
            userAgent: logData.userAgent || ''
        });

        // 2. 实时累加Redis总访问量
        await redisClient.incr('total_access_count');

        // 3. 累加当日页面访问量（Redis Hash）
        const today = dateUtil.formatDate(new Date());
        const dayAccessKey = `day_access_${today}`;
        await redisClient.hincrby(dayAccessKey, logData.pagePath, 1);
        // 设置7天过期
        await redisClient.expire(dayAccessKey, 7 * 24 * 60 * 60);

        return true;
    } catch (error) {
        console.error('上报访问日志失败：', error);
        throw error;
    }
};

/**
 * 汇总昨日访问量
 */
const summaryYesterdayAccess = async () => {
    try {
        const yesterday = dateUtil.getYesterday();

        // 1. 汇总昨日总访问量
        const totalCount = await accesslog.count({
            where: {
                accessTime: {
                    [Op.between]: [
                        `${yesterday} 00:00:00`,
                        `${yesterday} 23:59:59`
                    ]
                }
            }
        });

        // 2. 保存/更新总访问量汇总记录
        await accesssummary.upsert({
            statDate: yesterday,
            pagePath: '',
            visitCount: totalCount
        });

        // 3. 汇总昨日各页面访问量
        const pageAccessList = await accesslog.findAll({
            attributes: [
                'pagePath',
                [accesslog.sequelize.fn('COUNT', accesslog.sequelize.col('id')), 'count']
            ],
            where: {
                accessTime: {
                    [Op.between]: [
                        `${yesterday} 00:00:00`,
                        `${yesterday} 23:59:59`
                    ]
                }
            },
            group: ['pagePath'],
            raw: true
        });

        // 4. 保存/更新各页面访问量汇总记录
        for (const item of pageAccessList) {
            await accesssummary.upsert({
                statDate: yesterday,
                pagePath: item.pagePath,
                visitCount: parseInt(item.count)
            });
        }

        // 5. 计算近7天访问量环比趋势
        await calculateDailyTrend();

        // 6. 校准Redis总访问量
        const totalAccess = await accesssummary.sum('visitCount', {
            where: { pagePath: '' }
        });
        await redisClient.set('total_access_count', totalAccess || 0);

        return true;
    } catch (error) {
        console.error('汇总昨日访问量失败：', error);
        throw error;
    }
};

/**
 * 计算日访问量环比趋势
 */
const calculateDailyTrend = async () => {
    try {
        const recentDays = dateUtil.getRecentDays(7);
        for (const date of recentDays) {
            // 获取当日访问量
            const current = await accesssummary.findOne({
                where: { statDate: date, pagePath: '' },
                attributes: ['visitCount']
            });
            const currentCount = current ? current.visitCount : 0;

            // 获取前日访问量
            const prevDate = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
            const prev = await accesssummary.findOne({
                where: { statDate: prevDate, pagePath: '' },
                attributes: ['visitCount']
            });
            const prevCount = prev ? prev.visitCount : 0;

            // 计算环比（避免除0）
            let trend = 0;
            if (prevCount > 0) {
                trend = ((currentCount - prevCount) / prevCount) * 100;
                trend = Math.round(trend * 10) / 10; // 保留1位小数
            }

            // 更新趋势
            await accesssummary.update(
                { trend },
                { where: { statDate: date, pagePath: '' } }
            );
        }
        return true;
    } catch (error) {
        console.error('计算环比趋势失败：', error);
        throw error;
    }
};

/**
 * 获取近7天访问量数据
 */
const getRecent7DaysAccess = async () => {
    try {
        const recentDays = dateUtil.getRecentDays(7);
        const today = dateUtil.formatDate(new Date());
        const result = [];
        for (const date of recentDays) {
            let visitCount = 0;
            let trend = 0;
            
            if (date === today) {
                // 今日访问量：从Redis获取实时数据
                const dayAccessKey = `day_access_${today}`;
                const todayAccess = await redisClient.hgetall(dayAccessKey);
                // 计算今日总访问量（所有页面之和）
                visitCount = Object.values(todayAccess || {}).reduce((sum, count) => sum + parseInt(count), 0);
            } else {
                // 历史访问量：从accesssummary表获取
                const data = await accesssummary.findOne({
                    where: { statDate: date, pagePath: '' },
                    attributes: ['visitCount', 'trend']
                });
                visitCount = data ? data.visitCount : 0;
                trend = data ? data.trend : 0;
            }
            
            result.push({
                date: dateUtil.formatShortDate(date),
                visitCount: visitCount,
                trend: trend
            });
        }
        return result;
    } catch (error) {
        console.error('获取近7天访问量失败：', error);
        throw error;
    }
};

/**
 * 获取总访问量
 */
const getTotalAccessCount = async () => {
    try {
        // 优先从Redis获取
        let total = await redisClient.get('total_access_count');
        if (total) {
            return parseInt(total);
        }
        // Redis无数据，从数据库汇总总访问量（pagePath为空字符串表示总访问量）
        total = await accesssummary.sum('visitCount', {
            where: { pagePath: '' }
        });
        // 写入Redis        
        await redisClient.set('total_access_count', total || 0);
        return total || 0;
    } catch (error) {
        console.error('获取总访问量失败：', error);
        throw error;
    }
};

module.exports = {
    reportaccesslog,
    summaryYesterdayAccess,
    getRecent7DaysAccess,
    getTotalAccessCount
};