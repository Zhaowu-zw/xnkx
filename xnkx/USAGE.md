# 社团管理系统 - 前端使用文档

## 1. 项目概述

社团管理系统是一个基于Vue 3开发的现代化Web应用，旨在帮助社团高效管理日常事务，包括成员管理、活动管理、任务管理、成就管理等功能。本文档将详细介绍系统的使用方法和功能操作。

## 2. 系统架构

### 2.1 技术栈

- **框架**: Vue 3 + Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **HTTP客户端**: Axios
- **样式预处理器**: SCSS

### 2.2 项目结构

```
src/
├── api/             # API接口定义
├── assets/          # 静态资源
├── components/      # 通用组件
├── router/          # 路由配置
├── stores/          # 状态管理
├── utils/           # 工具函数
├── views/           # 页面组件
├── App.vue          # 根组件
└── main.js          # 入口文件
```

## 3. 功能模块

### 3.1 用户模块

#### 3.1.1 登录

访问 `/login` 页面，输入用户名和密码进行登录。

#### 3.1.2 个人中心

- **用户首页**: 访问 `/user/home`，查看个人信息和动态
- **个人资料**: 访问 `/user/profile`，修改个人信息
- **修改密码**: 访问 `/user/password`，修改登录密码

### 3.2 社团模块

#### 3.2.1 社团信息

访问 `/club/info`，查看社团基本信息。

#### 3.2.2 成员展示

访问 `/club/members`，查看社团成员列表。

#### 3.2.3 社团招新

访问 `/club/recruit`，查看和参与社团招新。

### 3.3 活动模块

#### 3.3.1 活动列表

访问 `/activity/list`，查看所有社团活动。

#### 3.3.2 活动详情

访问 `/activity/detail/:id`，查看活动详细信息。

### 3.4 成就模块

#### 3.4.1 成就详情

访问 `/achievement/:id`，查看成就详细信息。

### 3.5 任务模块

#### 3.5.1 任务详情

访问 `/task/detail/:id`，查看任务详细信息和提交任务。

### 3.6 管理员后台

#### 3.6.1 数据统计

访问 `/management/data-stat`，查看系统数据统计。

#### 3.6.2 系统管理

- **用户管理**: 访问 `/management/system/user`，管理系统用户
- **角色管理**: 访问 `/management/system/role`，管理系统角色
- **小组管理**: 访问 `/management/system/group`，管理社团小组

#### 3.6.3 审批管理

- **纳新审批**: 访问 `/management/approval/recruit`，审批社团招新申请
- **权限交接审批**: 访问 `/management/approval/permission`，审批权限交接申请

#### 3.6.4 业务管理

- **社团动态**: 访问 `/management/business/activity`，管理社团活动
- **社团成就**: 访问 `/management/business/achievement`，管理社团成就
- **小组成果**: 访问 `/management/business/group-achievement`，管理小组成果
- **反馈信息**: 访问 `/management/business/feedback`，管理用户反馈
- **任务管理**: 访问 `/management/business/task`，管理系统任务

## 4. 路由配置

系统使用Vue Router进行路由管理，路由配置文件位于 `src/router/routes.js`。所有路由均采用懒加载方式加载，提高首屏加载速度。

### 4.1 路由守卫

系统实现了全局路由守卫，用于：
- 设置页面标题
- 权限验证
- 角色验证

## 5. 状态管理

系统使用Pinia进行状态管理，状态管理文件位于 `src/stores/` 目录下。主要包括：

- **user**: 用户状态管理
- **activity**: 活动状态管理
- **group**: 小组状态管理
- **task**: 任务状态管理
- **approval**: 审批状态管理

## 6. API接口

系统使用Axios进行HTTP请求，API接口定义位于 `src/api/` 目录下。所有接口均返回统一格式的数据：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 6.1 请求拦截器

系统实现了请求拦截器，用于：
- 添加认证token
- 设置请求超时

### 6.2 响应拦截器

系统实现了响应拦截器，用于：
- 统一处理错误
- 刷新token

## 7. 开发流程

### 7.1 环境搭建

1. 安装Node.js和pnpm
2. 克隆代码仓库
3. 安装依赖：`pnpm install`
4. 启动开发服务器：`pnpm run dev`

### 7.2 代码规范

- 使用ESLint + Prettier进行代码检查和格式化
- 组件命名采用PascalCase规范
- 路由命名采用kebab-case规范

### 7.3 提交规范

遵循Conventional Commits规范，提交信息格式为：

```
type(scope?): description

optional body

optional footer(s)
```

## 8. 部署流程

### 8.1 构建生产版本

```bash
pnpm run build
```

构建产物将输出到 `dist` 目录。

### 8.2 部署到服务器

1. 将 `dist` 目录下的文件上传到服务器
2. 配置Nginx或其他Web服务器
3. 启动Web服务器

## 9. 常见问题及解决方案

### 9.1 页面加载缓慢

- 检查网络连接
- 检查服务器响应时间
- 优化图片资源
- 使用CDN加速

### 9.2 登录失败

- 检查用户名和密码是否正确
- 检查账号是否被禁用
- 清除浏览器缓存

### 9.3 权限不足

- 检查当前用户角色是否具有相应权限
- 联系管理员分配权限

## 10. 联系方式

如有问题或建议，请联系：

- 项目负责人：XXX
- 邮箱：XXX@example.com
- 文档更新时间：2025-12-23