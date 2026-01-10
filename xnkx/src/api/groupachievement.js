import request from '@/utils/request.js'

// 获取小组成果
export const getGroupAchievement = (params) => request.get('/groupAchievement/groupachievement', {
    params: {
        keyword: params.keyword,
        group_id: params.group_id,
        status: params.status
    }
});

// 新增小组成果
export const publishGroupAchievement = (data) => request.post('/groupAchievement/groupachievement', data);

// 修改小组成果（动态传id）
export const putGroupAchievement = (id, data) => request.put(`/groupAchievement/groupachievement/${id}`, data);

// 删除成果（动态传id）
export const deleteGroupAchievement = (id) => request.delete(`/groupAchievement/groupachievement/${id}`);

// 上传成果图片（修正路径）
export const uploadAchievementImg = (data) => request.post('/groupAchievement/upload-images', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
});