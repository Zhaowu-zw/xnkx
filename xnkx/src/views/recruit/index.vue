<template>
    <div class="recruitment-container">
        <!-- 头部组件 -->
        <HeaderView />

        <!-- 主视觉区域（优化移动端视觉） -->
        <section class="hero-section">
            <div class="hero-overlay">
                <h1 class="hero-title">加入我们，共创精彩</h1>
                <p class="hero-subtitle">这里是展示才华的舞台，是结识挚友的家园</p>
                <a href="#application" class="cta-button"
                    v-if="recruitEntryEnabled && isLogin && isMember && !recruitStore.isSubmitRecruit">立即报名</a>
            </div>
        </section>

        <!-- 纳新须知（优化移动端间距和字体） -->
        <section class="notice-section">
            <div class="container">
                <h2 class="section-title">
                    <i class="icon-notice"></i>纳新须知
                </h2>
                <div class="notice-card">
                    <!-- 纳新对象 -->
                    <div class="notice-item">
                        <h3 class="notice-title">纳新对象</h3>
                        <p class="notice-content">全体在校学生（不限年级、专业），对我们的组织有浓厚兴趣，愿意积极参与活动、贡献力量的同学。</p>
                    </div>

                    <!-- 纳新时间 -->
                    <div class="notice-item">
                        <h3 class="notice-title">纳新时间</h3>
                        <p class="notice-content">报名期：2025年9月1日 - 2025年9月15日</p>
                        <p class="notice-content">面试期：2025年9月16日 - 2025年9月20日</p>
                        <p class="notice-content">结果公示：2025年9月25日</p>
                    </div>

                    <!-- 招募组别 -->
                    <div class="notice-item">
                        <h3 class="notice-title">招募组别</h3>
                        <ul class="department-list">
                            <li v-for="item in groupInfo" :key="item"><i class="icon-check"></i>{{item.group_name}}：{{
                                item.function_desc }}</li>
                        </ul>
                    </div>

                    <!-- 报名要求 -->
                    <div class="notice-item">
                        <h3 class="notice-title">报名要求</h3>
                        <ul class="requirement-list">
                            <li><i class="icon-star"></i>有责任心，积极主动，能按时完成分配的任务</li>
                            <li><i class="icon-star"></i>具备团队合作精神，乐于分享与交流</li>
                            <li><i class="icon-star"></i>有相关经验者优先，但不是必需条件</li>
                            <li><i class="icon-star"></i>能够合理安排时间，参与组织常规活动</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- 权限提示（优化逻辑和样式） -->
        <section class="permission-tip" v-if="!recruitEntryEnabled || !isLogin || !isMember || recruitStore.isSubmitRecruit">
            <div class="container">
                <div class="tip-card">
                    <!-- 合并权限提示，避免多个alert堆叠 -->
                    <el-alert :title="getPermissionTipText" type="info" show-icon :closable="false"
                        class="permission-alert" />
                </div>
            </div>
        </section>

        <!-- 报名入口（权限控制） -->
        <section id="application" class="application-section"
            v-if="recruitEntryEnabled && isLogin && isMember && !recruitStore.isSubmitRecruit">
            <div class="container">
                <h2 class="section-title">
                    <i class="icon-application"></i>报名入口
                </h2>
                <div class="application-card">
                    <!-- Element Plus表单（优化移动端交互） -->
                    <el-form :model="form" ref="recruitForm" :rules="formRules" label-width="80px"
                        class="application-form" @submit.prevent="handleSubmit">
                        <el-form-item label="姓名" prop="name">
                            <el-input v-model="form.name" placeholder="请输入您的姓名" />
                        </el-form-item>

                        <el-form-item label="学号" prop="sno">
                            <el-input v-model="form.sno" placeholder="请输入您的学号" />
                        </el-form-item>

                        <el-form-item label="意向组别" prop="intention_group_id">
                            <el-select v-model="form.intention_group_id" placeholder="请选择意向组别">
                                <el-option label="网页组" value="1" />
                                <el-option label="虚拟组" value="2" />
                                <el-option label="维修组" value="3" />
                                <el-option label="人工组" value="4" />
                                <el-option label="大数据组" value="5" />
                                <el-option label="服从调剂" value="0" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="联系电话" prop="iphone">
                            <el-input v-model="form.iphone" placeholder="请输入您的手机号码" />
                        </el-form-item>

                        <el-form-item label="电子邮箱" prop="email">
                            <el-input v-model="form.email" type="email" placeholder="请输入您的电子邮箱" />
                        </el-form-item>

                        <el-form-item label="个人简介" prop="application_info">
                            <el-input v-model="form.application_info" type="textarea" :rows="4"
                                placeholder="请简要介绍自己（兴趣爱好、特长、相关经历等）" />
                        </el-form-item>

                        <el-form-item class="form-actions">
                            <el-button type="primary" native-type="submit" class="submit-button"
                                :disabled="recruitStore.isSubmitRecruit">
                                提交报名
                            </el-button>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
        </section>

        <!-- 底部组件 -->
        <FooterView />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElButton, ElAlert, ElMessage } from 'element-plus';
