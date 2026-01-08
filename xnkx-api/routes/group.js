const express = require('express');
const router = express.Router();
const { viewgroups, creategroup, editgroup, deletegroup, membershows } = require('../router_handler/group');
const checkPermission = require('../utils/checkPermission');
const authMiddleware = require('../utils/authMiddleware');



/* GET groups listing. */
//查询所有小组信息
router.get('/group_views', viewgroups)
//创建新小组
router.post('/group_create',authMiddleware, checkPermission('group:create'), creategroup);
//修改小组信息
router.put('/group_edit/:id', authMiddleware,checkPermission('group:edit'), editgroup);
//删除小组
router.delete('/group_delete/:id', authMiddleware, checkPermission('group:delete'),deletegroup);
//查看人员展示信息（可分组查询）
router.get('/member_shows', membershows);

module.exports = router;