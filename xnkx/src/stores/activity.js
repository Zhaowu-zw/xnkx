import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
    getActivity,
    getActivityDetail,
    postActivity,
    putActivity,
    deleteActivity,
    uploadActivityImage
} from '@/api/activity';

// 定义Activity仓库
const useActivityStore = defineStore('activity', () => {
    // ========== 核心状态 ==========
    // 动态列表数据
    const activityList = ref([]);
    // 分页信息
    const pagination = ref({
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0
    });
    // 加载状态（用于页面loading展示）
    const loading = ref(false);
    // 错误信息
    const errorMsg = ref('');

    // ========== 工具方法（大驼峰命名） ==========
    /**
     * 统一错误处理函数
     * @param {Error|Object} error - 错误对象
     * @param {String} defaultMsg - 默认错误提示
     * @returns {Promise} 标准化的错误返回
     */
    const HandleError = (error, defaultMsg) => {
        const errMsg = error.message || error.msg || defaultMsg;
        errorMsg.value = errMsg;
        return Promise.reject({
            success: false,
            message: errMsg
        });
    };

    // ========== 核心方法（大驼峰命名法） ==========
    /**
     * 获取动态列表
     * @param {Object} params - 查询参数（包含page、pageSize等）
     * @returns {Promise} 操作结果
     */
    const GetActivityInfo = async (params = {}) => {
        try {
            loading.value = true;
            errorMsg.value = '';

            // 参数默认值处理
            const queryParams = {
                page: pagination.value.page,
                pageSize: pagination.value.pageSize,
                ...params
            };

            // 调用接口
            const res = await getActivity(queryParams);

            // 接口返回校验
            if (res.code !== 200 || !res.status) {
                throw new Error(res.message || '获取动态列表失败');
            }

            // 更新状态
            activityList.value = res.data.list || [];
            pagination.value = {
                total: res.data.pagination?.total || 0,
                page: res.data.pagination?.page || 1,
                pageSize: res.data.pagination?.pageSize || 10,
                totalPages: res.data.pagination?.totalPages || 0
            };

            // 返回成功结果
            return {
                success: true,
                data: activityList.value,
                pagination: pagination.value
            };

        } catch (error) {
            return HandleError(error, '获取动态列表异常，请稍后重试');
        } finally {
            loading.value = false;
        }
    };

    /**
     * 新增动态（支持image_url数组传递多张图片地址）
     * @param {Object} activityData - 新增的动态数据（必填：title；可选：image_url数组等）
     * @returns {Promise} 操作结果
     */
    const CreateActivity = async (activityData) => {
        try {
            loading.value = true;
            errorMsg.value = '';

            // 参数校验
            if (!activityData || typeof activityData !== 'object') {
                throw new Error('新增动态数据不能为空');
            }
            if (!activityData.title) {
                throw new Error('动态标题不能为空');
            }
            // 校验image_url格式（如果传了则必须是数组）
            if (activityData.image_url && !Array.isArray(activityData.image_url)) {
                throw new Error('图片地址必须是数组格式');
            }

            // 调用新增接口（自动携带image_url数组给后端）
            const res = await postActivity(activityData);

            // 接口返回校验
            if (res.code !== 200 || !res.status) {
                throw new Error(res.message || '新增动态失败');
            }

            // 刷新列表
            await GetActivityInfo({
                page: pagination.value.page,
                pageSize: pagination.value.pageSize
            });

            // 返回成功结果
            return {
                success: true,
                data: res.data,
                message: '新增动态成功'
            };

        } catch (error) {
            return HandleError(error, '新增动态异常，请稍后重试');
        } finally {
            loading.value = false;
        }
    };

    /**
     * 编辑动态（支持image_url数组传递多张图片地址）
     * @param {Number|String} id - 动态ID（必填）
     * @param {Object} activityData - 编辑后的动态数据（可选：image_url数组等）
     * @returns {Promise} 操作结果
     */
    const UpdateActivity = async (id, activityData) => {
        try {
            loading.value = true;
            errorMsg.value = '';

            // 参数校验
            if (!id) {
                throw new Error('动态ID不能为空');
            }
            if (!activityData || typeof activityData !== 'object') {
                throw new Error('编辑的动态数据不能为空');
            }
            // 校验image_url格式（如果传了则必须是数组）
            if (activityData.image_url && !Array.isArray(activityData.image_url)) {
                throw new Error('图片地址必须是数组格式');
            }

            // 调用编辑接口
            const res = await putActivity(id, activityData);

            // 接口返回校验
            if (res.code !== 200 || !res.status) {
                throw new Error(res.message || '编辑动态失败');
            }

            // 刷新列表
            await GetActivityInfo({
                page: pagination.value.page,
                pageSize: pagination.value.pageSize
            });

            // 返回成功结果
            return {
                success: true,
                data: res.data,
                message: '编辑动态成功'
            };

        } catch (error) {
            return HandleError(error, '编辑动态异常，请稍后重试');
        } finally {
            loading.value = false;
        }
    };

    /**
     * 单张上传动态图片（一张一张传）
     * @param {File} file - 单张图片文件（必填）
     * @returns {Promise} 操作结果（返回单张图片URL）
     */
    const UploadActivityImage = async (file) => {
        try {
            loading.value = true;
            errorMsg.value = '';

            // 单文件参数校验
            if (!file || !(file instanceof File)) {
                throw new Error('请选择有效的图片文件');
            }
            // 可选：校验图片格式（仅允许jpg/png/gif）
            const allowTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];
            if (!allowTypes.includes(file.type)) {
                throw new Error('图片格式不支持，仅支持jpg/png/gif');
            }
            // 可选：校验图片大小（限制5MB以内）
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error('图片大小超过5MB，请压缩后上传');
            }

            // 构建FormData（单文件上传）
            const formData = new FormData();
            // 追加单张图片（后端接收字段名保持一致，比如file）
            formData.append('images', file);

            // 调用单文件上传接口
            const res = await uploadActivityImage(formData);

            // 接口返回校验
            if (res.code !== 200 || !res.status) {
                throw new Error(res.message || '上传图片失败');
            }

            // 返回单张图片URL
            return {
                success: true,
                data: res.data, // 示例：{ url: 'https://xxx.com/xxx.jpg' }
                message: '图片上传成功'
            };

        } catch (error) {
            return HandleError(error, '上传图片异常，请稍后重试');
        } finally {
            loading.value = false;
        }
    };

    /**
 * 删除动态（核心删除业务）
 * @param {Number|String} id - 动态ID（必填，唯一标识要删除的动态）
 * @returns {Promise} 操作结果（success: 布尔值，message: 提示语）
 */
    const DeleteActivity = async (id) => {
        try {
            loading.value = true;
            errorMsg.value = '';

            // 1. 前置参数校验：防止空ID调用接口（无效请求）
            if (!id) {
                throw new Error('动态ID不能为空');
            }

            // 2. 调用后端删除接口（传入动态ID）
            const res = await deleteActivity(id);

            // 3. 接口返回校验：判断删除是否成功
            if (res.code !== 200 || !res.status) {
                throw new Error(res.message || '删除动态失败');
            }

            // 4. 刷新动态列表：保证页面数据和后端一致
            await GetActivityInfo({
                page: pagination.value.page,
                pageSize: pagination.value.pageSize
            });

            // 5. 返回成功结果：给页面调用层返回清晰的提示
            return {
                success: true,
                message: '删除动态成功'
            };

        } catch (error) {
            // 统一错误处理：返回标准化的错误信息
            return HandleError(error, '删除动态异常，请稍后重试');
        } finally {
            // 无论成功/失败，都结束loading状态
            loading.value = false;
        }
    };

    /**
     * 重置动态仓库状态
     */
    const ResetActivityState = () => {
        activityList.value = [];
        pagination.value = {
            total: 0,
            page: 1,
            pageSize: 10,
            totalPages: 0
        };
        loading.value = false;
        errorMsg.value = '';
    };

    /**
     * 根据ID获取单条动态信息
     * @param {Number|String} id - 动态ID
     * @returns {Object|null} 匹配的动态信息
     */
    const GetActivityById = (id) => {
        if (!id) return null;
        return activityList.value.find(item => item.id === id) || null;
    };

    /**
     * 获取单条动态详情（直接从API获取）
     * @param {Number|String} id - 动态ID
     * @returns {Promise} 操作结果
     */
    const GetActivityDetail = async (id) => {
        try {
            loading.value = true;
            errorMsg.value = '';

            if (!id) {
                throw new Error('动态ID不能为空');
            }

            // 先尝试从本地获取
            const localActivity = GetActivityById(id);
            if (localActivity) {
                return localActivity;
            }

            // 本地没有，从API获取
            const res = await getActivityDetail(id);

            if (res.code !== 200 || !res.status) {
                throw new Error(res.message || '获取动态详情失败');
            }

            // 将获取到的详情添加到本地列表
            const activity = res.data;
            if (activity && activity.id) {
                // 检查是否已存在，避免重复添加
                const existingIndex = activityList.value.findIndex(item => item.id === activity.id);
                if (existingIndex === -1) {
                    activityList.value.push(activity);
                } else {
                    activityList.value[existingIndex] = activity;
                }
            }

            return activity;
        } catch (error) {
            return HandleError(error, '获取动态详情异常，请稍后重试');
        } finally {
            loading.value = false;
        }
    };

    // ========== 导出状态和方法（大驼峰命名） ==========
    return {
        // 状态
        activityList,
        pagination,
        loading,
        errorMsg,
        // 方法（大驼峰命名）
        GetActivityInfo,
        GetActivityDetail,
        CreateActivity,
        UpdateActivity,
        DeleteActivity,
        UploadActivityImage,
        ResetActivityState,
        GetActivityById
    };
});

export default useActivityStore;