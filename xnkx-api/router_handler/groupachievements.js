const { Op } = require('sequelize');
const { groupachievement, group_info } = require('../models');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { success, fail } = require('../utils/responses');
const { groupAchievementImgUpload } = require('../utils/uploadMiddleware.js');

/**
 * 1. 获取所有小组成果（按小组分组，无分页）
 * @param {Request} req 请求对象
 * @param {Response} res 响应对象
 * @param {NextFunction} next 下一步中间件
 */
const viewgroupachievement = async (req, res, next) => {
    try {
        const { keyword,group_id,status} = req.query;
        const whereCondition = {};
        if (keyword) {
            whereCondition.title = { [Op.like]: `%${keyword}%` };
        }
        if (group_id) {
            whereCondition.group_id = group_id;
        }
        if (status) {
            whereCondition.status = status;
        }   

        const achievements = await groupachievement.findAll({
            where: whereCondition,
            include: [
                {
                    model: group_info,
                    as: 'group',
                    attributes: ['id', 'group_name']
                }
            ],
            order: [['group_id', 'ASC'], ['activity_time', 'DESC']]
        });

        const groupedAchievements = {};
        achievements.forEach(item => {
            const groupId = item.group_id;
            const groupName = item.group?.group_name || '未知小组';
            if (!groupedAchievements[groupId]) {
                groupedAchievements[groupId] = {
                    group_id: groupId,
                    group_name: groupName,
                    achievements: []
                };
            }
            groupedAchievements[groupId].achievements.push(item);
        });

        const result = Object.values(groupedAchievements);
        return success(res, '获取分组成果列表成功', result);
    } catch (error) {
        next(error);
    }
};

/**
 * 2. 新增小组成果（移除权限校验）
 */
const publishgroupachievement = async (req, res, next) => {
    try {
        const { title, description, activity_time, group_id, status = 'completed', image_url = '' } = req.body;

        console.log('请求体数据：', req.body);
        if (!title || !activity_time || !group_id) {
            throw new BadRequestError('成果标题、完成时间、所属小组ID不能为空');
        }

        const newAchievement = await groupachievement.create({
            title,
            description,
            activity_time,
            group_id,
            status,
            image_url,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return success(res, '新增小组成果成功', newAchievement, 201);
    } catch (error) {
        next(error);
    }
};

/**
 * 3. 删除小组成果（移除权限校验）
 */
const deletegroupachievement = async (req, res, next) => {
    try {
        const { id } = req.params;
        const achievement = await groupachievement.findByPk(id);

        if (!achievement) {
            throw new NotFoundError('该小组成果不存在，无法删除');
        }

        await achievement.destroy();
        return success(res, '删除小组成果成功');
    } catch (error) {
        next(error);
    }
};

/**
 * 4. 修改小组成果信息（移除权限校验）
 */
const updategroupachievement = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, activity_time, group_id, status, image_url } = req.body;

        const achievement = await groupachievement.findByPk(id);
        if (!achievement) {
            throw new NotFoundError('该小组成果不存在，无法修改');
        }

        // 修复参数校验漏洞：同时判断undefined和空字符串
        if (!title || !activity_time || !group_id) {
            throw new BadRequestError('成果标题、完成时间、所属小组ID不能为空');
        }

        await achievement.update({
            title: title || achievement.title,
            description: description || achievement.description,
            activity_time: activity_time || achievement.activity_time,
            group_id: group_id || achievement.group_id,
            status: status || achievement.status,
            image_url: image_url || achievement.image_url,
            updatedAt: new Date()
        });

        return success(res, '修改小组成果成功', achievement);
    } catch (error) {
        next(error);
    }
};

/**
 * 5. 成果图片上传（集成groupAchievementImgUpload中间件处理上传）
 * 核心：在handler层封装上传逻辑，包含中间件调用+业务处理
 * @param {Request} req 请求对象
 * @param {Response} res 响应对象
 * @param {NextFunction} next 下一步中间件
 */
const uploadgroupachievementimg = async (req, res, next) => {
    // 第一步：调用上传中间件处理文件上传
    groupAchievementImgUpload(req, res, async (err) => {
        try {
            // 捕获上传中间件的错误（如文件类型/大小错误）
            if (err) {
                throw new BadRequestError(err.message || '图片上传失败');
            }

            // 第二步：校验文件是否上传成功
            if (!req.file) {
                throw new BadRequestError('请选择要上传的成果图片');
            }

            // 第三步：构建可访问的图片URL并返回
            const imageUrl = `http://localhost:3000/upload/groupachievementImg/${req.file.filename}`;
            return success(res, '成果图片上传成功', {
                imageUrl,
                filename: req.file.filename,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                filePath: req.file.path // 可选：返回本地文件路径
            });
        } catch (error) {
        return fail(res,error)
        }
    });
};

// 导出所有方法（包含上传中间件，方便路由层直接使用）
module.exports = {
    viewgroupachievement,
    publishgroupachievement,
    deletegroupachievement,
    updategroupachievement,
    uploadgroupachievementimg,
    groupAchievementImgUpload // 导出上传中间件，路由层可按需使用
};