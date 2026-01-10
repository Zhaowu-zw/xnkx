<template>
    <div class="profile-page">
        <!-- 返回按钮 -->
        <el-button type="text" class="back-button" @click="goBack">
            <el-icon class="back-icon">
                <ArrowLeft />
            </el-icon>
            返回
        </el-button>

        <el-card class="profile-edit-card" shadow="hover">
            <template v-slot:header>
                <div class="card-header">
                    <h2>编辑个人资料</h2>
                    <p class="subtitle">完善您的个人信息，让我们更好地了解您</p>
                </div>
            </template>

            <el-form ref="profileFormRef" :model="profileForm" :rules="rules" label-width="100px" class="profile-form"
                :size="formSize">
                <!-- 基本信息行 - 响应式布局调整 -->
                <el-row :gutter="16" :xs="1" :sm="2" :md="2">
                    <el-col :xs="24" :sm="12" :md="16">
                        <el-form-item label="昵称" prop="nickname">
                            <el-input v-model="profileForm.nickname" placeholder="请输入您的昵称（选填）"
                                maxlength="20"></el-input>
                        </el-form-item>
                    </el-col>

                    <el-col :xs="24" :sm="12" :md="8">
                        <el-form-item label="年龄" prop="age">
                            <el-input v-model="profileForm.age" placeholder="请输入您的年龄（选填）" type="number" min="1"
                                max="120"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="16" :xs="1" :sm="2" :md="2">
                    <el-col :xs="24" :sm="12" :md="8">
                        <el-form-item label="性别" prop="sex">
                            <el-select v-model="profileForm.sex" placeholder="请选择性别（必填）">
                                <el-option label="男" value="男"></el-option>
                                <el-option label="女" value="女"></el-option>
                                <el-option label="未知" value="未知"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>

                    <el-col :xs="24" :sm="12" :md="16">
                        <el-form-item label="手机号码" prop="telephone">
                            <el-input v-model="profileForm.telephone" placeholder="请输入手机号码（选填）"
                                maxlength="11"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <!-- 详细信息行 -->
                <el-form-item label="院系" prop="department">
                    <el-input v-model="profileForm.department" placeholder="请输入所在院系（选填）"></el-input>
                </el-form-item>

                <el-row :gutter="16" :xs="1" :sm="2" :md="2">
                    <el-col :xs="24" :sm="12" :md="12">
                        <el-form-item label="年级" prop="grade">
                            <el-input v-model="profileForm.grade" placeholder="请输入年级（选填）"></el-input>
                        </el-form-item>
                    </el-col>

                    <el-col :xs="24" :sm="12" :md="12">
                        <el-form-item label="学号" prop="student_number">
                            <el-input v-model="profileForm.student_number" placeholder="请输入学号（选填）"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="爱好" prop="hobbit">
                    <el-input v-model="profileForm.hobbit" placeholder="请输入爱好，多个爱好用逗号分隔（选填）"></el-input>
                </el-form-item>

                <el-form-item label="个人简介" prop="description">
                    <el-input v-model="profileForm.description" placeholder="请输入个人简介（选填）" type="textarea"
                        :rows="3"></el-input>
                </el-form-item>

                <!-- 头像上传区域 - 改为调用Pinia的上传方法（核心修改） -->
                <el-form-item label="头像" prop="avatar">
                    <!-- 自定义上传触发区域 -->
                    <div class="avatar-uploader" @click="triggerFileInput">
                        <img v-if="profileForm.avatar" :src="profileForm.avatar" class="avatar"
                            :alt="profileForm.nickname || '用户头像'">
                        <el-icon v-else class="avatar-uploader-icon">
                            <Plus />
                        </el-icon>
                    </div>
                    <!-- 隐藏的原生文件选择框 -->
                    <input type="file" ref="fileInputRef" class="hidden-file-input" accept="image/jpeg,image/png"
                        @change="handleFileSelect">
                    <div class="upload-tip">支持JPG、PNG格式，大小不超过5MB（选填）</div>
                    <!-- 上传/压缩中提示 -->
                    <div v-if="isUploading" class="compress-tip">{{ uploadingText }}</div>
                </el-form-item>

                <!-- 操作按钮 -->
                <el-form-item class="form-actions">
                    <el-button type="primary" @click="submitForm()" :loading="isSubmitting" class="submit-btn">
                        保存修改
                    </el-button>
                    <el-button @click="resetForm()" style="margin-left: 10px" class="reset-btn">
                        重置
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { Plus, ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage, ElNotification } from "element-plus";
import { useRouter } from 'vue-router';
import useUserStore from '@/stores/user';
import { editUserInfo } from "@/api/user";

