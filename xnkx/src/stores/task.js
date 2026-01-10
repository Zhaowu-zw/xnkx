import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getTask, getMyTask, updateTaskStatus, getTaskDetail, submitTaskResult, scoreTaskResult, deleteTask, uploadTaskFiles, uploadTaskImages, uploadSubmitFiles, uploadSubmitImages, createTask, updateTask } from '@/api/task';

// 工具函数：格式化时间为YYYY-MM-DD格式（用于比较）
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 工具函数：检查任务是否已过期
const isTaskExpired = (deadline) => {
    if (!deadline) return false;
    const today = formatDate(new Date()); // 当前系统日期
    const taskDeadline = formatDate(deadline); // 任务截止日期
    return taskDeadline < today;
};

const useTaskStore = defineStore('task', () => {
    let taskMyInfo = ref([]);
    let taskInfo = ref([]);
    let completedTaskMap = ref({});
    let currentTaskDetail = ref(null);
    let taskSubmissions = ref([]);

    // 查询所有任务（支持查询参数）
    const GetTask = async (params = {}) => {
        try {
            const res = await getTask(params);
            if (res.code == 200) {
                const responseData = res.data;
                // 确保正确解析嵌套的数据结构
                const tasksData = responseData.data || [];
                const totalCount = responseData.total || 0;
                taskInfo.value = tasksData;
                return { data: tasksData, total: totalCount };
            } else {
                return Promise.reject(new Error(res.message || '获取任务信息失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '获取任务信息失败'));
        }
    };

    // 查询个人所有任务（参数名改为 task_id）
    const GetMyTask = async () => {
        try {
            const res = await getMyTask();
            if (res.code == 200) {
                const tasksData = res.data.data || res.data;
                const processedTasks = await Promise.all(
                    tasksData.map(async (task) => {
                        if ( isTaskExpired(task.deadline)) {
                            try {
                                await updateTaskStatus(Number(task.id), { status: 'pending' });
                                return { ...task, user_task_status: 'pending' };
                            } catch (error) {
                                console.error(`更新个人任务${task.id}状态失败：`, error);
                                return task;
                            }
                        }
                        return task;
                    })
                );
                taskMyInfo.value = processedTasks;
                // console.log(res.data);
                
                // console.log('个人任务加载完成（含过期状态同步）:', processedTasks);
                
                // console.log('个人任务加载完成（含过期状态同步）');
                return processedTasks;
            } else {
                
                return Promise.reject(new Error(res.data || '获取任务信息失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '获取任务信息失败'));
        }
    };

    const groupMap = (data) => {
        switch (data) {
            case 1: return "网页组";
            case 2: return "虚拟组";
            case 3: return "维修组";
            case 4: return "人工组";
            case 5: return "大数据组";
            default: break;
        }
    };

    const toggleTaskCompleted = (taskId) => {
        completedTaskMap.value[taskId] = !completedTaskMap.value[taskId];
    };

    const isTaskCompleted = (taskId) => {
        return completedTaskMap.value[taskId] || false;
    };

    // 手动刷新并同步过期任务状态（参数名改为 task_id）
    const refreshAndSyncTaskStatus = async () => {
        // 同步个人任务状态
        const updatedMyTasks = await Promise.all(
            taskMyInfo.value.map(async (task) => {
                if (isTaskExpired(task.deadline)) {
                    try {
                        await updateTaskStatus(Number(task.id), { status: 'pending' });
                        return { ...task, user_task_status: 'pending' };
                    } catch (error) {
                        console.error(`刷新任务${task.id}状态失败：`, error);
                        return task;
                    }
                }
                return task;
            })
        );
        taskMyInfo.value = updatedMyTasks;

        // 同步所有任务状态
        const updatedAllTasks = await Promise.all(
            taskInfo.value.map(async (task) => {
                if ( isTaskExpired(task.deadline)) {
                    try {
                        await updateTaskStatus(Number(task.id), { status:'pending'});
                        return { ...task, user_task_status: 'pending' };
                    } catch (error) {
                        console.error(`刷新任务${task.id}状态失败：`, error);
                        return task;
                    }
                }
                return task;
            })
        );
        taskInfo.value = updatedAllTasks;

        // console.log('任务状态刷新并同步完成');
    };

    // 获取任务详情
    const GetTaskDetail = async (task_id) => {
        try {
            const res = await getTaskDetail(task_id);
            if (res.code == 200) {
                // console.log(res.data);
                currentTaskDetail.value = res.data.taskInfo;
                taskSubmissions.value = res.data.submissions;
                return res.data;
            } else {
                return Promise.reject(new Error(res.data || '获取任务详情失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '获取任务详情失败'));
        }
    };

    // 提交任务成果
    const SubmitTaskResult = async (task_id, data) => {
        try {
            const res = await submitTaskResult(task_id, data);
            if (res.code == 200) {
                return res;
            } else {
                return Promise.reject(new Error(res.data || '提交任务成果失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '提交任务成果失败'));
        }
    };

    // 评分任务成果
    const ScoreTaskResult = async (task_id, data) => {
        try {
            const res = await scoreTaskResult(task_id, data);
            if (res.code == 200) {
                return res;
            } else {
                return Promise.reject(new Error(res.data || '评分任务成果失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '评分任务成果失败'));
        }
    };

    // 删除任务
    const deleteTaskMethod = async (task_id) => {
        try {
            const res = await deleteTask(task_id);
            if (res.code == 200) {
                return res;
            } else {
                return Promise.reject(new Error(res.data || '删除任务失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '删除任务失败'));
        }
    };

    // 创建任务
    const createTaskMethod = async (data) => {
        try {
            const res = await createTask(data);
            if (res.code == 200) {
                return res;
            } else {
                return Promise.reject(new Error(res.data || '创建任务失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '创建任务失败'));
        }
    };

    // 更新任务
    const updateTaskMethod = async (task_id, data) => {
        try {
            const res = await updateTask(task_id, data);
            if (res.code == 200) {
                return res;
            } else {
                return Promise.reject(new Error(res.data || '更新任务失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '更新任务失败'));
        }
    };

    // 更新任务状态
    const updateTaskStatusMethod = async (task_id, data) => {
        try {
            const res = await updateTaskStatus(task_id, data);
            if (res.code == 200) {
                return res;
            } else {
                return Promise.reject(new Error(res.data || '更新任务状态失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '更新任务状态失败'));
        }
    };

    // 上传任务文件
    const UploadTaskFiles = async (formData, onUploadProgress) => {
        try {
            const res = await uploadTaskFiles(formData, onUploadProgress);
            if (res.code == 200) {
                return res;
            } else {
                return Promise.reject(new Error(res.data || '上传任务文件失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '上传任务文件失败'));
        }
    };

    // 上传任务图片
    const UploadTaskImages = async (formData, onUploadProgress) => {
        try {
            const res = await uploadTaskImages(formData, onUploadProgress);
            if (res.code == 200) {
                return res;
            } else {
                return Promise.reject(new Error(res.data || '上传任务图片失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '上传任务图片失败'));
        }
    };

    // 上传用户提交的文件
    const UploadSubmitFiles = async (task_id, formData, onUploadProgress) => {
        try {
            const res = await uploadSubmitFiles(task_id, formData, onUploadProgress);
            if (res.code == 200) {
                return res;
            } else {
                return Promise.reject(new Error(res.data || '上传提交文件失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '上传提交文件失败'));
        }
    };

    // 上传用户提交的图片
    const UploadSubmitImages = async (task_id, formData, onUploadProgress) => {
        try {
            const res = await uploadSubmitImages(task_id, formData, onUploadProgress);
            if (res.code == 200) {
                return res;
            } else {
                return Promise.reject(new Error(res.data || '上传提交图片失败'));
            }
        } catch (error) {
            return Promise.reject(new Error(error || '上传提交图片失败'));
        }
    };

    // 重置任务详情
    const ResetTaskDetail = () => {
        currentTaskDetail.value = null;
        taskSubmissions.value = [];
    };

    return {
        taskMyInfo,
        taskInfo,
        completedTaskMap,
        currentTaskDetail,
        taskSubmissions,
        GetTask,
        GetMyTask,
        GetTaskDetail,
        CreateTask: createTaskMethod,
        UpdateTask: updateTaskMethod,
        SubmitTaskResult,
        ScoreTaskResult,
        ResetTaskDetail,
        toggleTaskCompleted,
        groupMap,
        isTaskCompleted,
        refreshAndSyncTaskStatus,
        deleteTask: deleteTaskMethod,
        updateTaskStatus: updateTaskStatusMethod,
        UploadTaskFiles,
        UploadTaskImages,
        UploadSubmitFiles,
        UploadSubmitImages
    };

});

export default useTaskStore;