const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const { task, user, task_user, user_role, notice, sequelize } = require('../models');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../utils/errors');
const { success, fail } = require('../utils/responses');
const { taskFilesUpload, taskImagesUpload, submitFilesUpload, submitImagesUpload } = require('../utils/uploadMiddleware');


//查看任务列表(所有、分组)
const viewTasks = async function (req, res) {
    try {
        const { userId } = req.user;
        const { group_id, status, keyword, page=1, pageSize=10 } = req.query;
        // Convert pagination parameters to numbers
        const pageNum = parseInt(page, 10) || 1;
        const size = parseInt(pageSize, 10) || 10;
        // 根据权限类型构建查询条件
        let whereCondition = {};    
        
        // 分组查询
        if (group_id) {
            whereCondition.group_id = group_id;
        }
        
        // 状态查询
        if (status) {
            whereCondition.status = status;
        }
        
        // 模糊字符串匹配查询
        if (keyword) {
            whereCondition.title = {
                [Op.like]: `%${keyword}%`
            };
        }
        
        // 查询任务总数
        const total = await task.count({
            where: whereCondition
        });
        
        // 查询任务
        const tasks = await task.findAll({
            where: whereCondition,
            attributes: ['id', 'title', 'task_type', 'description', 'deadline', 'publisher_id','status', 'group_id', 'assessment_criteria', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: user, // 关联发布者用户表
                    as: 'publisher', // 别名
                    attributes: ['id', 'username'], // 用户表字段
                    include: [
                        {
                            model: require('../models').userinfo, // 关联用户信息表
                            as: 'userinfo', // 别名
                            attributes: ['nickname'] // 用户信息表字段
                        }
                    ]
                }
            ],
            order: [
                ['status', 'DESC'], // 先按状态排序
                ['deadline', 'ASC'] // 再按截止日期排序
            ],
            offset: (pageNum - 1) * size,
            limit: size
        });
        
        // 处理发布者信息
        const formattedTasks = tasks.map(taskItem => {
            const taskJson = taskItem.toJSON();
            return {
                ...taskJson,
                publisher_info: {
                    username: taskJson.publisher?.username,
                    nickname: taskJson.publisher?.userinfo?.nickname
                }
            };
        });
        
        success(res, '获取任务列表成功', { data: formattedTasks, total });
    } catch (error) {
        console.log('获取任务列表失败：', error);
        fail(res, error);
    }
}
//查看自己的所有任务
const viewTasksOwn = async (req, res, next) => {
    try {
        const { userId } = req.user;

        const statusOrderCase = `
            CASE 
                WHEN task_user.status = 'ongoing' THEN 1  
                WHEN task_user.status = 'completed' THEN 2 
                WHEN task_user.status = 'pending' THEN 3        
                ELSE 4 
            END
        `;
        // 1. 查询用户-任务关联表，关联任务表，获取完整信息
        const userTaskRelations = await task_user.findAll({
            where: { user_id: userId },
            attributes: ['status'], // 只保留关联表的 status 字段
            include: [
                {
                    model: task, // 关联任务表
                    as: 'task', // 对应模型中定义的别名
                    attributes: ['id', 'title', 'description', 'task_type', 'deadline', 'publisher_id', 'group_id', 'assessment_criteria'], // 任务表字段
                    include: [
                        {
                            model: user, // 关联发布者用户表
                            as: 'publisher', // 别名
                            attributes: ['id', 'username'], // 用户表字段
                            include: [
                                {
                                    model: require('../models').userinfo, // 关联用户信息表
                                    as: 'userinfo', // 别名
                                    attributes: ['nickname'] // 用户信息表字段
                                }
                            ]
                        }
                    ]
                }
            ],
            raw: true,
            nest: true, // 嵌套结果
            order: [
                [Sequelize.literal(statusOrderCase), 'ASC'], // 状态优先级排序
                [{ model: task, as: 'task' }, 'deadline', 'DESC']// 按任务截止时间排序
            ], 
        });

        if (userTaskRelations.length === 0) {
            return success(res, '没有任务');
        }

        // 2. 格式化数据：将 task 和 status 平级返回（更友好），并处理发布者信息
        const ownTasks = userTaskRelations.map(item => ({
            ...item.task, // 任务表所有字段
            user_task_status: item.status, // 关联表的 status 字段（命名区分，避免冲突）
            publisher_info: {
                username: item.task.publisher?.username,
                nickname: item.task.publisher?.userinfo?.nickname
            }
        }));

        // 3. 返回结果（包含 status 字段和发布者信息）
        return success(res, '获取任务成功', { data: ownTasks });

    } catch (error) {
        console.error('查询个人任务失败：', error);
        fail(res, error);
    }
};
// 创建任务 
 const createTask = async function (req, res) { 
     try { 
         const { userId } = req.user; 
         // 1. 解构参数（修复漏传deadline问题） 
         const { title, description, task_type, deadline, group_id, assessment_criteria, task_files, task_images } = req.body; 

         // 2. 获取当前用户的角色信息，判断是否允许发布club类型任务
         const currentUser = await user.findOne({
             where: { id: userId },
             attributes: ['role_name']
         });
         
         // 不允许组长角色发布club类型的任务
         if (task_type === 'club' && currentUser?.role_name === '组长') {
             throw new BadRequestError('组长角色不允许发布社团类型任务');
         }

         // 3. 优化校验：增加trim()避免空格有效值 
         const trimmedTitle = title?.trim() || ""; 
         const trimmedDesc = description?.trim() || ""; 
         if (!trimmedTitle) { 
             throw new BadRequestError('任务标题不能为空'); 
         } 
         if (!trimmedDesc) { 
             throw new BadRequestError('任务描述不能为空'); 
         } 
         if (!deadline) { 
             throw new BadRequestError('截止时间不能为空'); 
         } 
         // 补充校验：group任务必须传group_id 
         if (task_type === 'group' && !group_id) { 
             throw new BadRequestError('小组任务必须填写小组ID'); 
         }

        // 3. 创建任务记录
        const newTask = await task.create({
            title: trimmedTitle,
            description: trimmedDesc,
            task_type,
            deadline, // 模型set方法自动转Date
            group_id: task_type === 'club' ? null : group_id,
            publisher_id: userId,
            assessment_criteria,
            task_files: task_files ? JSON.parse(task_files) : null,
            task_images: task_images ? JSON.parse(task_images) : null
        });

        // 4. 获取任务通知的接收人ID列表
        let userIds = [];
        if (task_type === 'club') {
            // 社团任务：查询所有社团组员（role_id=5）的user_id
            const clubUsers = await user_role.findAll({
                where: { role_id: 5 },
                attributes: ['user_id']
            });
            userIds = clubUsers.map(item => item.user_id);
        } else if (task_type === 'group') {
            // 小组任务：查询当前小组下的所有用户ID
            const groupUsers = await user.findAll({
                where: { group_id },
                attributes: ['id']
            });
            userIds = groupUsers.map(item => item.id);
        }
        
        // 确保发布者也被包含在任务分配列表中
        if (!userIds.includes(userId)) {
            userIds.push(userId);
        }

        // 5. 批量插入任务-用户关联记录（task_user表）
        if (userIds.length > 0) {
            const taskUserRecords = userIds.map(userId => ({
                task_id: newTask.id,
                user_id: userId,
                status: 'ongoing' // 默认状态
            }));
            await task_user.bulkCreate(taskUserRecords);

            // ========== 核心新增：批量发送任务通知 ==========
            // 组装通知内容
            const noticeContent = `【小鸟快修社团】新任务发布啦！任务标题：${trimmedTitle},请及时查看并完成哦～`;

            // 批量创建通知记录（效率更高，避免循环调用create）
            const noticeRecords = userIds.map(userId => ({
                notice_type: 'task', // 通知类型标记为任务
                receiver_id: userId, // 每个接收人的ID
                content: noticeContent, // 统一的任务通知内容
                send_time: new Date() // 发送时间
            }));
            // 批量插入通知（比循环create性能好）
            await notice.bulkCreate(noticeRecords);
        }

        success(res, '创建任务成功', { taskId: newTask.id });
    } catch (error) {
        console.log('创建任务失败：', error);
        fail(res, error.message || '创建任务失败');
    }
};


