<template>
    <div class="manager-layout">
        <!-- 侧边栏 -->
        <aside class="manager-sidebar" :class="{ 'sidebar-dark': themeStore.isDark }"
            :style="{ width: isCollapse ? '64px' : '220px' }">
            <div class="sidebar-logo" :style="{ justifyContent: isCollapse ? 'center' : 'flex-start' }">
                <img src="../../assets/images/logo.png" alt="后台管理" class="logo-img" />
            </div>

            <el-menu :default-active="activeMenu" class="manager-menu" :background-color="themeStore.isDark ? '#1f2937' : '#fff'"
                :text-color="themeStore.isDark ? '#e5e7eb' : '#374151'" active-text-color="#409eff" :collapse="isCollapse"
                collapse-transition @select="handleMenuSelect" @open="handleSubMenuOpen">
                <!-- 动态生成菜单 -->
                <template v-for="menu in menus" :key="menu.index">
                    <!-- 无子菜单的菜单项 -->
                    <el-menu-item v-if="menu.children.length === 0" :index="menu.index">
                        <el-icon class="menu-icon">
                            <component :is="iconMap[menu.icon] || DataBoard" />
                        </el-icon>
                        <template v-slot:title><span>{{ menu.title }}</span></template>
                    </el-menu-item>
                    
                    <!-- 有子菜单的菜单项 -->
                    <el-sub-menu v-else :index="menu.index">
                        <template v-slot:title>
                            <el-icon class="menu-icon">
                                <component :is="iconMap[menu.icon] || DataBoard" />
                            </el-icon>
                            <span>{{ menu.title }}</span>
                        </template>
                        <el-menu-item v-for="subMenu in menu.children" :key="subMenu.index" :index="subMenu.index">
                            {{ subMenu.title }}
                        </el-menu-item>
                    </el-sub-menu>
                </template>
            </el-menu>
        </aside>

        <!-- 主体区域 -->
        <div class="manager-body" :class="{ 'dark-theme': themeStore.isDark }">
            <header class="manager-header">
                <div class="header-inner">
                    <div class="header-left">
                        <el-button circle :icon="Fold" class="collapse-btn" size="large" @click="toggleCollapse"
                            title="折叠/展开菜单" />
                        <div class="logo" v-show="isCollapse">
                            <span class="logo-text">后台管理系统</span>
                        </div>
                    </div>

                    <div class="header-actions">
                        <div class="action-buttons">
                            <!-- 刷新按钮：添加加载状态，防止重复点击 -->
                            <el-button circle :icon="refreshLoading ? Loading : Refresh" size="large"
                                class="transparent-btn" @click="refreshPage" :loading="refreshLoading"
                                :disabled="refreshLoading" title="刷新当前页面" />
                            <el-button circle :icon="themeStore.isDark ? Sunny : Moon" size="large" class="transparent-btn"
                                @click="themeStore.toggleTheme" title="切换背景深浅" />
                            <el-button circle :icon="isFullscreen ? FullScreen : FullScreen" size="large"
                                class="transparent-btn" @click="toggleFullscreen" title="全屏/退出全屏" />
                        </div>

                        <el-dropdown @command="handleCommand" placement="bottom-end">
                            <span class="el-dropdown__box user-dropdown">
                                <el-avatar :src="userStore.userInfo.avatar || avatar" />
                                <span class="user-name">
                                    {{ userStore.userInfo.nickname || userStore.userInfo.user?.username || '管理员' }}
                                </span>
                                <el-icon class="caret-icon">
                                    <CaretBottom />
                                </el-icon>
                            </span>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="frontend" :icon="House">返回官网</el-dropdown-item>
                                    <el-dropdown-item command="profile" :icon="Crop">更改用户信息</el-dropdown-item>
                                    <el-dropdown-item command="password" :icon="EditPen">重置密码</el-dropdown-item>
                                    <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                </div>
            </header>

            <main class="manager-content">
                <el-breadcrumb class="breadcrumb" separator="/">
                    <el-breadcrumb-item :to="{ path: '/management/data-stat' }">首页</el-breadcrumb-item>
                    <el-breadcrumb-item v-for="(item, index) in breadcrumbList" :key="index">
                        {{ item }}
                    </el-breadcrumb-item>
                </el-breadcrumb>

                <div class="content-wrapper">
                    <!-- 关键修改1：router-view 直接绑定，移除外层 component 包装 -->
                    <!-- 关键修改2：给 router-view 绑定唯一 key（基于路由全路径），适配嵌套路由 -->
                    <router-view v-slot="{ Component }" :key="route.fullPath + '-' + refreshKey">
                        <transition name="router-refresh" mode="out-in" duration="500">
                            <component :is="Component" />
                        </transition>
                    </router-view>
                </div>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import useUserStore from '@/stores/user'
