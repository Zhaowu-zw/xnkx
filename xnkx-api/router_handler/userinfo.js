const { Op } = require('sequelize');
const { user, userinfo,user_role, member_show, approval } = require('../models');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../utils/errors');
const { avatarUpload } = require('../utils/uploadMiddleware');
const { success, fail } = require('../utils/responses');
const bcrypt = require('bcryptjs');
const redisClient = require('../utils/redis');
//查询所有用户信息
const viewUsers = async function (req, res) {
    try {
        const { page = 1, pageSize = 10, keyword = '', group_id='' } = req.query;
        
        // 生成缓存键，包含所有查询参数
        const cacheKey = `user_list:${page}:${pageSize}:${keyword}:${group_id}`;
        
        // 尝试从Redis获取缓存数据
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('从Redis缓存获取用户列表');
            return success(res, '获取用户列表成功', JSON.parse(cachedData));
        }
        
        const offset = (page - 1) * pageSize;
        const limit = parseInt(pageSize);
        let whereClause = keyword
            ? {
                [Op.or]: [
                    { '$userinfo.nickname$': { [Op.like]: `%${keyword}%` } },
                    { username: { [Op.like]: `%${keyword}%` } }
                ]
            }
            : {};
        if (group_id) {
            whereClause = { group_id: Number(group_id) }
        }
        const { count, rows } = await user.findAndCountAll({
            where: whereClause,
            attributes: ['id','username','role_name', 'group_id','email','createdAt'],
            include: [{
                model: userinfo,
                    attributes: ['nickname', 'age', 'sex', 'hobbit', 'avatar', 'description', 'telephone', 'department', 'grade', 'student_number','updatedAt']
            }],
            offset,
            limit,
            order: [['id', 'ASC']]
        });
        
        const result = {
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                pageSize: limit,
                totalPages: Math.ceil(count / limit)
            }
        };
        
        // 将结果存入Redis，设置10分钟过期时间
        await redisClient.set(cacheKey, JSON.stringify(result), 600);
        console.log('用户列表存入Redis缓存');
        
        success(res, '获取用户列表成功', result);
    } catch (error) {
        console.error('接口报错详情:', error.message, error.stack);
        fail(res, error);
    }
}
// 查看某个用户详情或查看本人详情
const viewUserInfo = async function (req, res) {
    try {       
        const {id}= req.query;
        let targetUserId;
        
        if (!id) {
            // 如果没有提供 ID，则返回当前登录用户的信息
            const { userId } = req.user;
            targetUserId = userId;
        } else {
            targetUserId = Number(id);
        }
        
        // 生成缓存键，使用用户id
        const cacheKey = `user_info:${targetUserId}`;
        
        // 尝试从Redis获取缓存数据
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('从Redis缓存获取用户信息');
            return success(res, '获取用户信息成功', JSON.parse(cachedData));
        }
        
        const userinfoData = await userinfo.findOne({
            where: { user_id: targetUserId },
            include: [
                {
                    model: user, // user 是你的用户表模型（确保已导入且定义正确）
                    attributes: ['username'], // 只查询 user 表的 username 字段（避免返回多余字段）
                    required: true // 强制关联（如果 user 表中没有对应记录，会返回 null）
                }
            ]
        });
        
        if (!userinfoData) {
            throw new NotFoundError('用户信息未找到');
        }
        
        const result = { data: userinfoData };
        
        // 将结果存入Redis，设置10分钟过期时间
        await redisClient.set(cacheKey, JSON.stringify(result), 600);
        console.log('用户信息存入Redis缓存');
        
        success(res, '获取用户信息成功', result);
    }
    catch (error) {
        // console.log(error);
        
        fail(res, error);
    }
}
//修改用户信息
const editUserInfo = async function (req, res) {
    try {
        const { userId } = req.user;
        const { nickname, age, sex, hobbit, avatar, description, telephone, department, grade, student_number } = req.body;
        const userinfoData = await userinfo.findOne({ where: { user_id: Number(userId) } });
        if (!userinfoData) {
            throw new NotFoundError('用户信息未找到');
        }
        await userinfo.update(
            {
                nickname,
                age,
                sex,
                hobbit,
                avatar,
                description,
                telephone
                ,department,grade,student_number
            },
            { where: { user_id: Number(userId) } }
        );
        
        // 清除缓存，确保数据一致性
        await redisClient.delPattern('user_list:*');
        await redisClient.del(`user_info:${userId}`);
        console.log('清除用户相关缓存');
        
        success(res, '用户信息更新成功');
        
    } catch (error) {
        console.log(error)
        fail(res, error);
    }
}


