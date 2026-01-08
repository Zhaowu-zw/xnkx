const { activity, group_info, user, userinfo, sequelize } = require('../models');
const { Op } = require('sequelize');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { dynamicModuleUpload } = require('../utils/uploadMiddleware');
const { success, fail } = require('../utils/responses');
const redisClient = require('../utils/redis');

// 发布新动态
const createActivity = async function (req, res) {
    try {
        const { userId } = req.user;
        const { title, group_id, description, image_url, brief } = req.body;

        // 1. 基础业务校验
        if (!title || title.trim() === '') {
            return fail(res, '动态标题不能为空', null, 400);
        }
        // brief字段可选校验（若业务要求非空可开启）
        if (brief && brief.trim() === '') {
            return fail(res, '动态简介不能为空', null, 400);
        }

        // 2. 分组ID处理（简化逻辑）
        let finalGroupId = null;
        if (group_id != null) { // 兼容 undefined/null，简化判断
            const groupIdNum = Number(group_id);
            if (isNaN(groupIdNum) || groupIdNum <= 0) {
                return fail(res, '分组ID必须为正整数', null, 400);
            }
            const groupExists = await group_info.findOne({ where: { id: groupIdNum } });
            if (!groupExists) {
                return fail(res, '分组不存在', null, 400);
            }
            finalGroupId = groupIdNum;
        }

        // 3. 图片URL处理（适配模型的数组特性）
        let finalImageUrl = null;
        if (image_url != null) {
            // 统一转为数组处理：支持前端传字符串/数组
            const urlList = Array.isArray(image_url) ? image_url : image_url.split(',');
            // 过滤空URL，避免无效值
            const validUrls = urlList.filter(url => url && url.trim() !== '');

            // 逐个校验URL格式
            const urlRegex = /^(https?:\/\/)?((localhost)|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([\da-z.-]+\.[a-z.]{2,6}))(:\d{1,5})?([\/\w\-._~:?#[\]@!$&'()*+,;=]*)$/i;
            for (const url of validUrls) {
                if (!urlRegex.test(url.trim())) {
                    return fail(res, `图片URL格式无效：${url}`, null, 400);
                }
            }
            // 转为逗号分隔字符串（匹配模型setter）
            finalImageUrl = validUrls.length > 0 ? validUrls.join(',') : null;
        }

        // 4. 创建动态
        const newActivity = await activity.create({
            title: title.trim(),
            brief: brief ? brief.trim() : '',
            group_id: finalGroupId,
            activity_time: new Date(),
            description: description ? description.trim() : '',
            creator_id: userId,
            image_url: finalImageUrl // 模型setter会自动处理（这里传字符串也兼容）
        });

        // 5. 清除动态列表缓存，确保数据一致性
        await redisClient.delPattern('activity_list:*');
        console.log('清除动态列表缓存');

        return success(res, '动态发布成功', newActivity);
    } catch (error) {
        console.error('发布动态失败-详细错误:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            sql: error.sql // Sequelize错误会包含SQL语句
        });
        if (error.name === 'SequelizeError') {
            return fail(res, '数据库操作失败，请稍后重试', { sql: error.sql }, 500);
        }
        return fail(res, '发布动态失败', {error:error.mes}, 500);
    }
};

// 编辑动态
const updateActivity = async function (req, res) {
    try {
        const { userId } = req.user;
        const { id } = req.params;
        const { title, group_id, description, image_url, brief } = req.body;

        // 1. 校验ID格式
        const activityId = Number(id);
        if (isNaN(activityId) || activityId <= 0) {
            return fail(res, '无效的动态ID（必须为正整数）', null, 400);
        }

        // 2. 查询动态是否存在
        const existingActivity = await activity.findOne({
            where: { id: activityId, creator_id: userId }
        });
        if (!existingActivity) {
            throw new NotFoundError('动态不存在或无编辑权限');
        }

        // 3. 字段更新处理
        if (title !== undefined) {
            if (title.trim() === '') {
                return fail(res, '动态标题不能为空', null, 400);
            }
            existingActivity.title = title.trim();
        }
        if (group_id !== undefined) {
            if (group_id != null) {
                const groupIdNum = Number(group_id);
                if (isNaN(groupIdNum) || groupIdNum <= 0) {
                    return fail(res, '分组ID必须为正整数', null, 400);
                }
                const groupExists = await group_info.findOne({ where: { id: groupIdNum } });
                if (!groupExists) {
                    return fail(res, '分组不存在', null, 400);
                }
                existingActivity.group_id = groupIdNum;
            } else {
                existingActivity.group_id = null; // 明确置空
            }
        }
        if (brief !== undefined) {
            existingActivity.brief = brief ? brief.trim() : '';
        }
        if (description !== undefined) {
            existingActivity.description = description ? description.trim() : '';
        }
        if (image_url !== undefined) {
            // 兼容数组/字符串/空值
            if (image_url == null) {
                existingActivity.image_url = null;
            } else {
                const urlList = Array.isArray(image_url) ? image_url : image_url.split(',');
                const validUrls = urlList.filter(url => url && url.trim() !== '');
                const urlRegex = /^(https?:\/\/)?((localhost)|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([\da-z.-]+\.[a-z.]{2,6}))(:\d{1,5})?([\/\w\-._~:?#[\]@!$&'()*+,;=]*)$/i;
                for (const url of validUrls) {
                    if (!urlRegex.test(url.trim())) {
                        return fail(res, `图片URL格式无效：${url}`, null, 400);
                    }
                }
                existingActivity.image_url = validUrls.length > 0 ? validUrls.join(',') : null;
            }
        }

        await existingActivity.save();
        
        // 清除动态列表缓存，确保数据一致性
        await redisClient.delPattern('activity_list:*');
        console.log('清除动态列表缓存');
        
        return success(res, '动态更新成功', existingActivity);
    } catch (error) {
        console.error('编辑动态失败:', error);
        if (error instanceof NotFoundError) {
            return fail(res, error.message, null, 404);
        }
        if (error.name === 'SequelizeError') {
            return fail(res, '数据库操作失败，请稍后重试', null, 500);
        }
        return fail(res, '编辑动态失败', null, 500);
    }
};
// 动态图片上传接口
const uploadDynamicModuleImages = async function (req, res) {
    try {
        dynamicModuleUpload(req, res, async (err) => {
            if (err) {
                // 业务错误处理
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return fail(res, '图片大小超出限制', null, 400);
                }
                if (err.code === 'LIMIT_FILE_TYPE') {
                    return fail(res, '仅支持JPG/PNG格式图片', null, 400);
                }
                throw new BadRequestError(err.message || '图片上传失败');
            }
            // 生成图片URL
            const imageUrls =`http://localhost:3000/upload/activityImg/${req.file.filename}`;
      
           return  success(res, '图片上传成功', { imageUrls });
        });
    } catch (error) {
        console.error('图片上传失败:', error);
        if (error instanceof BadRequestError) {
            return fail(res, error.message, null, 400);
        }
        return fail(res, '图片上传失败，请稍后重试', null, 500);
    }
};

// 查看动态列表（带分页）- 最终稳定版
const viewActivities = async function (req, res) {
    try {
        // 分页参数
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        // 筛选条件
        const { group_id, keyword } = req.query;
        
        // 生成缓存键，包含所有查询参数
        const cacheKey = `activity_list:${page}:${pageSize}:${group_id || 'all'}:${keyword || 'none'}`;
        
        // 尝试从Redis获取缓存数据
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('从Redis缓存获取动态列表');
            return success(res, '动态获取成功', JSON.parse(cachedData));
        }

        const where = {};
        if (group_id) {
            where.group_id = Number(group_id);
        }
        if (keyword) {
            where.title = { [Op.like]: `%${keyword}%` };
        }

        // 分页查询 - 子查询方案（无需关联，直接查昵称）
        const { count, rows } = await activity.findAndCountAll({
            where,
            attributes: {
                // 1. 不排除creator_id（用于子查询），但后续格式化时删除
                // exclude: ['creator_id'], 
                // 2. 子查询获取昵称（核心）
                include: [
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(ui.nickname, '未知用户')
                            FROM users u
                            LEFT JOIN userinfos ui ON u.id = ui.user_id
                            WHERE u.id = activity.creator_id
                            LIMIT 1
                        )`),
                        'creator_nickname' // 直接生成昵称字段
                    ]
                ]
            },
            order: [['activity_time', 'DESC']],
            limit: pageSize,
            offset
        });

        // 格式化返回数据
        const formattedList = rows.map(item => {
            const data = item.toJSON();
            // 移除creator_id，不返回给前端（保护隐私）
            delete data.creator_id;
            // 兜底：子查询无结果时显示"未知用户"
            data.creator_nickname = data.creator_nickname || '未知用户';
            return data;
        });

        const result = {
            list: formattedList,
            pagination: {
                total: count,
                page,
                pageSize,
                totalPages: Math.ceil(count / pageSize)
            }
        };
        
        // 将结果存入Redis，设置10分钟过期时间
        await redisClient.set(cacheKey, JSON.stringify(result), 600);
        console.log('动态列表存入Redis缓存');

        return success(res, '动态获取成功', result);
    } catch (error) {
        console.error('获取动态失败:', error);
        console.error('错误详情:', error.stack);
        if (error.name === 'SequelizeError') {
            return fail(res, '数据库操作失败，请稍后重试', null, 500);
        }
        return fail(res, '获取动态失败', null, 500);
    }
};
// 删除动态
const deleteActivity = async function (req, res) {
    try {
        const { userId } = req.user;
        const { id } = req.params;

        // 校验ID格式
        if (!id || isNaN(Number(id)) || Number(id) <= 0) {
            return fail(res, '无效的动态ID（必须为正整数）', null, 400);
        }

        // 查询动态（仅校验创建者，业务逻辑）
        const activityToDelete = await activity.findOne({
            where: { id: Number(id), creator_id: userId }
        });
        if (!activityToDelete) {
            throw new NotFoundError('动态不存在或无删除权限');
        }

        await activityToDelete.destroy();
        
        // 清除动态列表缓存，确保数据一致性
        await redisClient.delPattern('activity_list:*');
        console.log('清除动态列表缓存');
        
        return success(res, '动态删除成功');
    } catch (error) {
        console.error('删除动态失败:', error);
        if (error instanceof NotFoundError) {
            return fail(res, error.message, null, 404);
        }
        if (error.name === 'SequelizeError') {
            return fail(res, '数据库操作失败，请稍后重试', null, 500);
        }
        return fail(res, '删除动态失败', null, 500);
    }
};

module.exports = {
    createActivity,
    updateActivity,
    uploadDynamicModuleImages,
    viewActivities,
    deleteActivity
};