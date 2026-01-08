const express = require('express');
const router = express.Router();
const { viewRoles, createRole, editRole, deleteRole, addUserRole, removeUserRole, getUserRoles, updateUserMainRole, resignClub } = require('../router_handler/role');
const  checkPermission  = require('../utils/checkPermission');
const authMiddleware = require('../utils/authMiddleware');


/* GET roles listing. */
//查询所有角色信息
router.get('/role_views', viewRoles);

//创建新角色
router.post('/role_create', authMiddleware, checkPermission('role:create'), createRole);

//修改角色信息
router.put('/role_edit/:id', authMiddleware, checkPermission('role:edit'), editRole);

//删除角色
router.delete('/role_delete/:id', authMiddleware, checkPermission('role:delete'), deleteRole);

//分配角色给用户
router.post('/role_assign', authMiddleware, checkPermission('role:assign'), addUserRole);

//从用户移除角色
router.delete('/role_remove/:userId/:roleId', authMiddleware, checkPermission('role:remove'), removeUserRole);

//获取用户所有角色
router.get('/role_user/:userId', authMiddleware, checkPermission('user:view:role'), getUserRoles);

//更新用户主角色
router.put('/role_user/:userId/main', authMiddleware, updateUserMainRole);

//用户退出社团
router.post('/role_user/:userId/resign-club', authMiddleware, resignClub);

module.exports = router;