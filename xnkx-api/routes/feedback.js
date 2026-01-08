const express = require('express');
const router = express.Router();
const checkPermission = require('../utils/checkPermission');
const { publishFeedback, viewFeedback, updateFeedback, deleteFeedback } = require('../router_handler/feedback');
const authMiddleware = require('../utils/authMiddleware');

//发布反馈
router.post('/feedback',publishFeedback);

//查看反馈
router.get('/feedback',authMiddleware , checkPermission('comment:view'), viewFeedback);

//修改反馈状态
router.put('/feedback/:id', authMiddleware,checkPermission('comment:update'), updateFeedback);

//删除反馈
router.delete('/feedback/:id', authMiddleware,checkPermission('comment:delete'), deleteFeedback);


module.exports = router;