//删除用户
const deleteUser = async function (req, res) {
    try { 
        const { id } = req.params;
        const userData = await user.findOne({ where: { id: Number(id) } });
        if (!userData) {
            throw new NotFoundError('用户未找到');
        }
        
        // 1. 先删除与用户相关的审批记录（因为approvals.applicant_id外键约束是RESTRICT）
        await approval.destroy({ where: { applicant_id: Number(id) } });
        console.log('已删除用户相关的审批记录');
        
        // 2. 删除用户主表记录，关联的userinfo、user_role和member_show记录会通过CASCADE外键约束自动删除
        await user.destroy({ where: { id: Number(id) } });
        console.log('已删除用户主表记录');
        
        // 3. 清除缓存，确保数据一致性
        await redisClient.delPattern('user_list:*');
        await redisClient.del(`user_info:${id}`);
        await redisClient.delPattern('member_shows:*'); // 注意使用复数形式，与group.js保持一致
        await redisClient.delPattern('approval_list:*'); // 清除审批记录相关缓存
        
        console.log('清除用户相关缓存');
        
        success(res, '用户删除成功');
    } catch (error) {
        console.error('删除用户失败:', error);
        // 处理外键约束错误，返回更友好的错误信息
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return fail(res, '删除用户失败，该用户可能存在关联数据，请先删除相关记录', 500);
        }
        fail(res, error);
    }
}
//修改密码
const updatePassword = async (req, res) => {
    try {
        const { userId } = req.user;
        const { oldPassword, newPassword, confirmPassword } = req.body;

        // 1. 基础参数校验（前后端双重校验，更安全）
        if (!oldPassword || !newPassword || !confirmPassword) {
            throw new NotFoundError ('原密码、新密码、确认密码不能为空' );
        }
        // 2. 查询用户是否存在
        const existingUser = await user.findOne({ where: { id: userId } });
        if (!existingUser) {
            throw new NotFoundError('用户不存在' );
        }

        // 3. 校验原密码是否正确
        const passwordMatch = bcrypt.compareSync(oldPassword, existingUser.password);
        if (!passwordMatch) {
            throw new NotFoundError ('原密码输入错误' );
        }

        // 4. 校验新密码与确认密码一致性
        if (newPassword !== confirmPassword) {
            throw new NotFoundError( '新密码与确认密码不一致' );
        }

        // 5. 校验新密码强度（与前端规则一致：6-20位，包含字母+数字）
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/;
        if (!passwordRegex.test(newPassword)) {
            throw new NotFoundError( '新密码需满足：6-20位字符，同时包含字母和数字');
        }

        // 6. 校验新密码不能与原密码相同
        if (bcrypt.compareSync(newPassword, existingUser.password)) {
            throw new NotFoundError('新密码不能与原密码相同' );
        }

        // 8. 更新数据库中的密码
        await user.update(
            { password: newPassword}, // 存入加密后的密码
            { where: { id: userId } } // 条件：当前用户ID
        );

        // 9. 响应成功结果
        success(res, '密码修改成功');

    } catch (error) {
        console.error('修改密码失败：', error);
        fail(res, error);
    }
};
// 头像上传接口（直接用封装好的中间件）
const uploadAvatar = async function (req, res) {
    try {
        // 调用头像上传中间件
        avatarUpload(req, res, async (err) => {
            if (err) {
                throw err; // 中间件已封装错误（格式/大小）
            }
            if (!req.file) {
                throw new BadRequestError('请选择要上传的头像文件');
            }
            // 生成可访问的URL（根据你的服务器域名调整）
            const avatarUrl = `http://localhost:3000/upload/avatar/${req.file.filename}`;
            success(res, '头像上传成功', { data: { avatarUrl } });
        });
    } catch (error) {
        fail(res, error);
    }
};

module.exports = {
    viewUserInfo,
    editUserInfo,
    viewUsers,
    deleteUser,
    updatePassword,
    uploadAvatar
};
