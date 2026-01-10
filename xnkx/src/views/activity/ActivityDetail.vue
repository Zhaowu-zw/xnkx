<template>
    <div class="activity-detail-page">
        <!-- 头部组件 -->
        <HeaderView></HeaderView>

        <!-- 页面主体 -->
        <div class="main-container">
            <!-- 返回按钮 -->
            <div class="back-btn">
                <el-button type="text" @click="goBack">
                    <i class="el-icon-arrow-left"></i> 返回动态列表
                </el-button>
            </div>

            <!-- 加载状态 -->
            <div v-if="loading" class="loading-container">
                <el-skeleton active :rows="12" style="width: 100%;"></el-skeleton>
            </div>

            <!-- 错误提示 -->
            <div v-else-if="errorMsg" class="error-container">
                <el-alert :message="errorMsg" type="error" show-icon></el-alert>
                <el-button type="primary" @click="loadActivityDetail()" style="margin-top: 10px;">重新加载</el-button>
            </div>

            <!-- 动态详情 -->
            <div v-else class="detail-content">
                <!-- 标题栏 -->
                <div class="detail-header">
                    <h1 class="detail-title">{{ activityDetail.title }}</h1>
                    <div class="detail-meta">
                        <!-- 优化标签颜色和名称显示 -->
                        <el-tag :style="{ backgroundColor: tagColor, color: '#fff' }">
                            {{ deptName || "社团" }}
                        </el-tag>
                        <span class="publish-time">
                            <i class="el-icon-time"></i> {{ formatTime(activityDetail.activity_time) }}
                        </span>
                        <span class="creator">
                            <i class="el-icon-user"></i>
                            <!-- 显示用户名（从用户仓库获取） -->
                            {{  `发布人: ${activityDetail.creator_nickname}` }}
                        </span>
                    </div>
                </div>

                <!-- 图片预览区 - 修复图片加载失败问题 -->
                <div class="image-preview" v-if="hasValidImages">
                    <el-image v-for="(url, index) in validImageUrls" :key="index" :src="url"
                        :preview-src-list="validImageUrls" :initial-index="index" fit="cover" class="detail-image" lazy>
                        <template #error>
                            <div class="image-error">
                                <i class="el-icon-picture-outline"></i>
                                <p>图片加载失败</p>
                            </div>
                        </template>
                        <template #placeholder>
                            <div class="image-loading">
                                <el-skeleton :animated="true"></el-skeleton>
                            </div>
                        </template>
                    </el-image>
                </div>
                <!-- 无图片提示 -->
                <div v-else class="no-image">
                    <el-empty description="暂无图片"></el-empty>
                </div>

                <!-- 简介 -->
                <div class="detail-brief" v-if="activityDetail.brief">
                    <h3 class="subtitle">简介</h3>
                    <p>{{ activityDetail.brief }}</p>
                </div>

                <!-- 详细描述 -->
                <div class="detail-description">
                    <h3 class="subtitle">详细内容</h3>
                    <div class="description-content">
                        {{ activityDetail.description || '暂无详细描述' }}
                    </div>
                </div>

                <!-- 其他信息 -->
                <div class="detail-other">
                    <div class="other-item">
                        <span class="label">创建时间：</span>
                        <span class="value">{{ formatTime(activityDetail.createdAt) }}</span>
                    </div>
                    <div class="other-item">
                        <span class="label">更新时间：</span>
                        <span class="value">{{ formatTime(activityDetail.updatedAt) }}</span>
                    </div>
                    <div class="other-item">
                        <span class="label">所属类别：</span>
                        <span class="value">{{ deptName || '无' }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部组件 -->
        <FooterView></FooterView>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import HeaderView from '@/components/HeaderView.vue'
import FooterView from '@/components/FooterView.vue'
import useActivityStore from '@/stores/activity'
import useGroupStore from '@/stores/group'
// 导入用户仓库（已做持久化）
import useUserStore from '@/stores/user'

// 路由/路由参数
const router = useRouter()
const route = useRoute()
const activityId = Number(route.params.id)

// 仓库实例
const activityStore = useActivityStore()
const groupStore = useGroupStore()
const userStore = useUserStore() // 用户仓库实例

// 页面状态
const loading = ref(false)
const errorMsg = ref('')
const activityDetail = ref({})

// 计算属性
// 部门名称 - 优化空值处理
const deptName = computed(() => {
    if (!activityDetail.value.group_id) return '社团'
    const dept = groupStore.groupInfo?.find(item => item.id === activityDetail.value.group_id)
    return dept?.group_name || '社团'
})

// 标签颜色 - 补充完整的颜色映射
const tagColor = computed(() => {
    const colorMap = {
        1: '#409eff',    // 网页组 - 蓝色
        2: '#67c23a',    // 虚拟组 - 绿色
        3: '#e6a23c',    // 维修组 - 橙色
        4: '#f56c6c',    // 人工组 - 红色
        5: '#909399',    // 大数据组 - 灰色
        default: '#722ed1' // 默认色 - 紫色（无分组/未知分组）
    }

    if (!activityDetail.value.group_id) return colorMap.default
    return colorMap[activityDetail.value.group_id] || colorMap.default
})

// 图片处理 - 过滤无效URL
const validImageUrls = computed(() => {
    if (!activityDetail.value.image_url || !Array.isArray(activityDetail.value.image_url)) {
        return []
    }
    // 过滤空URL、无效URL
    return activityDetail.value.image_url.filter(url => {
        return url && typeof url === 'string' && url.trim() !== '' && url.startsWith('http')
    })
})

// 是否有有效图片
const hasValidImages = computed(() => {
    return validImageUrls.value.length > 0
})


// 工具方法
// 格式化时间
const formatTime = (timeStr) => {
    if (!timeStr) return ''
    try {
        return new Date(timeStr).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    } catch (e) {
    console.log(e)
        return timeStr
    }
}

// 加载动态详情
const loadActivityDetail = async () => {
    try {
        loading.value = true
        errorMsg.value = ''

        // 使用专门的GetActivityDetail方法获取详情
        const activity = await activityStore.GetActivityDetail(activityId)

        // 更新详情数据
        activityDetail.value = { ...activity }

        // 加载部门信息
        if (!groupStore.groupInfo) {
            await groupStore.GetGroupInfo()
        }

        // 加载用户信息（如果用户仓库未获取）
        if (userStore.token && (!userStore.userInfo || !userStore.userInfo.id)) {
            await userStore.UserInfo()
        }

        // 检查动态是否存在
        if (!activityDetail.value.id) {
            throw new Error('动态不存在或已被删除')
        }

    } catch (error) {
        errorMsg.value = error.message || '加载动态详情失败，请稍后重试'
    } finally {
        loading.value = false
    }
}

// 监听用户信息变化，自动更新用户名
watch([() => userStore.userInfo, () => activityDetail.value.creator_id], () => {
    // 用户名通过计算属性自动更新，无需额外操作
}, { deep: true })

// 返回上一页
const goBack = () => {
    router.go(-1)
}

// 页面挂载时加载数据
onMounted(() => {
    if (activityId) {
        loadActivityDetail()
    } else {
        errorMsg.value = '无效的动态ID'
        loading.value = false
    }
})
</script>

<style scoped lang="scss">
// 文章式布局优化
.activity-detail-page {
    width: 100vw;
    min-height: 100vh;
    background-color: #f9fafb;
    overflow-x: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

    // 主体容器 - 文章布局核心
    .main-container {
        max-width: 800px; // 适合阅读的最大宽度
        width: 100%;
        margin: 0 auto;
        padding: 40px 20px 60px;

        // 返回按钮
        .back-btn {
            margin-bottom: 32px;

            .el-button {
                font-size: 15px;
                color: #6b7280;
                transition: all 0.2s ease;

                &:hover {
                    color: #374151;
                    background-color: rgba(55, 65, 81, 0.05);
                }
            }
        }

        // 加载/错误容器
        .loading-container,
        .error-container {
            padding: 60px 20px;
            text-align: center;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        // 详情内容 - 文章样式
        .detail-content {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 48px;
            margin-bottom: 20px;
            line-height: 1.75;
            color: #374151;

            // 标题栏
            .detail-header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 24px;
                border-bottom: 1px solid #f3f4f6;

                .detail-title {
                    font-size: 36px;
                    color: #111827;
                    font-weight: 700;
                    margin-bottom: 20px;
                    line-height: 1.2;
                    letter-spacing: -0.02em;
                }

                .detail-meta {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    font-size: 14px;
                    color: #6b7280;
                    flex-wrap: wrap;

                    .publish-time,
                    .creator {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }

                    .el-tag {
                        font-size: 13px;
                        padding: 4px 12px;
                        border-radius: 20px;
                    }
                }
            }

            // 图片预览区 - 文章式图片布局
            .image-preview {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 24px;
                margin-bottom: 40px;

                .detail-image {
                    width: 100%;
                    max-width: 600px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transition: all 0.3s ease;
                    cursor: pointer;

                    &:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                    }
                }

                // 图片加载失败样式
                .image-error {
                    width: 100%;
                    max-width: 600px;
                    aspect-ratio: 16/9;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: #f9fafb;
                    color: #9ca3af;
                    border-radius: 8px;
                    border: 1px dashed #d1d5db;

                    i {
                        font-size: 48px;
                        margin-bottom: 16px;
                    }

                    p {
                        font-size: 15px;
                        margin: 0;
                    }
                }

                // 图片加载中占位
                .image-loading {
                    width: 100%;
                    max-width: 600px;
                    aspect-ratio: 16/9;
                    border-radius: 8px;
                }
            }

            // 无图片提示
            .no-image {
                padding: 60px 0;
                text-align: center;
                margin-bottom: 40px;
                color: #9ca3af;
            }

            // 副标题通用样式
            .subtitle {
                font-size: 22px;
                color: #111827;
                font-weight: 600;
                margin-bottom: 16px;
                margin-top: 32px;
                display: block;

                &::before {
                    display: none;
                }
            }

            // 简介
            .detail-brief {
                margin-bottom: 32px;
                padding-bottom: 24px;
                border-bottom: 1px solid #f3f4f6;

                p {
                    font-size: 18px;
                    color: #4b5563;
                    line-height: 1.75;
                    font-weight: 500;
                }
            }

            // 详细描述
            .detail-description {
                margin-bottom: 32px;
                padding-bottom: 24px;
                border-bottom: 1px solid #f3f4f6;

                .description-content {
                    font-size: 17px;
                    color: #4b5563;
                    line-height: 2;
                    white-space: pre-line;
                    letter-spacing: 0.01em;

                    // 段落样式
                    & > p {
                        margin-bottom: 20px;
                    }

                    // 标题样式
                    & > h2 {
                        font-size: 24px;
                        font-weight: 600;
                        margin: 32px 0 16px;
                        color: #111827;
                    }

                    & > h3 {
                        font-size: 20px;
                        font-weight: 600;
                        margin: 28px 0 14px;
                        color: #111827;
                    }
                }
            }

            // 其他信息
            .detail-other {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;

                .other-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    color: #6b7280;

                    .label {
                        font-weight: 500;
                        margin-right: 8px;
                    }

                    .value {
                        color: #4b5563;
                    }
                }
            }
        }
    }

    // 响应式适配
    @media (max-width: 1024px) {
        .main-container {
            width: 95%;
            padding: 30px 15px 50px;
        }

        .detail-content {
            padding: 36px;
        }

        .detail-header {
            text-align: left !important;

            .detail-meta {
                justify-content: flex-start !important;
            }
        }

        .detail-other {
            align-items: flex-start !important;

            .other-item {
                justify-content: flex-start !important;
            }
        }
    }

    @media (max-width: 768px) {
        .main-container {
            padding: 20px 10px 40px;
        }

        .detail-content {
            padding: 24px !important;

            .detail-title {
                font-size: 28px !important;
            }

            .detail-header {
                margin-bottom: 32px;
            }

            .image-preview {
                gap: 16px;
                margin-bottom: 32px;
            }

            .detail-image {
                max-width: 100% !important;
            }

            .image-error {
                max-width: 100% !important;
                aspect-ratio: 4/3 !important;
            }

            .detail-brief p {
                font-size: 16px !important;
            }

            .description-content {
                font-size: 16px !important;
            }
        }
    }

    @media (max-width: 480px) {
        .detail-content {
            .detail-title {
                font-size: 24px !important;
            }

            .detail-meta {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 8px !important;
            }
        }
    }
}
</style>