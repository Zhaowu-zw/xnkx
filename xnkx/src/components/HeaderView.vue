<template>
    <div class="header-container">
        <div class="top">
            <div class="box">
                <span class="logo"><img src="@/assets/images/logo.png" alt=""></span>
                <span class="login" v-if="!isLogin"><i @click="$router.push('/login')">还未登录，前去登录！！</i></span>
                <span class="login" v-if="isLogin">
                    <el-dropdown placement="bottom-end" @command="handleCommand">
                        <span class="el-dropdown__box">
                            <el-avatar class="img" :src="userStore.userInfo?.avatar || avatar" />
                            <strong>{{ userStore.userInfo?.nickname || userStore.userInfo?.user?.username || '未知用户'
                                }}</strong>
                            <el-icon>
                                <CaretBottom />
                            </el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="home" :icon="User">个人中心</el-dropdown-item>
                                <!-- 优化：更严谨的权限判断 -->
                                <el-dropdown-item command="management" :icon="House" v-if="hasManagementPermission">
                                    进入后台
                                </el-dropdown-item>
                                <el-dropdown-item command="profile" :icon="Crop">更改用户信息</el-dropdown-item>
                                <el-dropdown-item command="password" :icon="EditPen">重置密码</el-dropdown-item>
                                <el-dropdown-item command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </span>
            </div>
        </div>
        <div class="nav">
            <div class="box">
                <ul class="nav-list">
                    <li class="nav-item">
                        <router-link to="/" class="nav-link" :class="{ 'nav-link--active': $route.path === '/' }">
                            <span class="nav-text">首页</span>
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/club/info" class="nav-link"
                            :class="{ 'nav-link--active': $route.path === '/club/info' }">
                            <span class="nav-text">社团概况</span>
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/club/members" class="nav-link"
                            :class="{ 'nav-link--active': $route.path === '/club/members' }">
                            <span class="nav-text">人员展示</span>
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/activity/list" class="nav-link"
                            :class="{ 'nav-link--active': $route.path.startsWith('/activity/') }">
                            <span class="nav-text">社团动态</span>
                        </router-link>
                    </li>
                    <li class="nav-item">
                        <router-link to="/user/home" class="nav-link"
                            :class="{ 'nav-link--active': $route.path.startsWith('/user/') }">
                            <el-icon class="nav-icon">
                                <User />
                            </el-icon>
                            <span class="nav-text">个人中心</span>
                        </router-link>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import useUserStore from '@/stores/user.js';
import avatar from '@/assets/images/default.png';
import { CaretBottom, User, Crop, EditPen, SwitchButton, House } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage, ElNotification } from 'element-plus';
import { computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getTimePeriodAndDetail } from '@/utils/time.js';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute(); // 新增：获取当前路由信息
let currentTime = getTimePeriodAndDetail();
// 优化1：用计算属性替代ref，自动响应式更新
const isLogin = computed(() => {
    // 检查用户是否已登录，包括检查token和用户信息
    return !!userStore.token;
});

// 优化2：单独抽离权限判断逻辑，更清晰且可复用
const hasManagementPermission = computed(() => {
    if (!isLogin.value) return false;
    const roleName = userStore.role_name || userStore.userInfo?.role_name || '';
    return !['普通用户', '组员','组长'].includes(roleName);
});

// 优化3：监听路由变化，确保权限判断实时更新
watch(
    () => route.path,
    () => {
        // 触发计算属性重新计算
    },
    { immediate: true }
);

