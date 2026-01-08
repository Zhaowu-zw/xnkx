const { Op } = require('sequelize'); // 移除无用的where导入
const { clubAchievement, user } = require('../models');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../utils/errors');
const { success, fail } = require('../utils/responses');
const useragent = require('useragent');
const { clubAchievementImgUpload } = require('../utils/uploadMiddleware');
const redisClient = require('../utils/redis'); // 导入Redis客户端

// 提交/新增社团成就
const publishclubachievement = async (req, res) => {
    try {
        // 1. 获取并校验请求参数
        const { year, participants, competition_name, participation_type, level, description ,image_url} = req.body;
        if (!year || !participants || !competition_name || !participation_type || !level || !description) {
            throw new BadRequestError('必填参数不能为空（year/participants/competition_name/participation_type/level/description）');
        }

        // 2. 校验枚举值合法性（和模型定义的ENUM匹配）
        const validParticipationTypes = ['个人', '团队', '个人及团队'];
        const validLevels = ['学院级', '省级', '国家级', '国际'];
        if (!validParticipationTypes.includes(participation_type)) {
            throw new BadRequestError(`参赛性质只能是：${validParticipationTypes.join('/')}`);
        }
        if (!validLevels.includes(level)) {
            throw new BadRequestError(`成就等级只能是：${validLevels.join('/')}`);
        }

        // 3. 创建数据
        const newAchievement = await clubAchievement.create({
            year: Number(year), // 确保是数字类型
            participants,
            competition_name,
            participation_type,
            level,
            description,
            image_url: image_url || null // 保存上传的图片路径（如果有）
        });

        // 4. 清除缓存，确保数据一致性
        await redisClient.delPattern('club_achievements:*');
        console.log('清除社团成就缓存');

        // 5. 成功响应（注意success函数参数顺序：res, data, msg）
        success(res,'新增社团成就成功', newAchievement);

    } catch (error) {
        console.error('新增社团成就失败：', error);
        // 区分自定义错误和系统错误
        if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
            fail(res, error.message); // 自定义错误返回具体信息
        } else {
            fail(res, '服务器内部错误：' + error.message); // 系统错误屏蔽详情
        }
    }
};

// 查看/查询社团成就（优化版）
const viewclubachievement = async (req, res) => {
    try {
        // 1. 提取查询参数
        const { year, keyword, participation_type, level, page, pageSize } = req.query;
        // 初始化查询条件
        const query = { deletedAt: null };

        // 2. 构建查询条件（确保类型安全）
        if (year) query.year = Number(year); // 强制转换为数字
        if (keyword) query[Op.or] = [
            { competition_name: { [Op.like]: `%${keyword}%` } },
            { participants: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } } // 增加description字段搜索
        ];
        if (participation_type) query.participation_type = participation_type;
        if (level) query.level = level;

        // 3. 处理分页参数（简化逻辑，确保类型安全）
        const currentPage = Math.max(1, parseInt(page) || 1);
        const currentPageSize = Math.max(1, Math.min(100, parseInt(pageSize) || 10)); // 限制最大页大小为100
        const offset = (currentPage - 1) * currentPageSize;

        // 4. 生成缓存键，包含所有查询参数
        const cacheKey = `club_achievements:${currentPage}:${currentPageSize}:${year || 'all'}:${keyword || 'none'}:${participation_type || 'all'}:${level || 'all'}`;
        
        // 5. 尝试从Redis获取缓存数据
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('从Redis缓存获取社团成就列表');
            return success(res, '获取成就信息成功', JSON.parse(cachedData));
        }

        // 6. 执行查询
        const { count, rows } = await clubAchievement.findAndCountAll({
            where: query,
            order: [['year', 'DESC'], ['createdAt', 'DESC']], // 增加createdAt排序
            limit: currentPageSize,
            offset: offset,
            // 只查询需要的字段，提升性能
            attributes: ['id', 'year', 'participants', 'competition_name', 'participation_type', 'level', 'description', 'image_url', 'createdAt', 'updatedAt']
        });

        // 7. 构造返回数据
        const result = {
            list: rows,
            pagination: {
                total: count,
                page: currentPage,
                pageSize: currentPageSize,
                totalPages: Math.ceil(count / currentPageSize)
            }
        };

        // 8. 将结果存入Redis，设置10分钟过期时间
        await redisClient.set(cacheKey, JSON.stringify(result), 600);
        console.log('社团成就列表存入Redis缓存');

        success(res, '获取成就信息成功', result);

    } catch (error) {
        console.error('查询社团成就失败：', error);
        fail(res, `查询成就信息失败：${error.message || '服务器内部错误'}`);
    }
};

