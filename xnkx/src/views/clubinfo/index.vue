<template>
    <div class="container">
        <!-- 头部组件 -->
        <HeaderView></HeaderView>

        <!-- 主体内容 -->
        <main class="overview-main">
            <!-- 页面标题 -->
            <div class="page-title">
                <h1>社团概况</h1>
                <div class="title-line"></div>
            </div>

            <!-- 1. 社团简介（含目的/背景/宗旨） -->
            <section class="section intro-section">
                <h2 class="section-title">
                    <el-icon>
                        <InfoFilled />
                    </el-icon>
                    社团简介
                </h2>
                <div class="intro-content">
                    <div class="intro-img">
                        <br> 
                         <img src="@/assets/images/club.png">
                        <br>
                       <video class="intro-video" src="@/assets/video/club.mp4" autoplay controls muted loop playsinline>
                            你的浏览器不支持 video 标签。
                        </video>
                    </div>
                    <div class="intro-text">
                        <!-- 社团成立背景 -->
                        <div class="intro-item">
                            <h3 class="intro-subtitle">成立背景</h3>
                            <p>
                                2012年，随着高校志愿服务体系的完善和计算机技术的普及，为解决校园及周边社区
                                计算机硬件故障维修难、技术服务资源分散的问题，在校团委支持下，“小鸟快修”专业社团应运而生，
                                旨在整合校内计算机专业学生资源，以技术服务社会。
                            </p>
                        </div>
                        <!-- 社团目的 -->
                        <div class="intro-item">
                            <h3 class="intro-subtitle">社团目的</h3>
                            <p>
                                一是为在校学生提供计算机技术实践平台，将课堂知识转化为实际应用能力；二是面向校园师生、
                                周边社区居民提供免费的计算机维修、系统优化等志愿服务；三是助力乡村振兴，为偏远地区学校
                                提供计算机设备维护和技术科普服务。
                            </p>
                        </div>
                        <!-- 社团宗旨 -->
                        <div class="intro-item">
                            <h3 class="intro-subtitle">社团宗旨</h3>
                            <p>
                                以“专业赋能公益，技术服务社会”为核心宗旨，坚持“奉献、友爱、互助、进步”的志愿精神，
                                践行“学以致用、服务他人、成长自我”的理念，打造有温度、有专业、有影响力的校园志愿服务品牌。
                            </p>
                        </div>
                        <!-- 原有简介内容 -->
                        <div class="intro-item">
                            <h3 class="intro-subtitle">发展历程</h3>
                            <p>
                                “小鸟快修”专业社团自2012年9月成立以来，始终以“专业赋能公益”为核心，
                                将计算机技能与志愿服务、乡村振兴深度融合，持续拓展服务边界，逐步打造出兼具专业特色与多元价值的志愿服务品牌，
                                并于2019年获评“河北省教育系统优秀志愿服务组织”。
                            </p>
                            <p>
                                十余年来，社团始终坚持以学生发展为核心，通过丰富的活动和项目实践，
                                提升社员的综合能力，搭建校内外交流桥梁，成为校园文化建设的重要力量。
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 2. 社团各小组介绍 -->
            <section class="section group-section">
                <h2 class="section-title">
                    <el-icon>
                        <UserFilled />
                    </el-icon>
                    社团各小组介绍
                </h2>
                <!-- 加载状态 -->
                <div v-if="groupStore.loading && !groupStore.groupInfo" class="loading-tip">
                    <el-skeleton :rows="3" animated />
                </div>
                <!-- 空状态 -->
                <div v-else-if="groupStore.groupInfo.length === 0" class="empty-tip">暂无小组信息</div>
                <!-- 小组列表 -->
                <div v-else class="department-grid">
                    <el-card v-for="(group, index) in groupStore.groupInfo" :key="index" class="department-card"
                        shadow="hover">
                        <div class="dept-icon">
                            <el-icon :size="50">
                                <UserFilled />
                            </el-icon>
                        </div>
                        <h3 class="dept-name">{{ group.group_name }}</h3>
                        <p class="dept-position">{{ group.group_position || '暂无小组定位' }}</p>
                        <p class="dept-desc">{{ group.function_desc || '暂无小组职能描述' }}</p>
                        <div class="dept-achieve-tag">
                            <el-tag type="success" size="small">核心成果</el-tag>
                            <span class="achieve-content">{{ group.core_achievements || '暂无核心成果' }}</span>
                        </div>
                        <p class="dept-member-count">
                            <i class="el-icon-user">
                            </i>
                            成员数：{{ groupStore.groupMemberCount[group.group_name] || 0 }}
                        </p>
                    </el-card>
                </div>
            </section>

            <!-- 3. 社团管理层（全新样式） -->
            <section class="section leader-section">
                <h2 class="section-title">
                    <el-icon>
                        <Avatar />
                    </el-icon>
                    社团管理层
                </h2>
                <!-- 加载状态（仅缓存未命中且请求中时显示） -->
                <div v-if="(roleStore.loading || loading) && !roleList.length" class="loading-tip">
                    <el-skeleton :rows="3" animated />
                </div>
                <!-- 空状态 -->
                <div v-else-if="leaderList.length === 0" class="empty-tip">暂无管理层信息</div>
                <!-- 管理层列表（卡片式布局） -->
                <div v-else class="leader-container">
                    <div class="leader-card" v-for="(leader, index) in leaderList" :key="index">
                        <!-- 头像区域 -->
                        <div class="leader-avatar-box">
                            <img :src="leader.user.avatar || '@/assets/images/default.png'"
                                :alt="leader.user.nickname" class="leader-avatar-img" />
                            <!-- 职位标签 -->
                            <div class="leader-role-tag">{{ leader.user_role.role_name }}</div>
                        </div>

                        <!-- 信息区域（调整为上下排列） -->
                        <div class="leader-info-box">
                            <h3 class="leader-name">{{ leader.user.nickname || '未设置昵称' }}</h3>
                            <!-- 所属小组与权限：上下排列 -->
                            <div class="leader-meta">
                                <span class="meta-item">
                                    <i class="el-icon-sitemap">
                                    </i>
                                    所属小组：{{ leader.group_name }}
                                </span>
                                <span class="meta-item" v-if="getPermissionDesc(leader.user_role.role_name)">
                                    <i class="el-icon-menu">
                                    </i>
                                    权限：{{ getPermissionDesc(leader.user_role.role_name) }}
                                </span>
                            </div>
                            <!-- 个人描述 -->
                            <p class="leader-desc" v-if="leader.user?.description">
                                {{ leader.user.description }}
                            </p>
                        </div>

                        <!-- 装饰线 -->
                        <div class="leader-divider"></div>
                    </div>
                </div>
            </section>

            <!-- 4. 社团成就（带分页+前端年份筛选） -->
            <section class="section achievement-section">
                <h2 class="section-title">
                    <el-icon>
                        <Trophy />
                    </el-icon>
                    社团成就
                </h2>

                <!-- 成就筛选区域 -->
                <div class="achievement-filter">
                    <el-select v-model="filterYear" placeholder="按年份筛选" clearable>
                        <el-option label="全部年份" value="" />
                        <el-option v-for="year in uniqueYears" :key="year" :label="year" :value="year" />
                    </el-select>
                    <el-select v-model="pageSize" placeholder="每页条数" @change="handlePageSizeChange">
                        <el-option label="5条/页" :value="5" />
                        <el-option label="10条/页" :value="10" />
                        <el-option label="20条/页" :value="20" />
                    </el-select>
                </div>

                <!-- 加载状态（仅缓存未命中且请求中时显示） -->
                <div v-if="achievementStore.loading && !allAchievements.length" class="loading-tip">
                    <el-skeleton :rows="3" animated />
                </div>
                <!-- 数据加载完成后 -->
                <div v-else>
                    <!-- 空状态 -->
                    <div v-if="filteredAchievementList.length === 0" class="empty-tip">暂无社团成就信息</div>
                    <!-- 成就列表 -->
                    <div v-else class="achievement-list">
                        <div class="achievement-item" v-for="(item, index) in paginatedAchievementList"
                            :key="item.id || index"
                            @click="goToAchievementDetail(item.id)">
                            <!-- 成就图片 -->
                            <div class="achievement-image-wrapper">
                                <img v-if="item.image_url" :src="item.image_url" :alt="item.competition_name" class="achievement-image" />
                                <div v-else class="no-image">
                                    <el-icon class="no-image-icon"><PictureFilled /></el-icon>
                                </div>
                            </div>
                            
                            <!-- 成就信息 -->
                            <div class="achievement-info">
                                <span class="achievement-year">{{ item.year }}</span>
                                <p class="achievement-content">{{ item.competition_name }}（{{ item.participation_type }} |
                                    {{ item.level }}）</p>
                                <p class="achievement-participants" v-if="item.participants">
                                    参与人员：{{ item.participants }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- 分页控件 -->
                    <div class="pagination-container">
                        <el-pagination @size-change="handlePageSizeChange" @current-change="handlePageChange"
                            :current-page="currentPage" :page-sizes="[5, 10, 20]" :page-size="pageSize"
                            layout="total, sizes, prev, pager, next, jumper" :total="filteredAchievementList.length" />
                    </div>
                </div>
            </section>

            <!-- 5. 加入我们 -->
            <section class="section join-section">
                <h2 class="section-title">
                    <el-icon>
                        <CirclePlusFilled />
                    </el-icon>
                    加入我们
                </h2>
                <div class="join-content">
                    <div class="join-text">
                        <p>如果你热爱生活、乐于探索、渴望成长，欢迎加入我们的大家庭！</p>
                        <p>招新时间：每年9月开学季</p>
                        <p>咨询方式：QQ群 123456789 | 邮箱：club@school.edu.cn</p>
                    </div>
                    <!-- 点击跳转纳新页面 -->
                    <button class="join-btn" @click="goToRecruitPage">立即报名</button>
                </div>
            </section>
        </main>

        <!-- 底部组件 -->
        <FooterView></FooterView>
    </div>
</template>

<script setup>
import HeaderView from '@/components/HeaderView.vue'
import FooterView from '@/components/FooterView.vue'
import { onMounted, computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
// 导入Pinia仓库
import useGroupStore from '@/stores/group'
import useClubachievementStore from '@/stores/clubachievement'
import useRoleStore from '@/stores/role'
// 导入接口（若仓库已封装，可不用直接导入）
import { getRoleInfo } from '@/api/role'
import {
    InfoFilled,
    UserFilled,
    Avatar,
    Trophy,
    CirclePlusFilled,
    PictureFilled
} from '@element-plus/icons-vue'

// 缓存配置
const CACHE_EXPIRE_TIME = 3600000 // 缓存有效期1小时
const CACHE_KEYS = {
    ROLE: 'club_role_data',
    GROUP: 'club_group_data',
    ACHIEVEMENT: 'club_achievement_data'
}

// 初始化路由
const router = useRouter()

// 初始化Pinia仓库
const groupStore = useGroupStore()
const achievementStore = useClubachievementStore()
const roleStore = useRoleStore()

// 初始化状态
const roleList = ref([]) // 存储所有角色信息
const loading = ref(false) // 管理层加载状态（仅请求时为true）

// 成就分页参数（默认5条/页）
const currentPage = ref(1)
const pageSize = ref(5)
const filterYear = ref('')
const allAchievements = ref([]) // 存储全量成就数据

// ========== 核心缓存方法 ==========
// 读取本地缓存
const getCache = (key) => {
    try {
        const cacheStr = localStorage.getItem(key)
        if (!cacheStr) return null

        const cacheData = JSON.parse(cacheStr)
        // 检查缓存是否过期
        if (Date.now() - cacheData.timestamp > CACHE_EXPIRE_TIME) {
            localStorage.removeItem(key) // 清理过期缓存
            return null
        }
        return cacheData.data
    } catch (e) {
        console.error('读取缓存失败：', e)
        return null
    }
}

// 写入本地缓存
const setCache = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify({
            data,
            timestamp: Date.now()
        }))
    } catch (e) {
        console.error('写入缓存失败：', e)
    }
}

