const { Op } = require('sequelize');
const { recruitment, userinfo, group_info, notice ,approval} = require('../models');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../utils/errors');
const { success, fail } = require('../utils/responses');
const { update } = require('lodash');


//查询所有纳新信息
const viewAllRecruitments = async function (req, res) {
    try {
        const { groupId, keyword } = req.query; // GET请求用query接收参数

        // 1. 构建查询条件
        const whereCondition = {};
        // 按组别筛选
        if (groupId) {
            whereCondition.intention_group_id = groupId;
        }
        // 模糊匹配（姓名/学号/手机号）
        if (keyword) {
            whereCondition[Op.or] = [
                { name: { [Op.like]: `%${keyword}%` } },
                { sno: { [Op.like]: `%${keyword}%` } },
                { iphone: { [Op.like]: `%${keyword}%` } }
            ];
        }

        // 2. 查询所有纳新信息（字段名匹配数据库）
        const recruitments = await recruitment.findAll({
            attributes: [
                'id', 'user_id', 'intention_group_id', 'application_info',
                'first_review_status', 'final_review_status', 'reviewer_id',
                'name', 'sno', 'iphone'
            ],
            where: whereCondition,
            order: [['createdAt', 'DESC']] // 按创建时间倒序
        });

        if (recruitments.length === 0) {
            return success(res, '暂无纳新信息', { data: [] });
        }

        // 3. 批量查询关联数据（用户昵称、分组名称）
        // 提取所有涉及的user_id和intention_group_id（去重）
        const userIds = [...new Set(recruitments.map(r => r.user_id))];
        const groupIds = [...new Set(recruitments.map(r => r.intention_group_id))];

        // 批量查询用户信息
        const users = userIds.length > 0
            ? await userinfo.findAll({
                where: { user_id: { [Op.in]: userIds } },
                attributes: ['user_id', 'nickname']
            })
            : [];

        // 批量查询分组信息
        const groups = groupIds.length > 0
            ? await group_info.findAll({
                where: { id: { [Op.in]: groupIds } },
                attributes: ['id', 'group_name']
            })
            : [];

        // 4. 格式化数据
        const formattedData = recruitments.map(rec => {
            const user = users.find(u => u.user_id === rec.user_id);
            const group = groups.find(g => g.id === rec.intention_group_id);

            return {
                ...rec.toJSON(),
                user_nickname: user?.nickname || '未知用户',
                group_name: group?.group_name || '未知组别'
            };
        });

        success(res, '获取纳新列表成功', { data: formattedData });
    } catch (error) {
        console.error('获取所有纳新列表失败：', error);
        fail(res, '获取纳新列表失败');
    }
};
//查询个人纳新报名信息
const viewPersonalRecruitment = async function (req, res) {
    try {
        const { sno, iphone } = req.body;

        // 1. 参数校验（学号和手机号必填）
        if (!sno || !iphone) {
            return fail(res, '学号和手机号不能为空');
        }

        // 2. 精准查询个人报名信息（学号+手机号联合匹配）
        const recruitment1 = await recruitment.findOne({
            attributes: [
                'id', 'user_id', 'intention_group_id', 'application_info',
                'first_review_status', 'final_review_status', 'reviewer_id',
                'name', 'sno', 'iphone'
            ],
            where: { sno, iphone } // 联合唯一匹配
        });

        if (!recruitment1) {
            return success(res, '暂无个人报名信息', { data: null });
        }

        // 3. 查询关联数据（用户昵称、分组名称）
        // 查询用户昵称
        const user = await userinfo.findOne({
            where: { user_id: recruitment1.user_id },
            attributes: ['user_id', 'nickname']
        });

        // 查询分组名称
        const group = await group_info.findOne({
            where: { id: recruitment1.intention_group_id },
            attributes: ['id', 'group_name']
        });

        // 4. 格式化详情数据
        const formattedData = {
            ...recruitment1.toJSON(),
            user_nickname: user?.nickname || '未知用户',
            group_name: group?.group_name || '未知组别',
            // 补充状态说明（可选，提升可读性）
            first_review_status_desc: getReviewStatusDesc(recruitment1.first_review_status),
            final_review_status_desc: getReviewStatusDesc(recruitment1.final_review_status)
        };

        success(res, '获取个人报名详情成功', { data: formattedData });
    } catch (error) {
        console.error('获取个人报名详情失败：', error);
        fail(res, '获取个人报名信息失败');
    }
};
// 纳新报名（仅成功时发送通知）
const createrecruitment = async function (req, res) {
    try {
        const { userId } = req.user;
        const { sno, name, iphone, ...otherParams } = req.body;

        // 1. 基础参数校验（去空格+必填校验）
        const trimmedSno = sno?.trim() || '';
        const trimmedName = name?.trim() || '';
        const trimmedPhone = iphone?.trim() || '';

        if (!trimmedSno) {
            throw new BadRequestError('学号不能为空');
        }
        if (!trimmedName) {
            throw new BadRequestError('姓名不能为空');
        }
        if (!trimmedPhone) {
            throw new BadRequestError('手机号不能为空');
        }

        // 2. 检查该用户是否已有记录
        const existingRecruitment = await recruitment.findOne({
            where: { user_id: userId }
        });
        
        let recruitment1;
        if (existingRecruitment) {
            // 2.1 如果存在，更新现有记录
            console.log(`用户${userId}已有纳新记录，执行更新操作`);
            
            // 执行更新操作
            const updateResult = await recruitment.update({
                sno: trimmedSno,
                name: trimmedName,
                iphone: trimmedPhone, // 使用正确的字段名
                ...otherParams,
                first_review_status: 'pending',
                final_review_status: 'pending',
                update_time: new Date()
            }, {
                where: { user_id: userId }
            });
            await userinfo.update({
                student_number: trimmedSno,
                telephone: trimmedPhone,
            }, {
                where: { user_id: userId }
            });
            
            // 更新成功后，重新查询获取最新记录
            console.log(`开始重新查询用户${userId}的纳新记录`);
            recruitment1 = await recruitment.findOne({
                where: { user_id: userId }
            });
            console.log(`重新查询结果：`, recruitment1);
            
            if (!recruitment1) {
                throw new Error('更新纳新记录成功，但无法获取更新后的记录');
            }
        } else {
            // 2.2 如果不存在，创建新记录
            console.log(`用户${userId}尚无纳新记录，执行创建操作`);
            
            recruitment1 = await recruitment.create({
                sno: trimmedSno,
                name: trimmedName,
                iphone: trimmedPhone, // 使用正确的字段名
                ...otherParams,
                user_id: userId,
                first_review_status: 'pending',
                final_review_status: 'pending'
            });
        }
        
        // 3. 创建或更新审批记录
        // 检查是否已有待处理的审批记录
        const existingApproval = await approval.findOne({
            where: {
                approval_type: 'recruitment',
                applicant_id: userId,
                approval_status: 'pending'
            }
        });
        
        if (existingApproval) {
            // 如果已有待处理审批，更新它
            await approval.update({
                content: recruitment1.application_info,
                approval_node: '初审',
                updateAt: new Date()
            }, {
                where: { id: existingApproval.id }
            });
        } else {
            // 如果没有待处理审批，创建新的
            await approval.create({
                approval_type: 'recruitment',
                applicant_id: userId,
                content: recruitment1.application_info,
                approval_node: '初审',
                approval_status: 'pending',
            });
        }

        // 4. 发送通知（无论是创建还是更新，都发送成功通知）
        await notice.create({
            notice_type: 'recruit',
            receiver_id: userId,
            content: '【小鸟快修社团】纳新申请提交成功！接下来请耐心等待初审！',
            send_time: new Date()
        });

        // 5. 返回成功响应
        const responseMsg = existingRecruitment ? '纳新申请更新成功' : '纳新申请创建成功';
        success(res, responseMsg, { data: recruitment1 });

    } catch (error) {
        // 6. 唯一约束冲突兜底处理（仅返回提示，不发通知）
        if (error.name === 'SequelizeUniqueConstraintError') {
            const duplicateField = Object.keys(error.fields)[0];
            const duplicateValue = error.fields[duplicateField];
            const fieldName = duplicateField === 'sno' ? '学号' : duplicateField;
            const errorMsg = `${fieldName} ${duplicateValue} 已被其他用户使用，请勿重复提交`;

            console.error(`唯一约束冲突：${errorMsg}`, error);
            return res.status(400).json({
                code: 400,
                msg: errorMsg
            });
        }

        // 7. 其他错误兜底（仅记录日志+返回提示，不发通知）
        console.error('纳新申请提交失败:', error);
        fail(res, error);
    }
};
 
// 辅助函数：转换审核状态为中文说明（可选）
function getReviewStatusDesc(status) {
    const statusMap = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已驳回',
    };
    return statusMap[status] || status;
}
module.exports = {
    viewAllRecruitments,
    createrecruitment,
    viewPersonalRecruitment,
};