import avatar from '@/assets/images/default.png'
// 导入路由配置
import { routes } from '@/router/routes'
// 新增Loading图标，用于刷新加载状态
import {
    CaretBottom, Crop, EditPen, SwitchButton, House, Refresh, Sunny, Moon, FullScreen,
    DataBoard, Setting, Promotion, Grid, Fold, Loading
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

// 状态管理
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// 导入主题store
import useThemeStore from '@/stores/theme'

// 响应式数据
const themeStore = useThemeStore()
const isFullscreen = ref(false)
const isCollapse = ref(false)
let fullscreenChangeHandler = null
const refreshLoading = ref(false) // 刷新加载状态，防止重复点击
const refreshKey = ref(0) // 用于控制组件卸载和重新挂载的key值

// 图标映射
const iconMap = {
    DataBoard,
    Setting,
    Promotion,
    Grid
}

// 从路由配置生成动态菜单
const generateMenus = () => {
    // 找到管理后台路由
    const managementRoute = routes.find(route => route.path === '/management')
    if (!managementRoute || !managementRoute.children) return []
    
    // 生成菜单数据
    const menuData = []
    managementRoute.children.forEach((child, index) => {
        const menuItem = {
            index: (index + 1).toString(),
            path: `/management${child.path.startsWith('/') ? '' : '/'}${child.path}`,
            title: child.meta.title,
            icon: child.meta.icon || 'DataBoard',
            children: []
        }
        
        // 处理子路由
        if (child.children && child.children.length > 0) {
            child.children.forEach((subChild, subIndex) => {
                menuItem.children.push({
                    index: `${index + 1}-${subIndex + 1}`,
                    path: `${menuItem.path}${subChild.path.startsWith('/') ? '' : '/'}${subChild.path}`,
                    title: subChild.meta.title
                })
            })
        }
        
        menuData.push(menuItem)
    })
    
    return menuData
}

// 初始化菜单数据
const menus = ref(generateMenus())

// 预生成并缓存菜单映射，避免每次计算都重新生成
const menuIndexToPathMap = ref({})
const parentMenuToFirstChildMap = ref({})

// 生成并缓存菜单映射
const generateMenuMaps = () => {
    const indexToPath = {}
    const parentToFirstChild = {}
    
    menus.value.forEach(menu => {
        // 无子菜单的情况
        if (menu.children.length === 0) {
            indexToPath[menu.index] = menu.path
        } else {
            // 有子菜单的情况
            parentToFirstChild[menu.index] = menu.children[0].path
            menu.children.forEach(child => {
                indexToPath[child.index] = child.path
            })
        }
    })
    
    menuIndexToPathMap.value = indexToPath
    parentMenuToFirstChildMap.value = parentToFirstChild
}

// 初始化生成菜单映射
generateMenuMaps()

// 计算属性 - 优化：使用缓存的映射表
const activeMenu = computed(() => {
    const path = route.path
    const pathToIndex = Object.entries(menuIndexToPathMap.value).find(([, val]) => val === path)
    return pathToIndex ? pathToIndex[0] : '1'
})

// 动态生成面包屑 - 优化：使用缓存的菜单数据，避免重复遍历
const breadcrumbList = computed(() => {
    const path = route.path
    const breadcrumb = ['数据统计'] // 默认面包屑
    
    // 从菜单数据中查找当前路径的面包屑
    for (const menu of menus.value) {
        // 检查是否是一级菜单
        if (menu.path === path && menu.children.length === 0) {
            breadcrumb[0] = menu.title
            break
        }
        
        // 检查是否是二级菜单
        for (const subMenu of menu.children) {
            if (subMenu.path === path) {
                breadcrumb[0] = menu.title
                breadcrumb[1] = subMenu.title
                break
            }
        }
    }
    
    return breadcrumb
})

// 刷新页面逻辑 - 优化：简化逻辑，减少不必要的路由操作
const refreshPage = () => {
    if (refreshLoading.value) return

    try {
        refreshLoading.value = true
        // 直接更新 refreshKey 触发组件重新挂载，无需重新路由匹配
        refreshKey.value = Date.now()
        ElMessage.success('页面已刷新')
    } catch (error) {
        ElMessage.error(`页面刷新失败：${error.message || '未知错误'}`)
        console.error('刷新异常：', error)
    } finally {
        // 缩短动画时间，提高响应速度
        setTimeout(() => {
            refreshLoading.value = false
        }, 200)
    }
}

// 其他方法 - 优化：使用缓存的映射表
const handleMenuSelect = (index) => {
    const targetPath = menuIndexToPathMap.value[index]
    if (targetPath && targetPath !== route.path) {
        router.push(targetPath)
    }
}

const handleSubMenuOpen = (index) => {
    const targetPath = parentMenuToFirstChildMap.value[index]
    if (targetPath && targetPath !== route.path) {
        router.push(targetPath)
    }
}
const handleCommand = async (cmd) => {
    switch (cmd) {
        case 'frontend':
            router.push('/')
            ElMessage.success('已返回前台')
            break
        case 'logout':
            await ElMessageBox.confirm('你确认要退出登录吗？', '提示', {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'warning'
            })
            userStore.logout()
            ElMessage.success('已退出')
            router.push('/')
            break
        case 'profile':
           router.push('/user/profile')
            break
        case 'password':
            router.push('/user/password')
            break
        default:
            break
    }
}

const toggleFullscreen = () => {
    const docEl = document.documentElement
    if (!document.fullscreenElement) {
        docEl.requestFullscreen().catch(err => {
            ElMessage.error('全屏切换失败：' + err.message)
        })
    } else {
        document.exitFullscreen()
    }
}
const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
}

