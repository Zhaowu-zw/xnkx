<template>
    <div class="policy-layout">
        <!-- 页面头部 -->
        <div class="policy-header">
            <div class="container">
                <h1 class="policy-title">{{ title }}</h1>
                <p class="policy-update">最后更新时间：{{ updateTime }}</p>
            </div>
        </div>

        <!-- 内容区域（由子页面填充） -->
        <div class="policy-content">
            <div class="container">
                <slot></slot> <!-- 插槽：子页面的具体条款内容 -->
            </div>
        </div>

        <!-- 返回顶部按钮 -->
        <button class="back-to-top" @click="scrollToTop" v-show="showBackToTop">
            <!-- 修复：使用纯CSS图标（无需依赖） -->
            <span class="icon-arrow-up"></span>
        </button>

        <!-- 底部（复用之前的footer组件） -->
        <Footer />
    </div>
</template>

<script setup>
// 修复1：正确导入需要的组合式API
import { ref, onMounted, onUnmounted } from 'vue';
// 注意：确保路径和文件名与实际一致（推荐改为 kebab-case 命名）
import Footer from '@/components/FooterView.vue';

// 接收父页面传递的 props
// eslint-disable-next-line no-unused-vars
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    updateTime: {
        type: String,
        default: '2025-01-01'
    }
});

// 返回顶部相关
const showBackToTop = ref(false);

// 修复1：定义滚动监听处理函数
const handleScroll = () => {
    // 监听浏览器窗口滚动高度，而非组件内部
    showBackToTop.value = window.scrollY > 300;
};

// 修复1：组件挂载时添加滚动监听
onMounted(() => {
    window.addEventListener('scroll', handleScroll);
});

// 修复1：组件卸载时移除滚动监听（避免内存泄漏）
onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});

// 滚动到顶部
const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};
</script>

<style scoped lang="scss">
.policy-layout {
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    color: #333;
    background-color: #f8f9fa;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.policy-header {
    background-color: #fff;
    border-bottom: 1px solid #eee;
    padding: 2rem 0;

    .container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 1.5rem;
    }

    .policy-title {
        font-size: 1.8rem;
        color: #2c3e50;
        margin: 0 0 0.5rem;
        font-weight: 600;
    }

    .policy-update {
        font-size: 0.9rem;
        color: #999;
        margin: 0;
    }
}

.policy-content {
    flex: 1;
    padding: 3rem 0;

    .container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 1.5rem;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        padding: 2.5rem;
    }
}

// 返回顶部按钮
.back-to-top {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: #42b983;
    color: #fff;
    border: none;
    outline: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 100;

    &:hover {
        background-color: #359469;
        transform: translateY(-2px);
    }
}

// 修复2：纯CSS实现箭头图标（无需引入图标库）
.icon-arrow-up {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-top: 2px solid #fff;
    border-right: 2px solid #fff;
    transform: rotate(-45deg);
}

// 条款内容基础样式（子页面可继承）
:deep(p) {
    line-height: 1.8;
    margin: 1rem 0;
    font-size: 0.95rem;
}

:deep(h2) {
    font-size: 1.4rem;
    color: #2c3e50;
    margin: 2rem 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
}

:deep(h3) {
    font-size: 1.1rem;
    color: #333;
    margin: 1.5rem 0 0.8rem;
}

:deep(ul) {
    margin: 1rem 0;
    padding-left: 1.5rem;

    li {
        line-height: 1.8;
        margin: 0.5rem 0;
        font-size: 0.95rem;
    }
}
</style>