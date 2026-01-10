<template>
    <div class="feedback-container">

        <main class="feedback-content">
            <h1 class="feedback-title">意见反馈</h1>
            <p class="feedback-desc">您的建议是我们进步的动力，感谢您的宝贵反馈！</p>

            <!-- 反馈类型选择 -->
            <div class="feedback-type">
                <h2 class="section-title">反馈类型</h2>
                <div class="type-options">
                    <label class="type-option" v-for="(type, index) in feedbackTypes" :key="index">
                        <input type="radio" name="feedbackType" :value="type.value" v-model="selectedType">
                        <span class="type-text">{{ type.label }}</span>
                    </label>
                </div>
            </div>

            <!-- 星级评分 -->
            <div class="feedback-rating">
                <h2 class="section-title">满意度评分</h2>
                <div class="star-container">
                    <i class="star-icon" :class="{ 'star-active': star <= rating }" v-for="star in 5" :key="star"
                        @click="rating = star">★</i>
                </div>
                <p class="rating-text">{{ ratingTexts[rating] }}</p>
            </div>

            <!-- 反馈内容 -->
            <div class="feedback-form">
                <h2 class="section-title">反馈内容</h2>
                <textarea v-model="feedbackContent" placeholder="请详细描述您的问题或建议...(至少5个字符)" :minlength="5" :maxlength="500"
                    @input="updateCharCount"></textarea>
                <div class="char-count">{{ charCount }}/500</div>

                <div class="feedback-anonymous">
                    <h2 class="section-title">是否匿名</h2>
                    <label class="anonymous-option">
                        <input type="checkbox" v-model="isAnonymous " :disabled="isUnlogin">
                        <span class="anonymous-text">匿名提交</span>
                    </label>
                </div>

                <div class="contact-info">
                    <h2 class="section-title">联系方式（选填）</h2>
                    <input type="text" v-model="contact" placeholder="请留下您的手机号或邮箱，方便我们联系您">
                </div>

                <button class="submit-btn" :disabled="!selectedType || !feedbackContent.trim()" @click="submitFeedback">
                    提交反馈
                </button>
            </div>
        </main>

        <FooterView></FooterView>

        <!-- 提交成功弹窗 -->
        <div class="modal" v-if="showSuccessModal">
            <div class="modal-content">
                <div class="success-icon">✓</div>
                <h3>提交成功！</h3>
                <p>感谢您的反馈，我们会尽快处理并回复~</p>
                <button class="confirm-btn" @click="back">确定</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import FooterView from '@/components/FooterView.vue'
import { ref } from 'vue'
import useFeedbackStore from '@/stores/feedback' // 引入Pinia仓库
import useUserStore from '@/stores/user' // 假设你有用户信息的store（用于获取username/user_id）
import { useRouter } from 'vue-router'
import {  ElNotification } from "element-plus";


// 反馈类型选项（保持不变）
const feedbackTypes = ref([
    { label: '功能建议', value: 'suggestion' },
    { label: 'bug反馈', value: 'bug' },
    { label: '界面优化', value: 'ui' },
    { label: '其他问题', value: 'other' }
])

// 新增：是否匿名状态
const isAnonymous = ref(false)
// 表单数据（新增isAnonymous）
const selectedType = ref('')
const rating = ref(3)
const feedbackContent = ref('')
const contact = ref('')
const charCount = ref(0)
const showSuccessModal = ref(false)
const isUnlogin=ref(false)


// 评分文本（保持不变）
const ratingTexts = ref([
    '', '非常不满意', '不满意', '一般', '满意', '非常满意'
])

// 获取用户信息（假设userStore中有username和user_id）
const userStore = useUserStore()
const feedbackStore = useFeedbackStore()

const $router=useRouter()

// 更新字符计数（保持不变）
const updateCharCount = () => {
    charCount.value = feedbackContent.value.length
}

if (!userStore.userInfo.user) {
    isAnonymous.value = true
    isUnlogin.value=true
} 

