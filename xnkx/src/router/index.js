// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes.js'
// 导入用户状态管理（用于路由守卫）
import  useUserStore  from '@/stores/user.js'
import { reportAccess } from '@/api/access.js'
import { debounce } from 'lodash';

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 优化滚动行为，提升用户体验
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})




// 可选：全局路由守卫（权限验证 + 页面标题设置）
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // 权限验证逻辑
  const userStore = useUserStore()
  

  
  // 2. 检查是否为后台页面（isAdmin为true的页面）
  if (to.meta.isAdmin === true) {
    // 允许进入后台的角色列表
    const allowedRoles = ['管理员', '指导老师', '社长']
    
    // 获取用户角色名称
    const userRole = userStore.role_name
    
    // 检查用户角色是否在允许列表中
    if (!allowedRoles.includes(userRole)) {
      // 角色不允许，跳转到404页面
      next('/404')
      return
    }
  }
  
  // 3. 所有验证通过，放行
  next()
})

// 封装防抖后的埋点函数
const debounceReportAccess = debounce(async (data) => {
  await reportAccess(data);
}, 500); // 500ms内只上报一次

// 路由守卫：每次路由跳转完成后上报埋点
router.afterEach(async (to) => {
  try {
    const userStore = useUserStore();
    const userId = userStore.userInfo?.id ? String(userStore.userInfo.id) : '';

    // 构造埋点参数（从路由meta中获取页面名称）
    const accessData = {
      pagePath: to.path,        // 跳转后的页面路径（如 /statistics）
      pageName: to.meta.title || '未知页面', // 页面名称（从路由meta取）
      userId: userId,
      accessTime: new Date()
    };

    // 调用防抖处理后的埋点接口
    debounceReportAccess(accessData);
  } catch (error) {
    console.error('路由埋点上报失败：', error);
  }
});



export default router