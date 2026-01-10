<template>
    <div class="club-home">
        <!-- 头部组件 -->
        <HeaderView></HeaderView>

        <!-- 社团风采轮播图（替换为小组仓库数据 + 移除按钮） -->
        <el-carousel class="club-carousel" height="500px" indicator-position="bottom" autoplay interval="5000"
            arrow="hover">
            <!-- 遍历小组仓库的部门数据，替代硬编码的carouselList -->
            <el-carousel-item v-for="dept in departmentList" :key="dept.id">
                <div class="carousel-item">
                    <!-- 保留原有随机图片，也可替换为部门专属图片 dept.image -->
                    <img v-lazy="groupImgMap[dept.id]" alt="社团风采" class="carousel-img" />
                    <div class="carousel-overlay">
                        <div class="carousel-info">
                            <!-- 从小组仓库读取部门名称和描述 -->
                            <h2 class="carousel-title">{{ dept.group_name }}</h2>
                            <p class="carousel-desc">{{ dept.group_position || dept.group_desc || '专注于相关技术领域的研发与实践' }}
                            </p>
                            <!-- 移除按钮 -->
                        </div>
                    </div>
                </div>
            </el-carousel-item>
        </el-carousel>

        <!-- 核心内容区 -->
        <div class="content-wrapper">
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-container">
                <el-skeleton active :rows="10" style="width: 100%;"></el-skeleton>
            </div>

            <!-- 错误提示 -->
            <div v-else-if="errorMsg" class="error-container">
                <el-alert :message="errorMsg" type="error" show-icon></el-alert>
                <el-button type="primary" @click="initData()" style="margin-top: 10px;">重新加载</el-button>
            </div>

            <div v-else>
                <!-- 部门结构展示模块 -->
                <section class="department-section">
                    <div class="section-header">
                        <h2>
                            <i class="el-icon-sitemap"></i> 社团部门结构
                        </h2>
                        <p class="section-desc">五大技术部门，协同赋能社团发展</p>
                    </div>
                    <div class="group-list">
                        <div class="group-item" v-for="(dept, index) in departmentList" :key="index">
                            <div class="group-icon">
                                <el-icon :size="80">
                                    <UserFilled />
                                </el-icon>
                            </div>
                            <h3 class="group-name">{{ dept.group_name }}</h3>
                            <p class="group-desc">{{ dept.group_position }}</p>
                        </div>
                    </div>
                </section>

                <!-- 社团动态模块（修改：只展示最新3条） -->
                <section class="club-news">
                    <div class="section-header">
                        <h2>
                            <i class="el-icon-bell"></i> 社团动态
                        </h2>
                        <el-button type="text" @click="viewMoreNews()">
                            查看更多 <i class="el-icon-arrow-right"></i>
                        </el-button>
                    </div>
                    <!-- 修改：使用最新3条动态的计算属性 -->
                    <div class="news-list">
                        <el-card v-for="(news, index) in latestThreeActivities" :key="index" class="news-card"
                            shadow="hover">
                            <div class="news-item">
                                <div class="news-tag" :style="{ backgroundColor: getTagColor(news.group_id) }">
                                    {{ getDeptNameById(news.group_id) || '社团' }}
                                </div>
                                <div class="news-content">
                                    <h3 class="news-title">{{ news.title }}</h3>
                                    <p class="news-time">
                                        <i class="el-icon-time"></i> {{ formatTime(news.activity_time) }}
                                    </p>
                                    <p class="news-brief">{{ news.brief }}</p>
                                </div>
                                <el-button type="text" icon="el-icon-view" @click="viewNewsDetail(news.id)">
                                    详情
                                </el-button>
                            </div>
                        </el-card>
                        <!-- 空状态：无动态时显示 -->
                        <div v-if="latestThreeActivities.length === 0" class="empty-news">
                            暂无社团动态信息
                        </div>
                    </div>
                </section>

                <!-- 部门成果展示模块（默认展示网页组 + 动态状态标签） -->
                <section class="achievement-section">
                    <div class="section-header">
                        <h2>
                            <i class="el-icon-solution"></i> 部门核心成果
                        </h2>
                        <p class="section-desc">各部门技术实践与项目产出</p>
                    </div>
                    <el-tabs v-model="activeTab" type="border-card">
                        <el-tab-pane v-for="dept in departmentList" :key="dept.id" :label="dept.group_name">
                            <div class="achievement-list">
                                <el-card v-for="(project, pIndex) in getDeptAchievements(dept.id)" :key="pIndex"
                                    class="project-card">
                                    <div class="project-header">
                                        <h3 class="project-title">{{ project.title }}</h3>
                                        <!-- 调用计算函数获取状态文本 + 动态绑定标签类型 -->
                                        <el-tag :type="getProjectStatusType(project)">{{ getProjectStatusText(project)
                                        }}</el-tag>
                                    </div>
                                    <p class="project-desc">{{ project.description }}</p>
                                    <div v-if="project.image_url" class="project-img">
                                        <el-image :src="project.image_url" fit="cover"
                                            preview-src-list="[project.image_url]"
                                            style="width: 100%; height: 200px; border-radius: 4px; margin: 10px 0;"></el-image>
                                    </div>
                                    <div class="project-meta">
                                        <span>
                                            <i class="el-icon-calendar"></i> {{ formatTime(project.activity_time) }}
                                        </span>
                                    </div>
                                </el-card>
                                <div v-if="getDeptAchievements(dept.id).length === 0" class="empty-project">
                                    暂无成果展示
                                </div>
                            </div>
                        </el-tab-pane>
                    </el-tabs>
                </section>
            </div>
        </div>

        <!-- 底部组件 -->
        <FooterView></FooterView>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import HeaderView from '@/components/HeaderView.vue'
