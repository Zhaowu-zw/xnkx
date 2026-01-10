import request from '@/utils/request.js'

//查询社团动态列表
export const getActivity = (params) => request.get('/activity/list', {
    params: {
        page: params.page || 1,
        pageSize: params.pageSize || 5,
        group_id: params.group_id,
        keyword:params.keyword
    }
})

//查询单条社团动态详情
export const getActivityDetail = (id) => request.get(`/activity/detail/${id}`)

//发布社团动态
export const postActivity = (data) => request.post('/activity/publish', data);
//编辑社团动态
export const putActivity = (id,data) => request.put(`/activity/edit/${id}`, data);
//删除社团动态
export const deleteActivity = (id) => request.delete(`/activity/delete/${id}`);
//上传社团动态图片
export const uploadActivityImage = (data) => request.post('/activity/upload-images', data);