import HeaderView from '@/components/HeaderView.vue';
import FooterView from '@/components/FooterView.vue';
import useRecruitStore from '@/stores/recruit';
import useUserStore from '@/stores/user';
import useGroupStore from '@/stores/group';
// 导入系统配置API
import { getRecruitEntryStatus } from '@/api/systemConfig';

const recruitStore = useRecruitStore();
const userStore = useUserStore();
const groupStore = useGroupStore();
const userInfo = computed(() => userStore.userInfo || {});
const groupInfo = groupStore.groupInfo;

// 纳新报名入口状态
const recruitEntryEnabled = ref(true);
const isLoading = ref(false);
const entryClosedTip = ref(false);

// 登录状态 & 成员身份
const isLogin = computed(() => !!userInfo.value && Object.keys(userInfo.value).length > 0);
const isMember = computed(() => userStore.role_name === '普通用户');

// 获取报名入口状态
const fetchRecruitEntryStatus = async () => {
    try {
        isLoading.value = true;
        const response = await getRecruitEntryStatus();
        if (response.status === 'success' && response.data) {
            recruitEntryEnabled.value = response.data.enabled;
            entryClosedTip.value = !response.data.enabled;
        }
    } catch (error) {
        console.error('获取报名入口状态失败:', error);
        ElMessage.error('获取报名入口状态失败');
    } finally {
        isLoading.value = false;
    }
};

// 优化：权限提示文本（合并为单个提示）
const getPermissionTipText = computed(() => {
    if (!recruitEntryEnabled.value) {
        return '当前纳新报名入口已关闭，敬请期待下次纳新';
    } else if (!isLogin.value) {
        return '请先登录账号，才能使用报名/查询功能';
    } else if (!isMember.value) {
        return '您已是组织成员，无法重复报名';
    } else if (recruitStore.isSubmitRecruit) {
        return '您已成功报名，无法重复报名，如需重新报名请联系管理员';
    }
    return '';
});

// 报名表单数据
const form = ref({
    name: userInfo.value.nickname || '',
    sno: userInfo.value.student_number || '',
    intention_group_id: '1',
    iphone: userInfo.value.telephone || '',
    email: '',
    application_info: ''
});

// 监听用户信息变化
onMounted(async() => {
    form.value.name = userInfo.value.nickname || '';
    form.value.sno = userInfo.value.student_number || '';
    form.value.iphone = userInfo.value.telephone || '';

    // 获取报名入口状态
    await fetchRecruitEntryStatus();

    if (!groupStore.isGroupInfoFetched) {
        try {
            // 首次查询：调用接口
            await groupStore.GetGroupInfo();
            // 更新持久化标记：标记为已查询
            groupStore.isGroupInfoFetched = true;
        } catch (error) {
            console.error('首次查询小组信息失败：', error);
            ElMessage.error('加载小组信息失败，请刷新重试');
        }
    }
});

// 报名表单验证规则
const formRules = ref({
    name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 10, message: '姓名长度在2-10个字符之间', trigger: 'blur' }
    ],
    sno: [
        { required: true, message: '请输入学号', trigger: 'blur' },
        { pattern: /^\d+$/, message: '学号只能是数字', trigger: 'blur' }
    ],
    intention_group_id: [
        { required: true, message: '请选择意向组别', trigger: 'change' }
    ],
    iphone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码格式', trigger: 'blur' }
    ],
    email: [
        { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
    ],
    application_info: [
        { required: true, message: '请填写个人简介', trigger: 'blur' },
        { min: 20, max: 500, message: '简介长度在20-500字之间', trigger: 'blur' }
    ]
});


// 提交报名表单
const recruitForm = ref(null);
const handleSubmit = async () => {
    const valid = await recruitForm.value.validate();
    if (!valid) return;

    try {
        await recruitStore.SubmitRecruitInfo(form.value);
        ElMessage.success('报名成功！我们会尽快与您联系，请留意通知。');
        recruitStore.isSubmitRecruit = true;
    } catch (error) {
        ElMessage.error('报名失败，请稍后重试');
        console.error('提交失败：', error);
    }
};


</script>

<style scoped lang="scss">
// 全局样式变量
$primary-color: #42b983;
$secondary-color: #35495e;
$accent-color: #ff7e5f;
$light-gray: #f5f7fa;
$dark-gray: #4e5969;
$success-color: #52c41a;
$warning-color: #faad14;
$pending-color: #1890ff;
$required-color: #ff4d4f;

// 基础容器（优化移动端适配）
.recruitment-container {
    width: 100vw;
    min-height: 100vh;
    background-color: #f7f9fc;
    overflow-x: hidden;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    padding-bottom: 2rem;
    -webkit-font-smoothing: antialiased; // 优化字体渲染
}

