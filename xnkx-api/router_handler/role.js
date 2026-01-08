const { Op } = require('sequelize');
const {role, user_role, user, approval, notice } = require('../models');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../utils/errors');
const { success, fail } = require('../utils/responses');


//查询所有角色信息
const viewRoles = async function (req, res) {
    try {
        const roles =  await role.findAll({
            attributes: ['id', 'role_name', 'permission_desc', 'createdAt']
        });
        success(res, '获取角色列表成功', { data: roles });
     } catch (error) {
        fail(res, error);
    }
}
//创建新角色
const createRole = async function (req, res) {
    try {
        const { role_name, permission_desc } = req.body;
        if (!role_name) {
            throw new BadRequestError('角色名称不能为空');
        }
        await role.create({ role_name, permission_desc });
        success(res, '创建角色成功');
     } catch (error) {
        fail(res, error);
    }
}
//修改角色信息
const editRole = async function (req, res) {
    try { 
        const { id } = req.params;
        const { role_name, permission_desc } = req.body;
        if (!id) {
            throw new BadRequestError('角色ID不能为空');
        }
        const existingRole = await role.findByPk(id);
        if (!existingRole) {
            throw new NotFoundError('角色不存在');
        }
        await role.update({ role_name, permission_desc }, { where: { id } });
        success(res, '修改角色成功');
    } catch (error) {
        fail(res, error);
    }
}
//删除角色
const deleteRole = async function (req, res) {
    try { 
        const { id } = req.params;
        if (!id) {
            throw new BadRequestError('角色ID不能为空');
        }
        const existingRole = await role.findByPk(id);
        if (!existingRole) {
            throw new NotFoundError('角色不存在');
        }
        await role.destroy({ where: { id } });
        success(res, '删除角色成功');
    } catch (error) {
        fail(res, error);
    }
}
// 分配角色给用户
const addUserRole = async function (req, res) {
    try {
        const { userId, roleId } = req.body;
        if (!userId || !roleId) {
            throw new BadRequestError('用户ID和角色ID不能为空');
        }
        
        // 检查角色是否存在
        const existingRole = await role.findByPk(roleId);
        if (!existingRole) {
            throw new NotFoundError('角色不存在');
        }
        
        // 检查用户是否存在
        const existingUser = await user.findByPk(userId);
        if (!existingUser) {
            throw new NotFoundError('用户不存在');
        }
        
        // 检查用户是否已拥有该角色
        const existingUserRole = await user_role.findOne({
            where: {
                user_id: userId,
                role_id: roleId
            }
        });
        
        if (existingUserRole) {
            throw new BadRequestError('用户已拥有该角色');
        }
        
        // 角色数量限制检查
        const roleName = existingRole.role_name;
        
        if (roleName === '组长') {
            // 每个组只能有一个组长
            const userGroup = await user.findByPk(userId, {
                attributes: ['group_id']
            });
            
            if (userGroup.group_id) {
                // 查询该组已有多少组长
                const groupLeadersCount = await user.count({
                    where: {
                        group_id: userGroup.group_id
                    },
                    include: [{
                        model: role,
                        through: user_role, // 使用中间表
                        where: { role_name: '组长' }
                    }]
                });
                
                if (groupLeadersCount >= 1) {
                    throw new BadRequestError('每个组只能有一个组长');
                }
            }
        } else if (roleName === '指导老师') {
            // 每个组可以有两个指导老师
            const userGroup = await user.findByPk(userId, {
                attributes: ['group_id']
            });
            
            if (userGroup.group_id) {
                // 查询该组已有多少指导老师
                const teachersCount = await user.count({
                    where: {
                        group_id: userGroup.group_id
                    },
                    include: [{
                        model: role,
                        through: user_role, // 使用中间表
                        where: { role_name: '指导老师' }
                    }]
                });
                
                if (teachersCount >= 2) {
                    throw new BadRequestError('每个组只能有两个指导老师');
                }
            }
        } else if (roleName === '社长' || roleName === '管理员') {
            // 社长和管理员都是只能有一个
            const roleCount = await user.count({
                include: [{
                    model: user_role,
                    include: [{
                        model: role,
                        where: { role_name }
                    }]
                }]
            });
            
            if (roleCount >= 1) {
                throw new BadRequestError(`${roleName}只能有一个`);
            }
        }
        
        // 直接创建角色关联
        await user_role.create({ user_id: userId, role_id: roleId });
        
        // 更新用户主角色（如果是更高层级角色）
        const roleHierarchy = {
            '指导老师': 4,
            '社长': 3,
            '组长': 2,
            '组员': 1,
            '普通用户': 0
        };
        
        const currentRoleLevel = roleHierarchy[existingUser.role_name] || 0;
        const newRoleLevel = roleHierarchy[existingRole.role_name] || 0;
        
        if (newRoleLevel > currentRoleLevel) {
            await user.update({
                role_name: existingRole.role_name
            }, {
                where: {
                    id: userId
                }
            });
        }
        await notice.create({
            notice_type: 'system',
            receiver_id: userId,
            content: `【小鸟快修社团】您的角色已被管理员分配为${existingRole.role_name}，望您可以发挥您的角色权限，遵守社团规则。`,
            send_time: new Date()
        });
        
        success(res, '角色分配成功');
    } catch (error) {
        fail(res, error);
    }
}

