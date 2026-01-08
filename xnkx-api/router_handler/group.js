const { Op, where } = require('sequelize');
const { group_info, member_show,userinfo,user } = require('../models');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../utils/errors');
const { success, fail } = require('../utils/responses');
const redisClient = require('../utils/redis');


//查询所有小组信息
const viewgroups = async function (req, res) {
    try {
        // 生成固定缓存键，因为该函数返回所有小组信息
        const cacheKey = 'groups_all';
        
        // 尝试从Redis获取缓存数据
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('从Redis缓存获取小组列表');
            return success(res, '获取小组列表成功', JSON.parse(cachedData));
        }
        
        const groups = await group_info.findAll();
        const result = { data: groups };
        
        // 将结果存入Redis，设置10分钟过期时间
        await redisClient.set(cacheKey, JSON.stringify(result), 600);
        console.log('小组列表存入Redis缓存');
        
        success(res, '获取小组列表成功', result);
    } catch (error) {
        fail(res, error);
    }
};
//创建新小组
const creategroup = async function (req, res) {
    try {
        const { group_name, group_position, function_desc, core_achievements } = req.body;
        if (!group_name) {
            throw new BadRequestError('小组名称不能为空');
        }
        await group_info.create({ group_name, group_position, function_desc, core_achievements });
        
        // 清除缓存，确保数据一致性
        await redisClient.del('groups_all');
        await redisClient.delPattern('member_shows:*');
        console.log('清除小组相关缓存');
        
        success(res, '创建小组成功');
    } catch (error) {
        fail(res, error);
    }
}
//修改小组信息
const editgroup = async function (req, res) {
    try {
        const { id } = req.params;
        const { group_name, group_position, function_desc, core_achievements } = req.body;
        if (!id) {
            throw new BadRequestError('小组ID不能为空');
        }
        const existinggroup = await group_info.findByPk(id);
        if (!existinggroup) {
            throw new NotFoundError('小组不存在');
        }
        await group_info.update({ group_name, group_position, function_desc, core_achievements }, { where: { id } });
        
        // 清除缓存，确保数据一致性
        await redisClient.del('groups_all');
        await redisClient.delPattern('member_shows:*');
        console.log('清除小组相关缓存');
        
        success(res, '修改小组成功');
    } catch (error) {
        fail(res, error);
    }
}
//删除小组
const deletegroup = async function (req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            throw new BadRequestError('小组ID不能为空');
        }
        const existinggroup = await group_info.findByPk(id);
        if (!existinggroup) {
            throw new NotFoundError('小组不存在');
        }
        await group_info.destroy({ where: { id } });
        
        // 清除缓存，确保数据一致性
        await redisClient.del('groups_all');
        await redisClient.delPattern('member_shows:*');
        console.log('清除小组相关缓存');
        
        success(res, '删除小组成功');
    } catch (error) {
        fail(res, error);
    }
}
//查看人员展示信息
const membershows = async function (req, res) {
    try {
        // 1. 接收查询参数：group_id（可选，用于按分组查询）
        const { group_id } = req.query;
        
        // 2. 生成缓存键，使用group_id作为区分
        const cacheKey = `member_shows:${group_id || 'all'}`;
        
        // 3. 尝试从Redis获取缓存数据
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('从Redis缓存获取人员展示信息');
            return success(res, `获取${group_id ? '分组ID=' + group_id : '所有'}人员展示信息成功`, JSON.parse(cachedData));
        }

        // 4. 动态构建查询条件：有group_id则查指定分组，无则查所有
        const queryCondition = group_id ? { id: group_id } : {};

        // 5. 查询分组（按条件过滤，包含关联的member_shows）
        const groups = await group_info.findAll({
            where: queryCondition, // 新增：动态条件
            include: [
                {
                    association: 'member_shows',
                    attributes: ['user_id', 'is_show']
                }
            ],
            attributes: ['id', 'group_name']
        });

        // 6. 提取所有member_shows中的user_id（去重）
        const userIds = [];
        groups.forEach(group => {
            const memberShows = Array.isArray(group.member_shows)
                ? group.member_shows
                : group.member_shows ? [group.member_shows] : [];

            memberShows.forEach(ms => {
                if (ms.user_id && !userIds.includes(ms.user_id)) {
                    userIds.push(ms.user_id);
                }
            });
        });

        // 7. 批量查询相关用户
        const users = userIds.length
            ? await userinfo.findAll({
                where: { user_id: userIds },
                attributes: ['id', 'user_id', 'nickname', 'avatar', 'hobbit', 'department', 'grade','sex']
            })
            : [];
        // console.log('查询到的用户信息：', users.map(u => u.toJSON()));
        //查询用户角色
        const userRole = userIds.length ? await user.findAll({
            where: { id: userIds },
            attributes:['id','role_name']
        }):[];

        // 8. 格式化数据（关联用户信息）
        const result = {
            data: groups.map(group => {
                const memberShows = Array.isArray(group.member_shows)
                    ? group.member_shows
                    : group.member_shows ? [group.member_shows] : [];

                const membersWithUser = memberShows.map(ms => {
                    const user = users.find(u => u.user_id === ms.user_id);
                    const user_role = userRole.find(u => u.id === ms.user_id);
                    return { ...ms.toJSON(), user: user, user_role: user_role || null };
                });

                return {
                    ...group.toJSON(),
                    member_shows: membersWithUser
                };
            })
        };
        
        // 9. 将结果存入Redis，设置10分钟过期时间
        await redisClient.set(cacheKey, JSON.stringify(result), 600);
        console.log('人员展示信息存入Redis缓存');

        success(res, `获取${group_id ? '分组ID=' + group_id : '所有'}人员展示信息成功`, result);
    } catch (error) {
        console.log('错误详情：', error);
        fail(res, '获取人员展示信息失败');
    }
};
module.exports = {
    viewgroups,
    creategroup,
    editgroup,
    deletegroup,
    membershows
};