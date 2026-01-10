const express = require('express');
const router = express.Router();
const systemConfigHandler = require('../router_handler/systemConfig');
const authMiddleware = require('../utils/authMiddleware');

// 获取系统配置
router.get('/config/:key', authMiddleware, systemConfigHandler.getSystemConfig);

// 获取多个系统配置
router.get('/configs', authMiddleware, systemConfigHandler.getSystemConfigs);

// 更新系统配置
router.put('/config/:key', authMiddleware, systemConfigHandler.updateSystemConfig);

// 获取报名入口状态
router.get('/recruit/status', authMiddleware, systemConfigHandler.getRecruitStatus);

// 更新报名入口状态
router.put('/recruit/status', authMiddleware, systemConfigHandler.updateRecruitStatus);

module.exports = router;