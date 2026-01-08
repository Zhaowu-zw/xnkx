const { Op, where } = require('sequelize');
const { feedback, user,notice,userinfo } = require('../models');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../utils/errors');
const { success, fail } = require('../utils/responses');
const useragent = require('useragent');
const redisClient = require('../utils/redis'); // 导入Redis客户端

// 定义合法的反馈类型（全局变量，供多个函数使用）
const validFeedbackTypes = ['suggestion', 'bug', 'ui', 'other'];

//提交反馈
const publishFeedback = async (req, res) => {
    try {
        // 1. 解析请求体参数（支持 JSON/表单提交）
        const {
            feedback_type,
            rating,
            content,
            contact,
            username,
            user_id
        } = req.body;

        // 2. 严格参数验证（不符合规则直接抛自定义 BadRequestError）
        if (!feedback_type) throw new BadRequestError('反馈类型不能为空');
        if (!rating) throw new BadRequestError('满意度评分不能为空');
        if (!content) throw new BadRequestError('反馈内容不能为空');

        // 验证反馈类型合法性（与模型 validate.isIn 一致）
        if (!validFeedbackTypes.includes(feedback_type)) {
            throw new BadRequestError('反馈类型不合法，仅支持 suggestion/bug/ui/other');
        }

        // 验证评分（必须是 1-5 的整数）
        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5 || !Number.isInteger(ratingNum)) {
            throw new BadRequestError('满意度评分必须是 1-5 的整数');
        }

        // 验证反馈内容长度
        if (content.length < 5) throw new BadRequestError('反馈内容不能少于 5 个字符');
        if (content.length > 2000) throw new BadRequestError('反馈内容不能超过 2000 个字符');

        // 可选参数验证（联系方式格式，按需开启）
        if (contact && !/^(1\d{10}|[\w.-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)$/.test(contact)) {
            throw new BadRequestError('联系方式格式不正确（请输入手机号或邮箱）');
        }

        // 3. 自动补充额外字段（无需前端传递）
        const ip_address = getClientIp(req); // 获取客户端IP
        const device_info = parseDeviceInfo(req); // 解析设备信息

     

        // 5. 数据入库（创建反馈记录）
        const feedbackRecord = await feedback.create({
            feedback_type,
            rating: ratingNum, // 确保存入数字类型
            content,
            contact: contact || null, // 无则存 null
            user_id: user_id || null, // 未登录用户为 null
            username: username || '匿名用户', // 默认匿名
            ip_address: ip_address || null,
            device_info: device_info || null,
            // 状态默认 0（待处理，模型已配置 defaultValue: 0）
            // created_at/updated_at 由模型自动维护
        });
        // 4. 可选：验证登录用户是否存在（如果传递了 user_id）
        if (user_id) {
            const existUser = await user.findByPk(user_id);
            if (!existUser) throw new NotFoundError('关联的用户不存在');
            await notice.create({
                notice_type: 'system',
                content: `【小鸟快修社团】感谢您的反馈，${existUser.username}！我们会尽快处理。`,
                receiver_id: existUser.id,
                is_read: 0,
            });
        }

        // 6. 清除反馈列表缓存，确保数据一致性
        await redisClient.delPattern('feedback_list:*');
        console.log('清除反馈列表缓存');
        
        // 7. 响应成功结果（返回反馈ID和提交时间，方便前端后续查询）
        success(res, '提交反馈成功');

    } catch (error) {
        console.error('提交反馈失败：', error); // 日志记录错误详情

        // 7. 错误分类响应（适配自定义错误和 Sequelize 错误）
        if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
            // 自定义错误：返回具体错误信息
            return fail(res, error.message, error.statusCode || 400);
        } else if (error.name === 'SequelizeValidationError') {
            // Sequelize 模型验证错误（比如字段长度、格式不符合模型定义）
            const errMsg = error.errors.map(item => item.message).join('，');
            return fail(res, `提交失败：${errMsg}`, 400);
        } else {
            // 未知错误：返回通用提示
            return fail(res, '提交反馈失败，请稍后重试', 500);
        }
    }
};