watch(() => route.fullPath, () => {
    refreshLoading.value = false
}, { immediate: true, flush: 'sync' }) // flush: 'sync' 确保同步重置，避免渲染延迟


// 全屏状态监听
fullscreenChangeHandler = () => {
    isFullscreen.value = !!document.fullscreenElement
}
onMounted(() => {
    document.addEventListener('fullscreenchange', fullscreenChangeHandler)
})
onUnmounted(() => {
    document.removeEventListener('fullscreenchange', fullscreenChangeHandler)
})
</script>

<style scoped lang="scss">
// 全局样式重置
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html,
body,
.manager-layout {
    height: 100%;
    width: 100%;
    overflow: hidden;
    display: flex;
}

// 主题色变量
$primary-color: #163a63;
$primary-light: #409eff;
$dark-bg: #1f2937;
$dark-bg-light: #2d3748;
$dark-bg-lighter: #4a5568;
$dark-text: #e5e7eb;
$dark-text-light: #cbd5e0;
$light-bg: #fff;
$light-bg-light: #f8f9fa;
$light-text: #374151;

// 侧边栏样式
.manager-sidebar {
    height: 100vh;
    background: $light-bg;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    transition: width 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    z-index: 20;

    &.sidebar-dark {
        background: $dark-bg;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

        .sidebar-logo {
            border-bottom-color: rgba(255, 255, 255, 0.1);
        }
    }

    .sidebar-logo {
        display: flex;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #f0f0f0;
        transition: border-color 0.3s ease;

        .logo-img {
            height: 50px;
            width: auto;
            margin-right: 10px;
        }
    }

    .manager-menu {
        flex: 1;
        border-right: none;
        height: 100%;

        :deep(.menu-icon) {
            font-size: 18px;
            display: inline-block !important;
        }

        :deep(.el-menu-item),
        :deep(.el-sub-menu__title) {
            padding: 0 20px !important;
            height: 56px !important;
            line-height: 56px !important;
            cursor: pointer;
        }

        :deep(.el-sub-menu .el-menu-item) {
            padding-left: 40px !important;
            justify-content: flex-start;
        }

        :deep(.el-sub-menu__title) {
            font-weight: 600;
            justify-content: flex-start;
        }

        &.el-menu--collapse {
            :deep(.el-sub-menu__title) {
                justify-content: center;
            }
        }

        :deep(.el-menu-item:hover),
        :deep(.el-sub-menu__title:hover) {
            background-color: rgba($primary-light, 0.1) !important;
        }
    }
}

