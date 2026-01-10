<template>
    <el-dialog :title="isEditMode ? '修改任务' : '提交新任务'" v-model="isShow" width="600px" :before-close="handleClose"
        destroy-on-close @open="initForm">
        <el-form :model="taskForm" :rules="formRules" ref="formRef" label-width="100px" class="task-submit-form">
            <!-- 任务标题 -->
            <el-form-item label="任务标题" prop="title">
                <el-input v-model="taskForm.title" placeholder="请输入任务标题（如：教学楼投影仪调试）" maxLength="50" />
            </el-form-item>

            <!-- 任务类型 + 所属小组 -->
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="任务类型" prop="task_type">
                        <el-select 
                            v-model="taskForm.task_type" 
                            placeholder="请选择任务类型" 
                            :disabled="isEditMode || isTeamLeader"
                        >
                            <!-- 编辑模式或组长角色下禁用任务类型修改，组长只能创建小组任务 -->
                            <el-option 
                                label="个人任务" 
                                value="club" 
                                :disabled="isTeamLeader" 
                            />
                            <el-option 
                                label="小组任务" 
                                value="group" 
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="所属小组" prop="group_id" v-if="taskForm.task_type === 'group'">
                        <el-select 
                            v-model="taskForm.group_id" 
                            placeholder="请选择小组" 
                            :disabled="isTeamLeader && filteredGroupList.length === 1"
                        >
                            <el-option 
                                v-for="group in filteredGroupList" 
                                :key="group.id" 
                                :label="group.name"
                                :value="group.id" 
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- 截止时间 -->
            <el-form-item label="截止时间" prop="deadline">
                <el-date-picker v-model="taskForm.deadline" type="datetime" placeholder="请选择截止时间"
                    :disabled-date="disabledPastDate" value-format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>

            <!-- 考核标准 -->
            <el-form-item label="考核标准" prop="assessment_criteria">
                <el-input v-model="taskForm.assessment_criteria" placeholder="请输入任务完成的考核标准" maxLength="100" />
            </el-form-item>

            <!-- 任务描述 -->
            <el-form-item label="任务描述" prop="description">
                <el-input v-model="taskForm.description" type="textarea" :rows="4" placeholder="请详细描述任务内容、要求等"
                    maxLength="500" />
            </el-form-item>

            <!-- 任务文件 -->
            <el-form-item label="任务文件">
                <el-upload
                    v-model:file-list="taskFiles"
                    :auto-upload="false"
                    :limit="5"
                    :multiple="true"
                    @change="handleFileChange"
                    @remove="handleRemoveFile"
                    @before-upload="beforeFileUpload"
                    accept=".doc,.docx,.pdf,.txt,.zip,.rar"
                >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">点击上传文件</div>
                    <template #tip>
                        <div class="upload-tips">
                            支持上传 .doc, .docx, .pdf, .txt, .zip, .rar 格式文件，最多5个，单个文件不超过10MB
                        </div>
                    </template>
                </el-upload>
            </el-form-item>

            <!-- 任务图片 -->
            <el-form-item label="任务图片">
                <el-upload
                    v-model:file-list="taskImages"
                    :auto-upload="false"
                    :limit="5"
                    :multiple="true"
                    @change="handleImageChange"
                    @remove="handleRemoveImage"
                    @before-upload="beforeImageUpload"
                    accept="image/*"
                    list-type="picture-card"
                    :preview-src-list="taskImages.map(item => item.url)"
                >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">点击上传图片</div>
                    <template #tip>
                        <div class="upload-tips">
                            支持上传图片格式文件，最多5个，单个文件不超过5MB
                        </div>
                    </template>
                </el-upload>
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="handleClose">取消</el-button>
            <el-button type="primary" @click="handleSubmit">
                {{ isEditMode ? '保存修改' : '提交任务' }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import useTaskStore from '@/stores/task';
import useUserStore from '@/stores/user';

// 初始化store
const taskStore = useTaskStore();
const userStore = useUserStore();

// 外部传入参数：是否显示弹窗、编辑的任务数据
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    editTask: {
        type: Object,
        default: null // 编辑模式时传入任务对象，新增时为null
    }
});

