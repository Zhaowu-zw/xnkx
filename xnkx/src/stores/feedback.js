import { defineStore } from 'pinia';
import { ref } from 'vue';
import { subFeedback, viewFeedback, putFeedback, deleteFeedback } from '@/api/feedback'

const useFeedbackStore = defineStore('feedback', () => {
    // 状态管理
    const feedbackList = ref([]);
    const loading = ref(false);
    const currentFeedback = ref(null);
    const total = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const searchParams = ref({});

    // 提交反馈
    const SubFeedback = async(data) => {
        try {
            loading.value = true;
            const res = await subFeedback(data);
            if (res.code !== 200) {
                return Promise.reject(new Error(res.message || '提交反馈失败'));
            }
            return res.data;
        } catch (error) {
            return Promise.reject(new Error(error.message || '提交反馈失败'));
        } finally {
            loading.value = false;
        }
    }

    // 获取反馈列表
    const GetFeedbackList = async(params = {}) => {
        try {
            loading.value = true;
            // 合并参数
            const queryParams = {
                ...searchParams.value,
                ...params,
                page: params.page || currentPage.value,
                pageSize: params.pageSize || pageSize.value
            };
            const res = await viewFeedback(queryParams);
            if (res.code === 200) {
                feedbackList.value = res.data.list;
                total.value = res.data.total;
                currentPage.value = res.data.currentPage;
                pageSize.value = res.data.pageSize;
                return res.data;
            } else {
                return Promise.reject(new Error(res.message || '获取反馈列表失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error.message || '获取反馈列表失败'));
        } finally {
            loading.value = false;
        }
    }

    // 处理反馈
    const HandleFeedback = async(id, data) => {
        try {
            loading.value = true;
            const res = await putFeedback(id, data);
            if (res.code === 200) {
                // 更新成功后刷新列表
                await GetFeedbackList();
                return res.data;
            } else {
                return Promise.reject(new Error(res.message || '处理反馈失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error.message || '处理反馈失败'));
        } finally {
            loading.value = false;
        }
    }

    // 删除反馈
    const DeleteFeedback = async(id) => {
        try {
            loading.value = true;
            const res = await deleteFeedback(id);
            if (res.code === 200) {
                // 删除成功后刷新列表
                await GetFeedbackList();
                return res.data;
            } else {
                return Promise.reject(new Error(res.message || '删除反馈失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error.message || '删除反馈失败'));
        } finally {
            loading.value = false;
        }
    }

    // 设置搜索参数
    const SetSearchParams = (params) => {
        searchParams.value = params;
        currentPage.value = 1;
    }

    // 重置状态
    const ResetFeedbackStore = () => {
        feedbackList.value = [];
        loading.value = false;
        currentFeedback.value = null;
        total.value = 0;
        currentPage.value = 1;
        pageSize.value = 10;
        searchParams.value = {};
    }

    return {
        // 状态
        feedbackList,
        loading,
        currentFeedback,
        total,
        currentPage,
        pageSize,
        searchParams,
        // 方法
        SubFeedback,
        GetFeedbackList,
        HandleFeedback,
        DeleteFeedback,
        SetSearchParams,
        ResetFeedbackStore
    }
})

export default useFeedbackStore;