// ========== 业务逻辑方法 ==========
// 跳转纳新页面事件
const goToRecruitPage = () => {
    router.push('/club/recruit').catch(err => {
        if (err.name !== 'NavigationDuplicated') {
            ElMessage.error('跳转纳新页面失败，请稍后重试')
        }
    })
}

// 跳转成就详情页面
const goToAchievementDetail = (id) => {
    router.push(`/achievement/${id}`).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
            ElMessage.error('跳转成就详情失败，请稍后重试')
        }
    })
}

// 获取角色信息（优先缓存）
const getRole = async (forceRefresh = false) => {
    // 强制刷新时跳过缓存
    if (!forceRefresh) {
        const cacheRoleData = getCache(CACHE_KEYS.ROLE)
        if (cacheRoleData) {
            roleList.value = cacheRoleData
            return
        }
    }
    // 1. 优先读取缓存
    const cacheRoleData = getCache(CACHE_KEYS.ROLE)
    if (cacheRoleData) {
        roleList.value = cacheRoleData
        return
    }

    // 2. 缓存未命中，请求接口
    try {
        loading.value = true
        const res = await roleStore.GetRoleInfo()
        const roleData = res?.data || (await getRoleInfo()).data?.data || []
        roleList.value = roleData
        // 写入缓存
        setCache(CACHE_KEYS.ROLE, roleData)
    } catch (error) {
        console.error('获取角色信息失败：', error.message)
        ElMessage.error('获取角色信息失败，请稍后重试')
        roleList.value = []
    } finally {
        loading.value = false
    }
}

