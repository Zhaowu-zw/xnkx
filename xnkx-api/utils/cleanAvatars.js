const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const { userinfo } = require('../models'); // 导入userinfo模型

// 头像文件夹路径（和上传接口的路径保持一致）
const avatarDir = path.join(__dirname, '../upload/avatar');

// 清理逻辑：删除超过24小时且未被数据库引用的头像
const cleanUnusedAvatars = async () => {
    try {
        // 1. 获取数据库中所有正在使用的头像URL
        const userInfos = await userinfo.findAll({ attributes: ['avatar'] });
        const usedAvatarUrls = userInfos
            .map(item => item.avatar)
            .filter(Boolean) // 过滤空值
            .map(url => {
                // 从URL中提取文件名（比如 https://xxx.com/uploads/avatars/avatar_123.png → avatar_123.png）
                return url.split('/').pop();
            });

        // 2. 扫描avatar文件夹中的所有文件
        const files = fs.readdirSync(avatarDir);
        const now = Date.now();
        const expiredTime = 24 * 60 * 60 * 1000; // 24小时过期

        // 3. 遍历文件，判断是否需要删除
        for (const file of files) {
            const filePath = path.join(avatarDir, file);
            const stat = fs.statSync(filePath);
            const fileCreateTime = stat.ctime.getTime();

            // 条件：① 文件超过24小时 ② 文件名不在已使用的列表中
            if (now - fileCreateTime > expiredTime && !usedAvatarUrls.includes(file)) {
                fs.unlinkSync(filePath); // 删除文件
                console.log(`清理未使用的头像文件：${file}`);
            }
        }
        console.log('头像文件夹清理完成');
    } catch (error) {
        console.error('清理头像文件失败：', error);
    }
};

// 配置定时任务：每天凌晨2点执行清理
const job = schedule.scheduleJob('0 2 * * *', cleanUnusedAvatars);
console.log('头像清理定时任务已启动，每天凌晨2点执行');

// 测试：立即执行一次（开发环境用，生产环境注释掉）
// cleanUnusedAvatars();

module.exports = { cleanUnusedAvatars };