// 从用户移除角色
const removeUserRole = async function (req, res) {
    try {
        const { userId, roleId } = req.params;
        if (!userId || !roleId) {
            throw new BadRequestError('用户ID和角色ID不能为空');
        }
        
        // 检查角色是否存在
        const existingRole = await role.findByPk(roleId);
        if (!existingRole) {
            throw new NotFoundError('角色不存在');
        }
        
        // 检查用户是否存在
        const existingUser = await user.findByPk(userId);
        if (!existingUser) {
            throw new NotFoundError('用户不存在');
        }
        
        // 检查用户是否拥有该角色
        const existingUserRole = await user_role.findOne({
            where: {
                user_id: userId,
                role_id: roleId
            }
        });
        
        if (!existingUserRole) {
            throw new BadRequestError('用户不拥有该角色');
        }
        
        // 检查是否移除的是组员角色
        if (existingRole.role_name === '组员') {
            // 查找普通用户角色的ID
            const normalRole = await role.findOne({
                where: { role_name: '普通用户' }
            });
            
            // 如果找到了普通用户角色
            if (normalRole) {
                // 移除用户除普通用户外的所有角色
                await user_role.destroy({
                    where: {
                        user_id: userId,
                        role_id: {
                            [Op.ne]: normalRole.id
                        }
                    }
                });
            }
            
            // 设置用户为主角色普通用户
            await user.update({
                role_name: '普通用户',
                group_id: null
            }, {
                where: {
                    id: userId
                }
            });
        } else {
            // 不是组员角色，只移除指定角色
            await user_role.destroy({
                where: {
                    user_id: userId,
                    role_id: roleId
                }
            });
            
            // 如果移除的是主角色，更新主角色为最高层级的剩余角色
            if (existingUser.role_name === existingRole.role_name) {
                const remainingRoles = await user_role.findAll({
                    where: { user_id: userId },
                    include: [{ model: role, attributes: ['role_name'] }]
                });
                
                if (remainingRoles.length > 0) {
                    const roleHierarchy = {
                        '管理员': 5,
                        '指导老师': 4,
                        '社长': 3,
                        '组长': 2,
                        '组员': 1,
                        '普通用户': 0
                    };
                    
                    let newMainRole = '普通用户';
                    let maxLevel = 0;
                    
                    remainingRoles.forEach(item => {
                        const roleLevel = roleHierarchy[item.role.role_name] || 0;
                        if (roleLevel > maxLevel) {
                            maxLevel = roleLevel;
                            newMainRole = item.role.role_name;
                        }
                    });
                    
                    await user.update({
                        role_name: newMainRole
                    }, {
                        where: {
                            id: userId
                        }
                    });
                } else {
                    // 如果没有剩余角色，设置为普通用户
                    await user.update({
                        role_name: '普通用户'
                    }, {
                        where: {
                            id: userId
                        }
                    });
                }
            }
        }
        // 根据情况发送不同的通知
        if (existingRole.role_name === '组员') {
            // 如果是组员角色，通知用户所有角色都被移除
            await notice.create({
                notice_type: 'system',
                receiver_id: userId,
                content: `【小鸟快修社团】由于您的组员角色被移除，您的所有角色已被清除，现为普通用户，望您可以遵守社团规则。`,
                send_time: new Date()
            });
        } else {
            // 如果是其他角色，只通知用户该角色被移除
            await notice.create({
                notice_type: 'system',
                receiver_id: userId,
                content: `【小鸟快修社团】您的角色${existingRole.role_name}已被管理员移除，望您可以遵守社团规则。`,
                send_time: new Date()
            });
        }
        
        success(res, '角色移除成功');
    } catch (error) {
        fail(res, error);
    }
}

