const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid');
const { BadRequestError } = require('../utils/errors'); // 引入你的错误类

/**
 * 通用文件上传中间件
 * @param {Object} options 配置项
 * @param {string} options.uploadDir 存储子目录（如 'avatars'、'dynamic-modules'）
 * @param {number} options.maxSize 最大文件大小（单位：MB，默认2）
 * @param {string[]} options.allowedTypes 允许的文件类型（默认图片格式）
 * @param {string} options.fieldName 接收的文件字段名（默认 'file'）
 * @param {number} options.maxCount 允许上传的文件数量（默认1，0为不限制，array模式生效）
 * @param {string} options.mode 上传模式：single（单文件）、array（多文件）、fields（多字段）
 * @returns {Function} multer中间件
 */
const createUploadMiddleware = (options = {}) => {
    // 默认配置
    const {
        uploadDir = 'upload', // 根目录
        subDir = 'default', // 子目录（区分不同模块：avatars/dynamic-modules）
        maxSize = 2, // 默认2MB
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], // 默认图片格式
        fieldName = 'file', // 默认字段名
        maxCount = 1, // 默认单文件
        mode = 'single' // 默认单文件模式
    } = options;

    // 1. 配置存储路径和文件名
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            // 完整存储路径：项目根目录/uploads/子目录（如 uploads/avatars、uploads/dynamic-modules）
            const fullDir = path.join(__dirname, `../${uploadDir}/${subDir}`);
            // 递归创建目录（不存在则创建）
            if (!fs.existsSync(fullDir)) {
                fs.mkdirSync(fullDir, { recursive: true });
            }
            cb(null, fullDir);
        },
        filename: (req, file, cb) => {
            // 生成唯一文件名：模块名_唯一ID_时间戳.后缀（避免重复）
            const ext = path.extname(file.originalname);
            const uniqueName = `${subDir}_${uuid.v4()}_${Date.now()}${ext}`;
            cb(null, uniqueName);
        }
    });

    // 2. 文件过滤（类型+大小）
    const fileFilter = (req, file, cb) => {
        // 校验文件类型
        if (!allowedTypes.includes(file.mimetype)) {
            const typeStr = allowedTypes.map(type => type.split('/')[1]).join('/');
            return cb(new BadRequestError(`仅支持 ${typeStr} 格式的文件`), false);
        }
        cb(null, true);
    };

    // 3. 配置multer
    const upload = multer({
        storage,
        limits: {
            fileSize: maxSize * 1024 * 1024, // 转换为字节
            files: maxCount // 多文件时的数量限制
        },
        fileFilter
    });

    // 4. 根据模式返回不同的中间件
    switch (mode) {
        case 'array':
            return upload.array(fieldName, maxCount); // 多文件（同字段名）
        case 'fields':
            return upload.fields(maxCount); // 多字段（不同字段名）
        case 'single':
        default:
            return upload.single(fieldName); // 单文件
    }
};

// 封装常用的预设中间件（直接复用）
// 1. 头像上传中间件（单文件，avatars子目录）
const avatarUpload = createUploadMiddleware({
    subDir: 'avatar',
    fieldName: 'avatar',
    mode: 'single',
    maxSize: 5
});

// 2. 动态模块多图片上传中间件（多文件，dynamic-modules子目录，最多10张）
const dynamicModuleUpload = createUploadMiddleware({
    subDir: 'activityImg',
    fieldName: 'images',
    mode: 'single',
    maxSize: 10 // 动态模块图片允许5MB
});

// 3. 成果图片上传中间件（单文件，groupachievementImg子目录）
const groupAchievementImgUpload = createUploadMiddleware({
    subDir: 'groupachievementImg', // 成果图片存储子目录
    fieldName: 'achievementImg',   // 前端上传的文件字段名（需和前端对应）
    mode: 'single',                // 单文件上传模式
    maxSize: 5,                    // 成果图片最大5MB（可根据需求调整）
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] // 仅允许图片格式
});

// 4. 社团成果图片上传中间件（单文件，clubachievementImg子目录）
const clubAchievementImgUpload = createUploadMiddleware({
    subDir: 'clubachievementImg', // 成果图片存储子目录
    fieldName: 'achievementImg',   // 前端上传的文件字段名（需和前端对应）
    mode: 'single',                // 单文件上传模式
    maxSize: 5,                    // 成果图片最大5MB（可根据需求调整）
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] // 仅允许图片格式
});

// 5. 任务文件上传中间件（多文件，taskFiles子目录）
const taskFilesUpload = createUploadMiddleware({
    subDir: 'taskFiles', // 任务文件存储子目录
    fieldName: 'taskFiles',   // 前端上传的文件字段名
    mode: 'array',                // 多文件上传模式
    maxSize: 10,                    // 任务文件最大10MB
    maxCount: 10,                   // 最多上传10个文件
    allowedTypes: [                // 允许的文件类型
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint
        'application/pdf', // PDF
        'application/zip', 'application/x-rar-compressed', // 压缩文件
        'text/plain', 'text/markdown' // 文本文件
    ]
});

// 6. 任务图片上传中间件（多文件，taskImages子目录）
const taskImagesUpload = createUploadMiddleware({
    subDir: 'taskImages', // 任务图片存储子目录
    fieldName: 'taskImages',   // 前端上传的文件字段名
    mode: 'array',                // 多文件上传模式
    maxSize: 5,                    // 任务图片最大5MB
    maxCount: 5,                   // 最多上传5个图片
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] // 仅允许图片格式
});

// 7. 用户提交文件上传中间件（多文件，submitFiles子目录）
const submitFilesUpload = createUploadMiddleware({
    subDir: 'submitFiles', // 用户提交文件存储子目录
    fieldName: 'submitFiles',   // 前端上传的文件字段名
    mode: 'array',                // 多文件上传模式
    maxSize: 50,                    // 提交文件最大10MB
    maxCount: 10,                   // 最多上传10个文件
    allowedTypes: [                // 允许的文件类型
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint
        'application/pdf', // PDF
        'application/zip', 'application/x-rar-compressed', // 压缩文件
        'text/plain', 'text/markdown' // 文本文件
    ]
});

// 8. 用户提交图片上传中间件（多文件，submitImages子目录）
const submitImagesUpload = createUploadMiddleware({
    subDir: 'submitImages', // 用户提交图片存储子目录
    fieldName: 'submitImages',   // 前端上传的文件字段名
    mode: 'array',                // 多文件上传模式
    maxSize: 5,                    // 提交图片最大5MB
    maxCount: 5,                   // 最多上传5个图片
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] // 仅允许图片格式
});

module.exports = {
    createUploadMiddleware, // 通用创建函数（自定义配置）
    avatarUpload, // 头像专用（直接用）
    dynamicModuleUpload,// 动态模块多图片专用（直接用）
    groupAchievementImgUpload, // 小组成果图片专用（直接用）
    clubAchievementImgUpload, // 社团成果图片专用（直接用）
    taskFilesUpload, // 任务文件专用（直接用）
    taskImagesUpload, // 任务图片专用（直接用）
    submitFilesUpload, // 用户提交文件专用（直接用）
    submitImagesUpload // 用户提交图片专用（直接用）
};