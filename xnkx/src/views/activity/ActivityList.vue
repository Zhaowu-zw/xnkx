<template>
    <div class="activity-list-page">
        <!-- 头部组件 -->
        <HeaderView></HeaderView>

        <!-- 页面主体 -->
        <div class="main-container">
            <!-- 筛选栏 - 新增搜索框 -->
            <div class="filter-bar">
                <div class="filter-left">
                    <h1 class="page-title">社团动态</h1>

                    <!-- 🌟 新增：动态名称搜索框 -->
                    <el-input v-model="searchKeyword" placeholder="请输入动态名称搜索" clearable
                        style="width: 280px; margin-left: 20px;" @keyup.enter="handleSearch" :prefix-icon="Search" 
                        >
                        <template #append>
                            <el-button :icon="Search" @click="handleSearch"></el-button>
                        </template>
                    </el-input>

                    <el-select v-model="filterGroupId" placeholder="请选择部门" clearable
                        style="width: 200px; margin-left: 20px;" :prefix-icon="OfficeBuilding">
                        <!-- Element Plus 部门图标 -->
                        <el-option v-for="dept in departmentList" :key="dept.id" :label="dept.group_name"
                            :value="dept.id"></el-option>
                    </el-select>

                    <el-select v-model="sortType" placeholder="排序方式" style="width: 150px; margin-left: 20px;"
                        :prefix-icon="Sort">
                        <!-- Element Plus 排序图标 -->
                        <el-option label="最新发布" value="desc"></el-option>
                        <el-option label="最早发布" value="asc"></el-option>
                    </el-select>
                </div>
                <el-button type="primary" @click="resetFilter" :icon="Refresh">重置筛选</el-button>
                <!-- Element Plus 重置图标 -->
            </div>

            <!-- 加载状态 -->
            <div v-if="loading" class="loading-container">
                <el-skeleton active :rows="8" style="width: 100%;"></el-skeleton>
            </div>

            <!-- 错误提示 -->
            <div v-else-if="errorMsg" class="error-container">
                <el-alert :message="errorMsg" type="error" show-icon></el-alert>
                <el-button type="primary" @click="loadActivityList()" style="margin-top: 10px;"
                    icon="Refresh">重新加载</el-button>
            </div>

            <!-- 空数据提示 -->
            <div v-else-if="activityList.length === 0" class="empty-container">
                <el-empty description="暂无动态数据"></el-empty>
            </div>

            <!-- 动态列表 -->
            <div v-else class="activity-card-list">
                <el-card v-for="(item, index) in activityList" :key="index" class="activity-card" shadow="hover"
                    @click="goToDetail(item.id)">
                    <!-- 动态图片展示 -->
                    <div class="activity-images" v-if="item.image_url && item.image_url.length > 0">
                        <img v-for="(url, imgIndex) in item.image_url.slice(0, 3)" :key="imgIndex" :src="url" alt="动态图片"
                            class="activity-img">
                        <span class="img-count" v-if="item.image_url.length > 3">
                            +{{ item.image_url.length - 3 }}
                        </span>
                    </div>

                    <!-- 动态基本信息 -->
                    <div class="activity-info">
                        <div class="info-header">
                            <h2 class="activity-title">{{ item.title }}</h2>
                            <el-tag :style="{
                                backgroundColor: getTagColor(item.group_id),
                                color: '#ffffff',
                                border: 'none'
                            }">
                                {{ getDeptNameById(item.group_id) || '社团' }}
                            </el-tag>
                        </div>

                        <p class="activity-brief">{{ item.brief }}</p>

                        <div class="info-footer">
                            <span class="publish-time">
                                <el-icon>
                                    <Clock />
                                </el-icon> {{ formatTime(item.activity_time) }} <!-- Element Plus 时间图标 -->
                            </span>
                            <span class="creator">
                                <el-icon>
                                    <User />
                                </el-icon> {{ item.creator_nickname || '未知用户' }} <!-- Element Plus 用户图标 -->
                            </span>
                        </div>
                    </div>

                    <!-- 查看详情按钮 -->
                    <div class="card-footer">
                        <el-button type="text" @click.stop="goToDetail(item.id)">
                            <el-icon>
                                <View />
                            </el-icon> 查看详情 <!-- Element Plus 查看图标 -->
                        </el-button>
                    </div>
                </el-card>
            </div>

            <!-- 分页组件 -->
            <div v-if="pagination.total > 0" class="pagination-container">
                <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange"
                    :current-page="pagination.page" :page-sizes="[5, 10, 20, 50]" :page-size="pagination.pageSize"
                    layout="total, sizes, prev, pager, next, jumper" :total="pagination.total">
                </el-pagination>
            </div>
        </div>

        <!-- 底部组件 -->
        <FooterView></FooterView>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// 🌟 导入 Element Plus 图标