// 主视觉区域（优化移动端视觉）
.hero-section {
    position: relative;
    height: 40vh;
    min-height: 280px;
    background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
        url('https://picsum.photos/id/1067/1920/1080') center/cover no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    text-align: center;

    .hero-overlay {
        padding: 0 15px;
    }

    .hero-title {
        font-size: clamp(1.6rem, 5vw, 1.8rem); // 响应式字体
        margin-bottom: 0.8rem;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        font-weight: 600;
    }

    .hero-subtitle {
        font-size: clamp(0.9rem, 3vw, 1rem);
        margin-bottom: 1.5rem;
        opacity: 0.95;
        line-height: 1.5;
    }

    .cta-button {
        display: inline-block;
        background-color: $primary-color;
        color: white;
        padding: 10px 24px;
        border-radius: 30px;
        font-size: 0.95rem;
        font-weight: 500;
        text-decoration: none;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(66, 185, 131, 0.3);

        &:hover {
            background-color: #359469;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(66, 185, 131, 0.4);
        }
    }
}

// 通用section样式（优化间距）
.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 15px;
}

.section-title {
    font-size: clamp(1.3rem, 4vw, 1.5rem);
    color: $secondary-color;
    margin-bottom: 1.5rem;
    padding-bottom: 0.6rem;
    border-bottom: 2px solid $primary-color;
    display: inline-block;
    font-weight: 600;

    i {
        margin-right: 6px;
        color: $primary-color;
    }
}

// 纳新须知 section（优化移动端体验）
.notice-section {
    padding: 2rem 0;
    background-color: white;

    .notice-card {
        background-color: $light-gray;
        border-radius: 12px; // 优化圆角
        padding: 1.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); // 优化阴影
        border: none; // 取消卡片边框
    }

    .notice-item {
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px dashed #e0e0e0;

        &:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
    }

    .notice-title {
        font-size: 1.1rem;
        color: $secondary-color;
        margin-bottom: 0.6rem;
        display: flex;
        align-items: center;
        font-weight: 500;

        &::before {
            content: '';
            display: inline-block;
            width: 6px;
            height: 6px;
            background-color: $primary-color;
            border-radius: 50%;
            margin-right: 6px;
        }
    }

    .notice-content {
        color: $dark-gray;
        line-height: 1.5;
        margin-bottom: 0.4rem;
        font-size: 0.95rem;
    }

    .department-list,
    .requirement-list {
        list-style: none;
        padding-left: 0;
        color: $dark-gray;
        line-height: 1.6;
        font-size: 0.95rem;

        li {
            display: flex;
            align-items: flex-start;
            margin-bottom: 0.4rem;
            padding-left: 2px;

            i {
                color: $primary-color;
                margin-right: 6px;
                margin-top: 3px;
            }
        }
    }
}

// 报名入口 section（取消表单边框）
.application-section {
    padding: 2rem 0;
    background-color: $light-gray;

    .application-card {
        background-color: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        border: none; // 取消卡片边框
    }

    .application-form {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.2rem; // 优化间距
    }

    .form-actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: center;
        margin-top: 1rem;
    }

    .submit-button {
        padding: 12px 30px;
        font-size: 1rem;
        font-weight: 500;
        border-radius: 30px;
        width: 100%;
        background-color: $primary-color !important;
        border-color: $primary-color !important;

        &:hover {
            background-color: #359469 !important;
            border-color: #359469 !important;
        }

        &:disabled {
            background-color: #cccccc !important;
            border-color: #cccccc !important;
            cursor: not-allowed;
        }
    }
}

// 权限提示区域（取消边框）
.permission-tip {
    padding: 1.5rem 0;
    background-color: $light-gray;

    .tip-card {
        background-color: white;
        border-radius: 12px;
        padding: 1.2rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        border: none; // 取消卡片边框
    }

    .permission-alert {
        margin: 0;
        font-size: 0.95rem;
        border-radius: 8px; // 优化alert圆角
        border: none; // 取消alert边框
    }
}



// 响应式补充（适配小屏手机）
@media (max-width: 375px) {
    .section-title {
        font-size: 1.2rem;
    }

    .notice-title {
        font-size: 1rem;
    }

    .hero-title {
        font-size: 1.5rem;
    }

    .query-btn-group {
        flex-direction: column; // 小屏按钮纵向排列
    }
}

// 取消Element Plus组件的边框
:deep(.el-form-item__label) {
    font-weight: 500;
    color: $secondary-color;
}

:deep(.el-input__inner),
:deep(.el-select__wrapper) {
    border-radius: 8px;
    padding: 10px 12px;
    border: none; // 取消输入框/下拉框边框
    box-shadow: 0 0 0 1px #e0e0e0; // 用阴影模拟浅边框（可选，若要完全无框则删除）

    &:focus {
        border: none; // 取消聚焦边框
        box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2); // 聚焦时用阴影替代边框
    }
}

:deep(.el-textarea__inner) {
    border-radius: 8px;
    padding: 10px 12px;
    border: none; // 取消文本域边框
    box-shadow: 0 0 0 1px #e0e0e0; // 用阴影模拟浅边框（可选）
}

:deep(.el-alert) {
    border: none; // 取消alert边框
}
</style>