/**
 * 获取时间时段（凌晨/早上/上午/中午/下午/晚上）+ 具体时间
 * @param {number|Date} [time] - 可选参数：指定时间（时间戳/Date对象），默认获取当前时间
 * @returns {Object} 包含时段和具体时间的对象（format1: 中文格式, format2: 数字格式）
 */
export function getTimePeriodAndDetail(time){
    // 处理参数：无参数则取当前时间，有参数则转为Date对象
    const date = time ? (time instanceof Date ? time : new Date(time)) : new Date();

    // 获取时分秒（用于判断时段和格式化）
    const hour = date.getHours(); // 0-23
    const minute = date.getMinutes().toString().padStart(2, '0'); // 补零为两位数
    const second = date.getSeconds().toString().padStart(2, '0'); // 补零为两位数

    // 获取年月日（用于完整时间显示）
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份0-11，需+1
    const day = date.getDate().toString().padStart(2, '0'); // 补零为两位数

    // 判断时段（按日常习惯划分）
    let period;
    if (hour >= 0 && hour < 6) {
        period = '凌晨';
    } else if (hour >= 6 && hour < 9) {
        period = '早上';
    } else if (hour >= 9 && hour < 12) {
        period = '上午';
    } else if (hour >= 12 && hour < 14) {
        period = '中午';
    } else if (hour >= 14 && hour < 18) {
        period = '下午';
    } else { // 18-24点
        period = '晚上';
    }

    // 格式化具体时间（两种常用格式）
    const format1 = `${year}年${month}月${day}日 ${period}${hour}:${minute}:${second}`; // 中文格式
    const format2 = `${year}-${month}-${day} ${hour}:${minute}:${second} ${period}`; // 数字格式（ISO风格）

    return {
        period, // 单独返回时段（如："早上"）
        format1, // 中文完整时间（如："2025年11月24日 早上08:30:45"）
        format2  // 数字完整时间（如："2025-11-24 08:30:45 早上"）
    };
}