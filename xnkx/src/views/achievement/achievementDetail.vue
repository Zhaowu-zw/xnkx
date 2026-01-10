<template>
    <div class="container">
        <!-- 头部组件 -->
        <HeaderView></HeaderView>

        <!-- 主体内容 -->
        <main class="achievement-detail-main">
            <!-- 返回按钮 -->
            <div class="back-btn-container">
                <el-button type="text" @click="goBack" class="back-btn">
                    <el-icon>
                        <ArrowLeft />
                    </el-icon>
                    返回
                </el-button>
            </div>

            <!-- 加载状态 -->
            <div v-if="loading" class="loading-container">
                <el-skeleton :rows="8" animated />
            </div>

            <!-- 错误状态 -->
            <div v-else-if="error" class="error-container">
                <el-empty description="获取成就详情失败，请稍后重试" />
                <el-button type="primary" @click="fetchAchievementDetail" style="margin-top: 20px;">
                    重新获取
                </el-button>
            </div>

            <!-- 成就详情内容 -->
            <div v-else-if="achievementDetail" class="detail-content">
                <!-- 成就标题 -->
                <h1 class="achievement-title">{{ achievementDetail.competition_name }}</h1>
                
                <!-- 基本信息 -->
                <div class="basic-info">
                    <span class="info-item year">{{ achievementDetail.year }}</span>
                    <span class="info-item type">{{ achievementDetail.participation_type }}</span>
                    <span class="info-item level">{{ achievementDetail.level }}</span>
                </div>
                
                <!-- 成就图片 -->
                <div v-if="achievementDetail.image_url" class="achievement-image-container">
                    <img :src="achievementDetail.image_url" :alt="achievementDetail.competition_name" class="achievement-image" />
                </div>
                <div v-else class="no-image">
                    <el-icon class="no-image-icon"><PictureFilled /></el-icon>
                    <p>暂无成就图片</p>
                </div>
                
                <!-- 详细信息 -->
                <div class="detail-info">
                    <!-- 参与人员 -->
                    <div class="info-section">
                        <h3 class="section-subtitle">参与人员</h3>
                        <p class="info-content">{{ achievementDetail.participants || '暂无参与人员信息' }}</p>
                    </div>
                    
                    <!-- 成就描述 -->
                    <div class="info-section">
                        <h3 class="section-subtitle">成就描述</h3>
                        <p class="info-content">{{ achievementDetail.description || '暂无成就描述' }}</p>
                    </div>
                    
                    <!-- 创建时间 -->
                    <div class="info-section">
                        <h3 class="section-subtitle">创建时间</h3>
                        <p class="info-content">{{ formatDate(achievementDetail.createdAt) }}</p>
                    </div>
                    
                    <!-- 更新时间 -->
                    <div class="info-section">
                        <h3 class="section-subtitle">更新时间</h3>
                        <p class="info-content">{{ formatDate(achievementDetail.updatedAt) }}</p>
                    </div>
                </div>
            </div>
        </main>

        <!-- 底部组件 -->
        <FooterView></FooterView>
    </div>
</template>

<script setup>
import HeaderView from '@/components/HeaderView.vue'
import FooterView from '@/components/FooterView.vue'
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
    ArrowLeft,
    PictureFilled
} from '@element-plus/icons-vue'
import useClubachievementStore from '@/stores/clubachievement'

// 初始化路由
const route = useRoute()
const router = useRouter()

// 初始化状态
const loading = ref(true)
const error = ref(false)
const achievementDetail = ref(null)
const achievementStore = useClubachievementStore()

// 获取成就ID
const achievementId = ref(Number(route.params.id) || 0)

// 返回上一页
const goBack = () => {
    router.go(-1)
}

// 格式化日期
const formatDate = (dateString) => {
    if (!dateString) return ''
    return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 获取成就详情
const fetchAchievementDetail = async () => {
    if (!achievementId.value) {
        error.value = true
        loading.value = false
        return
    }
    
    try {
        loading.value = true
        error.value = false
        
        // 调用仓库方法获取所有成就，然后筛选出当前ID的成就
        // 注意：这里假设仓库没有提供单独获取单个成就的方法，实际项目中应该添加该方法
        const allAchievements = await achievementStore.GetClubAchievement({
            page: 1,
            pageSize: 9999
        })
        
        const achievement = allAchievements?.list?.find(item => item.id === achievementId.value)
        
        if (achievement) {
            achievementDetail.value = achievement
        } else {
            error.value = true
            ElMessage.error('未找到该成就信息')
        }
    } catch (err) {
        console.error('获取成就详情失败：', err)
        error.value = true
        ElMessage.error('获取成就详情失败，请稍后重试')
    } finally {
        loading.value = false
    }
}

// 初始化加载数据
onMounted(() => {
    fetchAchievementDetail()
})
</script>

<style scoped lang="scss">
.container {
    background-color: #f5f7fa;
    min-height: 100vh;
    width: 100vw;
    overflow-x: hidden;
}

.achievement-detail-main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px 15px 60px;
}

.back-btn-container {
    margin-bottom: 30px;
}

.back-btn {
    font-size: 16px;
    color: #606266;
    
    &:hover {
        color: #409eff;
        background-color: rgba(64, 158, 255, 0.1);
    }
}

.loading-container,
.error-container {
    background-color: #fff;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 30px;
}

.detail-content {
    background-color: #fff;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.achievement-title {
    font-size: 28px;
    color: #2c3e50;
    margin-bottom: 20px;
    line-height: 1.4;
    font-weight: 600;
}

.basic-info {
    display: flex;
    gap: 15px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.info-item {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    
    &.year {
        background-color: #e6f7ff;
        color: #1890ff;
    }
    
    &.type {
        background-color: #f6ffed;
        color: #52c41a;
    }
    
    &.level {
        background-color: #fff7e6;
        color: #fa8c16;
    }
}

.achievement-image-container {
    margin-bottom: 30px;
    text-align: center;
}

.achievement-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
}

.no-image {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    background-color: #fafafa;
    border-radius: 8px;
    margin-bottom: 30px;
    
    .no-image-icon {
        font-size: 64px;
        color: #c0c4cc;
        margin-bottom: 16px;
    }
    
    p {
        color: #909399;
        font-size: 16px;
        margin: 0;
    }
}

.detail-info {
    display: flex;
    flex-direction: column;
    gap: 25px;
}

.info-section {
    
    .section-subtitle {
        font-size: 18px;
        color: #2c3e50;
        margin-bottom: 12px;
        font-weight: 600;
        padding-left: 10px;
        border-left: 3px solid #3498db;
    }
    
    .info-content {
        font-size: 16px;
        color: #606266;
        line-height: 1.7;
        margin: 0;
        padding: 0 10px;
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .achievement-detail-main {
        padding: 15px 10px 40px;
    }
    
    .detail-content {
        padding: 24px;
    }
    
    .achievement-title {
        font-size: 24px;
    }
    
    .basic-info {
        flex-direction: column;
        gap: 10px;
    }
    
    .info-item {
        display: block;
        text-align: center;
    }
}
</style>