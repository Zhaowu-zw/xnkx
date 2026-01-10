<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// 数字404的动画效果控制
const isAnimated = ref(false);
const router = useRouter();

onMounted(() => {
    // 页面加载后触发动画
    setTimeout(() => {
        isAnimated.value = true;
    }, 300);
});

function goHome() {
    router.push('/');
}

function goBack() {
    // 尝试使用 router.back，若不可用回退到 history
    if (router && typeof router.back === 'function') {
        router.back();
    } else {
        window.history.back();
    }
}
</script>

<template>
    <!-- 新增全屏容器：确保内容始终居中 -->
    <div class="not-found-wrapper">
        <!-- 404数字展示 -->
        <div class="error-code" :class="{ animated: isAnimated }" aria-hidden="true">
            <span class="digit">4</span>
            <span class="digit zero">0</span>
            <span class="digit">4</span>
        </div>

        <!-- 标题和描述 -->
        <h1 id="error-title" class="error-title">页面走失啦～</h1>
        <p class="error-desc">你访问的页面不存在、已被删除或链接错误。</p>

        <!-- 引导按钮 -->
        <div class="action-buttons">
            <button type="button" @click="goHome" class="btn back-home" aria-label="返回首页">返回首页</button>
            <button type="button" @click="goBack" class="btn go-back" aria-label="返回上一页">返回上一页</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
// 新增：全屏容器（核心居中样式）
.not-found-wrapper {
    width: 100vw; // 占满屏幕宽度
    min-height: 100vh; // 占满屏幕高度（内容不足时也全屏）
    display: flex; // 开启Flex布局
    flex-direction: column; // 子元素垂直排列
    justify-content: center; // 垂直居中（主轴居中）
    align-items: center; // 水平居中（交叉轴居中）
    box-sizing: border-box; // 避免padding导致溢出
    background-color: var(--color-background); // 继承全局背景色（适配深浅模式）
}

// 组件容器与样式（使用全局 CSS 变量以匹配主题）
.error-code {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;

    .digit {
        font-size: clamp(5.5rem, 18vw, 11rem);
        font-weight: 700;
        color: var(--color-heading, #4a6cf7);
        position: relative;

        &.zero {
            color: var(--color-border-hover, #ff6b6b);
            margin: 0 1rem;
        }
    }

    &.animated {
        .digit {
            animation: bounce 0.8s ease forwards;
            opacity: 0;

            &:nth-child(1) {
                animation-delay: 0.2s;
            }

            &:nth-child(2) {
                animation-delay: 0.5s;
            }

            &:nth-child(3) {
                animation-delay: 0.8s;
            }
        }
    }
}

.error-title {
    font-size: clamp(1.6rem, 4.5vw, 2.4rem);
    color: var(--color-heading, #2d3748);
    margin: 1rem 0 0.5rem;
    font-weight: 700;
    text-align: center; // 确保小屏幕文字也居中
}

.error-desc {
    font-size: clamp(0.95rem, 2vw, 1.15rem);
    color: var(--color-text, #4a5568);
    max-width: 600px;
    margin: 0 auto 1.5rem;
    line-height: 1.6;
    text-align: center; // 确保小屏幕文字也居中
}

.action-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
}

.btn {
    padding: 0.7rem 1.25rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    cursor: pointer;
    border: 0;

    &.back-home {
        background-color: var(--color-heading, #4a6cf7);
        color: var(--color-text-dark-1, #fff);

        &:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(74, 108, 247, 0.18);
        }
    }

    &.go-back {
        background-color: transparent;
        color: var(--color-heading, #4a6cf7);
        border: 2px solid var(--color-heading, #4a6cf7);

        &:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 18px rgba(74, 108, 247, 0.08);
        }
    }
}

@keyframes bounce {
    0% {
        opacity: 0;
        transform: scale(0.5) translateY(30px);
    }

    70% {
        transform: scale(1.1) translateY(-10px);
    }

    100% {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@media (max-width: 768px) {
    .action-buttons {
        flex-direction: column;
        width: 100%;
        max-width: 320px;
    }

    .btn {
        width: 100%;
    }

    .error-code .digit {
        margin: 0 0.25rem;
    }

    .not-found-wrapper {
        padding: 1rem; // 防止小屏幕内容贴边
    }
}
</style>