// 提交反馈（修改为对接仓库接口，匹配图中参数）
const submitFeedback = async () => {
    // 组装请求数据（匹配图中参数：content/feedback_type/rating/contact/username/user_id）
    const requestData = {
        content: feedbackContent.value,
        feedback_type: selectedType.value,
        rating: rating.value.toString(), // 图中是string类型，这里转字符串
        contact: contact.value,
        username: isAnonymous.value ? '' : userStore.userInfo.user.username, // 匿名则为空
        user_id: isAnonymous.value ? '' : userStore.userInfo.user_id // 匿名则为空
    }
    try {
        // 调用仓库中的SubFeedback方法
        await feedbackStore.SubFeedback(requestData)
        // 显示成功弹窗
        showSuccessModal.value = true
        // 重置表单
        selectedType.value = ''
        rating.value = 3
        feedbackContent.value = ''
        contact.value = ''
        charCount.value = 0
        isAnonymous.value = false
    } catch (error) {
        ElNotification({
            title: '提交失败',
            message: error.message ||'提交失败，请稍后再试',
            type: 'error',
            duration: 2000
        });
    }
}
const back = () => {
    showSuccessModal.value = false;
    $router.back();
}
</script>
<style scoped lang="scss">
.feedback-container {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-bottom: 60px; // 为底部导航留出空间

    .feedback-content {
        max-width: 768px;
        margin: 0 auto;
        padding: 20px 16px;

        .feedback-title {
            font-size: 24px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
            text-align: center;
        }

        .feedback-desc {
            font-size: 14px;
            color: #666;
            text-align: center;
            margin-bottom: 32px;
        }

        .section-title {
            font-size: 16px;
            font-weight: 500;
            color: #333;
            margin-bottom: 16px;
            display: flex;
            align-items: center;

            &::before {
                content: '';
                display: inline-block;
                width: 4px;
                height: 16px;
                background-color: #42b983;
                margin-right: 8px;
                border-radius: 2px;
            }
        }

        // 反馈类型
        .feedback-type {
            margin-bottom: 24px;

            .type-options {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
            }

            .type-option {
                display: flex;
                align-items: center;
                background-color: #fff;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 1px solid #eee;

                input {
                    margin-right: 8px;
                    accent-color: #42b983;
                }

                .type-text {
                    font-size: 14px;
                    color: #333;
                }

                &:hover {
                    border-color: #42b983;
                    background-color: #f8fff6;
                }

                input:checked+.type-text {
                    color: #42b983;
                    font-weight: 500;
                }
            }
        }

        // 星级评分
        .feedback-rating {
            margin-bottom: 24px;

            .star-container {
                display: flex;
                gap: 16px;
                margin-bottom: 8px;

                .star-icon {
                    font-size: 28px;
                    color: #ddd;
                    cursor: pointer;
                    transition: all 0.2s ease;

                    &:hover {
                        transform: scale(1.1);
                    }
                }

                .star-active {
                    color: #ffc107;
                }
            }

            .rating-text {
                font-size: 14px;
                color: #666;
            }
        }

        // 反馈表单
        .feedback-form {
            textarea {
                width: 100%;
                min-height: 120px;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                resize: vertical;
                box-sizing: border-box;

                &::placeholder {
                    color: #999;
                }

                &:focus {
                    outline: none;
                    border-color: #42b983;
                    box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
                }
            }

            .char-count {
                text-align: right;
                font-size: 12px;
                color: #999;
                margin: 8px 0 24px;
            }

            .contact-info {
                margin-bottom: 24px;

                input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 14px;
                    box-sizing: border-box;

                    &::placeholder {
                        color: #999;
                    }

                    &:focus {
                        outline: none;
                        border-color: #42b983;
                        box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
                    }
                }
            }

            .submit-btn {
                width: 100%;
                padding: 14px;
                background-color: #42b983;
                color: #fff;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;

                &:disabled {
                    background-color: #a3e6c6;
                    cursor: not-allowed;
                }

                &:not(:disabled):hover {
                    background-color: #359469;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(66, 185, 131, 0.2);
                }

                &:not(:disabled):active {
                    transform: translateY(0);
                }
            }

            .feedback-anonymous {
                margin-bottom: 24px;

                .anonymous-option {
                    display: flex;
                    align-items: center;
                    font-size: 14px;
                    color: #333;

                    input {
                        margin-right: 8px;
                        accent-color: #42b983;
                    }
                }
            }
        }
    }
}

// 成功弹窗
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .modal-content {
        background-color: #fff;
        width: 80%;
        max-width: 320px;
        padding: 24px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

        .success-icon {
            width: 60px;
            height: 60px;
            background-color: #e8f5e9;
            color: #42b983;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin: 0 auto 16px;
        }

        h3 {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }

        p {
            font-size: 14px;
            color: #666;
            margin-bottom: 24px;
        }

        .confirm-btn {
            padding: 10px 24px;
            background-color: #42b983;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;

            &:hover {
                background-color: #359469;
            }
        }
    }
}

// 响应式调整
@media (min-width: 768px) {
    .feedback-content {
        padding: 32px;
    }

    .feedback-title {
        font-size: 28px !important;
    }

    .section-title {
        font-size: 18px !important;
    }

    textarea,
    input {
        font-size: 16px !important;
    }
}
</style>