import FooterView from '@/components/FooterView.vue'
import { UserFilled } from '@element-plus/icons-vue'
import useActivityStore from '@/stores/activity'
import useGroupStore from '@/stores/group'
import { useGroupAchievementStore } from '@/stores/groupachievement'
import { useRouter } from 'vue-router'
import group1Img from '@/assets/images/group1.png'
import group2Img from '@/assets/images/group2.png'
import group3Img from '@/assets/images/group3.png'
import group4Img from '@/assets/images/group4.png'
import group5Img from '@/assets/images/group5.png'

// 初始化仓库
const activityStore = useActivityStore()
const groupStore = useGroupStore()
const achievementStore = useGroupAchievementStore()
const $router = useRouter()

// 页面状态
const loading = ref(false)
const errorMsg = ref('')
// 默认选中网页组（优先通过ID匹配，网页组ID假设为1）
const activeTab = ref('1')

// 从仓库获取计算属性
const departmentList = computed(() => {
    return groupStore.groupInfo || []
})
const activityList = computed(() => {
    return activityStore.activityList || []
})
const groupedAchievements = computed(() => {
    return achievementStore.achievementList || []
})

// ========== 新增：获取最新3条动态的计算属性 ==========
const latestThreeActivities = computed(() => {
    // 1. 先过滤掉无效数据
    const validActivities = activityList.value.filter(item => {
        return item && item.id && item.activity_time
    })
    // 2. 按活动时间倒序排序（最新的在前）
    const sortedActivities = validActivities.sort((a, b) => {
        return new Date(b.activity_time) - new Date(a.activity_time)
    })
    // 3. 截取前3条
    return sortedActivities.slice(0, 3)
})

// ========== 成果状态计算函数 ==========
/**
 * 获取成果状态文本（区分已完成/进行中）
 * @param {Object} project - 成果数据
 * @returns {String} 状态文本
 */