// 主体区域
.manager-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    transition: background-color 0.3s ease;
    background: $light-bg;
    overflow: hidden; /* 防止内容溢出导致页面无法收缩 */

    &.dark-theme {
        background: $dark-bg;

        .manager-header {
            background: $dark-bg;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .manager-content {
            background: $dark-bg;

            .breadcrumb {
                background: $dark-bg-light;
                color: $dark-text;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                border-radius: 8px;

                :deep(.el-breadcrumb__item__link) {
                    color: $dark-text !important;
                }
            }

            .content-wrapper {
                background: $dark-bg-light;
                color: $dark-text;
            }

            // 深色主题下的加载遮罩适配
            .refresh-loading-mask {
                background: rgba(31, 41, 55, 0.8) !important;
            }
        }
        
        // 深色主题下的下拉菜单样式
        :deep(.el-dropdown-menu) {
            background-color: $dark-bg !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
            
            .el-dropdown-item {
                color: $dark-text !important;
                
                &:hover {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                }
                
                &:focus {
                    background-color: rgba(64, 158, 255, 0.2) !important;
                }
            }
        }
        
        // 深色主题下的弹出框样式
        :deep(.el-message-box) {
            background-color: $dark-bg !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            color: $dark-text !important;
            
            .el-message-box__header {
                border-bottom-color: rgba(255, 255, 255, 0.1) !important;
            }
        }
        
        // 深色主题下的按钮样式
        :deep(.el-button) {
            &:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger) {
                background-color: $dark-bg !important;
                border-color: rgba(255, 255, 255, 0.1) !important;
                color: $dark-text !important;
                
                &:hover {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                    border-color: rgba(255, 255, 255, 0.2) !important;
                }
                
                &:active {
                    background-color: rgba(255, 255, 255, 0.2) !important;
                }
            }
        }
        
        // 深色主题下的输入框样式
        :deep(.el-input__wrapper) {
            background-color: $dark-bg !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            box-shadow: none !important;
            
            &:hover {
                border-color: rgba(255, 255, 255, 0.2) !important;
            }
            
            &.is-focus {
                border-color: $primary-light !important;
            }
            
            .el-input__inner {
                color: $dark-text !important;
            }
            
            .el-input__placeholder {
                color: rgba(255, 255, 255, 0.5) !important;
            }
        }
        
        // 深色主题下的选择器样式
        :deep(.el-select__wrapper) {
            background-color: $dark-bg !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            box-shadow: none !important;
            
            &:hover {
                border-color: rgba(255, 255, 255, 0.2) !important;
            }
            
            &.is-focus {
                border-color: $primary-light !important;
            }
            
            .el-select__input {
                color: $dark-text !important;
            }
            
            .el-select__placeholder {
                color: rgba(255, 255, 255, 0.5) !important;
            }
            
            .el-select__caret {
                color: rgba(255, 255, 255, 0.5) !important;
            }
        }
        
        // 深色主题下的选择器下拉菜单
        :deep(.el-select-dropdown) {
            background-color: $dark-bg !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
            
            .el-select-dropdown__item {
                color: $dark-text !important;
                
                &:hover {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                }
                
                &.selected {
                    background-color: rgba(64, 158, 255, 0.2) !important;
                }
            }
        }
        
        // 深色主题下的分页样式
        :deep(.el-pagination) {
            color: $dark-text !important;
            background-color: $dark-bg-light !important;
            padding: 12px 16px !important;
            border-radius: 8px !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
            margin: 8px 0 !important;
            
            .el-pagination__prev,
            .el-pagination__next,
            .el-pagination__sizes,
            .el-pagination__jump {
                color: $dark-text !important;
            }
            
            .el-pagination__total {
                color: $dark-text-light !important;
            }
            
            .el-pagination__button {
                background-color: $dark-bg !important;
                border-color: rgba(255, 255, 255, 0.1) !important;
                color: $dark-text !important;
                
                &:hover {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                    border-color: rgba(255, 255, 255, 0.2) !important;
                }
            }
            
            .el-pagination__active .el-pagination__button {
                background-color: $primary-light !important;
                border-color: $primary-light !important;
                color: #fff !important;
            }
            
            // 分页输入框样式
            .el-pagination__jump {
                :deep(.el-input__wrapper) {
                    background-color: $dark-bg !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                    
                    :deep(.el-input__inner) {
                        color: $dark-text !important;
                    }
                }
            }
            
            // 分页选择器样式
            .el-pagination__sizes {
                :deep(.el-select__wrapper) {
                    background-color: $dark-bg !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                    
                    :deep(.el-select__input) {
                        color: $dark-text !important;
                    }
                }
            }
            
            // 分页主体样式
            :deep(.el-pagination) {
                color: $dark-text !important;
                
                .el-pager {
                    li {
                        background-color: $dark-bg !important;
                        border-color: rgba(255, 255, 255, 0.1) !important;
                        color: $dark-text !important;
                        
                        &:hover {
                            color: $primary-light !important;
                        }
                        
                        &.active {
                            background-color: $primary-light !important;
                            color: #fff !important;
                        }
                    }
                }
                
                // 分页按钮样式
                .el-pagination__prev,
                .el-pagination__next,
                .el-pagination__jump-prev,
                .el-pagination__jump-next {
                    background-color: $dark-bg !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                    color: $dark-text !important;
                    
                    &:hover {
                        color: $primary-light !important;
                    }
                }
                
                // 分页输入框样式
                .el-pagination__editor {
                    background-color: $dark-bg !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                    
                    :deep(.el-input__inner) {
                        background-color: $dark-bg !important;
                        border-color: transparent !important;
                        color: $dark-text !important;
                    }
                }
            }
        }
        
        // 深色主题下的卡片样式
        :deep(.el-card) {
            background-color: $dark-bg !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            color: $dark-text !important;
            
            .el-card__header {
                background-color: rgba(255, 255, 255, 0.05) !important;
                border-bottom-color: rgba(255, 255, 255, 0.1) !important;
            }
            
            .el-card__body {
                color: $dark-text !important;
            }
        }
        
        // 深色主题下的表格样式
        :deep(.el-table) {
            background-color: $dark-bg !important;
            color: $dark-text !important;
            
            .el-table__header-wrapper {
                background-color: $dark-bg !important;
            }
            
            .el-table__header-wrapper th {
                background-color: $dark-bg !important;
                color: $dark-text-light !important;
                border-bottom-color: rgba(255, 255, 255, 0.1) !important;
                font-weight: 500 !important;
            }
            
            .el-table__body-wrapper td {
                background-color: $dark-bg !important;
                color: $dark-text !important;
                border-bottom-color: rgba(255, 255, 255, 0.05) !important;
            }
            
            .el-table__body-wrapper tr:hover td {
                background-color: rgba(255, 255, 255, 0.03) !important;
            }
            
            .el-table__empty-text {
                color: $dark-text !important;
            }
        }
        
        // 深色主题下的抽屉样式
        :deep(.el-drawer) {
            background-color: $dark-bg !important;
            color: $dark-text !important;
            
            .el-drawer__header {
                border-bottom-color: rgba(255, 255, 255, 0.1) !important;
            }
        }
        
        // 深色主题下的表单样式
        :deep(.el-form-item) {
            .el-form-item__label {
                color: $dark-text !important;
            }
        }
        
        // 深色主题下的加载样式
        :deep(.el-loading-mask) {
            background-color: rgba(31, 41, 55, 0.8) !important;
            
            .el-loading-text {
                color: $dark-text !important;
            }
        }
        
        // 深色主题下的面包屑样式
        :deep(.el-breadcrumb) {
            color: $dark-text !important;
            
            .el-breadcrumb__item__link {
                color: $dark-text !important;
            }
            
            .el-breadcrumb__item__separator {
                color: rgba(255, 255, 255, 0.5) !important;
            }
        }
        
        // 深色主题下的标签样式
        :deep(.el-tag) {
            background-color: rgba(255, 255, 255, 0.1) !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            color: $dark-text !important;
            
            &.el-tag--primary {
                background-color: $primary-light !important;
                border-color: $primary-light !important;
                color: #fff !important;
            }
            
            &.el-tag--success {
                background-color: #67c23a !important;
                border-color: #67c23a !important;
                color: #fff !important;
            }
            
            &.el-tag--warning {
                background-color: #e6a23c !important;
                border-color: #e6a23c !important;
                color: #fff !important;
            }
            
            &.el-tag--danger {
                background-color: #f56c6c !important;
                border-color: #f56c6c !important;
                color: #fff !important;
            }
        }
        
        // 深色主题下的分页容器样式
        :deep(.pagination-wrapper) {
            background-color: $dark-bg-light !important;
            border-top-color: rgba(255, 255, 255, 0.1) !important;
            border-radius: 8px !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
            margin: 8px 0 !important;
            padding: 12px 16px !important;
            
            :deep(.el-pagination) {
                background-color: transparent !important;
                color: $dark-text !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
            }
        }
        
        // 深色主题下业务管理模块的样式
        :deep(.business-management-animation) {
            background-color: $dark-bg-light !important;
            color: $dark-text !important;
        }
        
        // 业务管理模块搜索卡片样式
        :deep(.search-card) {
            background-color: $dark-bg-light !important;
            color: $dark-text !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
            
            :deep(.el-card__body) {
                background-color: $dark-bg-light !important;
            }
        }
        
        // 业务管理模块表格卡片样式
        :deep(.table-card) {
            background-color: $dark-bg-light !important;
            color: $dark-text !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
            
            :deep(.el-card__body) {
                background-color: $dark-bg-light !important;
            }
        }
        
        // 业务管理模块分页容器样式
        :deep(.pagination-container) {
            background-color: $dark-bg-light !important;
            border-top-color: rgba(255, 255, 255, 0.1) !important;
            border-radius: 8px !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
            margin: 8px 0 !important;
            padding: 12px 16px !important;
            
            :deep(.el-pagination) {
                background-color: transparent !important;
                color: $dark-text !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
            }
        }
    }
    
    // 确保子页面容器能够继承父容器的宽度
    & > * {
        width: 100%;
        box-sizing: border-box;
    }
}

