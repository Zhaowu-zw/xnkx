'use strict';

const { system_configs } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取系统配置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件函数
 */
const getSystemConfig = async (req, res, next) => {
    try {
        const { key } = req.params;
        
        // 验证参数
        if (!key) {
            return res.status(400).json({
                status: 'error',
                message: '缺少配置键参数'
            });
        }
        
        // 查询配置
        const config = await system_configs.findByPk(key);
        
        if (!config) {
            return res.status(200).json({
                status: 'success',
                data: null
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: config
        });
    } catch (error) {
        console.error('获取系统配置失败:', error);
        res.status(500).json({
            status: 'error',
            message: '获取系统配置失败',
            error: error.message
        });
    }
};

/**
 * 获取多个系统配置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件函数
 */
const getSystemConfigs = async (req, res, next) => {
    try {
        const { keys } = req.query;
        
        // 验证参数
        if (!keys || !Array.isArray(keys)) {
            return res.status(400).json({
                status: 'error',
                message: '缺少配置键数组参数'
            });
        }
        
        // 查询配置
        const configs = await system_configs.findAll({
            where: {
                key: { [Op.in]: keys }
            }
        });
        
        res.status(200).json({
            status: 'success',
            data: configs
        });
    } catch (error) {
        console.error('获取系统配置失败:', error);
        res.status(500).json({
            status: 'error',
            message: '获取系统配置失败',
            error: error.message
        });
    }
};

/**
 * 更新系统配置
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件函数
 */
const updateSystemConfig = async (req, res, next) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;
        
        // 验证参数
        if (!key || value === undefined) {
            return res.status(400).json({
                status: 'error',
                message: '缺少配置键或配置值参数'
            });
        }
        
        // 检查配置是否存在
        const existingConfig = await system_configs.findByPk(key);
        
        let config;
        if (existingConfig) {
            // 更新配置
            config = await existingConfig.update({
                value,
                description,
                update_time: new Date()
            });
        } else {
            // 创建配置
            config = await system_configs.create({
                key,
                value,
                description,
                update_time: new Date()
            });
        }
        
        res.status(200).json({
            status: 'success',
            message: '系统配置更新成功',
            data: config
        });
    } catch (error) {
        console.error('更新系统配置失败:', error);
        res.status(500).json({
            status: 'error',
            message: '更新系统配置失败',
            error: error.message
        });
    }
};

/**
 * 获取报名入口状态
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件函数
 */
const getRecruitStatus = async (req, res, next) => {
    try {
        // 查询报名入口状态配置
        const config = await system_configs.findByPk('is_recruit_open');
        
        res.status(200).json({
            status: 'success',
            data: {
                key: 'is_recruit_open',
                value: config ? config.value : 'false',
                description: config ? config.description : '纳新报名入口状态',
                enabled: config ? config.value === 'true' : false
            }
        });
    } catch (error) {
        console.error('获取报名入口状态失败:', error);
        res.status(500).json({
            status: 'error',
            message: '获取报名入口状态失败',
            error: error.message
        });
    }
};

/**
 * 更新报名入口状态
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件函数
 */
const updateRecruitStatus = async (req, res, next) => {
    try {
        const { enabled } = req.body;
        
        // 验证参数
        if (enabled === undefined) {
            return res.status(400).json({
                status: 'error',
                message: '缺少enabled参数'
            });
        }
        
        // 检查配置是否存在
        const existingConfig = await system_configs.findByPk('is_recruit_open');
        
        let config;
        if (existingConfig) {
            // 更新配置
            config = await existingConfig.update({
                value: enabled ? 'true' : 'false',
                description: '纳新报名入口状态',
                update_time: new Date()
            });
        } else {
            // 创建配置
            config = await system_configs.create({
                key: 'is_recruit_open',
                value: enabled ? 'true' : 'false',
                description: '纳新报名入口状态',
                update_time: new Date()
            });
        }
        
        res.status(200).json({
            status: 'success',
            message: '报名入口状态更新成功',
            data: {
                key: config.key,
                value: config.value,
                description: config.description,
                enabled: config.value === 'true'
            }
        });
    } catch (error) {
        console.error('更新报名入口状态失败:', error);
        res.status(500).json({
            status: 'error',
            message: '更新报名入口状态失败',
            error: error.message
        });
    }
};

module.exports = {
    getSystemConfig,
    getSystemConfigs,
    updateSystemConfig,
    getRecruitStatus,
    updateRecruitStatus
};