//编辑任务
const editTask = async function (req, res) {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const { title, description, task_type, deadline, group_id, assessment_criteria, status } = req.body;
        
        console.log('编辑任务参数:', { id, userId, title, description, task_type, deadline, group_id, assessment_criteria, status });
        
        // 查询任务，包含发布者信息
        const tasks = await task.findByPk(id, {
            attributes: ['id', 'title', 'description', 'task_type', 'deadline', 'status', 'group_id', 'assessment_criteria', 'publisher_id'] // 明确字段，包含status
         });
        
        if (!tasks) {
            throw new NotFoundError('任务不存在');
        }
        
        // 验证当前用户是否是任务发布者
        if (tasks.publisher_id !== userId) {
            throw new UnauthorizedError('只有任务发布者才能编辑任务');
        }
        
        // 优化校验：增加trim()避免空格有效值
        const trimmedTitle = title?.trim() || tasks.title;
        const trimmedDesc = description?.trim() || tasks.description;
        
        if (!trimmedTitle) {
            throw new BadRequestError('任务标题不能为空');
        }
        if (!trimmedDesc) {
            throw new BadRequestError('任务描述不能为空');
        }
        if (!deadline) {
            throw new BadRequestError('截止时间不能为空');
        }
        // 补充校验：group任务必须传group_id
        if (task_type === 'group' && !group_id) {
            throw new BadRequestError('小组任务必须填写小组ID');
        }
        
        // 验证状态值是否合法
        if (status) {
            const validStatuses = ['ongoing', 'completed', 'pending'];
            if (!validStatuses.includes(status)) {
                return fail(res, `无效的状态值，允许的值为：${validStatuses.join(', ')}`);
            }
        }
        console.log('更新状态:', status);
        
        // 开始事务
        await sequelize.transaction(async (t) => {
            // 计算更新后的状态
            const updatedStatus = status || tasks.status;
            console.log('更新后的状态:', updatedStatus);
            console.log('当前状态:', tasks.status);
            // 更新任务表
            await tasks.update({
                title: trimmedTitle,
                description: trimmedDesc,
                task_type: task_type || tasks.task_type,
                deadline: deadline || tasks.deadline,
                status: updatedStatus,
                group_id: task_type === 'club' ? null : (group_id || tasks.group_id),
                assessment_criteria: assessment_criteria || tasks.assessment_criteria
            }, { transaction: t });
            console.log('当前状态2:', tasks.status);
            console.log('状态是否改变:', updatedStatus !== tasks.status);
            
            // 如果状态改变，更新所有相关用户的任务状态
            if (updatedStatus == tasks.status) {
                await task_user.update(
                    { status: updatedStatus },
                    { 
                        where: { task_id: id },
                        transaction: t 
                    }
                );
            }
        });
        
        success(res, '编辑任务成功');
    } catch (error) {
        console.log('编辑任务失败：', error);
        fail(res, error);
    }
}
//删除任务
const deleteTask = async function (req, res) {
    try {
        const { id } = req.params;
        const tasks = await task.findByPk(id, {
            include: [],
            attributes: ['id', 'title', 'description', 'task_type', 'deadline', 'group_id', 'assessment_criteria'] // 明确字段
        });
        if (!tasks) {
            throw new NotFoundError('任务不存在');
        }
        
        // 开始事务，确保所有记录都被删除
        await sequelize.transaction(async (t) => {
        
            
            // 删除任务-用户关联记录
            await task_user.destroy({
                where: { task_id: id },
                transaction: t
            });
            
            // 删除任务记录
            await tasks.destroy({ transaction: t });
        });
        
        success(res, '删除任务成功');
    } catch (error) {
        console.log('删除任务失败：', error);
        fail(res, error);
    }
}
// 修改updateTaskStatus函数
const updateTaskStatus = async function (req, res) {
    try {
        const { userId } = req.user;
        const { status, end_all } = req.body;
        const task_id = Number(req.params.task_id);

        console.log('后端接收的路径参数：', req.params); // 打印所有路径参数
        console.log('后端接收的 task_id：', req.params.task_id);
        if (isNaN(task_id)) {
            return fail(res, '任务ID必须是数字');
        }

        // 验证状态值是否合法
        const validStatuses = ['ongoing', 'completed', 'pending'];
        if (!validStatuses.includes(status)) {
            return fail(res, `无效的状态值，允许的值为：${validStatuses.join(', ')}`);
        }

        // 构建查询条件和更新条件
        const findCondition = {
            task_id: task_id
        };

        // 构建更新条件
        const updateCondition = {
            task_id: task_id
        };

        // 检查当前用户是否为任务发布者 - 使用原始SQL查询避免Sequelize自动关联问题
        const [taskInfo] = await sequelize.query(
            'SELECT id, publisher_id FROM tasks WHERE id = ?',
            { replacements: [task_id], type: sequelize.QueryTypes.SELECT }
        );
        if (!taskInfo) {
            throw new NotFoundError('任务不存在');
        }

        // 如果end_all为true，只有发布者才能操作
        if (end_all) {
            if (taskInfo.publisher_id !== userId) {
                throw new UnauthorizedError('只有任务发布者才能结束任务');
            }
            // 不添加user_id条件，更新所有参与该任务的用户
            console.log(`结束所有用户的任务，task_id: ${task_id}, status: ${status}`);
        } else {
            // 添加user_id条件，只更新当前用户的任务状态
            findCondition.user_id = userId;
            updateCondition.user_id = userId;
        }
        // 检查任务是否存在
        const tasks = await task_user.findAll({
            where: findCondition
        });
        if (!tasks || tasks.length === 0) {
            throw new NotFoundError('任务用户关联记录不存在');
        }

        // 更新任务状态
        await task_user.update({ status }, {
            where: updateCondition
        });

        // 如果是结束所有用户的任务状态，同时更新task表中的状态
        if (end_all) {
            await task.update({ status }, {
                where: { id: task_id }
            });
        }

        success(res, '更改任务状态成功');
    } catch (error) {
        console.log('更改任务状态失败：', error);
        fail(res, error);
    }
}
//提交任务成果
const submitTaskResult = async function (req, res) {
    try {
        const { userId } = req.user;
        const { submit_files, submit_images, submit_content } = req.body;
        const { task_id } = req.params
        
        // 查询任务用户关联记录
        const taskUser = await task_user.findOne({
            where: {
                user_id: userId,
                task_id: task_id
            }
        });
        
        if (!taskUser) {
            throw new NotFoundError('任务用户关联记录不存在');
        }
        
        // 验证是否至少提交了一个字段
        const hasSubmittedContent = submit_files && submit_files.length > 0 || 
                                   submit_images && submit_images.length > 0 || 
                                   (submit_content && submit_content.trim() !== '');
        
        if (!hasSubmittedContent) {
            throw new BadRequestError('请至少提交一个字段的内容');
        }
        
        // 构建更新数据
        const updateData = {};
        
        // 处理提交的文件
        if (submit_files) {
            updateData.submit_files = typeof submit_files === 'string' ? JSON.parse(submit_files) : submit_files;
        }
        
        // 处理提交的图片
        if (submit_images) {
            updateData.submit_images = typeof submit_images === 'string' ? JSON.parse(submit_images) : submit_images;
        }
        
        // 处理提交的文字内容
        if (submit_content) {
            updateData.submit_content = submit_content.trim();
        }
        
        // 提交后自动将状态更新为已完成
        updateData.status = 'completed';
        
        // 更新任务成果
        await task_user.update(updateData, {
            where: {
                user_id: userId,
                task_id: task_id
            }
        });
        
        success(res, '提交任务成果成功');
    } catch (error) {
        console.log('提交任务成果失败：', error);
        fail(res, error);
    }
}
//评分任务成果
const scoreTaskResult = async function (req, res) {
    try {
        const { score, user_id } = req.body;
        const { task_id } = req.params;
        
        // 检查任务是否存在
        const taskExists = await task.findByPk(task_id, {
          include: [],
          attributes: ['id', 'title', 'description', 'task_type', 'deadline', 'status', 'publisher_id', 'group_id', 'assessment_criteria', 'task_files', 'task_images', 'createdAt', 'updatedAt'] // 明确字段，避免自动添加不存在的task_id字段
        });
        if (!taskExists) {
            throw new NotFoundError('任务不存在');
        }
        
        // 构建更新条件
        const updateCondition = {
            task_id: task_id
        };
        
        // 如果提供了user_id，则更新指定用户的评分
        // 否则，更新当前登录用户的评分
        if (user_id) {
            updateCondition.user_id = user_id;
        } 
        // 检查任务用户关联记录是否存在
        const taskUser = await task_user.findOne({
            where: updateCondition
        });
        
        if (!taskUser) {
            throw new NotFoundError('任务用户关联记录不存在');
        }
        
        // 更新评分
        await task_user.update(
            { score: score },
            { where: updateCondition }
        );
        
        success(res, '评分任务成果成功');
    } catch (error) {
        console.log('评分任务成果失败：', error);
        fail(res, error);
    }
}

