<template>
    <div class="container">
        <el-row justify="center" align="middle">
            <el-col :span="12" :xs="0">
            </el-col>
            <el-col :span="12" :xs="24">
                <!-- // 登录表单 -->
                <el-form class="login-form" :model="loginFrom" label-width="auto" :rules="rules" ref="loginForms"
                    status-icon v-show="isShow">
                    <h2 class="form-title">欢迎登录</h2>
                    <el-form-item label="用户名:" prop="login">
                        <el-input :prefix-icon="User" placeholder="请输入用户名或者邮箱" v-model="loginFrom.login"></el-input>
                    </el-form-item>
                    <el-form-item label="密码:" prop="password">
                        <el-input type="password" :prefix-icon="Lock" placeholder="请输入密码" show-password="true"
                            v-model="loginFrom.password"></el-input>
                    </el-form-item>
                    <el-form-item label="验证码:" prop="captcha">
                        <el-row :gutter="12">
                            <el-col :span="24">
                                <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                                    <el-input placeholder="请输入验证码" v-model="loginFrom.captcha" style="flex: 1; min-width: 120px;"></el-input>
                                    <el-button 
                                        type="primary" 
                                        :icon="Refresh" 
                                        @click="getLoginCaptcha" 
                                        :disabled="isLoginCounting"
                                        class="captcha-button"
                                        style="flex-shrink: 0; padding: 0 12px; font-size: 14px;"
                                    >
                                        {{ isLoginCounting ? `${loginCountdown}秒后刷新` : '获取验证码' }}
                                    </el-button>
                                </div>
                                <!-- 验证码显示区域 -->
                                <div class="captcha-container" style=" margin-top: 0; width: auto;" v-if="loginFrom.captchaText">
                                    <span class="captcha-text">{{ loginFrom.captchaText || '点击获取验证码' }}</span>
                                </div>
                            </el-col>
                        </el-row>
                    </el-form-item>
                    <span class="form-change"><i @click="isShowLogin">还没有账号？立即注册！</i></span>
                    <el-form-item>
                        <el-button type="primary" @click="handleLogin" class="login-button" :loading="loading"
                            :disabled="loading">登录</el-button>
                    </el-form-item>
                </el-form>
                <!-- //注册表单 -->
                <el-form class="login-form" label-width="auto" :model="registerFrom" :rules="rules" ref="registerForms"
                    status-icon v-show="!isShow">
                    <h2 class="form-title">欢迎注册</h2>
                    <el-form-item label="用户名:" prop="username">
                        <el-input :prefix-icon="User" placeholder="请输入用户名" v-model="registerFrom.username"></el-input>
                    </el-form-item>
                    <el-form-item label="密码:" prop="password">
                        <el-input type="password" :prefix-icon="Lock" placeholder="请输入密码" show-password="true"
                            v-model="registerFrom.password"></el-input>
                    </el-form-item>
                    <el-form-item label="确认密码:" prop="repassword">
                        <el-input type="password" :prefix-icon="Lock" placeholder="请再次输入密码" show-password="true"
                            v-model="registerFrom.repassword"></el-input>
                    </el-form-item>
                    <el-form-item label="邮箱:" prop="email">
                        <el-input type="email" :prefix-icon="Message" placeholder="请输入邮箱"
                            v-model="registerFrom.email"></el-input>
                    </el-form-item>
                    <el-form-item label="验证码:" prop="captcha">
                        <el-row :gutter="12">
                            <el-col :span="24">
                                <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                                    <el-input placeholder="请输入验证码" v-model="registerFrom.captcha" style="flex: 1; min-width: 120px;"></el-input>
                                    <el-button 
                                        type="primary" 
                                        :icon="Refresh" 
                                        @click="getRegisterCaptcha" 
                                        :disabled="isRegisterCounting"
                                        class="captcha-button"
                                        style="flex-shrink: 0; padding: 0 12px; font-size: 14px;"
                                    >
                                        {{ isRegisterCounting ? `${registerCountdown}秒后刷新` : '获取验证码' }}
                                    </el-button>
                                </div>
                                <!-- 验证码显示区域 -->
                                <div class="captcha-container" style=" margin-top: 0; width: auto;"  v-if="registerFrom.captchaText">
                                    <span class="captcha-text">{{ registerFrom.captchaText || '点击获取验证码' }}</span>
                                </div>
                            </el-col>
                        </el-row>
                    </el-form-item>
                    <span class="form-change"><i @click="isShowLogin">已有账号？前去登录！</i></span>
                    <el-form-item>
                        <el-button type="primary" @click="handleRegister" class="login-button" :loading="loading"
                            :disabled="loading">注册</el-button>
                    </el-form-item>
                </el-form>

            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { User, Lock, Message, Refresh } from '@element-plus/icons-vue';
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElNotification } from "element-plus"
import useUserStore from '@/stores/user.js';
import { getTimePeriodAndDetail } from '@/utils/time.js';
let isShow = ref(true); // 控制登录和注册表单的显示
let loginFrom = reactive({
    login: '',
    password: '',
    captcha: '',
    captchaId: '',
    captchaText: ''
});
let registerFrom = reactive({
    username: '',
    password: '',
    repassword: '',
    email: '',
    captcha: '',
    captchaId: '',
    captchaText: ''
});
// 验证码倒计时（为登录和注册分别创建独立的状态）
let loginCountdown = ref(0);
let isLoginCounting = ref(false);
let registerCountdown = ref(0);
let isRegisterCounting = ref(false);
let loading = ref(false);
let loginForms = ref();
let registerForms = ref();
let $router = useRouter();
let userStore = useUserStore();
let currentTime = getTimePeriodAndDetail();

