import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
    userLogin,
    getUserInfo,
    userRegister,
    uploadAvatar,
    editUserInfo,
    getUserInfoAll,
    deleteUser, // 已导入删除用户接口
    getCaptcha
} from '@/api/user.js';
import { SET_TOKEN, GET_TOKEN, REMOVE_TOKEN } from '@/utils/token.js';
import { ElMessage } from 'element-plus';

const useUserStore = defineStore('user', () => {
    // ========== 原有 state ==========
    let token = ref(GET_TOKEN());
    let userInfo = ref({});
    let role_name = ref('');
    let isFinite = ref(false)

    // ========== 新增：获取全部人员的状态 ==========
    let userList = ref([]);
    let total = ref(0);
    let userListLoading = ref(false);
    // 新增：删除操作的loading状态（可选，单独控制删除按钮loading）
    let deleteLoading = ref(false);

    // ========== 原有方法 ==========
    // 登录
    const UserLogin = async (data) => {
        const res = await userLogin(data);
        if (res.code == 200) {
            token.value = res.data.token;
            role_name.value = res.data.role_name;
            SET_TOKEN(res.data.token);
            await UserInfo()
            return true;
        } else {
            return Promise.reject(new Error(res.data || '登录失败'));
        }
    };

    // 获取验证码
    const GetCaptcha = async () => {
        try {
            const res = await getCaptcha();
            if (res.code == 200) {
                return res.data;
            } else {
                return Promise.reject(new Error(res.data || '获取验证码失败'));
            }
        } catch (error) {
            console.error('获取验证码失败:', error);
            return Promise.reject(new Error(error.message || '获取验证码失败'));
        }
    };

    // 注册
    const UserRegister = async (data) => {
        const res = await userRegister(data);
        if (res.code == 200) {
            return true;
        } else {
            return Promise.reject(new Error(res.data || '注册失败'));
        }
    };

    // 获取当前用户信息
    const UserInfo = async () => {
        try {
            const res = await getUserInfo();
            // console.log('获取用户信息返回：', res);
            if (res.code == 200) {
                userInfo.value = res.data.data;
                isFinite.value = true
                return res.data;
            } else {
                logout();
                return Promise.reject(new Error(res.data || '获取用户信息失败'));
            }
        } catch (err) {
            logout();
            return Promise.reject(err);
        }
    };

    // 上传头像
    const uploadUserAvatar = async (file) => {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            const res = await uploadAvatar(formData);
            if (res.code !== 200) {
                throw new Error(res.data || '头像上传失败');
            }
            const avatarUrl = res.data.data.avatarUrl;
            const editRes = await editUserInfo({ avatar: avatarUrl });
            if (editRes.code !== 200) {
                throw new Error(editRes.data || '更新头像信息失败');
            }
            updateUserInfo({ avatar: avatarUrl });
            ElMessage.success('头像上传成功');
            return avatarUrl;
        } catch (err) {
            ElMessage.error(err.message || '头像上传失败');
            return Promise.reject(err);
        }
    };

    // 更新用户信息
    const updateUserInfo = (newInfo) => {
        Object.assign(userInfo.value, newInfo);
    };

    // 退出登录
    const logout = () => {
        token.value = '';
        userInfo.value = {};
        role_name.value = '';
        isFinite.value = false;
        REMOVE_TOKEN();
    };

    // ========== 新增：获取全部人员信息的核心方法 ==========
    const getAllUserInfo = async (params) => {
        try {
            userListLoading.value = true;
            const res = await getUserInfoAll(params);
            if (res.code === 200) {
                userList.value = res.data.data;
                total.value = res.data.pagination.total;
                return res.data.data;
            } else {
                ElMessage.error(res.data.data || '获取人员列表失败');
                return Promise.reject(new Error(res.data.data || '获取人员列表失败'));
            }
        } catch (err) {
            ElMessage.error(err.message || '获取人员列表异常');
            return Promise.reject(err);
        } finally {
            userListLoading.value = false;
        }
    };

    // ========== 新增：重置人员列表 ==========
    const resetUserList = () => {
        userList.value = [];
        total.value = 0;
    };

    // ========== 新增：删除用户核心方法 ==========
    const deleteUserInfo = async (userId) => {
        try {
            // 开启删除loading（控制按钮loading状态）
            deleteLoading.value = true;
            // 调用删除用户接口（传入用户ID）
            const res = await deleteUser(userId);
            if (res.code === 200) {
                // 删除成功后，重新加载用户列表（保持分页状态）
                await getAllUserInfo({
                    page: 1, // 建议回到第一页，避免删除最后一页最后一条数据时分页异常
                    pageSize: 10,
                    keyword: '',
                    group_id: ''
                });
                return true;
            } else {
                ElMessage.error(res.data || '用户删除失败');
                return Promise.reject(new Error(res.data || '用户删除失败'));
            }
        } catch (err) {
            ElMessage.error(err.message || '用户删除异常');
            return Promise.reject(err);
        } finally {
            // 关闭删除loading
            deleteLoading.value = false;
        }
    };

    // ========== 导出所有状态和方法 ==========
    return {
        // 原有导出
        token,
        userInfo,
        role_name,
        isFinite,
        UserLogin,
        UserRegister,
        UserInfo,
        GetCaptcha,
        uploadUserAvatar,
        updateUserInfo,
        logout,
        // 新增导出
        userList,
        total,
        userListLoading,
        getAllUserInfo,
        resetUserList,
        // 新增删除相关导出
        deleteLoading,  // 删除按钮loading状态
        deleteUserInfo  // 删除用户方法
    };
}, {
    persist: {
        key: 'user-storage',
        storage: window.localStorage,
        paths: ['userInfo']
    }
});

export default useUserStore;