const router = useRouter();
const userStore = useUserStore();

// 表单相关引用
const profileFormRef = ref(null);
const fileInputRef = ref(null); // 隐藏的文件选择框引用
const isSubmitting = ref(false);
const isUploading = ref(false); // 头像上传状态（替代原isCompressing）
const uploadingText = ref(''); // 上传提示文本

// 响应式表单大小（根据屏幕宽度调整）
const formSize = computed(() => {
    return window.innerWidth < 768 ? 'small' : 'default';
});

// 表单数据 - 初始化空值，后续从仓库同步
const profileForm = reactive({
    nickname: '',
    age: Number(''),
    sex: '',
    hobbit: '',
    avatar: '', // 存储头像URL（不再存Base64）
    description: '',
    telephone: '',
    department: '',
    grade: '',
    student_number: ''
});

// 表单验证规则 - 只保留sex为必填项，其他可选
const rules = reactive({
    sex: [
        { required: true, message: '请选择性别', trigger: 'change' }
    ],
    telephone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ],
    age: [

    ],
    nickname: [
        { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    description: [
        { max: 500, message: '个人简介不能超过500个字符', trigger: 'blur' }
    ]
});

// 监听userStore的userInfo变化，实时同步到表单（解决初始值不显示问题）
watch(() => userStore.userInfo, (newUserInfo) => {
    if (newUserInfo) {
        Object.assign(profileForm, {
            nickname: newUserInfo.nickname || '',
            age: newUserInfo.age ? newUserInfo.age : '',
            sex: newUserInfo.sex || '',
            hobbit: newUserInfo.hobbit || '',
            avatar: newUserInfo.avatar || '', // 同步仓库中的头像URL
            description: newUserInfo.description || '',
            telephone: newUserInfo.telephone || '',
            department: newUserInfo.department || '',
            grade: newUserInfo.grade || '',
            student_number: newUserInfo.student_number || ''
        });
    }
}, { immediate: true, deep: true });

// 页面挂载时主动拉取用户信息
onMounted(async () => {
    try {
        await userStore.UserInfo();
    } catch (error) {
        ElMessage.error('加载用户信息失败，请稍后重试');
        console.error('用户信息加载失败:', error);
    }
});

// --------------- 核心：头像处理逻辑（对接Pinia的uploadUserAvatar） ---------------
// 触发隐藏的文件选择框
const triggerFileInput = () => {
    fileInputRef.value?.click();
};

// 图片压缩函数（复用原有逻辑，保持压缩优化）
const compressImage = async (file) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 进一步缩小尺寸：宽高不超过300px
            const maxSize = 300;
            let width = img.width;
            let height = img.height;
            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            canvas.width = width;
            canvas.height = height;

            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // 进一步降低质量：0.4
            const quality = 0.4;
            canvas.toBlob(
                (blob) => {
                    // 把blob转回File对象（保持文件名和类型）
                    const compressedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                },
                file.type,
                quality
            );
        };
    });
};

// 文件选择后处理（调用Pinia的上传方法）
const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. 格式校验
    const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJPG) {
        ElMessage.error('上传头像图片只能是 JPG/PNG 格式!');
        fileInputRef.value.value = ''; // 清空选择
        return;
    }

    // 2. 大小校验（2MB）
    const isLt2M = file.size / 1024 / 1024 < 5;
    if (!isLt2M) {
        ElMessage.error('头像图片大小不能超过 5MB!');
        fileInputRef.value.value = '';
        return;
    }

    // 3. 压缩+上传流程
    isUploading.value = true;
    uploadingText.value = '图片压缩中...';
    try {
        // 3.1 压缩图片
        const compressedFile = await compressImage(file);

        // 3.2 调用Pinia的上传头像方法（和个人中心逻辑统一）
        uploadingText.value = '头像上传中...';
        const avatarUrl = await userStore.uploadUserAvatar(compressedFile);

        // 3.3 更新表单中的头像URL
        profileForm.avatar = avatarUrl;
        ElMessage.success('头像上传成功');
    } catch (error) {
        ElMessage.error(error.message || '头像上传失败，请重新选择');
        console.error('头像上传失败:', error);
    } finally {
        isUploading.value = false;
        uploadingText.value = '';
        fileInputRef.value.value = ''; // 清空选择框
    }
};

