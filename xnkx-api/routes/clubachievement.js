const express = require('express');
const router = express.Router();
const checkPermission = require('../utils/checkPermission');
const { publishclubachievement, viewclubachievement, deleteclubachievement, editclubachievement, uploadClubAchievementImg } = require('../router_handler/clubachievement');
const authMiddleware = require('../utils/authMiddleware');


//获取所有成就
router.get('/clubachievement', viewclubachievement);

//新增社团成就
router.post('/clubachievement', authMiddleware, publishclubachievement);

//编辑社团成就
router.put('/clubachievement/:id', authMiddleware, editclubachievement);

//删除社团成就
router.delete('/clubachievement/:id', authMiddleware, deleteclubachievement)

// 社团成果图片上传路由（单文件）
router.post('/clubachievement/img', authMiddleware, uploadClubAchievementImg);

module.exports = router;