const isShow = ref(props.modelValue);
const editTask = ref(props.editTask);
// console.log(editTask.value)

// 双向绑定弹窗状态
const emit = defineEmits(['update:modelValue', 'submit-success']);

// 判断是否为编辑模式（核心：根据editTask是否存在）
const isEditMode = computed(() => {
    return !!editTask.value && !!editTask.value.id;
});

// 表单相关
const formRef = ref(null);
const taskForm = ref({
    id: '', // 新增：任务ID（编辑模式必填）
    title: '', // 任务标题
    task_type: 'club', // 任务类型（默认个人任务）
    group_id: null, // 所属小组（仅小组任务需要）
    deadline: '', // 截止时间
    assessment_criteria: '', // 考核标准
    description: '', // 任务描述
    task_files: [], // 任务文件URL列表
    task_images: [] // 任务图片URL列表
});

// 任务文件和图片
const taskFiles = ref([]);
const taskImages = ref([]);

// 小组列表
const groupList = ref([
    { id: 1, name: '网页组' },
    { id: 2, name: '虚拟组' },
    { id: 3, name: '维修组' },
    { id: 4, name: '人工组' },
    { id: 5, name: '大数据组' }
]);

// 表单校验规则（与新增保持一致，编辑模式自动复用）
const formRules = ref({
    title: [
        { required: true, message: '请输入任务标题', trigger: 'blur' },
        { max: 50, message: '标题长度不能超过50个字符', trigger: 'blur' }
    ],
    task_type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
    group_id: [
        {
            required: false,
            validator: (rule, value, callback) => {
                if (taskForm.value.task_type === 'group' && !value) {
                    callback(new Error('请选择所属小组'));
                } else {
                    callback();
                }
            },
            trigger: 'change'
        }
    ],
    deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
    assessment_criteria: [
        { required: true, message: '请输入考核标准', trigger: 'blur' },
        { max: 100, message: '考核标准长度不能超过100个字符', trigger: 'blur' }
    ],
    description: [
        { required: true, message: '请输入任务描述', trigger: 'blur' },
        { max: 500, message: '描述长度不能超过500个字符', trigger: 'blur' }
    ]
});

onMounted(() => {
    // console.log('环境变量：', import.meta.env.VITE_API_BASE_URL);
});

// 计算当前用户是否为组长
const isTeamLeader = computed(() => {
    return userStore.userInfo?.role_name === '组长';
});

// 计算当前用户所在的小组
const currentUserGroup = computed(() => {
    return userStore.userInfo?.group_id || null;
});

// 过滤小组列表，组长只能看到自己所在的小组
const filteredGroupList = computed(() => {
    if (isTeamLeader.value) {
        // 组长只能看到自己所在的小组
        return groupList.value.filter(group => group.id === currentUserGroup.value);
    } else {
        // 其他角色可以看到所有小组
        return groupList.value;
    }
});

// 初始化表单（新增/编辑模式差异化处理）
const initForm = () => {
    // console.log('子组件接收到的editTask：', editTask.value);
    if (isEditMode.value) {
        // 编辑模式：填充任务数据到表单
        taskForm.value = {
            id: editTask.value.id, // 关键：传递任务ID用于更新
            title: editTask.value.title || '',
            task_type: editTask.value.task_type || 'club',
            group_id: editTask.value.group_id || null,
            deadline: editTask.value.deadline || '',
            assessment_criteria: editTask.value.assessment_criteria || '',
            description: editTask.value.description || '',
            task_files: editTask.value.task_files || [],
            task_images: editTask.value.task_images || []
        };
        
        // 初始化文件和图片列表
        taskFiles.value = (editTask.value.task_files || []).map(url => ({
            name: url.split('/').pop(),
            url: url
        }));
        
        taskImages.value = (editTask.value.task_images || []).map(url => ({
            name: url.split('/').pop(),
            url: url
        }));
    } else {
        // 新增模式：重置表单
        const initialTaskType = isTeamLeader.value ? 'group' : 'club';
        const initialGroupId = isTeamLeader.value ? currentUserGroup.value : null;
        
        taskForm.value = {
            id: '',
            title: '',
            task_type: initialTaskType,
            group_id: initialGroupId,
            deadline: '',
            assessment_criteria: '',
            description: '',
            task_files: [],
            task_images: []
        };
        
        // 重置文件和图片列表
        taskFiles.value = [];
        taskImages.value = [];
    }
    // 重置表单校验状态
    if (formRef.value) formRef.value.resetFields();
};