// 获取用户所有角色
const getUserRoles = async function (req, res) {
    try {
        let { userId } = req.params;
        if (!userId) {
            throw new BadRequestError('用户ID不能为空');
        }
        
        // 将字符串转换为数字类型
        userId = parseInt(userId);
        if (isNaN(userId)) {
            throw new BadRequestError('无效的用户ID');
        }
        
        // 检查用户是否存在
        const existingUser = await user.findByPk(userId);
        if (!existingUser) {
            throw new NotFoundError('用户不存在');
        }
        
        // 获取用户角色关联记录
        const userRoleAssociations = await user_role.findAll({
            where: { user_id: userId },
            attributes: ['role_id']
        });
        
        // 如果没有角色关联，返回空数组
        if (userRoleAssociations.length === 0) {
            return success(res, '获取用户角色成功', { roles: [] });
        }
        
        // 提取所有角色ID
        const roleIds = userRoleAssociations.map(item => item.role_id);
        
        // 获取角色详细信息
        const roles = await role.findAll({
            where: { id: { [Op.in]: roleIds } },
            attributes: ['id', 'role_name', 'permission_desc']
        });
        
        success(res, '获取用户角色成功', { roles });
    } catch (error) {
        fail(res, error);
        console.error('获取用户角色失败:', error);
    }
}

