import { defineStore } from 'pinia';
import { ref } from 'vue';
// 导入通知相关接口
import {  deleteNotice, markNotice, getNotice } from '@/api/notice'

const useNoticeStore = defineStore('notice', () => {
    // 通知列表状态（存储查询到的通知数据）- 需持久化
    const noticeList = ref([]);
    // 可选：存储未读通知数量（如需持久化可添加）
    const unreadCount = ref(0);



    /**
     * 删除已读通知
     * @param {Object} params - 删除参数（包含id）
     * @returns {Promise<number|Error>} 成功返回0，失败返回reject
     */
    const DeleteNotice = async (params) => {
        try {
            const res = await deleteNotice(params);
            if (res.code !== 200) {
                return Promise.reject(new Error(res.msg || '删除通知失败'));
            }
            // 删除后更新本地通知列表
            noticeList.value = noticeList.value.filter(item => item.id !== params.id);
            // 更新未读数量
            updateUnreadCount();
            return 0;
        } catch (error) {
            return Promise.reject(new Error(error.message || '删除通知失败'));
        }
    };

    /**
     * 标记通知为已读
     * @param {Object} params - 标记参数（包含id）
     * @returns {Promise<number|Error>} 成功返回0，失败返回reject
     */
    const MarkNotice = async (params) => {
        try {
            const res = await markNotice(params);
            if (res.code !== 200) {
                return Promise.reject(new Error(res.msg || '标记通知已读失败'));
            }
            // 标记后更新本地通知的已读状态
            const targetNotice = noticeList.value.find(item => item.id === params.id);
            if (targetNotice && !targetNotice.is_read) {
                targetNotice.is_read = true;
                // 更新未读数量
                updateUnreadCount();
            }
            return 0;
        } catch (error) {
            return Promise.reject(new Error(error.message || '标记通知已读失败'));
        }
    };

    /**
     * 查询通知列表
     * @returns {Promise<Array|Error>} 成功返回通知列表，失败返回reject
     */
    const GetNotice = async () => {
        try {
            const res = await getNotice();
            // console.log('后端返回的数据:', res.data)
            const noticeArray = Array.from(res.data);
            if (res.code !== 200) {
                return Promise.reject(new Error(res.msg || '查询通知失败'));
            }
            // 存储通知列表到本地状态
            noticeList.value = noticeArray;
            // 更新未读数量
            updateUnreadCount();
            noticeList.value = Array.isArray(res.data) ? res.data : [];
            return res.data;
        } catch (error) {
            return Promise.reject(new Error(error.message || '查询通知失败'));
        }
    };

    /**
     * 辅助方法：更新未读通知数量
     */
    const updateUnreadCount = () => {
        unreadCount.value = noticeList.value.filter(item => !item.is_read).length;
    };

    /**
     * 重置通知仓库状态
     */
    const resetNoticeState = () => {
        noticeList.value = [];
        unreadCount.value = 0;
        // 清空持久化存储
        localStorage.removeItem('notice');
    };

    return {
        // 需持久化的状态
        noticeList,
        unreadCount,
        // 方法
        DeleteNotice,
        MarkNotice,
        GetNotice,
        resetNoticeState
    };
});

export default useNoticeStore;