<template>
    <div class="manager-page">
        <div class="page-header">
            <h2 class="page-title">{{ title }}</h2>
            <!-- 操作按钮插槽：用于放置新增/导入等按钮 -->
            <div class="page-actions">
                <slot name="actions"></slot>
            </div>
        </div>
        <slot />
    </div>
</template>

<script setup>
import { defineProps } from 'vue'
defineProps({
    title: {
        type: String,
        required: true,
        default: '管理页面'
    }
})
</script>

<style scoped lang="scss">
$mobile-break: 480px;
$tablet-break: 768px;
$desktop-break: 1200px;

.manager-page {
    --primary-bg: #f5f7fa;
    --card-radius: 8px;
    --base-padding: 20px;
    --mobile-padding: 10px;
    --base-font-size: 14px;
    --mobile-font-size: 12px;

    font-size: var(--base-font-size);
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: var(--base-padding);

    @media (max-width: $desktop-break) {
        --base-padding: 16px;
    }

    @media (max-width: $tablet-break) {
        padding: var(--mobile-padding);
        min-height: calc(100vh - 70px);
        font-size: var(--mobile-font-size);
        gap: 12px;
    }

    @media (max-width: $mobile-break) {
        --base-padding: 8px;
        gap: 8px;
    }
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.page-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;

    @media (max-width: $tablet-break) {
        font-size: 16px;
    }

    @media (max-width: $mobile-break) {
        font-size: 14px;
    }
}

.page-actions {
    display: flex;
    gap: 8px;
}
</style>