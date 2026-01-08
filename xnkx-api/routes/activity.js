const express = require('express');
const router = express.Router();
const checkPermission = require('../utils/checkPermission');
const {
    createActivity,
    updateActivity,
    uploadDynamicModuleImages,
    viewActivities,
    deleteActivity
} = require('../router_handler/activity');
const authMiddleware = require('../utils/authMiddleware');

// 1. 动态图片上传（需要登录）
router.post('/upload-images', authMiddleware, uploadDynamicModuleImages);

// 2. 查看动态列表（公开/私有，私有需要登录）
router.get('/list', viewActivities); // 公开动态无需登录，私有动态在控制器内校验

// 3. 发布动态（需要登录+权限）
router.post('/publish', authMiddleware, checkPermission('activity:create'), createActivity);

// 4. 编辑动态（需要登录+权限）
router.put('/edit/:id', authMiddleware, checkPermission('activity:edit'), updateActivity);

// 6. 删除动态（需要登录+权限）
router.delete('/delete/:id', authMiddleware, checkPermission('activity:delete'), deleteActivity);

module.exports = router;