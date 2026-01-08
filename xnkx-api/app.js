const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const authMiddleware = require('./utils/authMiddleware');
const cors = require('cors');
require('dotenv').config();
require('./utils/cleanAvatars');
require('./utils/cleanUploads');
// 启动访问量汇总定时任务
const { startAccessSummaryTask } = require('./schedule/accessSummaryTask');
startAccessSummaryTask();
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/auth');
const userinfoRouter = require('./routes/userinfo')
const roleRouter = require('./routes/role');
const groupRouter = require('./routes/group');
const recruitmentRouter = require('./routes/recruitment');
const taskRouter = require('./routes/task');
const noticeRouter = require('./routes/notice');
const feedbackRouter = require('./routes/feedback');
const activityRouter = require('./routes/activity');
const clubAchievementRouter = require('./routes/clubachievement')
const groupAchievementRouter = require('./routes/groupachievements')
const accessRouter=require('./routes/access');
const approvalRouter = require('./routes/approvals');

const app = express();

// 添加调试中间件，打印所有请求的URL
app.use((req, res, next) => {
    console.log('Received request:', req.method, req.url);
    next();
});

// 配置CORS，允许来自指定域名的请求
const corsOptions = {
    origin: 'http://localhost:5173', // 允许的前端域名
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true, // 允许发送凭证
    allowedHeaders: ['Origin', 'Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'] // 暴露Content-Disposition头，用于下载
};

app.use(cors(corsOptions));

// 为静态文件单独配置CORS
app.use('/upload', (req, res, next) => {
    // 允许所有来源访问静态文件
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
}, express.static(path.join(__dirname, 'upload')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// 配置静态资源访问：让 /uploads 路径映射到项目根目录的 uploads 文件夹
app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.use('/', indexRouter);
// 登录和注册路由
app.use('/auth',usersRouter);
//用户信息
app.use('/userinfo', authMiddleware, userinfoRouter);
//角色信息
app.use('/role', roleRouter);
//小组信息
app.use('/group', groupRouter);
//纳新信息
app.use('/recruitment', authMiddleware, recruitmentRouter);
//任务信息
app.use('/task', authMiddleware, taskRouter);
//通知信息
app.use('/notice', authMiddleware, noticeRouter);
//留言信息
app.use('/feedback', feedbackRouter);
//动态信息
app.use('/activity', activityRouter);
//成就信息
app.use('/clubAchievement', clubAchievementRouter);
//成果信息
app.use('/groupAchievement', groupAchievementRouter);
//审批信息s
app.use('/approval', authMiddleware, approvalRouter);

app.use('', accessRouter);

module.exports = app;