// 根据角色名称获取权限描述
const getPermissionDesc = (roleName) => {
    if (!roleName || !roleList.value.length) return ''
    const role = roleList.value.find(item => item.role_name === roleName)
    return role?.permission_desc || ''
}

// 动态生成管理层列表：筛选role_name不是“组员”“管理员”的用户
const leaderList = computed(() => {
    if (!groupStore.groupMemberShow || !roleList.value.length) return []
    let leaders = []
    groupStore.groupMemberShow.forEach(group => {
        if (group.member_shows && Array.isArray(group.member_shows)) {
            group.member_shows.forEach(member => {
                const roleName = member.user_role?.role_name
                if (roleName && !['组员', '管理员','普通用户'].includes(roleName)) {
                    leaders.push({
                        ...member,
                        group_name: group.group_name
                    })
                }
            })
        }
    })
    return leaders
})
// console.log(groupStore.groupMemberShow);

// 提取所有唯一年份（用于筛选下拉框）
const uniqueYears = computed(() => {
    if (!allAchievements.value.length) return []
    const years = new Set()
    allAchievements.value.forEach(item => years.add(item.year))
    return Array.from(years).sort((a, b) => b - a)
})

// 前端筛选成就数据（按年份）
const filteredAchievementList = computed(() => {
    if (!allAchievements.value.length) return []
    if (!filterYear.value) return allAchievements.value
    return allAchievements.value.filter(item => item.year === Number(filterYear.value))
})