//查看任务详情
const viewTaskDetail = async function (req, res) {
    try {
        const { task_id } = req.params;
        const taskInfo = await task.findByPk(task_id, {
            attributes: ['id', 'title', 'description', 'task_type', 'deadline', 'status', 'publisher_id', 'group_id', 'assessment_criteria', 'task_files', 'task_images'],
            include: [
                {
                    model: user, // 关联发布者用户表
                    as: 'publisher', // 别名
                    attributes: ['id', 'username'], // 用户表字段
                    include: [
                        {
                            model: require('../models').userinfo, // 关联用户信息表
                            as: 'userinfo', // 别名
                            attributes: ['nickname'] // 用户信息表字段
                        }
                    ]
                }
            ]
        });

        
        if (!taskInfo) {
            throw new NotFoundError('任务不存在');
        }
        
        // 查询该任务的所有提交记录
        const submissions = await task_user.findAll({
            where: {
                task_id: task_id
            },
            include: [
                {
                    model: user,
                    as: 'user',
                    attributes: ['id', 'username'],
                    include: [
                        {
                            model: require('../models').userinfo,
                            as: 'userinfo',
                            attributes: ['nickname']
                        }
                    ]
                }
            ],
            attributes: ['id', 'user_id', 'status', 'submit_files', 'submit_images', 'submit_content', 'score']
        });
        
        // 处理发布者信息
        const formattedTaskInfo = {
            ...taskInfo.toJSON(),
            publisher_info: {
                username: taskInfo.publisher?.username,
                nickname: taskInfo.publisher?.userinfo?.nickname
            }
        };
        
        success(res, '获取任务详情成功', {
            taskInfo: formattedTaskInfo,
            submissions
        });
    } catch (error) {
        console.log('获取任务详情失败：', error);
        fail(res, error);
    }
}


