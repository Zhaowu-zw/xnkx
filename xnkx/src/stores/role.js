import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getRoleInfo, createRoleInfo, putRoleInfo, deleteRoleInfo, updateUserMainRole ,resignClub, assignUserRole, removeUserRole, getUserRoles } from '@/api/role';

const useRoleStore = defineStore('role', () => {
    // 角色列表数据（统一初始值为空数组，避免类型不一致）
    const roleInfo = ref([]);
    // 接口请求加载状态（共用，若需区分可拆分为多个loading，如createLoading/updateLoading等）
    const loading = ref(false);

    // 获取角色信息（支持传参筛选，如角色ID/关键词）
    const GetRoleInfo = async (data = {}) => {
        try {
            loading.value = true;
            const res = await getRoleInfo(data);
            // 适配后端响应格式（status=true视为成功）
            if (res && res.status === true) {
                // 读取res.data，与后端responses.js返回格式保持一致
                roleInfo.value = res.data?.data || res.data || [];
                return res.data?.data || res.data || []; // 返回数据，方便组件直接使用
            } else {
                roleInfo.value = [];
                // 直接使用后端返回的错误信息
                const errorMsg = res?.message || res?.errors?.[0] || '获取角色信息失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            roleInfo.value = [];
            // 直接使用后端返回的错误信息
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || '获取角色信息失败';
            return Promise.reject(new Error(errorMsg));
        } finally {
            loading.value = false;
        }
    };

    // 新增角色
    // @param data: 角色表单数据（如{ role_name: '编辑', permissions: [1,2] }）
    const CreateRole = async (data) => {
        try {
            loading.value = true;
            // 校验入参（可选，避免空数据提交）
            if (!data || !data.role_name) {
                return Promise.reject(new Error('角色名称不能为空'));
            }
            const res = await createRoleInfo(data);
            // 适配后端响应格式（status=true视为成功）
            if (res && res.status === true) {
                // 新增成功后，重新获取角色列表，保证数据最新
                await getRoleInfo();
                return res.data; // 返回新增的角色数据
            } else {
                // 使用后端返回的错误信息
                const errorMsg = res?.message || res?.errors?.[0] || '新增角色失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            // 处理网络错误或其他异常
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || '新增角色失败';
            return Promise.reject(new Error(errorMsg));
        } finally {
            loading.value = false;
        }
    };

    // 编辑/更新角色
    // @param id: 角色ID（必传）
    // @param data: 要更新的角色数据（如{ role_name: '超级编辑', permissions: [1,2,3] }）
    const UpdateRole = async (id, data) => {
        try {
            loading.value = true;
            // 校验入参
            if (!id) {
                return Promise.reject(new Error('角色ID不能为空'));
            }
            if (!data) {
                return Promise.reject(new Error('请传入要更新的角色数据'));
            }
            // 调用编辑接口（根据后端接口设计，若需把id拼入data则调整：data = { id, ...data }）
            const res = await putRoleInfo(id, data);
            // 适配后端响应格式（status=true视为成功）
            if (res && res.status === true) {
                // 更新成功后，重新获取角色列表
                await getRoleInfo();
                return res.data; // 返回更新后的角色数据
            } else {
                // 使用后端返回的错误信息
                const errorMsg = res?.message || res?.errors?.[0] || '编辑角色失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            // 处理网络错误或其他异常
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || '编辑角色失败';
            return Promise.reject(new Error(errorMsg));
        } finally {
            loading.value = false;
        }
    };

    // 删除角色
    // @param id: 角色ID（必传）
    const DeleteRole = async (id) => {
        try {
            loading.value = true;
            // 校验入参
            if (!id) {
                return Promise.reject(new Error('角色ID不能为空'));
            }
            const res = await deleteRoleInfo(id);
            // 适配后端响应格式（status=true视为成功）
            if (res && res.status === true) {
                // 删除成功后，重新获取角色列表
                await getRoleInfo();
                return res.data; // 返回删除成功的结果
            } else {
                // 使用后端返回的错误信息
                const errorMsg = res?.message || res?.errors?.[0] || '删除角色失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            // 处理网络错误或其他异常
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || '删除角色失败';
            return Promise.reject(new Error(errorMsg));
        } finally {
            loading.value = false;
        }
    };

    // 更新用户主角色（需审批）
    // @param userId: 用户ID
    // @param data: 包含role_name（目标角色名称）、changeType（变更类型）、content（申请理由）
    const UpdateUserMainRole = async (userId, data) => {
        try {
            loading.value = true;
            // 校验入参
            if (!userId) {
                return Promise.reject(new Error('用户ID不能为空'));
            }
            if (!data || !data.role_name || !data.changeType) {
                return Promise.reject(new Error('角色名称和变更类型不能为空'));
            }
            
            const res = await updateUserMainRole(userId, data);
            // 适配后端响应格式（status=true视为成功）
            if (res && res.status === true) {
                return res.data; // 返回申请结果
            } else {
                // 使用后端返回的错误信息
                const errorMsg = res?.message || res?.errors?.[0] || '角色变更申请失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            // 处理网络错误或其他异常
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.errors || '角色变更申请失败';
            return Promise.reject(new Error(errorMsg));
        } finally {
            loading.value = false;
        }
    };

    // 用户退出社团（需审批）
    // @param userId: 用户ID
    // @param data: 包含content（退社理由）
    const ResignClub = async (userId, data) => {
        try {
            loading.value = true;
            // 校验入参
            if (!userId) {
                return Promise.reject(new Error('用户ID不能为空'));
            }
            
            const res = await resignClub(userId, data);
            // 适配后端响应格式（status=true视为成功）
            if (res && res.status === true) {
                return res.data; // 返回申请结果
            } else {
                // 使用后端返回的错误信息
                const errorMsg = res?.message || res?.errors?.[0] || '退出社团申请失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            // 处理网络错误或其他异常
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || '退出社团申请失败';
            return Promise.reject(new Error(errorMsg));
        } finally {
            loading.value = false;
        }
    };

    // 分配角色给用户
    // @param data: 包含userId和roleId
    const AssignUserRole = async (data) => {
        try {
            loading.value = true;
            // 校验入参
            if (!data || !data.userId || !data.roleId) {
                return Promise.reject(new Error('用户ID和角色ID不能为空'));
            }
            
            const res = await assignUserRole(data);
            // 适配后端响应格式（status=true视为成功）
            if (res && res.status === true) {
                return res.data; // 返回分配结果
            } else {
                // 使用后端返回的错误信息
                const errorMsg = res?.message || res?.errors?.[0] || '角色分配失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            // 处理网络错误或其他异常
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || '角色分配失败';
            return Promise.reject(new Error(errorMsg));
        } finally {
            loading.value = false;
        }
    };

    // 从用户移除角色
    // @param userId: 用户ID
    // @param roleId: 角色ID
    const RemoveUserRole = async (userId, roleId) => {
        try {
            loading.value = true;
            // 校验入参
            if (!userId || !roleId) {
                return Promise.reject(new Error('用户ID和角色ID不能为空'));
            }
            
            const res = await removeUserRole(userId, roleId);
            // 适配后端响应格式（status=true视为成功）
            if (res && res.status === true) {
                return res.data; // 返回移除结果
            } else {
                // 使用后端返回的错误信息
                const errorMsg = res?.message || res?.errors?.[0] || '角色移除失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            // 处理网络错误或其他异常
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || '角色移除失败';
            return Promise.reject(new Error(errorMsg));
        } finally {
            loading.value = false;
        }
    };

    // 获取用户所有角色
    // @param userId: 用户ID
    const GetUserRoles = async (userId) => {
        try {
            loading.value = true;
            // 校验入参
            if (!userId) {
                return Promise.reject(new Error('用户ID不能为空'));
            }
            
            const res = await getUserRoles(userId);
            // 适配后端响应格式（status=true视为成功）
            if (res && res.status === true) {
                return res.data?.roles || []; // 返回用户角色列表
            } else {
                // 使用后端返回的错误信息
                const errorMsg = res?.message || res?.errors?.[0] || '获取用户角色失败';
                return Promise.reject(new Error(errorMsg));
            }
        } catch (error) {
            // 处理网络错误或其他异常
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || '获取用户角色失败';
            return Promise.reject(new Error(errorMsg));
        } finally {
            loading.value = false;
        }
    };

    // 重置角色数据（退出登录/切换账号时）
    const resetRoleInfo = () => {
        roleInfo.value = [];
    };

    return {
        roleInfo,
        loading,
        GetRoleInfo,          // 获取角色列表
        CreateRole,           // 新增角色
        UpdateRole,           // 编辑角色
        DeleteRole,           // 删除角色
        UpdateUserMainRole,   // 更新用户主角色（需审批）
        ResignClub,           // 用户退出社团（需审批）
        AssignUserRole,       // 分配角色给用户
        RemoveUserRole,       // 从用户移除角色
        GetUserRoles,         // 获取用户所有角色
        resetRoleInfo         // 重置角色数据
    };
});

export default useRoleStore;