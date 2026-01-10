import request from '@/utils/request.js'

//提交反馈
export const subFeedback = (data) => request.post('/feedback/feedback', data);

//查看所有反馈
export const viewFeedback = (params) => request.get('/feedback/feedback', {
    params: {
        ...params,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
    }
    
 });

//处理反馈
export const putFeedback = (id, data) => request.put(`/feedback/feedback/${id}`, data);

//删除反馈
export const deleteFeedback = (id) => request.delete(`/feedback/feedback/${id}`);