import {
    Search, OfficeBuilding, Sort, Refresh, Clock, User, View
} from '@element-plus/icons-vue'
import HeaderView from '@/components/HeaderView.vue'
import FooterView from '@/components/FooterView.vue'
import useActivityStore from '@/stores/activity'
import useGroupStore from '@/stores/group'

// 路由实例
const router = useRouter()

// 仓库实例
const activityStore = useActivityStore()
const groupStore = useGroupStore()

// 页面状态
const loading = ref(false)
const errorMsg = ref('')
const filterGroupId = ref('') // 部门筛选ID
const sortType = ref('desc') // 排序方式：desc-最新，asc-最早
const searchKeyword = ref('') // 🌟 新增：搜索关键词（动态名称）

// 从仓库获取计算属性
const activityList = computed(() => {
    let list = [...activityStore.activityList]

    // 按部门筛选
    if (filterGroupId.value) {
        list = list.filter(item => item.group_id === Number(filterGroupId.value))
    }

    // 按时间排序
    list.sort((a, b) => {
        const timeA = new Date(a.activity_time).getTime()
        const timeB = new Date(b.activity_time).getTime()
        return sortType.value === 'desc' ? timeB - timeA : timeA - timeB
    })

    return list
})
const pagination = computed(() => activityStore.pagination)
const departmentList = computed(() => groupStore.groupInfo || [])

