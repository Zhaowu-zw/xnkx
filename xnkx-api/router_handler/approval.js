const { user_role, user, userinfo, approval, recruitment, notice ,group_info, role,member_show} = require('../models');
const { Op } = require('sequelize');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { success, fail } = require('../utils/responses');
const redisClient = require('../utils/redis'); // 导入Redis客户端

// 更新审批状态
const updateApprovalStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['approved', 'rejected'];
    if (!status) {
        throw new BadRequestError('审批状态不能为空');
    }
    if (!validStatuses.includes(status)) {
        throw new BadRequestError('审批状态无效');
    }
    
    const approvalRecord = await approval.findByPk(id);
    if (!approvalRecord) {
        throw new NotFoundError('审批记录不存在');
    }
    
    if (approvalRecord.approval_status !== 'pending') {
        throw new BadRequestError('只能更新待处理审批状态');
    }
    
    // 更新当前审批记录状态
    await approval.update({
        approval_status: status,
        updateAt: new Date(),
        approver_id: req.user.userId
    }, {
        where: {
            id: approvalRecord.id
        }
    });
    
    // 更新成功后，返回处理后的审批记录
    const updatedRecord = await approval.findByPk(approvalRecord.id, {
        include: [
            { 
                model: user, 
                as: 'applicant', 
                attributes: ['id', 'username'],
                include: [
                    { model: userinfo, as: 'userinfo', attributes: ['nickname'] }
                ]
            },
            { 
                model: user, 
                as: 'approver', 
                attributes: ['id', 'username'],
                include: [
                    { model: userinfo, as: 'userinfo', attributes: ['nickname'] }
                ]
            }
        ]
    });
    
    // content字段保持原样，不做JSON解析
    const processedRecord = updatedRecord.toJSON();
    
    if (approvalRecord.approval_type === 'recruitment') {
        // 处理纳新审批
        if (approvalRecord.approval_node === '初审') {
            // 初审处理
            if (status === 'approved') {
                // 初审通过
                // 更新纳新表初审状态
                await recruitment.update({
                    first_review_status: 'passed',
                    update_time: new Date()
                }, {
                    where: {
                        user_id: approvalRecord.applicant_id
                    }
                });
                
                // 创建终审审批记录
                await approval.create({
                    approval_type: approvalRecord.approval_type,
                    applicant_id: approvalRecord.applicant_id,
                    content: approvalRecord.content,
                    approval_node: '终审',
                    approval_status: 'pending',
                });
                
                // 发送初审通过通知
                await notice.create({
                    notice_type: 'recruit',
                    receiver_id: approvalRecord.applicant_id,
                    content: '【小鸟快修社团】恭喜您初审通过！请耐心等待终审！',
                    send_time: new Date()
                });
            } else {
                // 初审驳回
                // 更新纳新表初审状态
                await recruitment.update({
                    first_review_status: 'rejected',
                    update_time: new Date()
                }, {
                    where: {
                        user_id: approvalRecord.applicant_id
                    }
                });
                
                // 发送初审驳回通知
                await notice.create({
                    notice_type: 'recruit',
                    receiver_id: approvalRecord.applicant_id,
                    content: '【小鸟快修社团】抱歉您的初审没有通过！期待您的再次报名!',
                    send_time: new Date()
                });
            }
        } else if (approvalRecord.approval_node === '终审') {
            // 终审处理
            if (status === 'approved') {
                // 终审通过
                // 更新纳新表终审状态
                await recruitment.update({
                    final_review_status: 'passed',
                    update_time: new Date(),
                }, {
                    where: {
                        user_id: approvalRecord.applicant_id
                    }
                });
                
                // 更新用户角色为组员
                await user_role.create({
                    user_id: approvalRecord.applicant_id,
                    role_id: 5
                });
                
                // 解析content字段获取group_id，同时从recruitment表获取作为备选
                let groupId = null;
                
                // 1. 首先尝试从审批记录的content字段获取group_id
                try {
                    const contentData = typeof processedRecord.content === 'string' 
                        ? JSON.parse(processedRecord.content) 
                        : processedRecord.content;
                    groupId = contentData.group_id;
                    console.log('从content获取的小组ID:', groupId);
                } catch (e) {
                    console.error('解析审批内容失败:', e);
                }
                
                // 2. 如果content字段中没有group_id，从recruitment表获取
                if (!groupId) {
                    try {
                        const recruitmentData = await recruitment.findOne({
                            where: { user_id: approvalRecord.applicant_id },
                            attributes: ['intention_group_id']
                        });
                        if (recruitmentData) {
                            groupId = recruitmentData.intention_group_id;
                            console.log('从recruitment表获取的小组ID:', groupId);
                        }
                    } catch (e) {
                        console.error('从recruitment表获取小组ID失败:', e);
                    }
                }
                
                // 3. 更新user表
                await user.update({
                    role_name: '组员',
                    group_id: groupId
                }, {
                    where: {
                        id: approvalRecord.applicant_id
                    }
                });
                console.log('成功更新用户group_id:', approvalRecord.applicant_id, '->', groupId);

                // 4. 更新member_show表
                const memberShowRecord = await member_show.findOne({
                    where: {
                        user_id: approvalRecord.applicant_id
                    }
                });

                if (memberShowRecord) {
                    await member_show.update({
                        group_id: groupId
                    }, {
                        where: {
                            user_id: approvalRecord.applicant_id
                        }
                    });
                }else{
                    await member_show.create({
                        user_id: approvalRecord.applicant_id,
                        group_id: groupId
                    });
                }

                // 4. 清除相关缓存，确保数据一致性
                try {
                    // 清除用户列表缓存（包含所有分页、关键词和小组筛选的组合）
                    await redisClient.delPattern('user_list:*');
                    console.log('已清除用户列表缓存');
                    
                    // 清除单个用户信息缓存
                    await redisClient.del(`user_info:${approvalRecord.applicant_id}`);
                    console.log(`已清除用户 ${approvalRecord.applicant_id} 的信息缓存`);
                    
                    // 清除成员展示缓存（使用复数形式，与其他文件保持一致）
                    await redisClient.delPattern('member_shows:*');
                    console.log('已清除成员展示缓存');
                } catch (err) {
                    console.error('清除缓存失败:', err);
                }
                
                // 发送终审通过通知
                await notice.create({
                    notice_type: 'recruit',
                    receiver_id: approvalRecord.applicant_id,
                    content: `【小鸟快修社团】恭喜您通过终审！${processedRecord.applicant.userinfo.nickname}，欢迎您的加入，让我们一起共同努力！`,
                    send_time: new Date()
                });
            } else {
                // 终审驳回
                // 更新纳新表终审状态
                await recruitment.update({
                    final_review_status: 'reject',
                    update_time: new Date(),
                    review_result: 'reject'
                }, {
                    where: {
                        user_id: approvalRecord.applicant_id
                    }
                });
                
                // 发送终审驳回通知
                await notice.create({
                    notice_type: 'recruit',
                    receiver_id: approvalRecord.applicant_id,
                    content: '【小鸟快修社团】很抱歉您的终审未通过，感谢您的报名，期待您下次参与！',
                    create_time: new Date()
                });
            }
        }
    } else if (approvalRecord.approval_type === 'permission') {
            // 处理权限类审批
            // 根据approval_node区分不同类型的权限审批
            if (approvalRecord.approval_node === '晋升' || 
                approvalRecord.approval_node === '卸任' || 
                approvalRecord.approval_node === '退出社团' || 
                approvalRecord.approval_node === '角色变更') {
                // 角色变更处理（支持晋升、卸任和退出社团）
                try {
                    // 解析content字段中的JSON数据，获取用户ID和角色名称
                    let contentData = {
                        userId: approvalRecord.applicant_id,
                        role_name: '',
                        reason: ''
                    };
                    
                    try {
                        if (approvalRecord.content) {
                            contentData = JSON.parse(approvalRecord.content);
                        }
                    } catch (e) {
                        // 如果解析失败，使用默认值
                        console.error('解析审批内容失败：', e);
                    }
                    
                    // 审批申请人ID作为操作的用户ID
                    const userId = contentData.userId || approvalRecord.applicant_id;
                    
                    if (status === 'approved') {
                        let notificationContent = '';
                        let roleName = contentData.role_name;
                        let changeType = '';
                        
                        // 根据approval_node确定变更类型
                        if (approvalRecord.approval_node === '晋升') {
                            changeType = 'promote';
                            // 晋升处理：更新用户主角色为新角色
                            if (roleName) {
                                // 1. 检查角色是否存在
                                const targetRole = await role.findOne({
                                    where: { role_name: roleName }
                                });
                                
                                if (targetRole) {
                                    // 2. 更新用户主角色
                                    await user.update({
                                        role_name: roleName
                                    }, {
                                        where: {
                                            id: userId
                                        }
                                    });
                                    
                                    // 3. 检查用户是否已拥有该角色，如果没有则添加
                                    const hasRole = await user_role.findOne({
                                        where: {
                                            user_id: userId,
                                            role_id: targetRole.id
                                        }
                                    });
                                    
                                    if (!hasRole) {
                                        await user_role.create({
                                            user_id: userId,
                                            role_id: targetRole.id
                                        });
                                    }
                                }
                            }
                            notificationContent = `【小鸟快修社团】您的晋升申请已通过！新角色：${roleName}`;
                        } else if (approvalRecord.approval_node === '卸任') {
                            changeType = 'resign';
                            // 卸任处理：将用户主角色降级
                            
                            // 强制打印卸任日志，不受条件判断影响
                            console.log('\n===============================================');
                            console.log('============= 开始处理卸任逻辑 =============');
                            console.log('===============================================');
                            console.log('【1/10】处理卸任请求');
                            console.log('用户ID:', userId);
                            console.log('传入的角色名称:', roleName);
                            console.log('审批节点:', approvalRecord.approval_node);
                            console.log('审批状态:', status);
                            
                            // 1. 获取用户信息，包括当前主角色
                            console.log('【2/10】获取用户信息');
                            const userInfo = await user.findByPk(userId);
                            console.log('当前用户信息:', {
                                userId: userInfo.id,
                                username: userInfo.username,
                                currentRole: userInfo.role_name
                            });
                            
                            // 2. 确保普通用户角色存在
                            console.log('【3/10】获取普通用户角色');
                            let normalUserRole = await role.findOne({
                                where: { role_name: '普通用户' }
                            });
                            
                            console.log('普通用户角色存在状态:', !!normalUserRole);
                            if (!normalUserRole) {
                                console.log('【创建普通用户角色】普通用户角色不存在，创建一个');
                                normalUserRole = await role.create({
                                    role_name: '普通用户',
                                    permission_desc: '普通用户权限'
                                });
                                console.log('【创建普通用户角色】创建成功，角色ID:', normalUserRole.id);
                            }
                            
                            // 3. 角色层级定义
                            console.log('【4/10】角色层级定义');
                            const roleHierarchy = {
                                '指导老师': 4,
                                '社长': 3,
                                '组长': 2,
                                '组员': 1,
                                '普通用户': 0
                            };
                            console.log('角色层级:', roleHierarchy);
                            
                            // 4. 获取用户所有角色
                            console.log('【5/10】获取用户所有角色');
                            // 先查询user_role关联记录
                            const userRoleAssociations = await user_role.findAll({
                                where: { user_id: userId }
                            });
                            
                            console.log('用户角色关联记录:', userRoleAssociations);
                            
                            // 然后查询每个角色的详细信息
                            const userRoles = [];
                            for (const association of userRoleAssociations) {
                                const roleInfo = await role.findByPk(association.role_id, {
                                    attributes: ['id', 'role_name']
                                });
                                userRoles.push({
                                    role: {
                                        id: roleInfo.id,
                                        role_name: roleInfo.role_name
                                    }
                                });
                            }
                            
                            console.log('用户当前角色列表:');
                            userRoles.forEach((userRole, index) => {
                                console.log(`  ${index + 1}. 角色ID: ${userRole.role.id}, 角色名称: ${userRole.role.role_name}`);
                            });
                            
                            // 5. 确定要卸任的角色名称
                            // 直接使用当前主角色，忽略传入的角色名称
                            console.log('【6/10】确定要卸任的角色');
                            const resignRoleName = userInfo.role_name; // 直接使用当前主角色，不要使用传进来的角色
                            console.log('要卸任的角色名称:', resignRoleName, '(直接使用当前主角色，忽略传入的角色:', roleName, ')');
                            
                            // 6. 计算要保留的角色和要卸任的角色
                            console.log('【7/10】计算要保留和要卸任的角色');
                            let rolesToKeep = [];
                            let rolesToResign = [];
                            
                            for (const userRole of userRoles) {
                                const currentRoleName = userRole.role.role_name;
                                const currentRoleId = userRole.role.id;
                                
                                if (currentRoleName === resignRoleName) {
                                    // 要卸任的角色（当前主角色或指定角色）
                                    rolesToResign.push(currentRoleId);
                                } else {
                                    // 要保留的角色
                                    rolesToKeep.push({
                                        id: currentRoleId,
                                        name: currentRoleName,
                                        level: roleHierarchy[currentRoleName] || 0
                                    });
                                }
                            }
                            
                            console.log('要保留的角色:', rolesToKeep);
                            console.log('要卸任的角色ID列表:', rolesToResign);
                            
                            // 7. 找出要保留的角色中的最高层级角色
                            console.log('【8/10】确定新主角色');
                            let newMainRole = '普通用户';
                            let maxLevel = 0;
                            
                            if (rolesToKeep.length > 0) {
                                // 有要保留的角色，找出最高层级的
                                console.log('从保留角色中寻找最高层级角色');
                                for (const roleItem of rolesToKeep) {
                                    console.log(`  角色: ${roleItem.name}, 层级: ${roleItem.level}`);
                                    if (roleItem.level > maxLevel) {
                                        maxLevel = roleItem.level;
                                        newMainRole = roleItem.name;
                                    }
                                }
                            } else {
                                // 没有要保留的角色，使用普通用户
                                console.log('没有要保留的角色，默认使用普通用户');
                                newMainRole = '普通用户';
                            }
                            
                            console.log('确定的新主角色:', newMainRole, '(层级:', roleHierarchy[newMainRole] || 0, ')');
                            
                            // 8. 执行角色变更操作
                            console.log('【9/10】执行角色变更操作');
                            console.log('更新用户主角色:', {
                                from: userInfo.role_name,
                                to: newMainRole
                            });
                            
                            // 更新用户主角色
                            await user.update({
                                role_name: newMainRole
                            }, {
                                where: {
                                    id: userId
                                }
                            });
                            console.log('✅ 用户主角色更新成功');
                            
                            // 9. 移除要卸任的角色
                            console.log('移除要卸任的角色关联');
                            if (rolesToResign.length > 0) {
                                console.log('执行角色移除:', {
                                    userId: userId,
                                    roleIds: rolesToResign
                                });
                                await user_role.destroy({
                                    where: {
                                        user_id: userId,
                                        role_id: rolesToResign
                                    }
                                });
                                console.log('✅ 角色关联移除成功');
                            } else {
                                console.log('⚠️  没有要移除的角色关联');
                            }
                            
                            // 10. 确保用户始终有至少一个角色（普通用户角色）
                            console.log('【10/10】确保用户有至少一个角色');
                            const remainingRolesCount = await user_role.count({
                                where: { user_id: userId }
                            });
                            
                            console.log('当前用户角色数量:', remainingRolesCount);
                            if (remainingRolesCount === 0) {
                                console.log('📌 用户没有角色了，添加普通用户角色');
                                await user_role.create({
                                    user_id: userId,
                                    role_id: normalUserRole.id
                                });
                                console.log('✅ 普通用户角色添加成功');
                            } else {
                                console.log('✅ 用户已有角色，无需添加');
                            }
                            
                            // 获取最终的用户信息
                            const finalUserInfo = await user.findByPk(userId);
                            
                            // 获取最终的角色关联（使用分步查询，避免关联错误）
                            console.log('【获取最终角色关联】开始获取最终角色关联');
                            const finalUserRoleAssociations = await user_role.findAll({
                                where: { user_id: userId }
                            });
                            
                            const finalRoles = [];
                            for (const association of finalUserRoleAssociations) {
                                const roleInfo = await role.findByPk(association.role_id, {
                                    attributes: ['id', 'role_name']
                                });
                                finalRoles.push({
                                    role: {
                                        id: roleInfo.id,
                                        role_name: roleInfo.role_name
                                    }
                                });
                            }
                            
                            console.log('\n===============================================');
                            console.log('============= 卸任处理结果 =============');
                            console.log('===============================================');
                            console.log('最终用户信息:', {
                                userId: finalUserInfo.id,
                                username: finalUserInfo.username,
                                finalRole: finalUserInfo.role_name
                            });
                            console.log('最终角色关联:');
                            finalRoles.forEach((userRole, index) => {
                                console.log(`  ${index + 1}. 角色ID: ${userRole.role.id}, 角色名称: ${userRole.role.role_name}`);
                            });
                            console.log('===============================================');
                            console.log('============= 卸任逻辑处理完成 =============');
                            console.log('===============================================');
                            
                            notificationContent = `【小鸟快修社团】您的卸任申请已通过！新角色：${newMainRole}`;
                        } else if (approvalRecord.approval_node === '退出社团') {
                            changeType = 'resign_club';
                            // 退出社团处理：移除所有社团相关角色，只保留普通用户
                            try {
                                // 1. 获取普通用户角色ID
                                const normalUserRole = await role.findOne({
                                    where: { role_name: '普通用户' }
                                });
                                
                                if (normalUserRole) {
                                    // 2. 删除用户所有非普通用户角色关联
                                    await user_role.destroy({
                                        where: {
                                            user_id: userId,
                                            role_id: { [Op.ne]: normalUserRole.id }
                                        }
                                    });
                                    
                                    // 3. 确保用户有普通用户角色
                                    const hasNormalRole = await user_role.findOne({
                                        where: {
                                            user_id: userId,
                                            role_id: normalUserRole.id
                                        }
                                    });
                                    
                                    if (!hasNormalRole) {
                                        await user_role.create({
                                            user_id: userId,
                                            role_id: normalUserRole.id
                                        });
                                    }
                                    
                                    // 4. 更新用户信息
                                    await user.update({
                                        role_name: '普通用户', // 设置为普通用户角色名称
                                        group_id: null, // 清除小组关联
                                    }, {
                                        where: {
                                            id: userId
                                        }
                                    });
                                } else {
                                    // 如果没有普通用户角色，创建一个
                                    const newNormalRole = await role.create({
                                        role_name: '普通用户',
                                        permission_desc: '普通用户权限'
                                    });
                                    
                                    // 删除所有现有角色
                                    await user_role.destroy({
                                        where: {
                                            user_id: userId
                                        }
                                    });
                                    
                                    // 添加普通用户角色
                                    await user_role.create({
                                        user_id: userId,
                                        role_id: newNormalRole.id
                                    });
                                    
                                    // 更新用户信息
                                    await user.update({
                                        role_name: '普通用户',
                                        group_id: null,
                                    }, {
                                        where: {
                                            id: userId
                                        }
                                    });
                                }
                                
                                notificationContent = `【小鸟快修社团】您已成功退出社团，当前角色为普通用户！`;
                            } catch (error) {
                                console.error('退出社团角色处理失败：', error);
                                notificationContent = `【小鸟快修社团】退出社团成功，但角色更新失败，请联系管理员！`;
                            }
                        } else {
                            changeType = 'update_main_role';
                            // 其他角色变更处理
                            if (roleName) {
                                // 更新用户主角色
                                await user.update({
                                    role_name: roleName
                                }, {
                                    where: {
                                        id: userId
                                    }
                                });
                            }
                            notificationContent = `【小鸟快修社团】您的角色变更申请已通过！新角色：${roleName}`;
                        }
                        
                        // 发送角色变更成功通知
                        await notice.create({
                            notice_type: 'approval',
                            receiver_id: userId,
                            content: notificationContent,
                            send_time: new Date()
                        });
                        
                    } else {
                        // 审批驳回，发送驳回通知
                        await notice.create({
                            notice_type: 'approval',
                            receiver_id: approvalRecord.applicant_id,
                            content: `【小鸟快修社团】您申请的${approvalRecord.approval_node}已被驳回！`,
                            send_time: new Date()
                        });
                    }
                } catch (error) {
                    console.error('处理角色变更审批失败：', error);
                    // 发送错误通知
                    await notice.create({
                        notice_type: 'approval',
                        receiver_id: approvalRecord.applicant_id,
                        content: '【小鸟快修社团】处理角色变更审批时发生错误，请联系管理员！',
                        send_time: new Date()
                    });
                }
            }
    }
    
    success(res, '审批状态更新成功', processedRecord);
}

