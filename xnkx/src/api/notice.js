import request from '@/utils/request.js'

//删除已读通知
export const deleteNotice = (params) => request.delete('/notice/delete_read_notices', {
    params: {
        id: params.id
    }
})
//标记已读
export const markNotice = (params) => request.patch('/notice/mark_as_read', {
    params: {
        id: params.id
    }
})
//查询通知
export const getNotice = () => request.get('/notice/view_notices')