// 内容区域
.manager-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: $light-bg;
    transition: background-color 0.3s ease;
    padding: 16px;
    box-sizing: border-box;
    overflow-x: hidden; /* 防止水平滚动条导致页面无法收缩 */
    max-height: calc(100vh - 64px); /* 与菜单栏高度对齐，减去头部高度 */
    height: 100%;

    .content-wrapper {
        flex: 1;
        padding: 16px 20px;
        background: $light-bg;
        border-radius: 8px;
        box-sizing: border-box;
        transition: background-color 0.3s ease, color 0.3s ease;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: 100%;
    }
    
    // 确保所有子页面都能正确响应侧边栏折叠
    :deep(.manager-page),
    :deep(.activity-content),
    :deep(.data-stat-container),
    :deep(.system-management-page),
    :deep(.user-management-page),
    :deep(.role-management-page),
    :deep(.group-management-page) {
        box-sizing: border-box !important;
        min-height: auto !important;
        height: 100% !important;
        max-height: calc(100% - 40px) !important; /* 与内容区域高度对齐 */
        overflow: auto !important;
        padding: 16px !important;
        width: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
    }
    
    // 确保所有卡片容器都能正确收缩
    :deep(.table-wrapper) {
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: auto !important;
    }
    
    :deep(.el-table) {
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: auto !important;
        max-height: none !important;
        height: auto !important;
    }
    
    // 确保所有搜索栏和表格卡片都能正确收缩
    :deep(.search-card),
    :deep(.table-card),
    :deep(.search-bar),
    :deep(.pagination-wrapper) {
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    }
    
    // 确保所有el-card组件高度正确，根据内容自适应
    :deep(.el-card) {
        max-height: none !important;
        height: auto !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        
        :deep(.el-card__body) {
            overflow: auto !important;
            flex: none !important;
        }
    }
    
    // 确保所有el-form组件高度正确
    :deep(.el-form) {
        max-height: none !important;
        height: auto !important;
        overflow: auto !important;
    }
}

