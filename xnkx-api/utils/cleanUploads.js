const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
// 导入需要的模型
const { activity, clubAchievement, groupachievement, task, task_user } = require('../models');

// 上传文件夹根路径
const uploadRootDir = path.join(__dirname, '../upload');

// 所有需要清理的子文件夹配置
const cleanupConfigs = [
  {
    folderName: 'activityImg',
    folderPath: path.join(uploadRootDir, 'activityImg'),
    description: '活动图片',
    getUsedFiles: async () => {
      // 获取所有活动图片URL
      const activities = await activity.findAll({ attributes: ['image_url'] });
      let usedFilenames = [];
      
      activities.forEach(act => {
        if (act.image_url) {
          // 处理数组类型的image_url（因为模型中定义了getter将其转换为数组）
          const urls = Array.isArray(act.image_url) ? act.image_url : typeof act.image_url === 'string' ? act.image_url.split(',') : [];
          urls.forEach(url => {
            if (url) {
              usedFilenames.push(url.split('/').pop());
            }
          });
        }
      });
      
      return usedFilenames;
    }
  },
  {
    folderName: 'clubachievementImg',
    folderPath: path.join(uploadRootDir, 'clubachievementImg'),
    description: '社团成就图片',
    getUsedFiles: async () => {
      // 获取所有社团成就图片URL
      const clubAchievements = await clubAchievement.findAll({ attributes: ['image_url'] });
      return clubAchievements
        .map(item => item.image_url)
        .filter(Boolean)
        .map(url => url.split('/').pop());
    }
  },
  {
    folderName: 'groupachievementImg',
    folderPath: path.join(uploadRootDir, 'groupachievementImg'),
    description: '小组成就图片',
    getUsedFiles: async () => {
      // 获取所有小组成就图片URL
      const groupAchievements = await groupachievement.findAll({ attributes: ['image_url'] });
      return groupAchievements
        .map(item => item.image_url)
        .filter(Boolean)
        .map(url => url.split('/').pop());
    }
  },
  {
    folderName: 'taskFiles',
    folderPath: path.join(uploadRootDir, 'taskFiles'),
    description: '任务文件',
    getUsedFiles: async () => {
      // 获取所有任务文件URL
      const tasks = await task.findAll({ attributes: ['task_files'] });
      let usedFilenames = [];
      
      tasks.forEach(t => {
        if (t.task_files) {
          // 处理JSON数组
          const files = typeof t.task_files === 'string' ? JSON.parse(t.task_files) : t.task_files;
          if (Array.isArray(files)) {
            files.forEach(fileUrl => {
              if (fileUrl) {
                usedFilenames.push(fileUrl.split('/').pop());
              }
            });
          }
        }
      });
      
      return usedFilenames;
    }
  },
  {
    folderName: 'taskImages',
    folderPath: path.join(uploadRootDir, 'taskImages'),
    description: '任务图片',
    getUsedFiles: async () => {
      // 获取所有任务图片URL
      const tasks = await task.findAll({ attributes: ['task_images'] });
      let usedFilenames = [];
      
      tasks.forEach(t => {
        if (t.task_images) {
          // 处理JSON数组
          const images = typeof t.task_images === 'string' ? JSON.parse(t.task_images) : t.task_images;
          if (Array.isArray(images)) {
            images.forEach(imageUrl => {
              if (imageUrl) {
                usedFilenames.push(imageUrl.split('/').pop());
              }
            });
          }
        }
      });
      
      return usedFilenames;
    }
  },
  {
    folderName: 'submitFiles',
    folderPath: path.join(uploadRootDir, 'submitFiles'),
    description: '用户提交文件',
    getUsedFiles: async () => {
      // 获取所有用户提交文件URL
      const taskUsers = await task_user.findAll({ attributes: ['submit_files'] });
      let usedFilenames = [];
      
      taskUsers.forEach(tu => {
        if (tu.submit_files) {
          // 处理JSON数组
          const files = typeof tu.submit_files === 'string' ? JSON.parse(tu.submit_files) : tu.submit_files;
          if (Array.isArray(files)) {
            files.forEach(fileUrl => {
              if (fileUrl) {
                usedFilenames.push(fileUrl.split('/').pop());
              }
            });
          }
        }
      });
      
      return usedFilenames;
    }
  },
  {
    folderName: 'submitImages',
    folderPath: path.join(uploadRootDir, 'submitImages'),
    description: '用户提交图片',
    getUsedFiles: async () => {
      // 获取所有用户提交图片URL
      const taskUsers = await task_user.findAll({ attributes: ['submit_images'] });
      let usedFilenames = [];
      
      taskUsers.forEach(tu => {
        if (tu.submit_images) {
          // 处理JSON数组
          const images = typeof tu.submit_images === 'string' ? JSON.parse(tu.submit_images) : tu.submit_images;
          if (Array.isArray(images)) {
            images.forEach(imageUrl => {
              if (imageUrl) {
                usedFilenames.push(imageUrl.split('/').pop());
              }
            });
          }
        }
      });
      
      return usedFilenames;
    }
  }
];

// 通用清理逻辑：删除超过24小时且未被数据库引用的文件
const cleanUnusedFiles = async (config) => {
  try {
    console.log(`\n开始清理${config.description}...`);
    
    // 确保文件夹存在
    if (!fs.existsSync(config.folderPath)) {
      console.log(`${config.description}文件夹不存在，跳过清理`);
      return;
    }
    
    // 1. 获取数据库中所有正在使用的文件名
    const usedFilenames = await config.getUsedFiles();
    console.log(`正在使用的${config.description}数量：${usedFilenames.length}`);
    
    // 2. 扫描文件夹中的所有文件
    const files = fs.readdirSync(config.folderPath);
    const now = Date.now();
    const expiredTime = 24 * 60 * 60 * 1000; // 24小时过期
    
    console.log(`扫描到${config.description}总数：${files.length}`);
    
    // 3. 遍历文件，判断是否需要删除
    let deletedCount = 0;
    for (const file of files) {
      const filePath = path.join(config.folderPath, file);
      const stat = fs.statSync(filePath);
      const fileCreateTime = stat.ctime.getTime();
      
      // 条件：① 文件超过24小时 ② 文件名不在已使用的列表中
      if (now - fileCreateTime > expiredTime && !usedFilenames.includes(file)) {
        fs.unlinkSync(filePath); // 删除文件
        console.log(`清理未使用的${config.description}：${file}`);
        deletedCount++;
      }
    }
    
    console.log(`${config.description}清理完成，共清理${deletedCount}个文件`);
    return deletedCount;
  } catch (error) {
    console.error(`${config.description}清理失败：`, error);
    return 0;
  }
};

// 主清理函数
const runCleanup = async () => {
  console.log('\n====================================');
  console.log(`开始执行上传文件清理任务 - ${new Date().toLocaleString()}`);
  console.log('====================================');
  
  let totalDeleted = 0;
  
  // 遍历所有配置，依次清理
  for (const config of cleanupConfigs) {
    const deletedCount = await cleanUnusedFiles(config);
    totalDeleted += deletedCount;
  }
  
  console.log('\n====================================');
  console.log(`上传文件清理任务完成 - ${new Date().toLocaleString()}`);
  console.log(`总计清理文件：${totalDeleted}个`);
  console.log('====================================\n');
};

// 配置定时任务：每天凌晨2点执行清理
const job = schedule.scheduleJob('0 2 * * *', runCleanup);
console.log('上传文件清理定时任务已启动，每天凌晨2点执行');

// 测试：立即执行一次（开发环境用，生产环境注释掉）
// runCleanup();

module.exports = { runCleanup };