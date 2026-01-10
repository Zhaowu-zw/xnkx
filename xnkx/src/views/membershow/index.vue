<template>
    <div class="container">
        <!-- 头部组件 -->
        <HeaderView></HeaderView>

        <!-- 人员展示核心区域 -->
        <main class="personnel-main">
            <!-- 页面标题 + 分组查询按钮区 + 系别筛选区 -->
            <div class="personnel-header">
                <h2 class="title">社团成员展示</h2>

                <!-- 分组查询按钮组（从接口返回的分组列表动态生成） -->
                <div class="group-btn-group">
                    <button v-for="group in groupList" :key="group.id"
                        :class="['group-btn', { active: currentGroupId === group.id + '' }]"
                        @click="fetchGroupMember(group.id)">
                        {{ group.group_name }}
                    </button>
                    <!-- 全部分组按钮 -->
                    <button class="group-btn" :class="{ active: currentGroupId === '' }" @click="fetchGroupMember('')">
                        全部分组
                    </button>
                </div>
            </div>

            <!-- 系别筛选（保留功能，根据接口中 user.department 动态生成，去重） -->
            <div class="filter-group">
                <button :class="['filter-btn', { active: activeFilter === 'all' }]" @click="activeFilter = 'all'">
                    全部系别
                </button>
                <button v-for="dept in departmentList" :key="dept"
                    :class="['filter-btn', { active: activeFilter === dept }]" @click="activeFilter = dept">
                    {{ dept }}
                </button>
            </div>

            <!-- 人员卡片列表 -->
            <div class="personnel-list">
                <!-- 加载中 -->
                <div v-if="isLoading" class="loading-state">
                    <el-icon size="40">
                        <Loading />
                    </el-icon>
                    <p>加载中...</p>
                </div>

                <!-- 错误状态 -->
                <div v-else-if="errorMsg" class="error-state">
                    <el-icon class="error-icon">
                        <WarningFilled />
                    </el-icon>
                    <p>{{ errorMsg }}</p>
                </div>

                <!-- 人员卡片 -->
                <div v-else-if="filteredPersonnel.length > 0" v-for="(member, memberIdx) in filteredPersonnel"
                    :key="`${member.user.user_id}-${memberIdx}`" class="person-card"
                    @mouseenter="handleCardHover(member.user.user_id)" @mouseleave="handleCardLeave">
                    <!-- 头像区域 -->
                    <div class="avatar-wrapper">
                        <!-- 接口返回的 avatar 是字符串，直接绑定 -->
                        <img :src="member.user.avatar" :alt="member.user.nickname" class="avatar"
                            :class="{ hovered: hoveredId === member.user.user_id }" @error="handleAvatarError($event)">
                        <!-- 角色标签显示 user_role.role_name -->
                        <div class="role-tag">{{ member.user_role.role_name }}</div>
                    </div>

                    <!-- 人员信息 -->
                    <div class="person-info">
                        <h3 class="name">{{ member.user.nickname }}</h3>
                        <!-- 显示分组名 + 系别（接口中 user.department） -->
                        <p class="department">
                            分组：{{ member.group_name }}
                            <span v-if="member.user.department">| 系别：{{ member.user.department }}</span>
                        </p>
                        <!-- 性别信息 -->
                        <p class="gender">性别：{{ member.user.sex === '1' ? '男' : member.user.sex === '0' ? '女' :
                            member.user.sex || '未知' }}</p>

                        <!-- 兴趣爱好区域（逗号分割） -->
                        <div v-if="member.user.hobbit" class="hobbies-section">
                            <span class="section-label">兴趣爱好：</span>
                            <div class="hobbies">
                                <span v-for="(hobby, idx) in member.user.hobbit.split(',')" :key="idx"
                                    class="hobby-tag">
                                    {{ hobby.trim() }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- 基本信息（移除用户ID展示） -->
                    <div class="base-info" :class="{ show: hoveredId === member.user.user_id }">
                        <div class="info-item">
                            <span class="info-label">角色：</span>
                            <span class="info-value">{{ member.user_role.role_name }}</span>
                        </div>
                        <div v-if="member.user.department" class="info-item">
                            <span class="info-label">所属系别：</span>
                            <span class="info-value">{{ member.user.department }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">加入分组：</span>
                            <span class="info-value">{{ member.group_name }}</span>
                        </div>
                    </div>
                </div>

                <!-- 空状态（无数据） -->
                <div v-else class="empty-state">
                    <el-icon class="empty-icon">
                        <UserFilled />
                    </el-icon>
                    <p>暂无该分类下的人员信息</p>
                </div>
            </div>
        </main>

        <!-- 底部组件 -->
        <FooterView></FooterView>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
// 引入 Element Plus 图标
import { UserFilled, WarningFilled, Loading } from '@element-plus/icons-vue'
import HeaderView from '@/components/HeaderView.vue'
import FooterView from '@/components/FooterView.vue'
import useGroupStore from '@/stores/group'

// 状态管理
const groupStore = useGroupStore()

// 响应式数据
const currentGroupId = ref('') // 当前选中的分组ID（接口中 group.id）
const activeFilter = ref('all') // 当前选中的系别筛选
const hoveredId = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const groupMemberShow = computed(() => groupStore.groupMemberShow)

// 头像加载失败处理
const handleAvatarError = (e) => {
    e.target.src = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' // 默认头像
}

// 从接口返回的分组列表（动态生成）
const groupList = computed(() => {
    return groupMemberShow.value || []
})

// 从接口返回的系别列表（去重，过滤空值）
const departmentList = computed(() => {
    if (!groupList.value?.length) return []
    // 提取所有 user.department 并去重，过滤空值
    const depts = groupList.value.flatMap(group =>
        group.member_shows.map(member => member.user.department).filter(Boolean)
    )
    return [...new Set(depts)];
})

// 计算属性：过滤人员（先按分组筛选，再按系别筛选）
const filteredPersonnel = computed(() => {
    if (!groupMemberShow.value?.length) return []

    // 1. 先按选中的分组筛选
    let filteredByGroup = groupMemberShow.value
    if (currentGroupId.value) {
        filteredByGroup = filteredByGroup.filter(group => group.id === Number(currentGroupId.value))
    }

    // 2. 扁平化为人员列表
    let allMembers = filteredByGroup.flatMap(group =>
        group.member_shows.map(member => ({
            ...member,
            group_name: group.group_name // 把分组名挂载到人员对象上
        }))
    )

    // 3. 再按系别筛选（保留系别筛选功能）
    if (activeFilter.value !== 'all') {
        allMembers = allMembers.filter(member => member.user.department === activeFilter.value)
    }

    return allMembers
})

// 方法：获取指定分组的人员（调用store的接口方法）
const fetchGroupMember = async (groupId) => {
    currentGroupId.value = groupId + '' // 转为字符串，避免类型问题
    isLoading.value = true
    errorMsg.value = ''
    try {
        // 调用store的 GetGroupMemberShow 方法，传groupId（空则查全部）
        await groupStore.GetGroupMemberShow(groupId)
    } catch (err) {
        errorMsg.value = err.message || '数据获取失败，请稍后再试'
    } finally {
        isLoading.value = false
    }
}

// 页面挂载时默认查全部分组
onMounted(() => {
    fetchGroupMember('')
})

// 卡片悬停/离开
const handleCardHover = (id) => {
    hoveredId.value = id
}
const handleCardLeave = () => {
    hoveredId.value = ''
}
</script>

<style scoped lang="scss">
/* 全局样式优化 */
.container {
    background-color: #f5f7fa;
    min-height: 100vh;
    width: 100vw;
    overflow-x: hidden;
    font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.personnel-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
}

/* 头部布局：标题 + 分组按钮 + 系别筛选 */
.personnel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 20px;

    .title {
        font-size: 28px;
        font-weight: 600;
        color: #1d2129;
        margin: 0;
        letter-spacing: 0.5px;
        position: relative;
        padding-bottom: 8px;

        &::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: 0;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #4096ff, #67c23a);
            border-radius: 3px;
        }
    }

    /* 分组按钮组样式优化 */
    .group-btn-group {
        display: flex;
        gap: 12px;

        .group-btn {
            padding: 9px 18px;
            border-radius: 8px;
            border: 1px solid #e5e6eb;
            background-color: #fff;
            color: #4e5969;
            cursor: pointer;
            transition: all 0.25s ease;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

            &:hover {
                border-color: #4096ff;
                color: #4096ff;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
            }

            &.active {
                background: linear-gradient(135deg, #4096ff 0%, #1677ff 100%);
                color: #fff;
                border-color: #4096ff;
                box-shadow: 0 4px 12px rgba(64, 150, 255, 0.3);
            }
        }
    }
}

/* 系别筛选按钮组优化（保留功能） */
.filter-group {
    display: flex;
    gap: 12px;
    margin-bottom: 1rem;

    .filter-btn {
        padding: 9px 18px;
        border-radius: 8px;
        border: 1px solid #e5e6eb;
        background-color: #fff;
        color: #4e5969;
        cursor: pointer;
        transition: all 0.25s ease;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

        &:hover {
            border-color: #67c23a;
            color: #67c23a;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }

        &.active {
            background: linear-gradient(135deg, #67c23a 0%, #52c41a 100%);
            color: #fff;
            border-color: #67c23a;
            box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
        }
    }
}

/* 加载状态优化 */
.loading-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 20px;
    color: #86909c;

    :deep(.el-icon) {
        font-size: 48px;
        color: #4096ff;
        animation: pulse 1.5s infinite ease-in-out;
    }

    p {
        margin-top: 20px;
        font-size: 16px;
        letter-spacing: 0.3px;
    }
}

/* 错误状态优化 */
.error-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 20px;
    color: #f56c6c;

    .error-icon {
        font-size: 72px;
        margin-bottom: 20px;
        opacity: 0.8;
    }

    p {
        font-size: 16px;
        margin: 0;
        letter-spacing: 0.3px;
    }
}

/* 人员列表优化 - 桌面端网格布局，移动端列表布局 */
.personnel-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 28px;
}

