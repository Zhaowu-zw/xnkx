# 社团管理系统 - 前端项目

## 项目简介

这是一个基于Vue 3开发的社团管理系统前端项目，提供了社团信息管理、成员管理、活动管理、任务管理、成就管理等功能，旨在帮助社团高效管理日常事务，提升社团运营效率。

## 技术栈

- **框架**: Vue 3 + Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **样式预处理器**: SCSS
- **HTTP客户端**: Axios
- **构建工具**: Vite
- **代码规范**: ESLint + Prettier
- **Git钩子**: Husky

## 项目结构

```
src/
├── api/             # API接口定义
├── assets/          # 静态资源（图片、视频、样式）
│   ├── images/      # 图片资源
│   ├── video/       # 视频资源
│   └── *.scss       # 样式文件
├── components/      # 通用组件
├── router/          # 路由配置
├── stores/          # Pinia状态管理
├── utils/           # 工具函数
├── views/           # 页面组件
├── App.vue          # 根组件
└── main.js          # 入口文件
```

## 主要功能

1. **用户管理**
   - 用户登录/注册
   - 个人信息管理
   - 密码修改

2. **社团管理**
   - 社团信息展示
   - 成员展示
   - 社团招新

3. **活动管理**
   - 活动列表
   - 活动详情
   - 活动参与

4. **任务管理**
   - 任务详情
   - 任务提交

5. **成就管理**
   - 社团成就
   - 小组成就

6. **管理员后台**
   - 数据统计
   - 系统管理（用户、角色、小组）
   - 审批管理
   - 业务管理

## 安装和运行

### 环境要求

- Node.js >= 20.19.0
- pnpm >= 10.0.0

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm run dev
```

访问地址：http://localhost:5173

### 构建生产版本

```bash
pnpm run build
```

构建产物将输出到 `dist` 目录。

### 预览生产版本

```bash
pnpm run preview
```

## 开发规范

1. **代码风格**: 使用 ESLint + Prettier 进行代码检查和格式化
2. **组件命名**: 采用 PascalCase 命名规范
3. **路由命名**: 采用 kebab-case 命名规范
4. **Git提交**: 遵循 Conventional Commits 规范
5. **CSS规范**: 采用 BEM 命名规范

## 许可证

MIT