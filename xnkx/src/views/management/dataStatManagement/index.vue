<template>
    <div class="data-stat-container data-stat-animation">
        <!-- 数据卡片区域（首屏优先渲染） -->
        <el-row :gutter="20" class="stat-card-row">
            <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="(item, index) in statCardList" :key="index"
                class="stat-card-col">
                <el-card class="stat-card" shadow="hover" :class="{ 'card-animation': true }" :style="{ animationDelay: `${index * 0.1}s` }">
                    <div class="stat-card__content">
                        <span class="stat-card__label">{{ item.label }}</span>
                        <span class="stat-card__value">{{ item.value }}</span>
                        <el-tag :type="item.trend > 0 ? 'success' : item.trend < 0 ? 'danger' : 'info'" size="small"
                            class="stat-card__trend">
                            {{ item.trend > 0 ? '+' : '' }}{{ item.trend }}%
                        </el-tag>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 非核心区域（按需渲染 + 图表可视化） -->
        <div ref="lazyRef" class="lazy-container">
            <!-- 刷新按钮 -->
            <el-row class="refresh-row" style="margin-top: 20px;" v-if="isShowLazyContent">
                <el-col :xs="24" style="display: flex; justify-content: flex-end;">
                    <el-button type="primary" size="small" :icon="Refresh" @click="handleRefresh">
                        刷新数据
                    </el-button>
                </el-col>
            </el-row>
            <el-row :gutter="20" class="chart-row" style="margin-top: 20px;" v-if="isShowLazyContent">
                <!-- 用户角色分布（饼图） -->
                <el-col :xs="24" :lg="12" class="chart-col">
                    <el-card shadow="hover" class="chart-card-animation" :style="{ animationDelay: '0.2s' }">
                        <template #header>
                            <span>用户角色分布</span>
                        </template>
                        <div ref="rolePieChart" class="chart-container"></div>
                    </el-card>
                </el-col>

                <!-- 月度活动发布量（柱状图） -->
                <el-col :xs="24" :lg="12" class="chart-col">
                    <el-card shadow="hover" class="chart-card-animation" :style="{ animationDelay: '0.3s' }">
                        <template #header>
                            <span>月度动态发布量</span>
                        </template>
                        <div ref="activityBarChart" class="chart-container"></div>
                    </el-card>
                </el-col>

                <!-- 日访问量趋势（折线图） -->
                <el-col :xs="24" :lg="12" class="chart-col" style="margin-top: 20px;">
                    <el-card shadow="hover" class="chart-card-animation" :style="{ animationDelay: '0.4s' }">
                        <template #header>
                            <span>日访问量趋势（近7天）</span>
                        </template>
                        <div ref="visitLineChart" class="chart-container"></div>
                    </el-card>
                </el-col>

                <!-- 月度新增用户数（柱状图） -->
                <el-col :xs="24" :lg="12" class="chart-col" style="margin-top: 20px;">
                    <el-card shadow="hover" class="chart-card-animation" :style="{ animationDelay: '0.5s' }">
                        <template #header>
                            <span>月度新增用户数</span>
                        </template>
                        <div ref="newUserBarChart" class="chart-container"></div>
                    </el-card>
                </el-col>

                <!-- 各组今年纳新人数（柱状图） -->
                <el-col :xs="24" :lg="12" class="chart-col" style="margin-top: 20px;">
                    <el-card shadow="hover" class="chart-card-animation" :style="{ animationDelay: '0.6s' }">
                        <template #header>
                            <span>各组今年纳新人数</span>
                        </template>
                        <div ref="recruitBarChart" class="chart-container"></div>
                    </el-card>
                </el-col>

                <!-- 新增：各组人员比例（环形图） -->
                <el-col :xs="24" :lg="12" class="chart-col" style="margin-top: 20px;">
                    <el-card shadow="hover" class="chart-card-animation" :style="{ animationDelay: '0.7s' }">
                        <template #header>
                            <span>各组人员比例</span>
                        </template>
                        <div ref="groupRatioChart" class="chart-container"></div>
                    </el-card>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { debounce } from 'lodash';
import { Refresh } from '@element-plus/icons-vue'
// 统计聚合接口（真实接口）
import { getAllStat } from '@/api/access'
// 引入ECharts
import * as echarts from 'echarts';