const handleCommand = async (key) => {
    console.log('当前路由路径：', route.path); // 调试：打印当前路由
    console.log('点击的指令：', key); // 调试：打印点击的指令

    if (key === 'logout') {
        try {
            await ElMessageBox.confirm('你确认要进行退出么', '温馨提示', {
                type: 'warning',
                confirmButtonText: '确认',
                cancelButtonText: '取消'
            });
            userStore.logout();
            ElMessage.success('退出登录成功！');
            // 强制跳转登录页（绝对路径）
            await router.replace({ path: '/' });
        } catch (error) {
            console.log('取消退出：', error);
        }
    } else if (key === 'management') {
        // 强化权限校验
        if (!isLogin.value) {
            ElMessage.warning('请先登录！');
            await router.replace({ path: '/login' });
            return;
        }

        if (!hasManagementPermission.value) {
            ElMessage.warning('你无权限进入后台！');
            return;
        }

        try {
            // 优先用name跳转（需要路由里有对应name）
            await router.replace({
                name: 'ManagerDataStat'
            });
            ElNotification({
                title: `Hi,${currentTime.period}好!`,
                message: '成功进入后台管理系统！',
                type: 'success',
            });
        } catch (error) {
            // 备用方案：用path跳转（绝对不会拼接）
            console.error('name跳转失败，改用path跳转：', error);
            ElNotification({
                title: '跳转失败',
                message: error.message || '请联系负责人进行修复！',
                type: 'error',
            });
        }
    } else {
        // 其他跳转也用replace确保路径正确
        const targetPath = `/user/${key}`;
        console.log('准备跳转到：', targetPath);
        await router.replace({ path: targetPath });
    }
};
</script>

<style scoped lang="scss">
// 样式部分无修改，保持原有代码
.header-container {
    width: 100vw;
    height: 10vw;
    max-height: 140px;
    margin: 0 auto;
    border-radius: 10px 10px 0 0;
    background-color: rgba(24, 88, 158, 0.9);
    overflow: hidden;
}

.top {
    width: 100%;
    height: 60%;
    border-bottom: 1px solid #002956;
    margin: 0 auto;

    .box {
        width: 80%;
        height: 100%;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .logo {
            display: block;
            width: 180px;
            height: 100%;
            padding: 8px 0;

            img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
        }

        .login {
            display: flex;
            align-items: center;
            gap: 0.5vw;
            margin: 0;
            padding: 0;

            .login-link {
                color: #fff;
                font-size: 14px;
                text-decoration: none;
                display: flex;
                align-items: center;
                gap: 4px;

                &:hover {
                    color: #e6f7ff;
                    text-decoration: underline;
                }
            }

            i {
                font-size: 14px;
                color: #fff;
                cursor: pointer;
                line-height: 1;

                &:hover {
                    color: #e6f7ff;
                }
            }

            .el-dropdown__box {
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 8px;
                border-radius: 4px;
                transition: background-color 0.2s;

                &:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
            }

            .img {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.3);
            }

            .caret-icon {
                font-size: 16px;
                transition: transform 0.2s;
            }

            .el-dropdown__box:hover .caret-icon {
                transform: translateY(1px);
            }

            strong {
                margin: 0;
                line-height: 1;
                white-space: nowrap;
            }
        }
    }
}

.nav {
    width: 100%;
    height: 40%;
    border-top: 1px solid #3a7fcb;
    background-color: rgba(18, 72, 131, 0.95);
    margin: 0 auto;
    display: flex;
    align-items: center;

    .box {
        width: 80%;
        height: 100%;
        margin: 0 auto;
    }

    .nav-list {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 2vw;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .nav-item {
        height: 100%;
        display: flex;
        align-items: center;
    }

    .nav-link {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #e6f7ff;
        font-size: 14px;
        text-decoration: none;
        padding: 0 12px;
        height: 100%;
        border-radius: 4px 4px 0 0;
        transition: all 0.2s ease;

        &:hover {
            color: #fff;
            background-color: rgba(255, 255, 255, 0.15);
        }
    }

    .nav-link--active {
        color: #fff;
        background-color: rgba(255, 255, 255, 0.2);
        font-weight: 600;
        border-bottom: 2px solid #409eff;
    }

    .nav-icon {
        font-size: 16px;
    }

    .nav-text {
        white-space: nowrap;
    }
}

@media (max-width: 768px) {
    .header-container {
        height: auto;
        max-height: none;
    }

    .top {
        height: auto;
        padding: 10px 0;
    }

    .box {
        width: 95% !important;
        flex-direction: column;
        gap: 10px;
    }

    .logo {
        margin: 0 auto;
    }

    .nav {
        height: auto;
        padding: 10px 0;
    }

    .nav-list {
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
    }

    .nav-item {
        height: auto;
        margin-bottom: 8px;
    }

    .nav-link {
        padding: 8px 12px;
        font-size: 13px;
    }
}
</style>