// 分页后的成就列表
const paginatedAchievementList = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredAchievementList.value.slice(start, end)
})

// 成就分页事件处理
const handlePageChange = (val) => {
    currentPage.value = val
}

// 每页条数切换事件（修复类型错误）
const handlePageSizeChange = (val) => {
    pageSize.value = Number(val) // 强制转为数字
    currentPage.value = 1
}

// 年份筛选事件
watch(filterYear, () => {
    currentPage.value = 1
})

// 统一请求成就数据（优先缓存）
const fetchAchievementData = async (forceRefresh = false) => {
    // 1. 优先读取缓存
    if (!forceRefresh) {
        const cacheAchievementData = getCache(CACHE_KEYS.ACHIEVEMENT)
        if (cacheAchievementData) {
            allAchievements.value = cacheAchievementData
            return
        }
    }
 

    // 2. 缓存未命中，请求接口
    try {
        achievementStore.loading = true
        // 请求全量数据
        const res = await achievementStore.GetClubAchievement({
            page: 1,
            pageSize: 9999
        })
        const achievementData = res?.data?.list || achievementStore.clubachievementInfo?.list || []
        allAchievements.value = achievementData
        // 写入缓存
        setCache(CACHE_KEYS.ACHIEVEMENT, achievementData)
    } catch (error) {
        console.error('获取成就数据失败：', error)
        ElMessage.error('获取成就数据失败，请稍后重试')
        allAchievements.value = []
    } finally {
        achievementStore.loading = false
    }
}

// 获取小组数据（优先缓存）
const fetchGroupData = async (forceRefresh = false) => {
    // 1. 优先读取缓存
    if (!forceRefresh) {
        const cacheGroupData = getCache(CACHE_KEYS.GROUP)
        if (cacheGroupData) {
            groupStore.$patch({
                groupInfo: cacheGroupData.groupInfo,
                groupMemberShow: cacheGroupData.groupMemberShow,
                groupMemberCount: cacheGroupData.groupMemberCount
            })
            return
        }
    }

  

    // 2. 缓存未命中，请求接口
    try {
        // 修复：使用正确的loading状态赋值方式
        await groupStore.GetGroupInfo()
        // 修复：GetGroupMemberShow方法已支持无参数调用
        await groupStore.GetGroupMemberShow()
        // 写入缓存
        setCache(CACHE_KEYS.GROUP, {
            groupInfo: groupStore.groupInfo,
            groupMemberShow: groupStore.groupMemberShow,
            groupMemberCount: groupStore.groupMemberCount
        })
    } catch (error) {
        console.error('获取小组数据失败：', error)
        ElMessage.error('获取小组数据失败，请稍后重试')
    } finally {
        // 修复：使用正确的loading状态赋值方式
    }
}
// groupStore.GetGroupMemberShow()
// 监听角色列表变化，更新管理层信息（非深度监听，优化性能）
watch(roleList, () => {
    // console.log('角色列表更新：', roleList.value)
})

