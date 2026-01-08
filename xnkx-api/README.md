# 社团管理系统 - 后端项目

## 项目简介

这是一个基于Express.js开发的社团管理系统后端项目，提供了完整的RESTful API接口，支持社团信息管理、成员管理、活动管理、任务管理、成就管理等功能，旨在为前端应用提供稳定可靠的数据服务。

## 技术栈

- **框架**: Express.js
- **数据库**: MySQL
- **ORM**: Sequelize
- **认证**: JSON Web Token (JWT)
- **文件上传**: Multer
- **定时任务**: node-schedule
- **缓存**: Redis
- **日志**: Morgan
- **环境变量**: dotenv

## 项目结构

```
xnkx-api/
├── bin/                 # 启动脚本
│   └── www              # 服务器启动文件
├── config/              # 配置文件
│   └── config.json      # 数据库配置
├── migrations/          # 数据库迁移文件
├── models/              # 数据模型
│   └── index.js         # 模型索引
├── router_handler/      # 路由处理函数
├── routes/              # 路由配置
│   └── index.js         # 路由索引
├── schedule/            # 定时任务
├── seeders/             # 数据种子文件
├── service/             # 业务逻辑
├── upload/              # 上传文件目录
├── utils/               # 工具函数
├── .env                 # 环境变量
├── app.js               # 应用入口
├── package.json         # 项目配置
└── package-lock.json    # 依赖锁定文件
```

## 主要功能

1. **用户管理**
   - 用户注册/登录
   - 个人信息管理
   - 角色权限管理

2. **社团管理**
   - 社团信息管理
   - 成员管理
   - 小组管理

3. **活动管理**
   - 活动创建/更新/删除
   - 活动列表查询
   - 活动详情查询

4. **任务管理**
   - 任务创建/更新/删除
   - 任务分配
   - 任务提交与审核

5. **成就管理**
   - 社团成就管理
   - 小组成就管理

6. **审批管理**
   - 招新审批
   - 权限交接审批

7. **统计分析**
   - 数据统计
   - 访问日志分析

## 安装和运行

### 环境要求

- Node.js >= 18.0.0
- MySQL >= 5.7.0
- Redis >= 6.0.0

### 安装依赖

```bash
npm install
```

### 配置数据库

1. 创建数据库

```sql
CREATE DATABASE xnkx;
```

2. 配置环境变量

在 `.env` 文件中配置数据库连接信息：

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=xnkx
```

3. 运行数据库迁移

```bash
npx sequelize-cli db:migrate
```

4. 运行数据种子（可选）

```bash
npx sequelize-cli db:seed:all
```

### 启动服务器

```bash
npm start
```

服务器将在 http://localhost:3000 启动。

## API文档

### 认证相关

- **POST /auth/login**: 用户登录
- **POST /auth/register**: 用户注册
- **POST /auth/refresh-token**: 刷新Token

### 用户管理

- **GET /user**: 获取用户列表
- **GET /user/:id**: 获取用户详情
- **POST /user**: 创建用户
- **PUT /user/:id**: 更新用户
- **DELETE /user/:id**: 删除用户

### 社团管理

- **GET /group**: 获取小组列表
- **GET /group/:id**: 获取小组详情
- **POST /group**: 创建小组
- **PUT /group/:id**: 更新小组
- **DELETE /group/:id**: 删除小组

### 活动管理

- **GET /activity**: 获取活动列表
- **GET /activity/:id**: 获取活动详情
- **POST /activity**: 创建活动
- **PUT /activity/:id**: 更新活动
- **DELETE /activity/:id**: 删除活动

### 任务管理

- **GET /task**: 获取任务列表
- **GET /task/:id**: 获取任务详情
- **POST /task**: 创建任务
- **PUT /task/:id**: 更新任务
- **DELETE /task/:id**: 删除任务

### 成就管理

- **GET /clubachievement**: 获取社团成就列表
- **GET /clubachievement/:id**: 获取社团成就详情
- **POST /clubachievement**: 创建社团成就
- **PUT /clubachievement/:id**: 更新社团成就
- **DELETE /clubachievement/:id**: 删除社团成就

- **GET /groupachievement**: 获取小组成就列表
- **GET /groupachievement/:id**: 获取小组成就详情
- **POST /groupachievement**: 创建小组成就
- **PUT /groupachievement/:id**: 更新小组成就
- **DELETE /groupachievement/:id**: 删除小组成就

## 开发规范

1. **代码风格**: 采用JavaScript Standard Style
2. **命名规范**: 变量采用camelCase，函数采用camelCase，文件采用kebab-case
3. **API设计**: 遵循RESTful API设计规范
4. **错误处理**: 统一错误格式，使用HTTP状态码
5. **日志记录**: 重要操作记录日志

## 安全措施

1. **认证授权**: 使用JWT进行认证，基于角色的权限控制
2. **输入验证**: 对所有输入进行验证，防止SQL注入和XSS攻击
3. **密码安全**: 使用bcryptjs进行密码哈希
4. **文件上传**: 限制文件类型和大小，防止恶意文件上传
5. **CORS配置**: 配置CORS，限制跨域请求

## 部署

### 生产环境部署

1. 配置环境变量
2. 运行数据库迁移
3. 构建生产版本
4. 使用PM2或其他进程管理器启动应用

### Docker部署

1. 构建Docker镜像
2. 运行Docker容器
3. 配置Docker Compose（可选）

## 监控和维护

1. **日志监控**: 使用ELK Stack或其他日志监控工具
2. **性能监控**: 使用New Relic或其他性能监控工具
3. **定期备份**: 定期备份数据库
4. **安全更新**: 及时更新依赖包，修复安全漏洞

## 许可证

MIT