// -------------------------- 常量定义 --------------------------
const CACHE_KEY = 'stat_data';
const CACHE_EXPIRE = 5 * 60 * 1000; // 5分钟缓存有效期

// -------------------------- 响应式数据 --------------------------
const statCardList = ref([]);
// 图表实例引用
const rolePieChart = ref(null);
const activityBarChart = ref(null);
const visitLineChart = ref(null);
const newUserBarChart = ref(null);
const recruitBarChart = ref(null);
const groupRatioChart = ref(null); // 新增：各组人员比例图表引用
// 图表实例存储（用于销毁）
const chartInstances = ref({});

// 按需渲染控制
const lazyRef = ref(null);
const isShowLazyContent = ref(false);

// -------------------------- 数据处理 & 缓存逻辑 --------------------------
// 加载数据（含缓存逻辑 + 真实接口）
const loadData = async () => {
    try {
        // 1. 优先读取缓存
        const cacheData = sessionStorage.getItem(CACHE_KEY);
        const cacheTime = sessionStorage.getItem(`${CACHE_KEY}_time`);
        if (cacheData && cacheTime && Date.now() - Number(cacheTime) < CACHE_EXPIRE) {
            const data = JSON.parse(cacheData);
            assignData(data);
            ElMessage.success('加载数据成功');
            return;
        }

        // 2. 调用真实接口（核心修改：替换模拟数据为真实接口）
        const res = await getAllStat();
        // 假设接口返回格式：{ code: 200, data: {...} }，根据实际接口调整
        const data = res.code === 200 ? res.data : res;

        // 3. 写入缓存
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        sessionStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());

        // 4. 赋值数据
        assignData(data);
        ElMessage.success('加载最新数据成功');
    } catch (error) {
        console.error('数据加载失败：', error);
        ElMessage.error('数据加载失败，请刷新重试');
        // 加载失败兜底：空数据（避免页面报错）
        assignData({
            cards: [],
            roleDistribution: [],
            monthlyActivity: [],
            dailyVisit: [],
            monthlyNewUser: [],
            groupRecruit: [],
            groupMemberRatio: []
        });
    }
};

// 数据赋值（适配真实接口返回结构）
const assignData = (data) => {
    // 卡片数据
    statCardList.value = data.cards || [];
    // 初始化图表（使用真实接口数据）
    initCharts(data);
};