// 初始化加载所有数据（优先缓存）
onMounted(async () => {
    try {
        // 并行加载缓存数据（无请求时不阻塞）
        await Promise.all([
            getRole(true), // 角色数据（优先缓存）
            fetchGroupData(true), // 小组数据（优先缓存）
            fetchAchievementData(true) // 成就数据（优先缓存）
        ])
    } catch (error) {
        console.error('页面初始化数据加载失败：', error.message)
        ElMessage.error('数据加载失败，请刷新页面重试')
    }
})
</script>

<style scoped lang="scss">
// 全局容器
.container {
    background-color: #f5f7fa;
    min-height: 100vh;
    width: 100vw;
    overflow-x: hidden;
}

.overview-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px 15px;
}

// 页面标题
.page-title {
    text-align: center;
    margin-bottom: 40px;

    h1 {
        font-size: 32px;
        color: #2c3e50;
        margin-bottom: 10px;
        font-weight: 600;
    }

    .title-line {
        width: 80px;
        height: 3px;
        background-color: #3498db;
        margin: 0 auto;
    }
}

// 通用章节样式
.section {
    background-color: #fff;
    border-radius: 12px;
    padding: 30px 20px;
    margin-bottom: 30px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

    .section-title {
        font-size: 22px;
        color: #2c3e50;
        margin-bottom: 20px;
        padding-left: 10px;
        border-left: 4px solid #3498db;
        display: flex;
        align-items: center;

        .el-icon {
            margin-right: 10px;
            color: #3498db;
            font-size: 20px;
        }
    }
}

// 加载/空状态通用样式
.loading-tip,
.empty-tip {
    text-align: center;
    padding: 30px 0;
    font-size: 14px;
    border-radius: 8px;

    &.loading-tip {
        background-color: #f8f9fa;
    }

    &.empty-tip {
        color: #999;
        background-color: #f8f9fa;
    }
}

// 社团简介样式
.intro-content {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;

    .intro-img {
        flex: 1;
        min-width: 300px;

        img,
        .intro-video {
            width: 100%;
            height: 250px;
            object-fit: cover;
            border-radius: 8px;
            display: block;
        }
    }

    .intro-text {
        flex: 2;
        min-width: 300px;
        line-height: 1.8;
        color: #555;
        font-size: 15px;

        .intro-item {
            margin-bottom: 20px;

            &:last-child {
                margin-bottom: 0;
            }

            .intro-subtitle {
                font-size: 16px;
                color: #2c3e50;
                margin-bottom: 8px;
                font-weight: 600;
                display: flex;
                align-items: center;

                &::before {
                    content: '';
                    display: inline-block;
                    width: 4px;
                    height: 16px;
                    background-color: #3498db;
                    margin-right: 8px;
                    border-radius: 2px;
                }
            }

            p {
                margin-bottom: 10px;

                &:last-child {
                    margin-bottom: 0;
                }
            }
        }
    }
}

// 小组介绍样式
.department-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;

    .department-card {
        padding: 25px 20px;
        text-align: left;
        transition: all 0.3s ease;
        cursor: pointer;
        border-radius: 8px;

        &:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }

        .dept-icon {
            margin-bottom: 15px;
            color: #409eff;
        }

        .dept-name {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
        }

        .dept-position {
            font-size: 14px;
            color: #3498db;
            margin-bottom: 12px;
            font-weight: 500;
        }

        .dept-desc {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 12px;
        }

        .dept-achieve-tag {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 15px;

            .achieve-content {
                font-size: 13px;
                color: #7f8c8d;
                line-height: 1.5;
            }
        }

        .dept-member-count {
            font-size: 14px;
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 5px;
            font-weight: 500;
        }
    }
}

// 管理层样式调整（核心修改）
.leader-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); // 适配更窄卡片
    gap: 20px;
    padding: 10px 0;
}

.leader-card {
    background-color: #f8f9fa;
    border-radius: 12px;
    padding: 20px 15px; // 减少内边距
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(52, 152, 219, 0.1);
        background-color: #fff;
        border: 1px solid #e8f4fd;
    }
}