const getProjectStatusText = computed(() => (project) => {
    if (!project) return '未知状态'
    // 支持多种状态值映射：1/已完成/finished → 已完成；0/进行中/processing → 进行中
    const statusVal = project.status?.toString().toLowerCase()
    const completedStatus = ['1', '已完成', 'finished', 'complete']
    const processingStatus = ['0', '进行中', 'processing', 'inprogress']

    if (completedStatus.includes(statusVal)) {
        return '已完成'
    } else if (processingStatus.includes(statusVal)) {
        return '进行中'
    }
    // 默认返回已完成
    return '已完成'
})

/**
 * 获取成果状态标签类型（适配Element Plus标签样式）
 * @param {Object} project - 成果数据
 * @returns {String} success/warning/info/danger
 */
const getProjectStatusType = computed(() => (project) => {
    const statusText = getProjectStatusText.value(project)
    return statusText === '已完成' ? 'success' : 'warning'
})

// 工具方法：格式化时间
const formatTime = (timeStr) => {
    if (!timeStr) return ''
    return new Date(timeStr).toLocaleDateString('zh-CN')
}

// 工具方法：根据部门ID获取部门名称
const getDeptNameById = (deptId) => {
    if (!deptId) return ''
    const dept = departmentList.value.find(item => item.id === deptId)
    return dept?.group_name || ''
}

// 根据部门ID获取对应成果
const getDeptAchievements = (deptId) => {
    const deptGroup = groupedAchievements.value.find(item => item.group_id === deptId)
    return deptGroup?.achievements || []
}

// 工具方法：获取部门标签颜色
const getTagColor = (deptId) => {
    const colorMap = {
        1: '#409eff', // 网页组
        2: '#67c23a', // 虚拟组
        3: '#e6a23c', // 维修组
        4: '#f56c6c', // 人工组
        5: '#909399'  // 大数据组
    }
    return colorMap[deptId] || '#409eff'
}

// 映射图片路径
const groupImgMap = {
    1: group1Img,
    2: group2Img,
    3: group3Img,
    4: group4Img,
    5: group5Img,
}

// 初始化数据
const initData = async () => {
    try {
        loading.value = true
        errorMsg.value = ''

        await Promise.all([
            groupStore.GetGroupInfo(),
            groupStore.GetGroupMemberShow(),
            activityStore.GetActivityInfo({ page: 1, pageSize: 10 }), // 加载足够多的数据用于筛选最新3条
            achievementStore.fetchGroupAchievement({})
        ])

        // 兼容处理：若网页组ID不是1，自动匹配网页组ID
        const webDept = departmentList.value.find(item => item.group_name === '网页组')
        if (webDept) {
            activeTab.value = webDept.id.toString()
        }

    } catch (error) {
        errorMsg.value = error.message || '数据加载失败，请稍后重试'
    } finally {
        loading.value = false
    }
}

const viewMoreNews = () => {
    $router.push('/activity/list')
}

const viewNewsDetail = (id) => {
    $router.push(`/activity/detail/${id}`)
}

// 页面挂载时初始化数据
onMounted(() => {
    initData()
})
</script>

