import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ElMessage } from 'element-plus'; // 假设使用Element Plus做消息提示（可替换为其他UI库）
import { getClubAchievement, postClubAchievement, putClubAchievement, deleteClubAchievement, uploadClubAchievementImg } from '@/api/clubachievement';

const useClubachievementStore = defineStore('clubachievement', () => {
    // 社团成就列表数据
    let clubachievementInfo = ref({ list: [], pagination: { total: 0 } }); 
    // 加载状态（用于按钮loading/页面骨架屏）
    const loading = ref(false);

    // 获取社团成就列表
    const GetClubAchievement = async (params={}) => {
        try {
            loading.value = true;
            // 调用接口获取数据
            const res = await getClubAchievement(params);
            // 校验接口返回格式（适配后端统一响应格式：{ code:200, data:[...], msg:"xxx" }）
            if (res && res.code === 200) {
                clubachievementInfo.value = res.data;
                return res.data;
            } else {

                clubachievementInfo.value = []; // 空数据时设为数组，避免页面渲染报错
                return Promise.reject(new Error(res.data || '获取角色信息失败'));
            }
        } catch (error) {

            clubachievementInfo.value = [];
            return Promise.reject(new Error(error.message || '获取角色信息失败'));
        } finally {
            loading.value = false;
        }
    };

    // 新增社团成就
    const PostClubAchievement = async (formData) => {
        try {
            loading.value = true;
            // 入参校验
            if (!formData) {
                ElMessage.warning('请填写新增成就信息');
                return false;
            }
            // 调用新增接口
            const res = await postClubAchievement(formData);
            if (res && res.code === 200) {
                ElMessage.success(res.msg || '新增社团成就成功');
                // 新增成功后重新拉取列表，保证数据最新
                await GetClubAchievement();
                return true;
            } else {
                ElMessage.error(res.msg || '新增社团成就失败');
                return false;
            }
        } catch (error) {
            console.error('新增社团成就失败：', error);
            ElMessage.error('新增社团成就失败，请检查参数或稍后重试');
            return false;
        } finally {
            loading.value = false;
        }
    };

    // 删除社团成就
    const DeleteClubAchievement = async (id) => {
        try {
            loading.value = true;
            // 入参校验
            if (!id) {
                ElMessage.warning('请选择要删除的成就');
                return false;
            }
            // 调用删除接口（支持传ID或参数对象，适配不同接口设计）
            const res = await deleteClubAchievement(id);
            if (res && res.code === 200) {
                ElMessage.success(res.msg || '删除社团成就成功');
                // 删除成功后重新拉取列表
                await GetClubAchievement();
                return true;
            } else {
                ElMessage.error(res.msg || '删除社团成就失败');
                return false;
            }
        } catch (error) {
            console.error('删除社团成就失败：', error);
            ElMessage.error('删除社团成就失败，该成就可能已被删除或无权限');
            return false;
        } finally {
            loading.value = false;
        }
    };

    // 更新社团成就
    const UpdateClubAchievement = async (id, formData) => {
        try {
            loading.value = true;
            // 入参校验
            if (!id || !formData) {
                ElMessage.warning('请填写完整的成就信息');
                return false;
            }
            // 调用更新接口
            const res = await putClubAchievement(id, formData);
            if (res && res.code === 200) {
                ElMessage.success(res.msg || '更新社团成就成功');
                // 更新成功后重新拉取列表，保证数据最新
                await GetClubAchievement();
                return true;
            } else {
                ElMessage.error(res.msg || '更新社团成就失败');
                return false;
            }
        } catch (error) {
            console.error('更新社团成就失败：', error);
            ElMessage.error('更新社团成就失败，请检查参数或稍后重试');
            return false;
        } finally {
            loading.value = false;
        }
    };

    // 上传社团成就图片
    const UploadClubAchievementImg = async (file) => {
        try {
            loading.value = true;
            // 入参校验
            if (!file) {
                ElMessage.warning('请选择要上传的图片');
                return false;
            }
            // 创建FormData对象
            const formData = new FormData();
            formData.append('achievementImg', file);
            // 调用上传接口
            const res = await uploadClubAchievementImg(formData);
            if (res && res.code === 200) {
                ElMessage.success(res.msg || '图片上传成功');
                return res.data;
            } else {
                ElMessage.error(res.msg || '图片上传失败');
                return false;
            }
        } catch (error) {
            console.error('图片上传失败：', error);
            ElMessage.error('图片上传失败，请检查文件或稍后重试');
            return false;
        } finally {
            loading.value = false;
        }
    };

    // 重置成就数据（如退出登录时）
    const resetClubAchievement = () => {
        clubachievementInfo.value = { list: [], pagination: { total: 0 } };
    };

    return {
        clubachievementInfo,
        loading,
        GetClubAchievement,
        PostClubAchievement,
        UpdateClubAchievement,
        DeleteClubAchievement,
        UploadClubAchievementImg,
        resetClubAchievement
    };
});

export default useClubachievementStore;