// 管理员查看所有反馈
const viewFeedback = async (req, res) => {
    try {
        const { feedback_type, status,page=1, pageSize=10  } = req.query;
        // 验证查询参数（反馈类型和状态）
        if (feedback_type && !validFeedbackTypes.includes(feedback_type)) {
            throw new BadRequestError('反馈类型不合法，仅支持 suggestion/bug/ui/other');
        }
        if (status && ![0, 1, 2].includes(parseInt(status, 10))) {
            throw new BadRequestError('状态值必须是 0（待处理）或 1（处理中）或 2（已处理并解决）');
        }

        // 构建查询条件
        const queryConditions = {};
        if (feedback_type) queryConditions.feedback_type = feedback_type;
        if (status !== undefined) queryConditions.status = status;
        // 验证并设置默认分页参数
        const pageNum = parseInt(page, 10) || 1;
        const pageSizeNum = parseInt(pageSize, 10) || 10;
        
        if (pageNum < 1) {
            throw new BadRequestError('分页参数无效，page 必须大于等于 1');
        }
        
        if (pageSizeNum < 1 || pageSizeNum > 100) {
            throw new BadRequestError('分页参数无效，pageSize 必须在 1-100 之间');
        }
        
        // 生成缓存键，包含所有查询参数
        const cacheKey = `feedback_list:${pageNum}:${pageSizeNum}:${feedback_type || 'all'}:${status || 'all'}`;
        
        // 尝试从Redis获取缓存数据
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('从Redis缓存获取反馈列表');
            return success(res, '查看反馈成功', JSON.parse(cachedData));
        }
        
        // 计算分页偏移量
        const offset = (pageNum - 1) * pageSizeNum;
        const limit = pageSizeNum;

        // 获取总记录数
        const total = await feedback.count({
            where: queryConditions
        });

        const feedbackList = await feedback.findAll({
            include: [
                {
                    model: user,
                    as: 'handler', // 处理人关联
                    attributes: ['username'], // 确保返回username
                    include: [{
                        model: userinfo,
                        attributes: ['nickname'], // 返回nickname
                    }]
                }
            ],
            order: [
                ['status', 'ASC'], // 状态排序：待处理(0) > 处理中(1) > 已解决(2)
                ['created_at', 'ASC'] // 相同状态下，创建时间早的在前
            ],
            where: queryConditions,
            offset,
            limit,
        });

        // 构建返回数据
        const result = {
            list: feedbackList,
            total,
            currentPage: pageNum,
            pageSize: pageSizeNum
        };
        
        // 将结果存入Redis，设置10分钟过期时间
        await redisClient.set(cacheKey, JSON.stringify(result), 600);
        console.log('反馈列表存入Redis缓存');

        // 返回分页数据和总数
        success(res, '查看反馈成功', result);
    } catch (error) {
        console.error('查看反馈失败：', error);
        return fail(res, '查看反馈失败，请稍后重试', 500);
    }
}

//更新反馈状态
const updateFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const {userId} = req.user;
        const { status, handle_note } = req.body;
        const normalizedStatus = parseInt(status, 10);
        if (isNaN(normalizedStatus) || ![0, 1, 2].includes(normalizedStatus)) {
            throw new BadRequestError('状态值必须是 0（待处理）或 1（处理中）或 2（已处理并解决）');
        }
        console.log(req.body);
        
        const feedbackRecord = await feedback.findByPk(id);
        if (!feedbackRecord) throw new NotFoundError('反馈记录不存在');
        const handlerInfo = await user.findByPk(userId,{
            include: [{
                model: userinfo,
                attributes: ['nickname'], // 返回nickname
            }]
        })
        // 补充：防止handlerInfo为空导致后续拼接文案报错
        if (!handlerInfo) throw new BadRequestError('处理人信息不存在');

        // 修正通知文案的逻辑（之前status=2的文案写反了）
        const statusDesc = {
            0: '将您的反馈恢复为待处理',
            1: '正在处理您的反馈',
            2: '已处理并解决您的反馈'
        };
        if (feedbackRecord.user_id) {
            //向用户发送通知
            await notice.create({
                notice_type: 'system',
                content: `【小鸟快修社团】${handlerInfo.role_name}${handlerInfo.userinfo?.nickname || handlerInfo.username}${statusDesc[normalizedStatus]}，备注：${handle_note || '无处理备注'}。`,
                receiver_id: feedbackRecord.user_id,
                is_read: 0,
            });
        }
      
        feedbackRecord.status = normalizedStatus;
        feedbackRecord.handle_note = handle_note || null;
        feedbackRecord.handler_id = userId;
        await feedbackRecord.save();
        
        // 清除反馈列表缓存，确保数据一致性
        await redisClient.delPattern('feedback_list:*');
        console.log('清除反馈列表缓存');
        
        success(res, '更新反馈状态成功');
    } catch (error) {
        console.error('更新反馈状态失败：', error);
        return fail(res, '更新反馈状态失败，请稍后重试', 500);
    }
}


// 管理员删除指定反馈
const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const feedbackRecord = await feedback.findByPk(id);
        if (!feedbackRecord) throw new NotFoundError('反馈记录不存在');
        await feedbackRecord.destroy();
        
        // 清除反馈列表缓存，确保数据一致性
        await redisClient.delPattern('feedback_list:*');
        console.log('清除反馈列表缓存');
        
        success(res, '删除反馈成功');
    } catch (error) {
        console.error('删除反馈失败：', error);
        return fail(res, '删除反馈失败，请稍后重试', 500);
    }
}


const getClientIp = (req) => {
    let ip = req.ip
        || req.connection.remoteAddress
        || req.socket.remoteAddress
        || req.headers['x-forwarded-for']
        || null;

    // 处理 IPv6 格式（::1 转为 127.0.0.1）
    if (ip) {
        ip = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
        ip = ip === '::1' ? '127.0.0.1' : ip;
    }
    return ip;
};

const parseDeviceInfo = (req) => {
    try {
        // 第一步：判断 user-agent 是否存在
        const userAgentStr = req.headers['user-agent'];
        if (!userAgentStr) return '未知设备';

        // 第二步：解析后判断是否有效
        const agent = useragent.parse(userAgentStr);
        if (!agent || !agent.browser || !agent.os) return '未知设备';

        // 第三步：安全获取属性（避免 undefined 报错）
        const browser = `${agent.browser.family || '未知浏览器'} ${agent.browser.version || '未知版本'}`;
        const os = `${agent.os.family || '未知系统'} ${agent.os.version || '未知版本'}`;

        return `${browser} (${os})`;
    } catch (err) {
        console.warn('解析设备信息失败：', err.message);
        return '未知设备'; // 出错时返回默认值，避免影响主流程
    }
};
module.exports={
    publishFeedback,
    viewFeedback,
    updateFeedback,
    deleteFeedback
}