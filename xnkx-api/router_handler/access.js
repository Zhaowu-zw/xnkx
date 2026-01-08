const accessService = require('../service/accessService');
const statService = require('../service/statService');
const { BadRequestError } = require('../utils/errors'); // 仅使用当前场景需要的错误类
const { success, fail } = require('../utils/responses');

/**
 * 上报访问日志接口
 * @param {Request} req Express请求对象
 * @param {Response} res Express响应对象
 * @returns {Promise<void>}
 */
const reportAccess = async (req, res) => {
    try {
        const logData = req.body;
        // console.log('===== 接收的上报参数 =====', logData); // 打印传入的所有参数
        // console.log('timestamp类型：', typeof logData.timestamp); // 检查timestamp类型
        // console.log('accessTime转换：', new Date(logData.timestamp)); // 检查日期转换是否正常

        // 1. 精细化参数校验（使用自定义BadRequestError）
        // 校验pagePath是否存在且为字符串
        if (!logData.pagePath || typeof logData.pagePath !== 'string') {
            throw new BadRequestError('页面路径pagePath不能为空，且必须为字符串类型');
        }
        // 可选参数类型校验（提升鲁棒性）
        if (logData.userId && typeof logData.userId !== 'string') {
            throw new BadRequestError('用户IDuserId必须为字符串类型');
        }
        if (logData.timestamp && typeof logData.timestamp !== 'number') {
            throw new BadRequestError('时间戳timestamp必须为数字类型');
        }

        // 2. 优化IP获取逻辑（兼容IPv6/反向代理）
        let ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;
        // 处理IPv6本地地址（::1）转为IPv4的127.0.0.1
        if (ip === '::1' || ip === '::ffff:127.0.0.1') {
            ip = '127.0.0.1';
        }
        // 处理多个IP的情况（反向代理时x-forwarded-for可能是逗号分隔的IP列表）
        if (ip && ip.includes(',')) {
            ip = ip.split(',')[0].trim();
        }

        // 3. 调用服务层上报日志
        await accessService.reportaccesslog({
            ...logData,
            timestamp: logData.timestamp || Date.now(),
            ip: ip || req.connection.remoteAddress // 兜底获取IP
        });

        // 4. 使用统一响应工具返回成功结果
        success(res, '上报成功', null);

    } catch (error) {
  
            console.error('访问日志上报异常：', error);
     return   fail(res, '服务器内部错误，上报失败'+error);
        
    }
};

/**
 * 获取所有统计数据接口
 * @param {Request} req Express请求对象
 * @param {Response} res Express响应对象
 * @returns {Promise<void>}
 */
const getAllStat = async (req, res) => {
    try {
        // 1. 调用服务层获取统计数据
        const data = await statService.getAllStatData();

        // 2. 使用统一响应工具返回成功结果
        success(res, '获取统计数据成功', data);

    } catch (error) {
        // 2. 系统错误处理（统计接口暂无业务错误，直接返回500）
        console.error('获取统计数据异常：', error.stack);
        fail(res, '获取统计数据失败，请稍后重试', null, 500);
    }
};

module.exports = {
    reportAccess,
    getAllStat
};