// 移除组件挂载时自动获取验证码，改为用户点击获取验证码按钮时调用
onMounted(() => {
    // 组件挂载时不自动获取验证码
});



const validatorUsername = (rule, value, callback) => {
    const usernameRegex = /^[A-Z][a-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/;
    if (usernameRegex.test(value)) {

        if (value.length < 2 || value.length > 15) {
            callback(new Error('用户名长度应在2到15个字符之间'));
        } else {
            callback();
        }
    } else {
        callback(new Error('用户名应以大写字母开头，且只能包含小写字母、数字和特殊字符'));
    }

};
const validatorRepassword = (rule, value, callback) => {
    if (value !== registerFrom.password) {
        callback(new Error('两次输入的密码不一致'));
    } else {
        callback();
    }
};
const rules = {
    login: [
        { required: true, message: '请输入用户名或邮箱', trigger: 'change' },
        {
            validator: (rule, value, callback) => {
                // 允许字母、数字、@（邮箱）、下划线等
                const reg = /^[a-zA-Z0-9_@.]+$/;
                if (!reg.test(value)) {
                    callback(new Error('用户名只能包含字母、数字、@、_或.'));
                } else {
                    callback();
                }
            },
            trigger: 'change'
        }
    ],
    username: [
        { required: true, validator: validatorUsername, trigger: 'change' },
    ],
    password: [
        { required: true, min: 6, max: 20, message: '密码必须要6-12位', trigger: 'change' },
    ],
    repassword: [
        { required: true, validator: validatorRepassword, trigger: 'change'}
    ],
    email: [
        { required: true, message: '请输入邮箱', trigger: 'change' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
    ],
    captcha: [
        { required: true, message: '请输入验证码', trigger: 'change' },
        { min: 4, max: 4, message: '验证码长度为4位', trigger: 'change' }
    ]
};


const isShowLogin = () => {
    isShow.value = !isShow.value;
};

// 获取登录验证码
const getLoginCaptcha = async () => {
    try {
        const captchaData = await userStore.GetCaptcha();
        loginFrom.captchaText = captchaData.captcha;
        loginFrom.captchaId = captchaData.captchaId;
        startCountdown('login');
    } catch (error) {
        console.error('获取登录验证码失败:', error);
        ElNotification({
            title: '获取验证码失败',
            message: error.message || '获取验证码出现错误，请稍后重试',
            type: 'error',
        });
    }
};

// 获取注册验证码
const getRegisterCaptcha = async () => {
    try {
        const captchaData = await userStore.GetCaptcha();
        registerFrom.captchaText = captchaData.captcha;
        registerFrom.captchaId = captchaData.captchaId;
        startCountdown('register');
    } catch (error) {
        console.error('获取注册验证码失败:', error);
        ElNotification({
            title: '获取验证码失败',
            message: error.message || '获取验证码出现错误，请稍后重试',
            type: 'error',
        });
    }
};

// 开始倒计时，区分登录和注册
const startCountdown = (type) => {
    if (type === 'login') {
        isLoginCounting.value = true;
        loginCountdown.value = 60;
        const timer = setInterval(() => {
            loginCountdown.value--;
            if (loginCountdown.value <= 0) {
                clearInterval(timer);
                isLoginCounting.value = false;
            }
        }, 1000);
    } else if (type === 'register') {
        isRegisterCounting.value = true;
        registerCountdown.value = 60;
        const timer = setInterval(() => {
            registerCountdown.value--;
            if (registerCountdown.value <= 0) {
                clearInterval(timer);
                isRegisterCounting.value = false;
            }
        }, 1000);
    }
};

const handleLogin = async () => {
    await loginForms.value.validate();
    loading.value= true;
    try {
        await userStore.UserLogin(loginFrom);
        if(userStore.role_name==='管理员'){
            $router.push('/management/data-stat');
            ElNotification({
                title: `Hi,${currentTime.period}好!`,
                message: '欢迎管理员登录！',
                type: 'success',
            });
            loading.value=false;
        }else{
            $router.push('/');
            ElNotification({
                title: `Hi,${currentTime.period}好!`,
                message: '登录成功！',
                type: 'success',
            });
            loading.value = false;
        }
    } catch (error) {
        loading.value = false;
        ElNotification({
            title: '登录失败',
            message: error.errors?.join('，') || '登录出现错误，请稍后重试',
            type: 'error',
        });
    }
}

const handleRegister = async () => {
    await registerForms.value.validate();
    loading.value = true;
    try {
        await userStore.UserRegister(registerFrom);
        ElNotification({
            title: '注册成功',
            message: '请前往登录！',
            type: 'success',
        }); 
        loading.value = false;
        isShow.value = true;
    } catch (error) {
        loading.value = false;
        ElNotification({
            title: '注册失败',
            message: error.errors?.join('，') || '注册出现错误，请稍后重试',
            type: 'error',
        });
        return;
    }

}
</script>

<style scoped lang="scss">
.container {
    height: 100vh; // 使容器高度占满视口高度，确保垂直居中
    justify-content: center; // 水平居中
    align-items: center; // 垂直居中
    background: url('../../assets/images/login_bg.png') no-repeat center center;
    background-size: cover;

    .captcha-container {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        /* 移除固定宽度，改为自适应内容 */
        height: 40px;
        padding: 0 20px;
        background-color: #f0f4f8;
        border: 1px solid #dcdfe6;
        border-radius: 6px;
        position: relative;
        overflow: hidden;

        /* 添加干扰线 */
        &::before,
        &::after {
            content: '';
            position: absolute;
            width: 150%;
            height: 1px;
            background: linear-gradient(90deg, transparent, #909399, transparent);
            transform: rotate(-30deg);
            opacity: 0.3;
        }

        &::before {
            top: 10px;
        }

        &::after {
            bottom: 10px;
        }

        .captcha-text {
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #303133;
            font-family: 'Arial', 'Helvetica', sans-serif;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
            z-index: 1;
            user-select: none;
        }
    }
    
    /* 移动端响应式优化 */
    @media (max-width: 768px) {
        .captcha-container {
            padding: 0 15px;
            height: 36px;
            
            .captcha-text {
                font-size: 16px;
                letter-spacing: 6px;
            }
            
            &::before,
            &::after {
                width: 200%;
            }
        }
        
        .login-form {
            width: 95%;
            padding: 1rem;
            top: 25vh;
            
            .login-button {
                width: 90%;
            }
        }
    }
    
    @media (max-width: 480px) {
        .captcha-container {
            padding: 0 12px;
            height: 32px;
            
            .captcha-text {
                font-size: 14px;
                letter-spacing: 4px;
            }
        }
        
        .login-form {
            width: 98%;
            padding: 0.8rem;
        }
    }

    /* 验证码按钮样式优化 */
    :deep(.el-button) {
        border-radius: 4px;
        transition: all 0.3s ease;

        &:hover {
            color: #409eff;
            background-color: #ecf5ff;
        }
    }

    .login-form {
        position: relative;
        width: 80%;
        top: 30vh;
        padding: 2rem;
        margin: auto;
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

        .form-title {
            text-align: center;
            margin-bottom: 1.5rem;
            font-weight: bold;
            color: #333;
        }

        .form-change {
            display: block;
            text-align: right;
            margin-bottom: 1rem;

            i {
                color: #409EFF;
                cursor: pointer;


                &:hover {
                    // text-decoration: underline;
                    color: #333;
                }
            }

        }

        .login-button {
            margin: auto;
            width: 80%;
        }
    }
}
</style>