// 禁止选择过去的日期（编辑模式允许选择当前及以后的日期，与新增一致）
const disabledPastDate = (time) => {
    return time.getTime() < Date.now() - 8.64e7; // 只能选择今天及以后的日期
};

// 处理文件变化
    const handleFileChange = async (file, fileList) => {
        console.log('文件变化:', file, fileList);
        
        // 直接更新文件列表
        taskFiles.value = fileList;
        
        // 更新taskForm中的文件URL列表
        taskForm.value.task_files = taskFiles.value.filter(f => f.url).map(f => f.url);
        
        // 检查file是否有效
        if (!file || !file.uid) {
            console.log('文件对象无效，跳过上传');
            return;
        }
        
        // 如果是新增文件且未上传
        if (file.status === 'ready' && file.raw) {
            console.log('检测到新文件，开始上传');
            
            // 验证文件
            if (!validateFiles([file], 'file')) {
                console.log('文件验证失败，移除文件');
                taskFiles.value = taskFiles.value.filter(f => f.uid !== file.uid);
                return;
            }
            
            try {
                // 创建FormData
                const formData = new FormData();
                formData.append('taskFiles', file.raw);
                
                // 调用上传API
                console.log('调用上传API');
                const res = await taskStore.UploadTaskFiles(formData);
                console.log('上传API返回结果:', res);
                
                if (res.code === 200 && res.data.fileUrls && res.data.fileUrls.length > 0) {
                    console.log('文件上传成功');
                    
                    // 获取服务器返回的URL
                    const fileUrl = res.data.fileUrls[0];
                    
                    // 更新文件列表
                    const updatedFiles = taskFiles.value.map(f => {
                        if (f.uid === file.uid) {
                            return {
                                ...f,
                                url: fileUrl,
                                status: 'success'
                            };
                        }
                        return f;
                    });
                    
                    taskFiles.value = updatedFiles;
                    taskForm.value.task_files = updatedFiles.filter(f => f.url).map(f => f.url);
                    
                    ElMessage.success('文件上传成功');
                    console.log('更新后的文件列表:', updatedFiles);
                    console.log('更新后的taskForm:', taskForm.value.task_files);
                } else {
                    console.log('文件上传失败：API返回错误');
                    // 更新文件状态为失败
                    const updatedFiles = taskFiles.value.map(f => {
                        if (f.uid === file.uid) {
                            return {
                                ...f,
                                status: 'fail'
                            };
                        }
                        return f;
                    });
                    taskFiles.value = updatedFiles;
                    ElMessage.error('文件上传失败：' + (res.msg || '未知错误'));
                }
            } catch (error) {
                console.log('文件上传失败：捕获到异常', error);
                // 更新文件状态为失败
                const updatedFiles = taskFiles.value.map(f => {
                    if (f.uid === file.uid) {
                        return {
                            ...f,
                            status: 'fail'
                        };
                    }
                    return f;
                });
                taskFiles.value = updatedFiles;
                ElMessage.error('文件上传失败：' + error.message);
            }
        }
    };

    // 处理图片变化
    const handleImageChange = async (file, fileList) => {
        console.log('图片变化:', file, fileList);
        
        // 直接更新图片列表
        taskImages.value = fileList;
        
        // 更新taskForm中的图片URL列表
        taskForm.value.task_images = taskImages.value.filter(f => f.url).map(f => f.url);
        
        // 检查file是否有效
        if (!file || !file.uid) {
            console.log('图片对象无效，跳过上传');
            return;
        }
        
        // 如果是新增图片且未上传
        if (file.status === 'ready' && file.raw) {
            console.log('检测到新图片，开始上传');
            
            // 验证图片
            if (!validateFiles([file], 'image')) {
                console.log('图片验证失败，移除图片');
                taskImages.value = taskImages.value.filter(f => f.uid !== file.uid);
                return;
            }
            
            try {
                // 创建FormData
                const formData = new FormData();
                formData.append('taskImages', file.raw);
                
                // 调用上传API
                console.log('调用上传API');
                const res = await taskStore.UploadTaskImages(formData);
                console.log('上传API返回结果:', res);
                
                if (res.code === 200 && res.data.imageUrls && res.data.imageUrls.length > 0) {
                    console.log('图片上传成功');
                    
                    // 获取服务器返回的URL
                    const imageUrl = res.data.imageUrls[0];
                    
                    // 更新图片列表
                    const updatedImages = taskImages.value.map(f => {
                        if (f.uid === file.uid) {
                            return {
                                ...f,
                                url: imageUrl,
                                status: 'success'
                            };
                        }
                        return f;
                    });
                    
                    taskImages.value = updatedImages;
                    taskForm.value.task_images = updatedImages.filter(f => f.url).map(f => f.url);
                    
                    ElMessage.success('图片上传成功');
                    console.log('更新后的图片列表:', updatedImages);
                    console.log('更新后的taskForm:', taskForm.value.task_images);
                } else {
                    console.log('图片上传失败：API返回错误');
                    // 更新图片状态为失败
                    const updatedImages = taskImages.value.map(f => {
                        if (f.uid === file.uid) {
                            return {
                                ...f,
                                status: 'fail'
                            };
                        }
                        return f;
                    });
                    taskImages.value = updatedImages;
                    ElMessage.error('图片上传失败：' + (res.msg || '未知错误'));
                }
            } catch (error) {
                console.log('图片上传失败：捕获到异常', error);
                // 更新图片状态为失败
                const updatedImages = taskImages.value.map(f => {
                    if (f.uid === file.uid) {
                        return {
                            ...f,
                            status: 'fail'
                        };
                    }
                    return f;
                });
                taskImages.value = updatedImages;
                ElMessage.error('图片上传失败：' + error.message);
            }
        }
    };

    // 处理文件移除
    const handleRemoveFile = (file, fileList) => {
        console.log('移除文件:', file, fileList);
        taskFiles.value = fileList;
        // 更新taskForm中的文件URL列表
        taskForm.value.task_files = fileList.filter(f => f.url).map(f => f.url);
    };

    // 处理图片移除
    const handleRemoveImage = (file, fileList) => {
        console.log('移除图片:', file, fileList);
        taskImages.value = fileList;
        // 更新taskForm中的图片URL列表
        taskForm.value.task_images = fileList.filter(f => f.url).map(f => f.url);
    };

    // 验证文件
    const validateFiles = (files, type) => {
        const maxSize = type === 'file' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
        const allowedTypes = type === 'file' ? ['.doc', '.docx', '.pdf', '.txt', '.zip', '.rar'] : ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        
        for (const file of files) {
            // 验证文件大小
            if (file.raw.size > maxSize) {
                ElMessage.error(`${type === 'file' ? '文件' : '图片'}大小不能超过${type === 'file' ? '10MB' : '5MB'}`);
                return false;
            }
            
            // 验证文件格式
            if (type === 'file') {
                const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
                if (!allowedTypes.includes(fileExtension.toLowerCase())) {
                    ElMessage.error(`文件格式不支持，请上传${allowedTypes.join(', ')}格式的文件`);
                    return false;
                }
            } else {
                if (!allowedTypes.includes(file.raw.type)) {
                    ElMessage.error(`图片格式不支持，请上传JPG、PNG、WEBP或GIF格式的图片`);
                    return false;
                }
            }
        }
        return true;
    };