// 更新用户主角色（需审批）
const updateUserMainRole = async function (req, res) {
    try {
        const { userId } = req.params;
        const { role_name, changeType, content } = req.body;
        if (!userId || !role_name || !changeType) {
            throw new BadRequestError('用户ID、角色名称和变更类型不能为空');
        }
        
        // 验证变更类型
        const validChangeTypes = ['promote', 'resign', 'resign_club', 'update_main_role'];
        if (!validChangeTypes.includes(changeType)) {
            throw new BadRequestError('无效的变更类型');
        }
        
        // 检查用户是否存在
        const existingUser = await user.findByPk(userId);
        if (!existingUser) {
            throw new NotFoundError('用户不存在');
        }
        
        // 检查角色是否存在
        const existingRole = await role.findOne({
            where: { role_name }
        });
        if (!existingRole) {
            throw new NotFoundError('角色不存在');
        }
        
        // 角色数量限制检查
        if (role_name === '组长') {
            // 每个组只能有一个组长
            const userGroup = await user.findByPk(userId, {
                attributes: ['group_id']
            });
            
            if (userGroup.group_id) {
                // 查询该组已有多少组长，排除当前用户
                const groupLeadersCount = await user.count({
                    where: {
                        group_id: userGroup.group_id,
                        id: { [Op.ne]: userId } // 排除当前用户
                    },
                    include: [{
                        model: role,
                        through: user_role, // 使用中间表
                        where: { role_name: '组长' }
                    }]
                });
                
                if (groupLeadersCount >= 1) {
                    throw new BadRequestError('每个组只能有一个组长');
                }
            }
        } else if (role_name === '指导老师') {
            // 每个组可以有两个指导老师
            // 查询已有多少指导老师，排除当前用户，按组统计
            const userGroup = await user.findByPk(userId, {
                attributes: ['group_id']
            });
            
            if (userGroup.group_id) {
                // 查询该组已有多少指导老师，排除当前用户
                const teachersCount = await user.count({
                    where: {
                        group_id: userGroup.group_id,
                        id: { [Op.ne]: userId } // 排除当前用户
                    },
                    include: [{
                        model: role,
                        through: user_role, // 使用中间表
                        where: { role_name: '指导老师' }
                    }]
                });
                
                if (teachersCount >= 2) {
                    throw new BadRequestError('每个组只能有两个指导老师');
                }
            }
        } else if (role_name === '社长' || role_name === '管理员') {
            // 社长和管理员都是只能有一个
            // 查询已有多少该角色，排除当前用户
            const roleCount = await user.count({
                where: {
                    id: { [Op.ne]: userId } // 排除当前用户
                },
                include: [{
                    model: role,
                    through: user_role, // 使用中间表
                    where: { role_name }
                }]
            });
            
            if (roleCount >= 1) {
                throw new BadRequestError(`${role_name}只能有一个`);
            }
        }
        
        // 根据变更类型决定是否检查用户是否拥有该角色
        // 晋升操作时，用户可能还没有目标角色，所以不检查
        // 卸任和角色变更操作时，用户应该拥有目标角色，所以需要检查
        if (changeType !== 'promote') {
            const hasRole = await user_role.findOne({
                where: {
                    user_id: userId,
                    role_id: existingRole.id
                }
            });
            
            if (!hasRole) {
                throw new BadRequestError('用户不拥有该角色，无法设置为主角色');
            }
        }
        
        // 根据变更类型设置审批节点
        let approvalNode = '角色变更';
        switch (changeType) {
            case 'promote':
                approvalNode = '晋升';
                break;
            case 'resign':
                approvalNode = '卸任';
                break;
            case 'resign_club':
                approvalNode = '退出社团';
                break;
            default:
                approvalNode = '角色变更';
        }
        
        // 创建审批记录，content字段使用前端传递的纯文本
        // 并将用户ID、角色名称等信息存储在content中，以便后续审批使用
        const approvalContent = {
            userId: parseInt(userId),
            role_name: role_name,
            reason: content || ''
        };
        
        await approval.create({
            approval_type: 'permission',
            applicant_id: parseInt(userId), // 审批申请人是要变更角色的用户
            content: JSON.stringify(approvalContent), // 存储为JSON，便于后续解析
            approval_node: approvalNode,
            approval_status: 'pending'
        });
        await notice.create({
            notice_type: 'system',
            receiver_id: userId,
            content: '【小鸟快修社团】您的角色变更申请已提交，等待审批',
            send_time: new Date()
        });
        
        success(res, '角色变更申请已提交，等待审批');
    } catch (error) {
        fail(res, error);
    }
}

// 用户退出社团，移除所有非普通用户角色（需审批）
const resignClub = async function (req, res) {
    try {
        const { userId } = req.params;
        const { changeType = 'resign_club', content } = req.body;
        if (!userId) {
            throw new BadRequestError('用户ID不能为空');
        }
        
        // 检查用户是否存在
        const existingUser = await user.findByPk(userId);
        if (!existingUser) {
            throw new NotFoundError('用户不存在');
        }
        
        // 设置审批节点为退出社团
        const approvalNode = '退出社团';
        
        // 创建审批记录，content字段存储用户ID和退社原因
        const approvalContent = {
            userId: parseInt(userId),
            reason: content || ''
        };
        
        await approval.create({
            approval_type: 'permission',
            applicant_id: parseInt(userId), // 审批申请人是要退出社团的用户
            content: JSON.stringify(approvalContent), // 存储为JSON，便于后续解析
            approval_node: approvalNode,
            approval_status: 'pending'
        });
        await notice.create({
            notice_type: 'system',
            receiver_id: userId,
            content: '【小鸟快修社团】您的退出社团申请已提交，等待审批',
            send_time: new Date()
        });
        
        success(res, '退出社团申请已提交，等待审批');
    } catch (error) {
        fail(res, error);
    }
}

module.exports = {
    viewRoles,
    createRole,
    editRole,
    deleteRole,
    addUserRole,
    removeUserRole,
    getUserRoles,
    updateUserMainRole,
    resignClub
};