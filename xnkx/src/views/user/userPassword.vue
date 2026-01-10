<template>
    <div class="change-password-page">
        <!-- 返回按钮 -->
        <el-button type="text" class="back-button" @click="goBack">
            <el-icon class="back-icon">
                <ArrowLeft />
            </el-icon>
            返回
        </el-button>
        <!-- 主内容区 -->
        <div class="password-container">
            <div class="password-card">
                <h2 class="card-title">更改密码</h2>
                <p class="card-desc">为了您的账户安全，请设置复杂度较高的密码</p>

                <!-- 更改密码表单 -->
                <el-form :model="passwordForm" :rules="formRules" ref="passwordFormRef" label-width="100px">
                    <!-- 原密码 -->
                    <el-form-item label="原密码" prop="oldPassword">
                        <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码"
                            :show-password="true" />
                    </el-form-item>

                    <!-- 新密码 -->
                    <el-form-item label="新密码" prop="newPassword">
                        <el-input v-model="passwordForm.newPassword" type="password"
                            placeholder="请输入6-20位新密码（含字母+数字，支持特殊字符）" :show-password="true"
                            @input="checkPasswordStrength(passwordForm.newPassword)" />

                        <!-- 密码强度提示（优化后） -->
                        <div class="password-strength" v-if="passwordForm.newPassword.length > 0">
                            <div class="strength-header">
                                <span class="strength-label">密码强度：</span>
                                <span class="strength-text" :class="strengthTextClass">{{ strengthText }}</span>
                            </div>
                            <!-- 强度进度条 -->
                            <div class="strength-bar">
                                <div class="strength-segment"
                                    :class="{ active: index < strengthLevel, [`level-${index + 1}`]: index < strengthLevel }"
                                    v-for="index in 4" :key="index"></div>
                            </div>
                            <!-- 强度说明 -->
                            <div class="strength-desc">{{ strengthDesc }}</div>
                        </div>
                    </el-form-item>

                    <!-- 确认新密码 -->
                    <el-form-item label="确认密码" prop="confirmPassword">
                        <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码"
                            :show-password="true" />
                    </el-form-item>

                    <!-- 提交按钮 -->
                    <el-form-item class="submit-btn-group">
                        <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">
                            确认更改
                        </el-button>
                        <el-button @click="handleReset">重置</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { putUserPassword } from '@/api/user'
import useUserStore from '@/stores/user';
import { useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';

const userStore = useUserStore();
const router = useRouter();
const passwordFormRef = ref(null); // 表单引用
const isSubmitting = ref(false); // 提交加载状态

// 表单数据
const passwordForm = reactive({
    oldPassword: '', // 原密码
    newPassword: '', // 新密码
    confirmPassword: '' // 确认新密码
});

// 密码强度相关（优化后）
const strengthLevel = ref(0); // 0-4级强度（0：未输入，1：弱，2：中，3：强，4：极强）
const strengthText = ref('未输入'); // 强度文本
const strengthDesc = ref(''); // 强度说明
const strengthTextClass = computed(() => {
    // 文本颜色与强度对应
    switch (strengthLevel.value) {
        case 1: return 'text-weak';
        case 2: return 'text-medium';
        case 3: return 'text-strong';
        case 4: return 'text-very-strong';
        default: return '';
    }
});

// 表单校验规则（保持不变，新增特殊字符支持提示）
const formRules = reactive({
    oldPassword: [
        { required: true, message: '请输入原密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' },
        {
            pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
            message: '密码需同时包含字母和数字',
            trigger: 'blur'
        },
        {
            validator: (rule, value, callback) => {
                if (value === passwordForm.oldPassword) {
                    callback(new Error('新密码不能与原密码相同'));
                } else {
                    callback();
                }
            },
            trigger: 'blur'
        }
    ],
    confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
            validator: (rule, value, callback) => {
                if (value !== passwordForm.newPassword) {
                    callback(new Error('两次输入的密码不一致'));
                } else {
                    callback();
                }
            },
            trigger: 'blur'
        }
    ]
});