// 提交任务（新增/编辑差异化处理）
const handleSubmit = async () => {
    // 表单校验
    await formRef.value.validate();

    try {
        // 1. 获取所有已上传的文件和图片URL
        const allFiles = taskFiles.value.filter(file => file.url).map(file => file.url);
        const allImages = taskImages.value.filter(file => file.url).map(file => file.url);
        
        // 2. 准备提交数据，将task_files和task_images转换为JSON字符串
        const submitData = {
            ...taskForm.value,
            task_files: JSON.stringify(allFiles || []),
            task_images: JSON.stringify(allImages || [])
        };
        
        // 3. 创建或更新任务
        let res;
        if (isEditMode.value) {
            // 编辑模式：调用store中的更新方法
            res = await taskStore.UpdateTask(taskForm.value.id, submitData);
        } else {
            // 新增模式：调用store中的创建方法
            res = await taskStore.CreateTask(submitData);
        }

        if (res.code === 200) {
            ElMessage.success(isEditMode.value ? '任务修改成功！' : '任务提交成功！');
            emit('submit-success'); // 通知父组件刷新任务列表
            handleClose(); // 关闭弹窗
        } else {
            ElMessage.error(`${isEditMode.value ? '任务修改' : '任务提交'}失败：` + (res.msg || '未知错误'));
        }
    } catch (error) {
        ElMessage.error(`${isEditMode.value ? '任务修改' : '任务提交'}失败：${error.message || '网络错误'}`);
        console.error(`${isEditMode.value ? 'Update' : 'Submit'} task error:`, error);
    }
};