// 上传任务文件
const uploadTaskFiles = async function (req, res) {
    try {
        console.log('[上传任务文件] 开始处理上传请求');
        taskFilesUpload(req, res, async (err) => {
            if (err) {
                console.error('[上传任务文件] 中间件处理失败:', err);
                // 详细的错误信息，便于前端调试
                let errorMessage = '任务文件上传失败';
                if (err.code === 'LIMIT_FILE_SIZE') {
                    errorMessage = '文件大小超出限制，最大支持10MB';
                } else if (err.code === 'LIMIT_FILE_TYPE') {
                    errorMessage = '文件类型不支持';
                } else if (err.message) {
                    errorMessage = err.message;
                }
                throw new BadRequestError(errorMessage);
            }

            if (!req.files || req.files.length === 0) {
                console.warn('[上传任务文件] 未选择要上传的文件');
                throw new BadRequestError('请选择要上传的任务文件');
            }

            console.log(`[上传任务文件] 成功上传 ${req.files.length} 个文件`);
            // 构建可访问的文件URL数组
            const fileUrls = req.files.map(file => {
                console.log(`[上传任务文件] 文件名: ${file.originalname}, 存储路径: ${file.filename}`);
                return `http://localhost:3000/upload/taskFiles/${file.filename}`;
            });

            return success(res, '任务文件上传成功', {
                fileUrls,
                files: req.files
            });
        });
    } catch (error) {
        console.error('[上传任务文件] 处理失败:', error);
        fail(res, error);
    }
};

