import { defineStore } from 'pinia';
import { ref } from 'vue';
// 移除ElMessage导入
// import { ElMessage } from 'element-plus';

// 导入接口
import {
    getGroupAchievement,
    publishGroupAchievement,
    putGroupAchievement,
    deleteGroupAchievement,
    uploadAchievementImg
} from '@/api/groupachievement';

// 定义小组成果仓库 + 持久化配置
export const useGroupAchievementStore = defineStore('groupAchievement', () => {
    // ========== 状态管理（需持久化的状态） ==========
    const achievementList = ref([]);
    const loading = ref(false);
    const currentAchievement = ref(null);
    const searchKeyword = ref('');

    // ========== 核心方法 ==========
    /**
     * 1. 获取所有小组成果（支持关键词搜索）
     * @param {Object} params - 搜索参数 { keyword: '' }
     * @returns {Promise<any>} 成功返回成果列表，失败返回reject
     */
    const fetchGroupAchievement = async (params = {}) => {
        try {
            loading.value = true;
            searchKeyword.value = params.keyword || '';
            const res = await getGroupAchievement(params);

            if (res.code === 200) {
                achievementList.value = res.data;
                // 成功：返回res.data
                return res.data;
            } else {
                // 失败：返回Promise.reject
                const errorMsg = res.msg || '获取成果列表失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            console.error('获取小组成果失败：', error);
            // 网络异常：返回Promise.reject
            return Promise.reject(new Error(error.message || '获取成果列表失败'));
        } finally {
            loading.value = false;
        }
    };

    /**
     * 2. 新增小组成果
     * @param {Object} data - 成果数据
     * @param {Function} callback - 新增成功后的回调
     * @returns {Promise<any>} 成功返回新增成果数据，失败返回reject
     */
    const addGroupAchievement = async (data, callback) => {
        try {
            loading.value = true;
            const res = await publishGroupAchievement(data);

            if (res.code === 200 || res.code === 201) {
                // 新增后重新获取列表
                await fetchGroupAchievement({ keyword: searchKeyword.value });
                callback && callback();
                // 成功：返回res.data
                return res.data;
            } else {
                const errorMsg = res.msg || '新增成果失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            console.error('新增小组成果失败：', error);
            return Promise.reject(new Error(error.message || '新增成果失败'));
        } finally {
            loading.value = false;
        }
    };

    /**
     * 3. 修改小组成果信息
     * @param {Object} data - 包含id的成果数据
     * @param {Function} callback - 修改成功后的回调
     * @returns {Promise<any>} 成功返回修改后成果数据，失败返回reject
     */
    const editGroupAchievement = async (data, callback) => {
        try {
            if (!data.id) {
                // 参数校验失败：返回reject
                return Promise.reject(new Error('请选择要修改的成果'));
            }

            loading.value = true;
            const res = await putGroupAchievement(data.id, data);

            if (res.code === 200) {
                await fetchGroupAchievement({ keyword: searchKeyword.value });
                currentAchievement.value = null;
                callback && callback();
                // 成功：返回res.data
                return res.data;
            } else {
                const errorMsg = res.msg || '修改成果失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            console.error('修改小组成果失败：', error);
            return Promise.reject(new Error(error.message || '修改成果失败'));
        } finally {
            loading.value = false;
        }
    };

    /**
     * 4. 删除小组成果
     * @param {Number|String} id - 成果ID
     * @param {Function} callback - 删除成功后的回调
     * @returns {Promise<any>} 成功返回删除结果，失败返回reject
     */
    const removeGroupAchievement = async (id, callback) => {
        try {
            if (!id) {
                return Promise.reject(new Error('请选择要删除的成果'));
            }

            loading.value = true;
            const res = await deleteGroupAchievement(id);

            if (res.code === 200) {
                await fetchGroupAchievement({ keyword: searchKeyword.value });
                callback && callback();
                // 成功：返回res.data
                return res.data;
            } else {
                const errorMsg = res.msg || '删除成果失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            console.error('删除小组成果失败：', error);
            return Promise.reject(new Error(error.message || '删除成果失败'));
        } finally {
            loading.value = false;
        }
    };

    /**
     * 5. 上传成果图片
     * @param {FormData} formData - 包含图片的FormData
     * @returns {Promise<string>} 成功返回图片URL，失败返回reject
     */
    const uploadGroupAchievementImg = async (formData) => {
        try {
            if (!formData) {
                return Promise.reject(new Error('请选择要上传的成果图片'));
            }

            loading.value = true;
            const res = await uploadAchievementImg(formData);

            if (res.code === 200) {
                // 成功：返回图片URL（res.data.imageUrl）
                return res.data.imageUrl;
            } else {
                const errorMsg = res.msg || '图片上传失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            console.error('上传成果图片失败：', error);
            return Promise.reject(new Error(error.message || '图片上传失败'));
        } finally {
            loading.value = false;
        }
    };

    /**
     * 重置仓库状态（含持久化状态）
     */
    const resetState = () => {
        achievementList.value = [];
        loading.value = false;
        currentAchievement.value = null;
        searchKeyword.value = '';
        localStorage.removeItem('groupAchievement');
    };

    // ========== 导出状态和方法 ==========
    return {
        // 导出状态和方法 ==========
    // 状态
    achievementList,
    currentAchievement,
    searchKeyword,
    loading,
    // 方法
    fetchGroupAchievement,
    addGroupAchievement,
    editGroupAchievement,
    removeGroupAchievement,
    uploadGroupAchievementImg,
    resetState
};
});

// 导出默认值，兼容默认导入语法
export default useGroupAchievementStore;