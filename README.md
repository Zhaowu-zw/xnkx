# 项目介绍

## 项目概述

本项目是一个基于 Vue 3 + Express 的前后端分离的社团管理系统，包含前端和后端两个主要模块。

## 项目架构

### 目录结构

```
temp/
├── xnkx/          # 前端项目
└── xnkx-api/      # 后端项目
```

## 前端模块 (xnkx)

### 技术栈
- Vue 3 + Vite
- Element Plus
- Pinia
- Vue Router
- Axios
- ECharts

### 主要功能
- 用户登录与注册
- 社团信息展示
- 成员管理
- 活动发布与管理
- 任务分配与提交
- 成就展示
- 审批管理
- 数据统计与分析

### 运行说明

1. 进入前端目录
   ```bash
   cd xnkx
   ```

2. 安装依赖
   ```bash
   pnpm install
   ```

3. 启动开发服务器
   ```bash
   pnpm run dev
   ```

4. 构建生产版本
   ```bash
   pnpm run build
   ```

## 后端模块 (xnkx-api)

### 技术栈
- Express
- Sequelize
- MySQL
- Redis
- JWT
- Multer

### 主要功能
- 用户认证与授权
- 角色权限管理
- 社团信息管理
- 成员管理
- 活动管理
- 任务管理
- 成就管理
- 审批流程
- 数据统计
- 文件上传

### 运行说明

1. 进入后端目录
   ```bash
   cd xnkx-api
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 配置环境变量
   - 复制 `.env.example` 为 `.env`
   - 配置数据库连接信息

4. 启动开发服务器
   ```bash
   npm run start
   ```

## 数据库设计

### 主要表结构
- 用户表
- 角色表
- 权限表
- 社团表
- 成员表
- 活动表
- 任务表
- 成就表
- 审批表

## API 文档

API 文档采用 RESTful 设计风格，主要包括：

- 认证相关 API
- 用户管理 API
- 社团管理 API
- 活动管理 API
- 任务管理 API
- 成就管理 API
- 审批管理 API

## 部署说明

### 前端部署
1. 构建生产版本
2. 使用 Nginx 或 Apache 部署静态文件

### 后端部署
1. 构建生产版本
2. 使用 PM2 或 Docker 部署
3. 配置 Nginx 反向代理

## 开发规范

### 前端
- 使用 Vue 3 Composition API
- 采用 ESLint + Prettier 进行代码检查和格式化
- 组件命名采用 PascalCase
- 路由命名采用 kebab-case

### 后端
- 使用 RESTful API 设计
- 采用中间件进行权限验证
- 错误处理统一化
- 日志记录

## 贡献指南

1. Fork 仓库
2. 创建特性分支
3. 提交代码
4. 推送分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- Email: zhaowu-zw@qq.com