// 监听props变化：同步弹窗状态和编辑任务数据
watch(() => props.modelValue, (newVal) => {
    isShow.value = newVal;
});

watch(
    () => props.editTask,
    (newVal) => {
        editTask.value = newVal;
        // 数据变化后，重新初始化表单（确保表单能获取到新值）
        if (isShow.value) {
            initForm();
        }
    },
    { deep: true } // 必须加 deep: true，因为父组件传递的是Proxy对象（响应式对象）
); // 深层监听，确保数据更新时能响应

// 监听isShow变化，通知父组件更新
watch(isShow, (newVal) => {
    emit('update:modelValue', newVal);
});

// // 监听小组ID变化（调试用）
// watch(() => taskForm.value.group_id, (newVal) => {
//     // console.log('选中的小组ID：', newVal);
// });

// 关闭弹窗
const handleClose = () => {
    isShow.value = false;
    // 重置编辑任务数据（避免下次打开弹窗时残留）
    editTask.value = null;
    initForm();
    // 重置文件和图片
    taskFiles.value = [];
    taskImages.value = [];
};
</script>

<style scoped lang="scss">
/* 减小整体容器上边距 */
.task-submit-form {
    margin-top: 5px;
}

/* 优化上传提示 */
.upload-tips {
    margin-top: 4px;
    font-size: 0.75rem;
    color: #999;
    margin-bottom: 5px;
}

/* 减小图片上传卡片尺寸 */
.el-upload--picture-card {
    width: 60px;
    height: 60px;
    margin-bottom: 5px;
}

/* 减小上传拖拽区域高度 */
:deep(.el-upload-dragger) {
    // padding: 10px 0 !important;
    min-height: 60px !important;
}

/* 减小上传文字 */
:deep(.el-upload__text) {
    font-size: 0.8rem;
    margin-top: 5px;
    line-height: 1.2;
}

/* 减小上传图标 */
:deep(.el-icon--upload) {
    font-size: 1.2rem;
}

/* 减小表单项间距 */
.el-form-item {
    margin-bottom: 12px !important;
}

/* 减小对话框内边距 */
:deep(.el-dialog__body) {
    padding: 15px !important;
}

/* 减小对话框标题高度 */
:deep(.el-dialog__header) {
    padding: 15px 20px !important;
}

/* 减小对话框底部间距 */
:deep(.el-dialog__footer) {
    padding: 10px 20px 20px !important;
}

// 适配小屏幕
@media (max-width: 768px) {
    .el-row {
        flex-direction: column;
    }

    .el-col {
        width: 100% !important;
        margin-bottom: 10px;
    }
}
</style>