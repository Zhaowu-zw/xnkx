# 社团管理系统 - 后端使用文档

## 1. 项目概述

社团管理系统后端是一个基于Express.js开发的RESTful API服务，为前端应用提供数据支持和业务逻辑处理。系统采用模块化设计，具有良好的扩展性和可维护性。

## 2. 系统架构

### 2.1 技术栈

- **框架**: Express.js
- **数据库**: MySQL
- **ORM**: Sequelize
- **认证**: JSON Web Token (JWT)
- **文件上传**: Multer
- **定时任务**: node-schedule
- **缓存**: Redis
- **日志**: Morgan
- **环境变量**: dotenv

### 2.2 核心组件

- **路由层**: 处理HTTP请求和响应
- **业务逻辑层**: 实现核心业务逻辑
- **数据访问层**: 与数据库交互
- **中间件**: 处理认证、日志、错误等
- **工具函数**: 提供通用功能支持

## 3. 环境搭建

### 3.1 依赖安装

```bash
npm install
```

### 3.2 环境变量配置

创建 `.env` 文件，配置以下环境变量：

```
# 服务器配置
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=xnkx

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 文件上传配置
UPLOAD_PATH=./upload

# 日志配置
LOG_LEVEL=debug
```

## 4. 数据库配置

### 4.1 数据库创建

```sql
CREATE DATABASE xnkx DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4.2 数据库迁移

运行数据库迁移脚本，创建表结构：

```bash
npx sequelize-cli db:migrate
```

### 4.3 数据种子

运行数据种子脚本，初始化测试数据：

```bash
npx sequelize-cli db:seed:all
```

### 4.4 数据库模型

主要数据模型包括：

- User: 用户表
- UserInfo: 用户信息表
- Role: 角色表
- Permission: 权限表
- UserRole: 用户角色关联表
- RolePermission: 角色权限关联表
- GroupInfo: 小组表
- MemberShow: 成员展示表
- Recruitment: 招新表
- Task: 任务表
- TaskUser: 任务用户关联表
- Approval: 审批表
- Notice: 通知表
- Activity: 活动表
- Feedback: 反馈表
- ClubAchievement: 社团成就表
- GroupAchievement: 小组成就表
- AccessLog: 访问日志表
- AccessSummary: 访问汇总表

## 5. API接口详细说明

### 5.1 认证相关接口

#### 5.1.1 用户登录

- **URL**: `/auth/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "admin",
    "password": "123456"
  }
  ```
- **响应**:
  ```json
  {
    "code": 200,
    "message": "登录成功",
    "data": {
      "token": "jwt_token",
      "user": {
        "id": 1,
        "username": "admin",
        "role": "管理员"
      }
    }
  }
  ```

#### 5.1.2 用户注册

- **URL**: `/auth/register`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "new_user",
    "password": "123456",
    "email": "user@example.com"
  }
  ```

### 5.2 用户管理接口

#### 5.2.1 获取用户列表

- **URL**: `/user`
- **方法**: `GET`
- **权限**: 管理员
- **查询参数**:
  - `page`: 页码（默认1）
  - `pageSize`: 每页条数（默认10）
  - `keyword`: 搜索关键词

#### 5.2.2 获取用户详情

- **URL**: `/user/:id`
- **方法**: `GET`
- **权限**: 管理员或当前用户

### 5.3 社团管理接口

#### 5.3.1 获取小组列表

- **URL**: `/group`
- **方法**: `GET`
- **查询参数**:
  - `page`: 页码（默认1）
  - `pageSize`: 每页条数（默认10）

#### 5.3.2 创建小组

- **URL**: `/group`
- **方法**: `POST`
- **权限**: 管理员
- **请求体**:
  ```json
  {
    "group_name": "网页开发组",
    "group_desc": "负责社团网站开发",
    "group_position": "技术部"
  }
  ```

### 5.4 活动管理接口

#### 5.4.1 获取活动列表

- **URL**: `/activity`
- **方法**: `GET`
- **查询参数**:
  - `page`: 页码（默认1）
  - `pageSize`: 每页条数（默认10）
  - `group_id`: 小组ID