// 头像区域（调整标签位置）
.leader-avatar-box {
    position: relative;
    margin-bottom: 15px;

    .leader-avatar-img {
        width: 90px; // 缩小头像
        height: 90px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .leader-role-tag {
        position: absolute;
        bottom: 0; // 调整为头像底部
        right: 0;
        background-color: #3498db;
        color: #fff;
        font-size: 12px;
        padding: 3px 8px;
        border-radius: 15px;
        box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
        transform: translate(10%, 10%); // 微调位置
    }
}

// 信息区域（上下排列样式）
.leader-info-box {
    text-align: center;
    width: 100%;

    .leader-name {
        font-size: 17px;
        color: #2c3e50;
        font-weight: 600;
        margin-bottom: 10px;
    }

    // 所属小组与权限：上下排列
    .leader-meta {
        display: flex;
        flex-direction: column; // 改为纵向排列
        gap: 4px; // 上下间距
        font-size: 13px;
        color: #666;
        margin-bottom: 8px;

        .meta-item {
            display: flex;
            align-items: center;
            justify-content: center; // 居中对齐
            gap: 4px;

            .el-icon {
                font-size: 12px;
                color: #3498db;
            }
        }
    }

    .leader-desc {
        font-size: 13px;
        color: #7f8c8d;
        line-height: 1.5;
        padding: 8px 10px;
        background-color: #f0f7ff;
        border-radius: 6px;
        margin-top: 5px;
    }
}

// 装饰线
.leader-divider {
    width: 60%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #3498db, transparent);
    margin-top: 12px;
}

// 社团成就（带分页样式）
.achievement-filter {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    align-items: center;

    .el-select {
        width: 150px;
    }
}

.achievement-list {
    .achievement-item {
        display: flex;
        align-items: flex-start;
        padding: 20px 15px;
        border-bottom: 1px dashed #eee;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;

        &:last-child {
            border-bottom: none;
        }
        
        &:hover {
            background-color: #f8f9fa;
            transform: translateX(5px);
        }

        // 成就图片容器
        .achievement-image-wrapper {
            width: 120px;
            height: 120px;
            margin-right: 20px;
            flex-shrink: 0;
            border-radius: 8px;
            overflow: hidden;
            background-color: #f5f7fa;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            
            .achievement-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }
            
            &:hover .achievement-image {
                transform: scale(1.05);
            }
            
            .no-image {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #f5f7fa;
                
                .no-image-icon {
                    font-size: 40px;
                    color: #c0c4cc;
                }
            }
        }
        
        // 成就信息
        .achievement-info {
            flex: 1;
            min-width: 0;
            
            .achievement-year {
                font-size: 18px;
                font-weight: 600;
                color: #3498db;
                margin-bottom: 8px;
                display: inline-block;
                background-color: #f0f7ff;
                padding: 4px 12px;
                border-radius: 15px;
                width: fit-content;
            }

            .achievement-content {
                color: #2c3e50;
                line-height: 1.6;
                font-size: 15px;
                margin-bottom: 6px;
                font-weight: 500;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }

            .achievement-participants {
                color: #666;
                font-size: 14px;
                line-height: 1.5;
                margin: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    padding: 10px 0;
}

// 加入我们
.join-content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    .join-text {
        flex: 2;
        min-width: 300px;

        p {
            color: #555;
            line-height: 1.8;
            font-size: 15px;
            margin-bottom: 8px;
        }
    }

    .join-btn {
        flex: 1;
        min-width: 150px;
        padding: 12px 30px;
        background-color: #3498db;
        color: #fff;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:hover {
            background-color: #2980b9;
        }
    }
}

// 响应式适配
@media (max-width: 768px) {
    .overview-main {
        padding: 15px 10px;
    }

    .page-title h1 {
        font-size: 26px;
    }

    .section {
        padding: 20px 15px;
    }

    .section-title {
        font-size: 20px;
    }

    .leader-container {
        grid-template-columns: 1fr;
    }

    .leader-card {
        padding: 15px;
    }

    .leader-avatar-img {
        width: 80px;
        height: 80px !important;
    }

    .achievement-filter {
        flex-direction: column;
        align-items: flex-start;

        .el-select {
            width: 100%;
            margin-bottom: 10px;
        }
    }

    .achievement-item {
        padding: 15px 10px !important;

        .achievement-year {
            font-size: 16px;
            padding: 3px 10px;
        }

        .achievement-content {
            font-size: 14px;
        }

        .achievement-participants {
            font-size: 13px;
        }
    }

    .pagination-container {
        padding: 0;

        .el-pagination {
            font-size: 12px;
        }
    }
}
</style>