// 头部样式
.manager-header {
    height: 64px;
    width: 100%;
    background: $primary-color;
    color: #fff;
    display: flex;
    align-items: center;
    z-index: 10;
    padding: 0 20px;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);

    .header-inner {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .collapse-btn {
            background: transparent;
            color: #fff;
            border: none;
            transition: background-color 0.2s ease;

            &:hover {
                background: rgba(255, 255, 255, 0.1);
            }
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 18px;
            font-weight: 700;

            .logo-text {
                white-space: nowrap;
            }
        }
    }

    .header-actions {
        display: flex;
        gap: 16px;
        align-items: center;

        .action-buttons {
            display: flex;
            gap: 8px;

            .transparent-btn {
                background: transparent;
                color: #fff;
                border: none;
                transition: all 0.2s ease;
                border-radius: 6px;

                &:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: scale(1.05);
                }

                &:active {
                    transform: scale(0.95);
                }
            }
        }

        .user-dropdown {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: #fff;

            .user-name {
                max-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .caret-icon {
                font-size: 14px;
            }
        }
    }
}

// 内容区域
.manager-content {
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
    background: $light-bg;
    transition: background-color 0.3s ease;
    min-height: calc(100vh - 120px);
    padding: 16px;
    box-sizing: border-box;
    width: auto; /* 移除固定宽度，让flex布局自动计算 */

    .breadcrumb {
        padding: 16px 20px;
        background: $light-bg;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        width: 100%;
        transition: all 0.3s ease;
        margin-bottom: 16px;
    }

    .content-wrapper {
        flex: 1;
        padding: 16px 20px;
        background: $light-bg;
        min-height: calc(100vh - 180px);
        border-radius: 8px;
        box-sizing: border-box;
        transition: background-color 0.3s ease, color 0.3s ease;
        // 相对定位：为加载遮罩提供定位容器
        position: relative;
        width: auto; /* 移除固定宽度，让flex布局自动计算 */
        overflow: hidden; /* 防止内容溢出导致页面无法收缩 */
    }

    // 刷新加载遮罩样式
    .refresh-loading-mask {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        z-index: 999;
        display: flex;
        justify-content: center;
        align-items: center;
    }
}