// 工具方法
// 格式化时间
const formatTime = (timeStr) => {
    if (!timeStr) return ''
    return new Date(timeStr).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 根据部门ID获取名称
const getDeptNameById = (deptId) => {
    if (!deptId) return ''
    const dept = departmentList.value.find(item => item.id === deptId)
    return dept?.group_name || ''
}

// 获取部门标签颜色
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

// 🌟 新增：处理搜索（提交关键词到后端）
const handleSearch = () => {
    // 重置分页到第一页
    activityStore.pagination.page = 1
    // 重新加载列表（携带搜索关键词）
    loadActivityList({
        page: 1,
        keyword: searchKeyword.value.trim() // 传递title模糊匹配关键词
    })
}

// 加载动态列表（新增keyword参数）
const loadActivityList = async (params = {}) => {
    try {
        loading.value = true
        errorMsg.value = ''

        // 默认参数：第一页，每页10条 + 搜索关键词
        const queryParams = {
            page: pagination.value.page,
            pageSize: pagination.value.pageSize,
            keyword: searchKeyword.value.trim(), // 携带搜索关键词
            ...params
        }

        await activityStore.GetActivityInfo(queryParams)

        // 首次加载时获取部门列表
        if (!groupStore.groupInfo) {
            await groupStore.GetGroupInfo()
        }

    } catch (error) {
        errorMsg.value = error.message || '加载动态列表失败，请稍后重试'
    } finally {
        loading.value = false
    }
}

// 分页处理
const handleSizeChange = (val) => {
    activityStore.pagination.pageSize = val
    loadActivityList({
        pageSize: val,
        keyword: searchKeyword.value.trim() // 分页时保留搜索关键词
    })
}

const handleCurrentChange = (val) => {
    activityStore.pagination.page = val
    loadActivityList({
        page: val,
        keyword: searchKeyword.value.trim() // 翻页时保留搜索关键词
    })
}

// 重置筛选（清空搜索框）
const resetFilter = () => {
    filterGroupId.value = ''
    sortType.value = 'desc'
    searchKeyword.value = '' // 🌟 新增：清空搜索关键词
    // 重置分页到第一页
    activityStore.pagination.page = 1
    loadActivityList({ page: 1 })
}

// 跳转到详情页
const goToDetail = (id) => {
    router.push({ path: `/activity/detail/${id}` })
}

// 页面挂载时加载数据
onMounted(() => {
    loadActivityList()
})
</script>

<style scoped lang="scss">
.activity-list-page {
    width: 100vw;
    min-height: 100vh;
    background-color: #f5f7fa;
    overflow-x: hidden;

    // 主体容器
    .main-container {
        width: 1200px;
        margin: 40px auto;
        padding-bottom: 60px;

        // 筛选栏
        .filter-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 30px;

            .filter-left {
                display: flex;
                align-items: center;
                flex-wrap: wrap; // 新增：适配小屏幕换行
                gap: 15px; // 新增：统一间距

                .page-title {
                    font-size: 24px;
                    color: #2c3e50;
                    font-weight: 600;
                    margin: 0; // 重置默认margin
                }
            }
        }

        // 加载/错误/空数据容器
        .loading-container,
        .error-container,
        .empty-container {
            padding: 40px 20px;
            text-align: center;
        }

        // 动态列表
        .activity-card-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 24px;
            margin-bottom: 40px;

            .activity-card {
                cursor: pointer;
                transition: transform 0.3s ease, box-shadow 0.3s ease;

                &:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                }

                // 图片展示区
                .activity-images {
                    height: 200px;
                    overflow: hidden;
                    position: relative;
                    border-radius: 4px 4px 0 0;
                    display: flex;

                    .activity-img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        flex: 1;
                        border-right: 1px solid #f5f7fa;

                        &:last-child {
                            border-right: none;
                        }
                    }

                    .img-count {
                        position: absolute;
                        right: 10px;
                        bottom: 10px;
                        background: rgba(0, 0, 0, 0.6);
                        color: #fff;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                    }
                }

                // 信息区
                .activity-info {
                    padding: 20px;

                    .info-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 12px;

                        .activity-title {
                            font-size: 18px;
                            font-weight: 600;
                            color: #2c3e50;
                            flex: 1;
                            margin-right: 10px;
                            display: -webkit-box;
                            -webkit-line-clamp: 1;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                        }

                        :deep(.el-tag) {
                            height: 24px;
                            line-height: 24px;
                            padding: 0 8px;
                            font-size: 12px;
                            font-weight: 500;
                        }
                    }

                    .activity-brief {
                        font-size: 14px;
                        color: #666;
                        line-height: 1.6;
                        margin-bottom: 16px;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    .info-footer {
                        display: flex;
                        justify-content: space-between;
                        font-size: 12px;
                        color: #999;

                        .publish-time,
                        .creator {
                            display: flex;
                            align-items: center;
                            gap: 4px;
                        }
                    }
                }

                // 卡片底部
                .card-footer {
                    padding: 0 20px 20px;
                }
            }
        }

        // 分页容器
        .pagination-container {
            text-align: right;
        }
    }

    // 响应式适配
    @media (max-width: 1200px) {
        .main-container {
            width: 90%;
        }

        .activity-card-list {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
        }
    }

    @media (max-width: 768px) {
        .filter-bar {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 15px;

            .filter-left {
                width: 100%;
            }

            :deep(.el-input),
            :deep(.el-select) {
                width: 100% !important;
                margin-left: 0 !important;
            }
        }

        .activity-card-list {
            grid-template-columns: 1fr !important;
        }
    }
}
</style>