const express = require('express');
const router = express.Router();
const checkPermission = require('../utils/checkPermission');
const {viewNotices, markAsRead, deleteReadNotices } = require('../router_handler/notice');

//查看通知（未读）
router.get('/view_notices', checkPermission('notice:view'), viewNotices)
//标记已读
router.patch('/mark_as_read', checkPermission('notice:mark:read'), markAsRead)
//删除已读通知
router.delete('/delete_read_notices', checkPermission('notice:delete'), deleteReadNotices)


module.exports = router;