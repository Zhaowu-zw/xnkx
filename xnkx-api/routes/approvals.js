const express = require('express');
const router = express.Router();
const checkPermission = require('../utils/checkPermission');
const {
    updateApprovalStatus,
    viewApprovals,
    deleteApprovals
} = require('../router_handler/approval');

// 更新审批状态
router.patch('/:id', checkPermission('approval:approve'), updateApprovalStatus);

// 查看审批记录列表
router.get('/', checkPermission('approval:view'), viewApprovals);

// 删除审批记录
router.delete('/:id', checkPermission('approval:delete'), deleteApprovals);

module.exports = router;
