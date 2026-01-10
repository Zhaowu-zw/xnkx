/**
 * 路由配置说明：
 * 1. 所有组件均采用懒加载方式导入，提升首屏加载速度
 * 2. 按业务模块分组，提高可读性和维护性
 * 3. 组件命名采用 PascalCase 规范，路径采用 kebab-case 规范
 * 4. 统一添加 meta 信息，便于全局路由守卫和页面标题控制
 */
export const routes = [
    // 基础路由
    {
        path: '/',
        name: 'Layout',
        // 懒加载布局组件 - 添加webpackChunkName
        component: () => import(/* webpackChunkName: "layout" */ '@/views/layout/index.vue'),
        meta: { title: '首页' }
    },
    {
        path: '/login',
        name: 'Login',
        // 懒加载登录组件 - 添加webpackChunkName
        component: () => import(/* webpackChunkName: "login" */ '@/views/login/index.vue'),
        meta: { title: '登录', requiresAuth: false }
    },

    // 用户相关路由（分组管理）
    {
        path: '/user',
        meta: { title: '用户中心', requiresAuth: true },
        children: [
            {
                path: 'home',
                name: 'UserHome',
                component: () => import(/* webpackChunkName: "user-home" */ '@/views/userhome/index.vue'),
                meta: { title: '用户首页' }
            },
            {
                path: 'profile',
                name: 'UserProfile',
                component: () => import(/* webpackChunkName: "user-profile" */ '@/views/user/userProfile.vue'),
                meta: { title: '个人资料' }
            },
            {
                path: 'password',
                name: 'UserPassword',
                component: () => import(/* webpackChunkName: "user-password" */ '@/views/user/userPassword.vue'),
                meta: { title: '修改密码' }
            }
        ]
    },

    // 社团相关路由
    {
        path: '/club',
        meta: { title: '社团管理', requiresAuth: true },
        children: [
            {
                path: 'info',
                name: 'ClubInfo',
                component: () => import(/* webpackChunkName: "club-info" */ '@/views/clubinfo/index.vue'),
                meta: { title: '社团信息' }
            },
            {
                path: 'members',
                name: 'MemberShow',
                component: () => import(/* webpackChunkName: "member-show" */ '@/views/membershow/index.vue'),
                meta: { title: '成员展示' }
            },
            {
                path: 'recruit',
                name: 'Recruit',
                component: () => import(/* webpackChunkName: "recruit" */ '@/views/recruit/index.vue'),
                meta: { title: '社团招新' }
            }
        ]
    },

    // 活动相关路由
    {
        path: '/activity',
        meta: { title: '社团活动', requiresAuth: true },
        children: [
            {
                path: 'list',
                name: 'ActivityList',
                component: () => import(/* webpackChunkName: "activity-list" */ '@/views/activity/ActivityList.vue'),
                meta: { title: '所有社团动态' }
            },
            {
                path: 'detail/:id',
                name: 'ActivityDetail',
                component: () => import(/* webpackChunkName: "activity-detail" */ '@/views/activity/ActivityDetail.vue'),
                meta: { title: '动态详情' }
            }
        ]
    },
    
    // 成就相关路由
    {
        path: '/achievement',
        meta: { title: '成就详情', requiresAuth: false },
        children: [
            {
                path: ':id',
                name: 'AchievementDetail',
                component: () => import(/* webpackChunkName: "achievement-detail" */ '@/views/achievement/achievementDetail.vue'),
                meta: { title: '成就详情' }
            }
        ]
    },
    
    // 任务相关路由
    {
        path: '/task',
        meta: { title: '任务管理', requiresAuth: true },
        children: [
            {
                path: 'detail/:id',
                name: 'TaskDetail',
                component: () => import(/* webpackChunkName: "task-detail" */ '@/views/task/TaskDetail.vue'),
                meta: { title: '任务详情' }
            }
        ]
    },

    // 其他功能路由
    {
        path: '/feedback',
        name: 'Feedback',
        component: () => import(/* webpackChunkName: "feedback" */ '@/views/feedback/index.vue'),
        meta: { title: '意见反馈', requiresAuth: true }
    },
    {
        path: '/privacy-policy',
        name: 'PrivacyPolicy',
        component: () => import(/* webpackChunkName: "privacy-policy" */ '@/views/PrivacyPolicy/index.vue'),
        meta: { title: '隐私政策', requiresAuth: false }
    },
    {
        path: '/service-terms',
        name: 'ServiceTerms',
        component: () => import(/* webpackChunkName: "service-terms" */ '@/views/ServiceTerms/index.vue'),
        meta: { title: '服务条款', requiresAuth: false }
    },

    // 管理员后台路由（核心修正：子路由改为相对路径）
    {
        path: '/management',
        name:'Management',
        component: () => import(/* webpackChunkName: "management" */ '@/views/management/index.vue'),
        meta: { title: '管理员后台', requiresAuth: true, isAdmin: true },
        redirect: '/management/data-stat',
        children: [
            {
                path: 'data-stat',
                name: 'ManagerDataStat',
                component: () => import(/* webpackChunkName: "management-data-stat" */ '@/views/management/dataStatManagement/index.vue'), // 对应数据展示页面组件
                meta: { title: '数据统计', isAdmin: true, icon: 'DataBoard' } // 可加图标标识
            },
            {
                path: 'system',
                name: 'ManagerSystem',
                component: () => import(/* webpackChunkName: "management-system" */ '@/views/management/system/index.vue'), 
                meta: { title: '系统管理', isAdmin: true, icon: 'Setting' },
                redirect: 'user',
                children: [
                    { path: 'user', name: 'managementSystemUser', component: () => import(/* webpackChunkName: "management-system-user" */ '@/views/management/system/userManagement.vue'), meta: { title: '用户管理', isAdmin: true } },
                    { path: 'role', name: 'managementSystemRole', component: () => import(/* webpackChunkName: "management-system-role" */ '@/views/management/system/roleManagement.vue'), meta: { title: '角色管理', isAdmin: true } },
                    { path: 'group', name: 'managementSystemGroup', component: () => import(/* webpackChunkName: "management-system-group" */ '@/views/management/system/groupManagement.vue'), meta: { title: '小组管理', isAdmin: true } },
                ]
            },
            {
                path: 'approval',
                name: 'ManagerApproval',
                component: () => import(/* webpackChunkName: "management-approval" */ '@/views/management/approval/index.vue'),
                meta: { title: '审批管理', isAdmin: true, icon: 'Promotion' },
                redirect: 'recruit',
                children: [
                    { path: 'recruit', name: 'managementApprovalRecruit', component: () => import(/* webpackChunkName: "management-approval-recruit" */ '@/views/management/approval/approvalRecruit.vue'), meta: { title: '纳新审批', isAdmin: true } },
                    { path: 'permission', name: 'managementApprovalPermission', component: () => import(/* webpackChunkName: "management-approval-permission" */ '@/views/management/approval/approvalPermission.vue'), meta: { title: '权限交接审批', isAdmin: true } },
                ]
            },
            {
                path: 'business',
                name: 'ManagerBusiness',
                component: () => import(/* webpackChunkName: "management-business" */ '@/views/management/business/index.vue'),
                meta: { title: '业务管理', isAdmin: true, icon: 'Grid' },
                redirect: 'activity',
                children: [
                    { path: 'activity', name: 'managementBusinessActivity', component: () => import(/* webpackChunkName: "management-business-activity" */ '@/views/management/business/activityManagement.vue'), meta: { title: '社团动态', isAdmin: true } },
                    { path: 'achievement', name: 'managementBusinessAchievement', component: () => import(/* webpackChunkName: "management-business-achievement" */ '@/views/management/business/clubAchievementManagement.vue'), meta: { title: '社团成就', isAdmin: true } },
                    { path: 'group-achievement', name: 'managementBusinessGroupAchievement', component: () => import(/* webpackChunkName: "management-business-group-achievement" */ '@/views/management/business/groupAchievementManagement.vue'), meta: { title: '小组成果', isAdmin: true } },
                    { path: 'feedback', name: 'managementBusinessFeedback', component: () => import(/* webpackChunkName: "management-business-feedback" */ '@/views/management/business/feedbackManagement.vue'), meta: { title: '反馈信息', isAdmin: true } },
                    { path: 'task', name: 'managementBusinessTask', component: () => import(/* webpackChunkName: "management-business-task" */ '@/views/management/business/taskManagement.vue'), meta: { title: '任务管理', isAdmin: true } },
                ]
            }
        ]
    },

    // 404 路由（必须放在最后）
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import(/* webpackChunkName: "404" */ '@/views/404/index.vue'),
        meta: { title: '页面不存在' }
    }
]