// -------------------------- 图表初始化 --------------------------
const initCharts = (data) => {
    // 先销毁原有图表实例，避免重复渲染
    Object.values(chartInstances.value).forEach(chart => {
        chart && chart.dispose();
    });
    chartInstances.value = {};

    // 1. 用户角色分布（饼图）
    if (rolePieChart.value && data.roleDistribution?.length) {
        chartInstances.value.rolePie = echarts.init(rolePieChart.value);
        chartInstances.value.rolePie.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
            legend: {
                orient: 'vertical',
                left: 'left',
                textStyle: { fontSize: 12 }
            },
            series: [
                {
                    name: '角色分布',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    data: data.roleDistribution.map(item => ({
                        name: item.roleName,
                        value: item.count,
                        itemStyle: { color: item.color }
                    })),
                    label: {
                        fontSize: 11,
                        formatter: '{b}: {d}%'
                    }
                }
            ]
        });
    }

    // 2. 月度活动发布量（柱状图）
    if (activityBarChart.value && data.monthlyActivity?.length) {
        chartInstances.value.activityBar = echarts.init(activityBarChart.value);
        const months = data.monthlyActivity.map(item => item.month);
        const counts = data.monthlyActivity.map(item => item.count);
        chartInstances.value.activityBar.setOption({
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: months, axisLabel: { fontSize: 12 } },
            yAxis: { type: 'value', min: 0, axisLabel: { fontSize: 12 } },
            series: [
                {
                    name: '活动数',
                    type: 'bar',
                    data: counts,
                    itemStyle: { color: '#409eff' },
                    label: {
                        show: true,
                        position: 'top',
                        fontSize: 11
                    }
                }
            ]
        });
    }

    // 3. 日访问量趋势（折线图）
    if (visitLineChart.value && data.dailyVisit?.length) {
        chartInstances.value.visitLine = echarts.init(visitLineChart.value);
        const dates = data.dailyVisit.map(item => item.date);
        const visitCounts = data.dailyVisit.map(item => item.visitCount);
        chartInstances.value.visitLine.setOption({
            tooltip: { 
                trigger: 'axis',
                formatter: '{b}：{c}次'
            },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 12 } },
            yAxis: { type: 'value', min: Math.min(...visitCounts) > 0 ? Math.min(...visitCounts) - 5 : 0, axisLabel: { fontSize: 12 } },
            series: [
                {
                    name: '访问量',
                    type: 'line',
                    data: visitCounts,
                    smooth: true,
                    itemStyle: { color: '#67c23a' },
                    lineStyle: { width: 2 },
                    symbol: 'circle',
                    symbolSize: 6,
                    label: {
                        show: true,
                        position: 'top',
                        fontSize: 10,
                        color: '#333',
                        formatter: '{c}次'
                    }
                }
            ]
        });
    }

    // 4. 月度新增用户数（柱状图）
    if (newUserBarChart.value && data.monthlyNewUser?.length) {
        chartInstances.value.newUserBar = echarts.init(newUserBarChart.value);
        const months = data.monthlyNewUser.map(item => item.month);
        const counts = data.monthlyNewUser.map(item => item.count);
        chartInstances.value.newUserBar.setOption({
            tooltip: { trigger: 'axis' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: months, axisLabel: { fontSize: 12 } },
            yAxis: { type: 'value', min: 0, axisLabel: { fontSize: 12 } },
            series: [
                {
                    name: '新增用户数',
                    type: 'bar',
                    data: counts,
                    itemStyle: { color: '#e6a23c' },
                    label: {
                        show: true,
                        position: 'top',
                        fontSize: 11
                    }
                }
            ]
        });
    }

    // 5. 各组今年纳新人数（柱状图）
    if (recruitBarChart.value && data.groupRecruit?.length) {
        chartInstances.value.recruitBar = echarts.init(recruitBarChart.value);
        const groupNames = data.groupRecruit.map(item => item.groupName);
        const recruitCounts = data.groupRecruit.map(item => item.recruitCount);
        chartInstances.value.recruitBar.setOption({
            tooltip: { trigger: 'axis', formatter: '{b}：{c}人' },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: groupNames, axisLabel: { fontSize: 12 } },
            yAxis: { type: 'value', min: 0, axisLabel: { fontSize: 12 } },
            series: [
                {
                    name: '纳新人数',
                    type: 'bar',
                    data: recruitCounts,
                    itemStyle: {
                        color: (params) => {
                            const colors = ['#f56c6c', '#e6a23c', '#67c23a', '#409eff', '#909399', '#722ed1'];
                            return colors[params.dataIndex % colors.length];
                        }
                    },
                    label: {
                        show: true,
                        position: 'top',
                        fontSize: 11
                    }
                }
            ]
        });
    }

    // 6. 新增：各组人员比例（环形图）
    if (groupRatioChart.value && data.groupMemberRatio?.length) {
        chartInstances.value.groupRatio = echarts.init(groupRatioChart.value);
        // 计算总人数（用于tooltip显示）
        const totalMembers = data.groupMemberRatio.reduce((sum, item) => sum + item.memberCount, 0);
        // 配色方案（与纳新人数图表保持一致）
        const colors = ['#f56c6c', '#e6a23c', '#67c23a', '#409eff', '#909399', '#722ed1'];

        chartInstances.value.groupRatio.setOption({
            tooltip: {
                trigger: 'item',
                formatter: '{b}<br/>人数：{c}人<br/>占比：{d}%'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                textStyle: { fontSize: 12 }
            },
            series: [
                {
                    name: '各组人员比例',
                    type: 'pie',
                    radius: ['40%', '70%'], // 环形图设置
                    center: ['50%', '50%'],
                    data: data.groupMemberRatio.map((item, index) => ({
                        name: item.groupName,
                        value: item.memberCount,
                        itemStyle: { color: colors[index % colors.length] }
                    })),
                    label: {
                        fontSize: 11,
                        formatter: '{b}: {d}%'
                    },
                    labelLine: { show: true },
                    emphasis: {
                        label: {
                            fontSize: 14,
                            fontWeight: 'bold'
                        }
                    }
                },
                // 中心显示总人数
                {
                    type: 'text',
                    left: 'center',
                    top: 'center',
                    style: {
                        text: totalMembers ? `总人数\n${totalMembers}人` : '暂无数据',
                        fontSize: 14,
                        fontWeight: 600,
                        fill: '#333'
                    }
                }
            ]
        });
    }
};