#### 5.4.2 创建活动

- **URL**: `/activity`
- **方法**: `POST`
- **权限**: 管理员或社长
- **请求体**:
  ```json
  {
    "title": "社团招新活动",
    "content": "社团招新活动详情",
    "group_id": 1,
    "activity_time": "2025-12-30 14:00:00"
  }
  ```

### 5.5 任务管理接口

#### 5.5.1 获取任务列表

- **URL**: `/task`
- **方法**: `GET`
- **查询参数**:
  - `page`: 页码（默认1）
  - `pageSize`: 每页条数（默认10）
  - `status`: 任务状态

#### 5.5.2 创建任务

- **URL**: `/task`
- **方法**: `POST`
- **权限**: 管理员或组长
- **请求体**:
  ```json
  {
    "title": "开发社团网站",
    "content": "开发社团官方网站",
    "group_id": 1,
    "assign_to": [1, 2, 3],
    "deadline": "2025-12-31 23:59:59"
  }
  ```

## 6. 开发流程

### 6.1 代码结构

```
xnkx-api/
├── routes/              # 路由配置
├── router_handler/      # 路由处理函数
├── service/             # 业务逻辑
├── models/              # 数据模型
├── utils/               # 工具函数
└── app.js               # 应用入口
```

### 6.2 开发规范

- **命名规范**: 变量采用camelCase，函数采用camelCase，文件采用kebab-case
- **代码风格**: 采用JavaScript Standard Style
- **API设计**: 遵循RESTful API设计规范
- **错误处理**: 统一错误格式，使用HTTP状态码
- **日志记录**: 重要操作记录日志

### 6.3 中间件开发

创建自定义中间件示例：

```javascript
// utils/middleware.js
module.exports = {
  // 认证中间件
  auth: (req, res, next) => {
    // 认证逻辑
    next();
  },
  
  // 权限中间件
  permission: (permission) => {
    return (req, res, next) => {
      // 权限验证逻辑
      next();
    };
  }
};
```

### 6.4 定时任务

创建定时任务示例：

```javascript
// schedule/task.js
const schedule = require('node-schedule');

// 每天凌晨1点执行
const job = schedule.scheduleJob('0 1 * * *', () => {
  console.log('定时任务执行');
  // 执行任务逻辑
});

module.exports = job;
```

## 7. 部署流程

### 7.1 生产环境构建

```bash
npm run build
```

### 7.2 进程管理

使用PM2进行进程管理：

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start bin/www --name xnkx-api

# 查看应用状态
pm2 status

# 查看应用日志
pm2 logs

# 重启应用
pm2 restart xnkx-api

# 停止应用
pm2 stop xnkx-api
```

### 7.3 Nginx配置

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件服务
    location /upload {
        alias /path/to/xnkx-api/upload;
        expires 30d;
    }
}
```

## 8. 监控和维护

### 8.1 日志管理

- **访问日志**: 使用Morgan记录HTTP请求日志
- **错误日志**: 记录应用错误信息
- **业务日志**: 记录重要业务操作

### 8.2 性能监控

- 使用PM2监控应用性能
- 使用Redis监控缓存使用情况
- 使用MySQL监控数据库性能

### 8.3 安全维护

- 定期更新依赖包
- 定期备份数据库
- 监控异常访问
- 实施防火墙策略

## 9. 常见问题及解决方案

### 9.1 数据库连接失败

- 检查数据库服务是否正常运行
- 检查数据库配置是否正确
- 检查数据库用户权限

### 9.2 JWT认证失败

- 检查JWT密钥是否正确
- 检查Token是否过期
- 检查Token格式是否正确

### 9.3 文件上传失败

- 检查上传目录权限
- 检查文件大小是否超过限制
- 检查文件类型是否允许

### 9.4 定时任务不执行

- 检查定时任务配置是否正确
- 检查应用是否正常运行
- 检查日志记录

## 10. 联系方式

如有问题或建议，请联系：

- 项目负责人：XXX
- 邮箱：XXX@example.com
- 文档更新时间：2025-12-23