<style scoped lang="scss">
.club-home {
    width: 100vw;
    min-height: 100vh;
    background-color: #f5f7fa;
    overflow-x: hidden;

    // 轮播图样式
    .club-carousel {
        width: 100%;
        margin: 0 auto;

        .carousel-item {
            position: relative;
            height: 100%;

            .carousel-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .carousel-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2));
                display: flex;
                align-items: center;
                padding-left: 80px;

                .carousel-info {
                    color: #fff;
                    max-width: 600px;

                    .carousel-title {
                        font-size: 36px;
                        font-weight: bold;
                        margin-bottom: 20px;
                    }

                    .carousel-desc {
                        font-size: 18px;
                        margin-bottom: 30px;
                        opacity: 0.9;
                    }
                }
            }
        }
    }

    // 内容容器
    .content-wrapper {
        width: 1200px;
        margin: 60px auto;

        .loading-container {
            padding: 20px;
        }

        .error-container {
            padding: 20px;
            margin-bottom: 20px;
        }

        .section-header {
            text-align: center;
            margin-bottom: 30px;

            h2 {
                font-size: 28px;
                color: #2c3e50;
                display: inline-flex;
                align-items: center;
                gap: 12px;
                padding-bottom: 10px;
                border-bottom: 3px solid #409eff;
            }

            .section-desc {
                margin-top: 15px;
                font-size: 16px;
                color: #7f8c8d;
            }
        }

        // 部门结构模块
        .department-section {
            margin-bottom: 80px;

            .group-list {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;

                .group-item {
                    padding: 20px;
                    border-radius: 6px;
                    background-color: #f9f9f9;
                    text-align: center;
                    transition: transform 0.3s ease;

                    &:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    }

                    .group-icon {
                        width: 80px;
                        height: 80px;
                        margin: 0 auto 15px;
                        color: #3498db;
                    }

                    .group-name {
                        font-size: 18px;
                        color: #2c3e50;
                        margin-bottom: 10px;
                        font-weight: 500;
                    }

                    .group-desc {
                        color: #666;
                        font-size: 14px;
                        line-height: 1.6;
                        margin-bottom: 10px;
                    }
                }
            }
        }

        // 社团动态模块
        .club-news {
            margin-bottom: 80px;

            .section-header {
                text-align: left;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: none;

                h2 {
                    border-bottom: none;
                }
            }

            .news-list {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;

                // 新增：无动态时的空状态样式
                .empty-news {
                    grid-column: 1 / -1; // 占满整行
                    text-align: center;
                    padding: 40px;
                    color: #999;
                    font-size: 14px;
                    background-color: #f8f9fa;
                    border-radius: 6px;
                }

                .news-card {
                    .news-item {
                        position: relative;
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        height: 100%;

                        .news-tag {
                            position: absolute;
                            top: 20px;
                            right: 20px;
                            padding: 4px 8px;
                            color: #fff;
                            border-radius: 4px;
                            font-size: 12px;
                        }

                        .news-content {
                            flex: 1;

                            .news-title {
                                font-size: 18px;
                                font-weight: 600;
                                color: #2c3e50;
                                margin-bottom: 10px;
                            }

                            .news-time {
                                font-size: 14px;
                                color: #999;
                                margin-bottom: 8px;
                            }

                            .news-brief {
                                font-size: 14px;
                                color: #666;
                                line-height: 1.6;
                                display: -webkit-box;
                                -webkit-line-clamp: 2;
                                -webkit-box-orient: vertical;
                                overflow: hidden;
                            }
                        }

                        .el-button {
                            margin-top: 15px;
                            align-self: flex-start;
                        }
                    }
                }
            }
        }

        // 部门成果模块
        .achievement-section {
            margin-bottom: 60px;

            .el-tabs {
                --el-tabs-border-color: #e5e7eb;

                .project-card {
                    margin-bottom: 20px;

                    .project-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;

                        .project-title {
                            font-size: 18px;
                            font-weight: 600;
                            color: #2c3e50;
                        }
                    }

                    .project-desc {
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 15px;
                        line-height: 1.6;
                    }

                    .project-img {
                        margin: 10px 0;
                        border-radius: 4px;
                        overflow: hidden;
                    }

                    .project-meta {
                        font-size: 13px;
                        color: #999;
                        display: flex;
                        gap: 20px;
                    }
                }

                .empty-project {
                    text-align: center;
                    padding: 40px;
                    color: #999;
                    font-size: 14px;
                }
            }
        }
    }

    // 响应式适配
    @media (max-width: 1200px) {
        .content-wrapper {
            width: 90%;
        }

        .news-list {
            grid-template-columns: repeat(2, 1fr) !important;
        }
    }

    @media (max-width: 768px) {
        .club-carousel {
            height: 350px !important;

            .carousel-overlay {
                padding-left: 20px;

                .carousel-title {
                    font-size: 24px !important;
                }

                .carousel-desc {
                    font-size: 16px !important;
                }
            }
        }

        .news-list {
            grid-template-columns: 1fr !important;
        }
    }
}
</style>