/* 空状态优化 */
.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 20px;
    color: #86909c;

    .empty-icon {
        font-size: 72px;
        margin-bottom: 20px;
        color: #c0c4cc;
        opacity: 0.8;
    }

    p {
        font-size: 16px;
        margin: 0;
        letter-spacing: 0.3px;
    }
}

/* 人员卡片 - 桌面端样式 */
.person-card {
    background-color: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;

    &:hover {
        transform: translateY(-10px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    }

    .avatar-wrapper {
        position: relative;
        height: 220px;
        background: linear-gradient(135deg, #4096ff 0%, #67c23a 100%);
        overflow: hidden;

        .avatar {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: all 0.3s ease;

            &.hovered {
                opacity: 0.88;
                transform: scale(1.02);
            }
        }

        .role-tag {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background-color: rgba(0, 0, 0, 0.7);
            color: #fff;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            backdrop-filter: blur(4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
    }

    .person-info {
        padding: 24px;
        flex: 1;
        display: flex;
        flex-direction: column;

        .name {
            font-size: 22px;
            font-weight: 600;
            color: #1d2129;
            margin: 0 0 10px 0;
            letter-spacing: 0.3px;
        }

        .department {
            color: #666e78;
            font-size: 14px;
            margin: 0 0 12px 0;
            line-height: 1.5;
        }

        .gender {
            color: #666e78;
            font-size: 14px;
            margin: 0 0 16px 0;
            line-height: 1.5;
        }

        /* 兴趣爱好区域样式 */
        .hobbies-section {
            margin-top: 16px;

            .section-label {
                font-size: 14px;
                color: #666e78;
                font-weight: 500;
                display: block;
                margin-bottom: 8px;
            }

            .hobbies {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;

                .hobby-tag {
                    padding: 6px 12px;
                    background-color: #f0f7ff;
                    color: #4096ff;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;

                    &:hover {
                        background-color: #e6f4ff;
                        transform: translateY(-1px);
                    }
                }
            }
        }
    }

    /* 基本信息面板（移除用户ID展示） */
    .base-info {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: rgba(255, 255, 255, 0.98);
        padding: 20px 24px;
        border-top: 1px solid #f0f2f5;
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        gap: 10px;
        backdrop-filter: blur(8px);
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);

        &.show {
            transform: translateY(0);
        }

        .info-item {
            display: flex;
            align-items: center;
            font-size: 14px;

            .info-label {
                color: #666e78;
                font-weight: 500;
                width: 70px;
                flex-shrink: 0;
            }

            .info-value {
                color: #1d2129;
                flex: 1;
                word-break: break-all;
            }
        }
    }
}

/* 动画效果 */
@keyframes pulse {
    0% {
        opacity: 0.8;
        transform: scale(1);
    }

    50% {
        opacity: 1;
        transform: scale(1.05);
    }

    100% {
        opacity: 0.8;
        transform: scale(1);
    }
}

/* 响应式适配优化 - 平板端 */
@media (max-width: 1024px) {
    .personnel-list {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 24px;
    }
}

/* 响应式适配优化 - 移动端（768px以下） */
@media (max-width: 768px) {
    .personnel-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .group-btn-group,
    .filter-group {
        width: 100%;
        flex-wrap: wrap;
    }

    .personnel-main {
        padding: 30px 16px;
    }

    /* 移动端人员列表改为单列列表布局 */
    .personnel-list {
        grid-template-columns: 1fr;
        gap: 16px;
        /* 减小间距，更紧凑 */
    }

    /* 移动端卡片改为横向布局（头像+信息），更省空间 */
    .person-card {
        flex-direction: row;
        height: auto;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        &:hover {
            transform: none;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        /* 移动端头像区域缩小 */
        .avatar-wrapper {
            width: 100px;
            height: 100px;
            flex-shrink: 0;

            .role-tag {
                bottom: 8px;
                left: 8px;
                padding: 3px 8px;
                font-size: 12px;
                border-radius: 12px;
            }

            .avatar.hovered {
                opacity: 0.9;
                transform: none;
            }
        }

        /* 移动端信息区域优化 */
        .person-info {
            padding: 16px;
            flex: 1;

            .name {
                font-size: 18px;
                margin: 0 0 6px 0;
            }

            .department,
            .gender {
                font-size: 13px;
                margin: 0 0 8px 0;
            }

            /* 移动端兴趣爱好简化 */
            .hobbies-section {
                margin-top: 8px;

                .section-label {
                    font-size: 13px;
                    margin-bottom: 4px;
                }

                .hobbies {
                    gap: 6px;

                    .hobby-tag {
                        padding: 3px 8px;
                        font-size: 12px;
                    }
                }
            }
        }

        /* 移动端基本信息面板调整 */
        .base-info {
            position: static;
            transform: none;
            padding: 12px 16px;
            border-top: 1px solid #f5f7fa;
            gap: 6px;
            display: none;
            /* 移动端默认隐藏，点击/长按显示 */
            box-shadow: none;

            &.show {
                display: flex;
            }

            .info-item {
                font-size: 13px;

                .info-label {
                    width: 60px;
                }
            }
        }
    }

    /* 移动端状态提示优化 */
    .loading-state,
    .error-state,
    .empty-state {
        padding: 40px 20px;

        :deep(.el-icon),
        .error-icon,
        .empty-icon {
            font-size: 48px;
        }

        p {
            font-size: 14px;
        }
    }
}

/* 小屏移动端（480px以下）极致优化 */
@media (max-width: 480px) {
    .personnel-main {
        padding: 20px 12px;
    }

    .group-btn,
    .filter-btn {
        padding: 8px 14px;
        font-size: 13px;
        flex: 1;
        min-width: 80px;
        text-align: center;
    }

    /* 超小屏头像进一步缩小 */
    .person-card .avatar-wrapper {
        width: 80px;
        height: 80px;
    }

    /* 超小屏信息区域更紧凑 */
    .person-info {
        padding: 12px;

        .name {
            font-size: 16px;
        }

        .department,
        .gender {
            font-size: 12px;
        }
    }

    /* 超小屏筛选按钮换行更友好 */
    .filter-group {
        gap: 8px;
        margin-bottom: 0.8rem;
    }
}
</style>