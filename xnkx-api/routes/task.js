const express = require('express');
const router = express.Router();
const checkPermission = require('../utils/checkPermission');
const { viewTasks, createTask, editTask, deleteTask, updateTaskStatus, submitTaskResult, scoreTaskResult, viewTasksOwn, viewTaskDetail, uploadTaskFiles, uploadTaskImages, uploadSubmitFiles, uploadSubmitImages } = require('../router_handler/task');

//查看任务列表
router.get('/task_views', checkPermission('task:view'), viewTasks)
//查看自己的任务
router.get('/task_views_own', checkPermission('task:view:own'), viewTasksOwn)
//创建任务
router.post('/task_create', checkPermission('task:create'), createTask)
//编辑任务
router.put('/task_edit/:id', checkPermission('task:edit'), editTask)
//删除任务
router.delete('/task_delete/:id', checkPermission('task:delete'), deleteTask)
//更改任务状态
router.patch('/task_update_status/:task_id', checkPermission('task_user:update:status'), updateTaskStatus)
//提交任务成果
router.post('/task_submit_result/:task_id', checkPermission('task_user:submit:result'), submitTaskResult)
//评分任务成果
router.post('/task_score/:task_id', checkPermission('task_user:score'), scoreTaskResult)
//查看任务详情
router.get('/task_detail/:task_id', checkPermission('task:view:detail'), viewTaskDetail)
//上传任务文件
router.post('/task_upload_files', uploadTaskFiles)
//上传任务图片
router.post('/task_upload_images',  uploadTaskImages)
//上传用户提交的文件
router.post('/task_submit_files/:task_id',uploadSubmitFiles)
//上传用户提交的图片
router.post('/task_submit_images/:task_id', uploadSubmitImages)

module.exports = router;