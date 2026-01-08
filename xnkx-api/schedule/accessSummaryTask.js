const schedule = require('node-schedule');
const accessService = require('../service/accessService');

/**
 * 定时汇总昨日访问量（每天凌晨1点执行）
 */
const startAccessSummaryTask = () => {
    //  cron表达式：秒 分 时 日 月 周
    const job = schedule.scheduleJob('0 0 1 * * *', async () => {
        console.log('开始执行访问量汇总定时任务');
        try {
            await accessService.summaryYesterdayAccess();
            console.log('访问量汇总定时任务执行成功');
        } catch (error) {
            console.error('访问量汇总定时任务执行失败：', error);
        }
    });

    console.log('访问量汇总定时任务已启动（每天凌晨1点执行）');
    return job;
};

module.exports = {
    startAccessSummaryTask
};