// 过渡动画 - 页面切换
.router-fade-enter-from {
    opacity: 0;
    transform: translateX(10px);
}

.router-fade-leave-to {
    opacity: 0;
    transform: translateX(-10px);
}

.router-fade-enter-active,
.router-fade-leave-active {
    transition: all 0.3s ease;
}

// 过渡动画 - 刷新效果
.router-refresh-enter-from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
    filter: blur(3px);
}

.router-refresh-leave-to {
    opacity: 0;
    transform: scale(1.05) translateY(-10px);
    filter: blur(3px);
}

.router-refresh-enter-active {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.router-refresh-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// 按钮样式
:deep(.action-buttons .transparent-btn) {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.collapse-btn) {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.action-buttons .transparent-btn .el-icon),
:deep(.collapse-btn .el-icon) {
    font-size: 20px;
}

// 响应式适配
@media (max-width: 768px) {
    .manager-layout {
        flex-direction: column;
    }

    .manager-sidebar {
        width: 100% !important;
        height: auto;
        max-height: 400px;
    }

    .manager-body {
        height: calc(100vh - 400px);
    }

    .manager-header .header-left .logo .logo-text {
        display: none;
    }

    :deep(.action-buttons .transparent-btn),
    :deep(.collapse-btn) {
        width: 16px;
        height: 16px;
    }

    :deep(.action-buttons .transparent-btn .el-icon),
    :deep(.collapse-btn .el-icon) {
        font-size: 10px;
    }
}
</style>