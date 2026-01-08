const express = require('express');
const router = express.Router();
const { publishgroupachievement, viewgroupachievement, deletegroupachievement, updategroupachievement, uploadgroupachievementimg } = require('../router_handler/groupachievements');
const authMiddleware = require('../utils/authMiddleware');


//获取所有小组成果
router.get('/groupachievement', viewgroupachievement);
//新增成果
router.post('/groupachievement', authMiddleware, publishgroupachievement);
//删除成果
router.delete('/groupachievement/:id', authMiddleware, deletegroupachievement)
//修改成果信息
router.put('/groupachievement/:id', authMiddleware, updategroupachievement);
//上传成果图片
router.post('/upload-images', authMiddleware, uploadgroupachievementimg);

module.exports = router;