const dayjs = require('dayjs');

// 格式化日期为YYYY-MM-DD
const formatDate = (date) => {
    return dayjs(date).format('YYYY-MM-DD');
};

// 格式化日期为MM/DD（前端展示用）
const formatShortDate = (date) => {
    return dayjs(date).format('MM/DD');
};

// 获取昨日日期
const getYesterday = () => {
    return dayjs().subtract(1, 'day').format('YYYY-MM-DD');
};

// 获取近n天的日期列表
const getRecentDays = (days = 7) => {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        result.push(date);
    }
    return result;
};

module.exports = {
    formatDate,
    formatShortDate,
    getYesterday,
    getRecentDays
};