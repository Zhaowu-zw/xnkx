const express = require('express');
const router = express.Router();
const { viewUserInfo, editUserInfo,viewUsers, deleteUser, updatePassword, uploadAvatar } = require('../router_handler/userinfo');
const  checkPermission  = require('../utils/checkPermission');



/* GET users listing. */
//查询所有用户信息
router.get('/user_views', checkPermission('user:view'), viewUsers)
//查询某个用户详情
router.get('/userinfo_view', checkPermission('user:view:detail'),  viewUserInfo);
//查看本人的用户详情
router.get('/userinfo_self_view', viewUserInfo);
//修改个人信息
router.put('/userinfo_edit', editUserInfo);
//上传用户头像
router.post('/upload-avatar', uploadAvatar)
//删除用户
router.delete('/user_delete/:id', checkPermission('user:delete'), deleteUser);

//修改用户密码
router.put('/update_password',updatePassword)

module.exports = router;