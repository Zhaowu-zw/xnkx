<template>
    <router-view :key="$route.fullPath + '-' + refreshKey" />
</template>

<script setup>
import { ref } from 'vue'

// 刷新key，用于触发组件重新挂载
const refreshKey = ref(0)
</script>

<style scoped></style>
