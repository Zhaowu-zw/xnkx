import request from '@/utils/request.js'

//查询所有任务
export const getTask = (params) => request.get('/task/task_views', { params });
//创建新任务
export const createTask = (data) => request.post('/task/task_create', data)
//查询个人所有任务
export const getMyTask = () => request.get('/task/task_views_own');
//修改任务详情
export const updateTask = (task_id, data) => request.put('/task/task_edit/' + `${task_id}`, data)
//更新任务状态
export const updateTaskStatus = (task_id, data) => request.patch(`/task/task_update_status/${task_id}`, data)
//删除任务
export const deleteTask = (task_id) => request.delete(`/task/task_delete/${task_id}`)
//查看任务详情
export const getTaskDetail = (task_id) => request.get(`/task/task_detail/${task_id}`)
//提交任务成果
export const submitTaskResult = (task_id, data) => request.post(`/task/task_submit_result/${task_id}`, data)
//评分任务成果
export const scoreTaskResult = (task_id, data) => request.post(`/task/task_score/${task_id}`, data)
//上传任务文件
export const uploadTaskFiles = (data, onUploadProgress) => request.post('/task/task_upload_files', data, {
  onUploadProgress
})
//上传任务图片
export const uploadTaskImages = (data, onUploadProgress) => request.post('/task/task_upload_images', data, {
  onUploadProgress
})
//上传用户提交的文件
export const uploadSubmitFiles = (task_id, data, onUploadProgress) => request.post(`/task/task_submit_files/${task_id}`, data, {
  onUploadProgress
})
//上传用户提交的图片
export const uploadSubmitImages = (task_id, data, onUploadProgress) => request.post(`/task/task_submit_images/${task_id}`, data, {
  onUploadProgress
})