// 上传任务图片
const uploadTaskImages = async function (req, res) {
    try {
        console.log('[上传任务图片] 开始处理上传请求');
        taskImagesUpload(req, res, async (err) => {
            if (err) {
                console.error('[上传任务图片] 中间件处理失败:', err);
                // 详细的错误信息，便于前端调试
                let errorMessage = '任务图片上传失败';
                if (err.code === 'LIMIT_FILE_SIZE') {
                    errorMessage = '图片大小超出限制，最大支持5MB';
                } else if (err.code === 'LIMIT_FILE_TYPE') {
                    errorMessage = '图片类型不支持';
                } else if (err.message) {
                    errorMessage = err.message;
                }
                throw new BadRequestError(errorMessage);
            }

            if (!req.files || req.files.length === 0) {
                console.warn('[上传任务图片] 未选择要上传的图片');
                throw new BadRequestError('请选择要上传的任务图片');
            }

            console.log(`[上传任务图片] 成功上传 ${req.files.length} 张图片`);
            // 构建可访问的图片URL数组
            const imageUrls = req.files.map(file => {
                console.log(`[上传任务图片] 文件名: ${file.originalname}, 存储路径: ${file.filename}`);
                return `http://localhost:3000/upload/taskImages/${file.filename}`;
            });

            return success(res, '任务图片上传成功', {
                imageUrls,
                files: req.files
            });
        });
    } catch (error) {
        console.error('[上传任务图片] 处理失败:', error);
        fail(res, error);
    }
};