// 编辑社团成就
const editclubachievement = async (req, res) => {
    try {
        // 1. 获取并校验请求参数
        const { id } = req.params || req.body; // 支持路径参数或请求体传ID
        if (!id) {
            throw new BadRequestError('请传入要编辑的成就ID');
        }
        const { year, participants, competition_name, participation_type, level, description, image_url } = req.body;
        if (!year || !participants || !competition_name || !participation_type || !level || !description) {
            throw new BadRequestError('必填参数不能为空（year/participants/competition_name/participation_type/level/description）');
        }
        // 2. 校验参赛性质和等级
        const validParticipationTypes = ['个人', '团队', '个人及团队'];
        const validLevels = ['学院级', '省级', '国家级', '国际'];
        if (!validParticipationTypes.includes(participation_type)) {
            throw new BadRequestError(`参赛性质只能是：${validParticipationTypes.join('/')}`);
        }
        if (!validLevels.includes(level)) {
            throw new BadRequestError(`成就等级只能是：${validLevels.join('/')}`);
        }
        // 3. 更新数据
        const [updatedCount] = await clubAchievement.update({
            year: Number(year), // 确保是数字类型
            participants,
            competition_name,
            participation_type,
            level,
            description,
            image_url,
            updatedAt: new Date()
        }, {
            where: { id: Number(id) } // 确保ID是数字类型
        });
        if (updatedCount === 0) {
            throw new NotFoundError(`ID为${id}的社团成就不存在`);
        }
        
        // 5. 清除缓存，确保数据一致性
        await redisClient.delPattern('club_achievements:*');
        console.log('清除社团成就缓存');
        
        // 6. 成功响应
        success(res, `ID为${id}的社团成就已更新`);
    } catch (error) {
        console.error('编辑社团成就失败：', error);
        fail(res, `编辑成就信息失败：${error.message || '服务器内部错误'}`);
    }
};

// 删除社团成就（软删除）
const deleteclubachievement = async (req, res) => { // 补全req/res参数，加async
    try {
        // 1. 获取并校验ID
        const { id } = req.params || req.body; // 支持路径参数或请求体传ID
        if (!id) {
            throw new BadRequestError('请传入要删除的成就ID');
        }

        // 2. 检查记录是否存在
        const achievement = await clubAchievement.findByPk(id);
        if (!achievement) {
            throw new NotFoundError(`ID为${id}的社团成就不存在`);
        }

        // 3. 执行软删除（paranoid: true时，destroy会自动设置deletedAt）
        await achievement.destroy();
        
        // 4. 清除缓存，确保数据一致性
        await redisClient.delPattern('club_achievements:*');
        console.log('清除社团成就缓存');

        // 5. 成功响应
        success(res, `ID为${id}的社团成就已删除`);

    } catch (error) {
        console.error('删除社团成就失败：', error);
        if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
            fail(res, error.message);
        } else {
            fail(res, '删除成就失败：' + error.message);
        }
    }
};

// 社团成果图片上传处理
const uploadClubAchievementImg = async function (req, res) {
    try {
        clubAchievementImgUpload(req, res, async (err) => {
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
            const imageUrl = `http://localhost:3000/upload/clubachievementImg/${req.file.filename}`;

            return success(res, '图片上传成功', { imageUrl });
        });
    } catch (error) {
        console.error('图片上传失败:', error);
        if (error instanceof BadRequestError) {
            return fail(res, error.message, null, 400);
        }
        return fail(res, '图片上传失败，请稍后重试', null, 500);
    }
};


module.exports = {
    publishclubachievement,
    viewclubachievement,
    editclubachievement,
    deleteclubachievement,
    uploadClubAchievementImg,
};