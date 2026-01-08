// middleware/checkPermission.js
const { user, role, permission } = require('../models');

// 传入需要的权限标识（如 'group:create'）
const checkPermission = (requiredPermissionCode) => {
    return async (req, res, next) => {
        try {
            // 1. 从 Token 中获取当前用户 ID（假设登录时已存入 req.user.id）
            const { userId } = req.user;
        //   console.log(req.user,userId);

            // 2. 查询用户关联的角色及权限
            const newuser = await user.findByPk(userId, {
                include: [{
                    model: role,
                    include: [permission] // 嵌套查询权限
                }]
            });

            // 3. 提取用户拥有的所有权限 code
            const userPermissions = [];
            newuser.roles.forEach(role => {
                role.permissions.forEach(perm => {
                    userPermissions.push(perm.action);
                });
            });
            // console.log('用户拥有的权限：', userPermissions);
            // 4. 验证是否拥有所需权限
            if (userPermissions.includes(requiredPermissionCode)) {
                next(); // 有权限，继续执行接口逻辑
            } else {
                res.status(403).json({ message: '没有权限执行此操作' });
            }
        } catch (error) {
            // console.log(error);
            res.status(500).json({ message: '权限验证失败' });
        }
    };
};

module.exports = checkPermission;