// 图表自适应
const resizeCharts = () => {
    Object.values(chartInstances.value).forEach(chart => {
        chart && chart.resize();
    });
};

// 刷新数据（防抖处理）
const handleRefresh = debounce(async () => {
    // 清除缓存
    sessionStorage.removeItem(CACHE_KEY);
    sessionStorage.removeItem(`${CACHE_KEY}_time`);
    // 重新加载数据
    await loadData();
    ElMessage.success('数据已刷新');
}, 300);

// -------------------------- 生命周期 & 监听 --------------------------
onMounted(async () => {
    // 1. 加载数据
    await loadData();

    // 2. 监听元素可见性，实现按需渲染
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                isShowLazyContent.value = true;
                observer.disconnect();
            }
        });
    });
    if (lazyRef.value) {
        observer.observe(lazyRef.value);
    }

    // 3. 监听窗口大小变化，调整图表
    window.addEventListener('resize', resizeCharts);
});

onUnmounted(() => {
    // 销毁图表实例，避免内存泄漏
    Object.values(chartInstances.value).forEach(chart => {
        chart && chart.dispose();
    });
    // 移除窗口监听
    window.removeEventListener('resize', resizeCharts);
});
</script>

<style scoped lang="scss">
.data-stat-container {
    padding: 20px;
    background-color: #f5f7fa;
    /* 隐藏滚动条 */
    scrollbar-width: none;
    /* Firefox */
    max-height: 100% !important;
    /* Chrome, Safari, Edge, Opera */
    &::-webkit-scrollbar {
        display: none;
    }

    /* 深色主题适配 */
    .dark-theme & {
        background-color: #1f2937;
    }
}
// 数据卡片样式优化
.stat-card-row {
    .stat-card-col {
        margin-bottom: 16px; // 移动端间距优化
    }

    .stat-card {
        height: 100%;
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }

        .stat-card__content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px 0;

            .stat-card__label {
                font-size: 14px;
                color: #666;
                margin-bottom: 8px;
            }

            .stat-card__value {
                font-size: 28px;
                font-weight: 600;
                color: #333;
                margin-bottom: 6px;
            }

            .stat-card__trend {
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 4px;
            }
        }
    }
}

// 图表区域样式
.chart-row {
    .chart-col {
        .el-card {
            height: 100%;
            border-radius: 8px;
            overflow: hidden;

            :deep(.el-card__header) {
                background-color: #f8f9fa;
                border-bottom: 1px solid #ebeef5;
                padding: 12px 16px;
                font-weight: 500;
            }

            .chart-container {
                width: 100%;
                height: 300px; // 图表默认高度
                padding: 10px;
            }
        }
    }
}

// 刷新按钮行
.refresh-row {
    .el-button {
        border-radius: 6px;
        padding: 8px 16px;
    }
}

// 响应式适配
@media (max-width: 768px) {
    .data-stat-container {
        padding: 10px;
    }

    .chart-row {
        .chart-col {
            .el-card {
                .chart-container {
                    height: 250px;
                }
            }
        }
    }
}

@media (max-width: 480px) {
    .stat-card__value {
        font-size: 24px !important;
    }

    .chart-row {
        .chart-col {
            .el-card {
                .chart-container {
                    height: 200px;
                }
            }
        }
    }

    // 移动端图例位置调整（避免遮挡）
    :deep(.el-card .ec-legend) {
        orient: horizontal !important;
        left: 'center' !important;
        top: 'bottom' !important;
        width: 100% !important;
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
    }
}

// 数据统计模块动画效果
.data-stat-animation {
    animation: dataStatFadeIn 0.6s ease-out;
}

// 卡片动画
.card-animation {
    opacity: 0;
    animation: cardSlideUp 0.5s ease-out forwards;
}

// 图表卡片动画
.chart-card-animation {
    opacity: 0;
    animation: chartFadeIn 0.6s ease-out forwards;
}

// 数据统计容器动画
@keyframes dataStatFadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// 卡片上滑动画
@keyframes cardSlideUp {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

// 图表淡入动画
@keyframes chartFadeIn {
    from {
        opacity: 0;
        transform: scale(0.98);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>