//查看审批记录列表
const viewApprovals = async (req, res) => {
    const { approval_type, approval_status='pending' } = req.query;
    const query = {};
    if (approval_type) {
        query.approval_type = approval_type;
    }
    if (approval_status) {
        query.approval_status = approval_status;
    }
    
    // 第一步：查询所有符合条件的审批记录
    const approvalRecords = await approval.findAll({
        where: query,
        include: [
            { 
                model: user, 
                as: 'applicant', 
                attributes: ['id', 'username'],
                include: [
                    { model: userinfo, as: 'userinfo', attributes: ['nickname'] }
                ]
            },
            { 
                model: user, 
                as: 'approver', 
                attributes: ['id', 'username'],
                include: [
                    { model: userinfo, as: 'userinfo', attributes: ['nickname'] }
                ]
            }
        ]
    });
    
    // 处理返回结果，为纳新审批添加申请的组名信息
    const processedRecords = await Promise.all(approvalRecords.map(async record => {
        const recordData = record.toJSON();
        
        // 如果是纳新审批，添加申请的组名
        if (recordData.approval_type === 'recruitment') {
            try {
                // 第二步：根据applicant_id查询对应的recruitment记录
                const recruitmentRecord = await recruitment.findOne({
                    where: { user_id: recordData.applicant_id },
                    include: [
                        { 
                            model: group_info, 
                            as: 'intentionGroup', 
                            attributes: ['group_name']
                        }
                    ]
                });
                
                if (recruitmentRecord && recruitmentRecord.intentionGroup) {
                    recordData.applied_group_name = recruitmentRecord.intentionGroup.group_name;
                } else {
                    // 尝试从content字段解析获取group_id
                    const contentData = typeof recordData.content === 'string' 
                        ? JSON.parse(recordData.content) 
                        : recordData.content;
                    
                    if (contentData.group_id) {
                        // 根据group_id查询组名
                        const groupInfo = await group_info.findByPk(contentData.group_id);
                        recordData.applied_group_name = groupInfo ? groupInfo.group_name : '未知组名';
                    } else {
                        recordData.applied_group_name = '未知组名';
                    }
                }
            } catch (e) {
                console.error('获取申请组名失败:', e);
                recordData.applied_group_name = '未知组名';
            }
        }
        
        return recordData;
    }));
    
    success(res, '审批记录列表查询成功', processedRecords);
};


//删除审批记录
const deleteApprovals = async (req, res) => {
    const { id } = req.params;
    const approvalRecord = await approval.findByPk(id);
    if (!approvalRecord) {
        throw new NotFoundError('审批记录不存在');
    }
    await approvalRecord.destroy();
    success(res, '审批记录删除成功');
}




module.exports = {
    updateApprovalStatus,
    viewApprovals,
    deleteApprovals,
}