// 检查密码强度（优化核心逻辑）
const checkPasswordStrength = (password) => {
    const len = password.length;
    let level = 0;

    // 规则1：纯字母或纯数字 → 弱（1级）
    if (/^[a-zA-Z]+$/.test(password) || /^\d+$/.test(password)) {
        level = 1;
    }
    // 规则2：字母+数字 → 中（2级）
    else if (/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(password)) {
        level = 2;
        // 规则3：字母+数字 + 长度≥12 → 强（3级）
        if (len >= 12) {
            level = 3;
        }
        // 规则4：字母+数字+特殊字符 → 极强（4级）
        if (/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+~`\-={}[\]:;"'<>,.?/\\|]).+$/.test(password)) {
            level = 4;
        }
    }

    // 更新强度相关状态
    strengthLevel.value = level;
    switch (level) {
        case 0:
            strengthText.value = '未输入';
            strengthDesc.value = '';
            break;
        case 1:
            strengthText.value = '弱';
            strengthDesc.value = '建议包含字母+数字组合，提升安全性';
            break;
        case 2:
            strengthText.value = '中';
            strengthDesc.value = '建议增加长度至12位以上或添加特殊字符';
            break;
        case 3:
            strengthText.value = '强';
            strengthDesc.value = '密码安全性良好，可添加特殊字符进一步提升';
            break;
        case 4:
            strengthText.value = '极强';
            strengthDesc.value = '密码安全性优秀，不易被破解';
            break;
    }
};

// 提交修改密码（保持不变）
const handleSubmit = async () => {
    try {
        await passwordFormRef.value.validate();
        isSubmitting.value = true;
        const res = await putUserPassword(passwordForm)

        if (res.code === 200) {
            ElMessage.success('密码修改成功！请重新登录');
            userStore.logout();
            router.push('/login');
        } else {
            ElMessage.error(res.message || '密码修改失败');
        }
    } catch (error) {
        console.error('修改密码失败：', error);
        ElMessage.error('表单校验失败或网络异常');
    } finally {
        isSubmitting.value = false;
    }
};

// 重置表单（保持不变）
const handleReset = () => {
    passwordFormRef.value.resetFields();
    strengthLevel.value = 0;
    strengthText.value = '未输入';
    strengthDesc.value = '';
};

// 返回上一页（保持不变）
const goBack = () => {
    router.back();
};
</script>

<style scoped lang="scss">
.change-password-page {
    width: 100vw;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background-color: #f8f9fa;
    min-height: 100vh;
    color: #333;
}

// 主容器
.password-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 0 1.5rem;
}

/* 返回按钮样式 */
.back-button {
    display: flex;
    align-items: center;
    color: #409eff;
    margin-bottom: 16px;
    padding: 8px 0;

    .back-icon {
        margin-right: 6px;
        font-size: 16px;
    }
}

// 卡片样式（与个人中心统一）
.password-card {
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
    padding: 2.5rem;

    .card-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #2c3e50;
        margin: 0 0 0.5rem;
        text-align: center;
    }

    .card-desc {
        font-size: 0.9rem;
        color: #666;
        margin: 0 0 2rem;
        text-align: center;
    }
}

// 表单样式
.el-form {
    width: 100%;

    .el-form-item {
        margin-bottom: 1.5rem;

        .el-input {
            width: 100%;
        }
    }

    // 密码强度提示（优化后样式）
    .password-strength {
        margin-top: 0.8rem;
        width: 100%;

        // 强度标题栏
        .strength-header {
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;

            .strength-label {
                font-size: 0.85rem;
                color: #666;
                margin-right: 8px;
            }

            .strength-text {
                font-size: 0.85rem;
                font-weight: 500;

                // 强度文本颜色
                &.text-weak {
                    color: #ef4444;
                }

                // 弱-红色
                &.text-medium {
                    color: #f59e0b;
                }

                // 中-橙色
                &.text-strong {
                    color: #3b82f6;
                }

                // 强-蓝色
                &.text-very-strong {
                    color: #42b983;
                }

                // 极强-绿色
            }
        }

        // 强度进度条（4段式）
        .strength-bar {
            display: flex;
            gap: 4px;
            height: 8px;
            width: 100%;
            border-radius: 4px;
            overflow: hidden;

            .strength-segment {
                flex: 1;
                background-color: #f1f1f1;
                transition: all 0.3s ease;

                // 激活状态的颜色（与文本颜色对应）
                &.level-1 {
                    background-color: #ef4444;
                }

                &.level-2 {
                    background-color: #f59e0b;
                }

                &.level-3 {
                    background-color: #3b82f6;
                }

                &.level-4 {
                    background-color: #42b983;
                }

                // 未激活时的hover效果
                &:not(.active):hover {
                    background-color: #e0e0e0;
                }
            }
        }

        // 强度说明文本
        .strength-desc {
            margin-top: 0.5rem;
            font-size: 0.75rem;
            color: #999;
            transition: color 0.3s ease;

            // 弱强度时说明文本标红，提醒用户
            .text-weak+& {
                color: #ef4444;
            }
        }
    }

    // 提交按钮组
    .submit-btn-group {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 2rem;

        .el-button {
            padding: 0.6rem 2rem;
            font-size: 1rem;
        }
    }
}

// 响应式适配
@media (max-width: 768px) {
    .password-card {
        padding: 1.5rem;
    }

    .el-form-item {
        margin-bottom: 1.2rem;
    }

    .submit-btn-group {
        flex-direction: column;
        gap: 0.8rem;

        .el-button {
            width: 100%;
        }
    }

    // 小屏幕下强度说明换行自适应
    .strength-desc {
        word-break: break-all;
    }
}
</style>