// 上传用户提交的文件
const uploadSubmitFiles = async function (req, res) {
    try {
        const taskId = req.params.task_id;
        console.log(`[上传提交文件] 开始处理任务 ${taskId} 的文件上传请求`);
        submitFilesUpload(req, res, async (err) => {
            if (err) {
                console.error('[上传提交文件] 中间件处理失败:', err);
                // 详细的错误信息，便于前端调试
                let errorMessage = '提交文件上传失败';
                if (err.code === 'LIMIT_FILE_SIZE') {
                    errorMessage = '文件大小超出限制，最大支持50MB';
                } else if (err.code === 'LIMIT_FILE_TYPE') {
                    errorMessage = '文件类型不支持';
                } else if (err.message) {
                    errorMessage = err.message;
                }
                throw new BadRequestError(errorMessage);
            }

            if (!req.files || req.files.length === 0) {
                console.warn('[上传提交文件] 未选择要上传的文件');
                throw new BadRequestError('请选择要上传的提交文件');
            }

            console.log(`[上传提交文件] 成功上传 ${req.files.length} 个文件`);
            // 构建可访问的文件URL数组
            const fileUrls = req.files.map(file => {
                console.log(`[上传提交文件] 文件名: ${file.originalname}, 存储路径: ${file.filename}`);
                return `http://localhost:3000/upload/submitFiles/${file.filename}`;
            });

            return success(res, '提交文件上传成功', {
                fileUrls,
                files: req.files
            });
        });
    } catch (error) {
        console.error('[上传提交文件] 处理失败:', error);
        fail(res, error);
    }
};

// 上传用户提交的图片
const uploadSubmitImages = async function (req, res) {
    try {
        const taskId = req.params.task_id;
        console.log(`[上传提交图片] 开始处理任务 ${taskId} 的图片上传请求`);
        submitImagesUpload(req, res, async (err) => {
            if (err) {
                console.error('[上传提交图片] 中间件处理失败:', err);
                // 详细的错误信息，便于前端调试
                let errorMessage = '提交图片上传失败';
                if (err.code === 'LIMIT_FILE_SIZE') {
                    errorMessage = '图片大小超出限制，最大支持5MB';
                } else if (err.code === 'LIMIT_FILE_TYPE') {
                    errorMessage = '图片类型不支持';
                } else if (err.message) {
                    errorMessage = err.message;
                }
                throw new BadRequestError(errorMessage);
            }

            if (!req.files || req.files.length === 0) {
                console.warn('[上传提交图片] 未选择要上传的图片');
                throw new BadRequestError('请选择要上传的提交图片');
            }

            console.log(`[上传提交图片] 成功上传 ${req.files.length} 张图片`);
            // 构建可访问的图片URL数组
            const imageUrls = req.files.map(file => {
                console.log(`[上传提交图片] 文件名: ${file.originalname}, 存储路径: ${file.filename}`);
                return `http://localhost:3000/upload/submitImages/${file.filename}`;
            });

            return success(res, '提交图片上传成功', {
                imageUrls,
                files: req.files
            });
        });
    } catch (error) {
        console.error('[上传提交图片] 处理失败:', error);
        fail(res, error);
    }
};

module.exports = {
    viewTasks,
    createTask,
    editTask,
    deleteTask,
    viewTasksOwn,
    updateTaskStatus,
    submitTaskResult,
    scoreTaskResult,
    viewTaskDetail,
    uploadTaskFiles,
    uploadTaskImages,
    uploadSubmitFiles,
    uploadSubmitImages
};