// --------------- 表单提交逻辑（优化头像处理） ---------------
const submitForm = async () => {
    try {
        isSubmitting.value = true;

        // 1. 表单验证
        await profileFormRef.value.validate();

        // 2. 处理提交参数
        const submitData = { ...profileForm };
        // 清空空值字段（避免后端接收无效空参数）
        Object.keys(submitData).forEach(key => {
            if (submitData[key] === '' || submitData[key] === Number('')) {
                delete submitData[key];
            }
        });
        // age转为数字类型
        if (submitData.age) {
            submitData.age = Number(submitData.age);
        }

        // 3. 提交到修改用户信息接口（头像已通过uploadUserAvatar上传，这里只传URL）
        await editUserInfo(submitData);

        // 4. 更新Pinia中的用户信息
        userStore.updateUserInfo(submitData);

        // 5. 成功提示并返回
        ElNotification({
            title: '修改成功',
            message: '您的个人资料已更新',
            type: 'success',
            duration: 2000
        });

        // 延迟返回，确保用户看到提示
        setTimeout(() => {
            goBack();
        }, 1500);

    } catch (error) {
        // 错误处理
        if (error.name === 'ValidationError') {
            ElMessage.error('请选择性别后提交');
        } else {
            ElNotification({
                title: '修改失败',
                message: error.message || '请检查数据',
                type: 'error'
            });
        }
    } finally {
        isSubmitting.value = false;
    }
};

// 重置表单
const resetForm = () => {
    profileFormRef.value?.resetFields();
    const userinfo = userStore.userInfo || {};
    // 重置为仓库中的原始值
    Object.assign(profileForm, {
        nickname: userinfo.nickname || '',
        age: userinfo.age ? userinfo.age : '',
        sex: userinfo.sex || '',
        hobbit: userinfo.hobbit || '',
        avatar: userinfo.avatar || '',
        description: userinfo.description || '',
        telephone: userinfo.telephone || '',
        department: userinfo.department || '',
        grade: userinfo.grade || '',
        student_number: userinfo.student_number || ''
    });
    ElMessage.info('表单已重置为原始数据');
};

// 返回上一页
const goBack = () => {
    router.back();
};

// 监听窗口大小变化
window.addEventListener('resize', () => { });
</script>

<style scoped>
/* 页面容器 */
.profile-page {
    width: 100vw;
    padding: 16px;
    min-height: 100vh;
    box-sizing: border-box;
    background-color: #f5f7fa;
}

/* 返回按钮样式 */
.back-button {
    display: flex;
    align-items: center;
    color: #409eff;
    margin-bottom: 16px;
    padding: 8px 0;
}

.back-icon {
    margin-right: 6px;
    font-size: 16px;
}

.profile-edit-card {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    border-radius: 12px;
    overflow: hidden;
}

.card-header {
    border-bottom: 1px solid #eee;
    padding-bottom: 15px;
}

.subtitle {
    color: #666;
    margin-top: 5px;
    font-size: 14px;
}

.profile-form {
    margin-top: 24px;
    padding: 0 16px 16px;
}

/* 头像上传样式 */
.avatar-uploader {
    cursor: pointer;
    display: inline-block;
    position: relative;
}

.avatar {
    width: clamp(80px, 25vw, 178px);
    height: clamp(80px, 25vw, 178px);
    display: block;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #f0f0f0;
}

.avatar-uploader-icon {
    font-size: clamp(20px, 4vw, 28px);
    color: #8c939d;
    width: clamp(80px, 25vw, 178px);
    height: clamp(80px, 25vw, 178px);
    line-height: clamp(80px, 25vw, 178px);
    text-align: center;
    border: 1px dashed #d9d9d9;
    border-radius: 50%;
    background-color: #f6f6f6;
    transition: all 0.3s;
}

.avatar-uploader-icon:hover {
    border-color: #409eff;
    background-color: #e8f4ff;
}

.hidden-file-input {
    display: none;
    /* 隐藏原生文件选择框 */
}

.upload-tip {
    margin-top: 10px;
    color: #666;
    font-size: 12px;
}

.compress-tip {
    margin-top: 8px;
    color: #409eff;
    font-size: 12px;
}

/* 按钮区域 */
.form-actions {
    margin-top: 30px;
    text-align: center;
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
}

.submit-btn,
.reset-btn {
    min-width: 120px;
}

/* 适配小屏幕设备 */
@media (max-width: 768px) {
    .profile-form {
        margin-top: 16px;
    }

    .card-header h2 {
        font-size: 18px;
    }

    .subtitle {
        font-size: 13px;
    }

    .form-actions {
        flex-direction: column;
        align-items: stretch;
    }

    .submit-btn,
    .reset-btn {
        width: 100%;
        margin-left: 0 !important;
    }
}

/* 适配超小屏幕设备 */
@media (max-width: 375px) {
    .profile-page {
        padding: 12px 8px;
    }

    .profile-form {
        padding: 0 8px 8px;
    }

    .el-form-item {
        margin-bottom: 16px;
    }
}
</style>