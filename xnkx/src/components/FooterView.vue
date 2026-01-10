<template>
    <div class="footer-container">
        <footer class="footer">
            <!-- 顶部footer内容 -->
            <div class="footer-top">
                <div class="container">
                    <div class="footer-grid">
                        <!-- 社团品牌信息 -->
                        <div class="footer-brand">
                            <div class="brand-logo">
                                <i class="icon-bird"></i>
                                <h3 class="brand-name">小鸟快修社团</h3>
                            </div>
                            <p class="brand-desc">
                                校园设备维修志愿服务队，专注于电脑设备维修，
                                用技术传递温暖，让服务贴近师生
                            </p>
                        </div>

                        <!-- 服务项目 -->
                        <div class="footer-links">
                            <h4 class="link-title">服务项目</h4>
                            <ul class="link-list">
                                <li><a href="#" class="link-item">电脑系统重装</a></li>
                                <li><a href="#" class="link-item">软件安装调试</a></li>
                                <li><a href="#" class="link-item">硬件清洁保养</a></li>
                                <li><a href="#" class="link-item">技术咨询答疑</a></li>
                            </ul>
                        </div>

                        <!-- 社团导航 -->
                        <div class="footer-links">
                            <h4 class="link-title">社团导航</h4>
                            <ul class="link-list">
                                <li><router-link to="/" class="link-item">首页</router-link></li>
                                <li><router-link to="/club/info" class="link-item">社团概况</router-link></li>
                                <li><router-link to="/club/members" class="link-item">人员展示</router-link></li>
                                <li><router-link to="/activity/list" class="link-item">社团动态</router-link></li>
                                <li><router-link to="/user/home" class="link-item">个人中心</router-link></li>
                            </ul>
                        </div>

                        <!-- 联系预约 -->
                        <div class="footer-contact">
                            <h4 class="contact-title">加入我们</h4>
                            <ul class="contact-list">
                                <li class="contact-item">
                                    <i class="icon-location"></i>
                                    <span>知行3号楼128教室</span>
                                </li>
                                <li class="contact-item">
                                    <i class="icon-time"></i>
                                    <span>纳新时间: 每年九月开学季</span>
                                </li>
                                <li class="contact-item">
                                    <i class="icon-phone"></i>
                                    <span>咨询电话: 138-XXXX-8888</span>
                                </li>
                                <li class="contact-item">
                                    <i class="icon-wechat"></i>
                                    <span>咨询微信: xiaoniaokuaixiu</span>
                                </li>
                            </ul>
                            <router-link to="/club/recruit" class="reserve-btn">立即加入</router-link>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部版权信息 -->
            <div class="footer-bottom">
                <div class="container">
                    <div class="footer-bottom-content">
                        <p class="copyright">
                            &copy; {{ new Date().getFullYear() }} 小鸟快修社团 版权所有 | 隶属于石家庄信息工程职业学院计算机应用系
                        </p>
                        <div class="footer-policy">
                            <a href="/service-terms" class="policy-link">服务条款</a>
                            <a href="/privacy-policy" class="policy-link">隐私说明</a>
                            <a href="/feedback" class="policy-link">意见反馈</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup>
// 可添加预约功能、表单提交等逻辑
</script>

<style scoped lang="scss">
// 图标占位符（实际项目建议引入Font Awesome或自定义SVG）
[class^="icon-"] {
    display: inline-block;
    width: 1em;
    height: 1em;
    stroke-width: 0;
    stroke: currentColor;
    fill: currentColor;
    vertical-align: middle;
}

.footer-container {
    background-color: #f8f9fa; // 浅灰背景，更显清爽
    color: #333;
    width: 100vw;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    border-top: 2px solid #42b983; // 绿色边框强调社团活力
}

.footer {
    padding: 3rem 0 1.5rem;

    .container {
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
        padding: 0 1.5rem;
    }

    // 顶部footer内容
    .footer-top {
        .footer-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 2.5rem;

            @media (max-width: 1024px) {
                grid-template-columns: repeat(6, 1fr);
            }

            @media (max-width: 768px) {
                grid-template-columns: 1fr;
                gap: 2rem;
            }

            // 社团品牌信息
            .footer-brand {
                grid-column: span 4;

                @media (max-width: 1024px) {
                    grid-column: span 6;
                }

                @media (max-width: 768px) {
                    grid-column: span 1;
                    text-align: center;
                }

                .brand-logo {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    margin-bottom: 1rem;

                    @media (max-width: 768px) {
                        justify-content: center;
                    }

                    .icon-bird {
                        font-size: 1.8rem;
                        color: #42b983; // 小鸟主题色（绿色）
                    }

                    .brand-name {
                        font-size: 1.4rem;
                        font-weight: 700;
                        color: #2c3e50;
                        margin: 0;
                    }
                }

                .brand-desc {
                    font-size: 0.9rem;
                    line-height: 1.6;
                    color: #666;
                    margin-bottom: 1.5rem;
                }

                .social-links {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;

                    @media (max-width: 768px) {
                        justify-content: center;
                    }

                    .social-link {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        border-radius: 20px;
                        background-color: #f0f7f3;
                        color: #42b983;
                        font-size: 0.85rem;
                        transition: all 0.3s ease;

                        &:hover {
                            background-color: #42b983;
                            color: #fff;
                            transform: translateY(-2px);
                        }

                        i {
                            font-size: 1rem;
                        }
                    }
                }
            }

            // 服务项目/社团导航
            .footer-links {
                grid-column: span 2;

                @media (max-width: 1024px) {
                    grid-column: span 3;
                }

                @media (max-width: 768px) {
                    grid-column: span 1;
                    text-align: center;
                }

                .link-title {
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 1.2rem;
                    position: relative;
                    padding-bottom: 0.4rem;

                    &::after {
                        content: '';
                        position: absolute;
                        left: 0;
                        bottom: 0;
                        width: 2.5rem;
                        height: 2px;
                        background-color: #42b983;

                        @media (max-width: 768px) {
                            left: 50%;
                            transform: translateX(-50%);
                        }
                    }
                }

                .link-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;

                    .link-item {
                        display: block;
                        color: #666;
                        font-size: 0.88rem;
                        margin-bottom: 0.8rem;
                        transition: all 0.3s ease;

                        &:hover {
                            color: #42b983;
                            transform: translateX(4px);
                        }
                    }
                }
            }

            // 联系预约
            .footer-contact {
                grid-column: span 4;

                @media (max-width: 1024px) {
                    grid-column: span 6;
                }

                @media (max-width: 768px) {
                    grid-column: span 1;
                    text-align: center;
                }

                .contact-title {
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 1.2rem;
                    position: relative;
                    padding-bottom: 0.4rem;

                    &::after {
                        content: '';
                        position: absolute;
                        left: 0;
                        bottom: 0;
                        width: 2.5rem;
                        height: 2px;
                        background-color: #42b983;

                        @media (max-width: 768px) {
                            left: 50%;
                            transform: translateX(-50%);
                        }
                    }
                }

                .contact-list {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 1.5rem;

                    .contact-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 0.8rem;
                        color: #666;
                        font-size: 0.88rem;
                        margin-bottom: 1rem;

                        @media (max-width: 768px) {
                            justify-content: center;
                        }

                        i {
                            color: #42b983;
                            font-size: 1.1rem;
                            margin-top: 2px;
                        }

                        span {
                            line-height: 1.5;
                        }
                    }
                }

                .reserve-btn {
                    display: inline-block;
                    padding: 0.7rem 1.8rem;
                    background-color: #42b983;
                    color: #fff;
                    font-size: 0.9rem;
                    font-weight: 500;
                    border-radius: 25px;
                    transition: all 0.3s ease;
                    text-align: center;

                    &:hover {
                        background-color: #359469;
                        transform: translateY(-3px);
                        box-shadow: 0 4px 8px rgba(66, 185, 131, 0.3);
                    }

                    @media (max-width: 768px) {
                        display: block;
                        width: 60%;
                        margin: 0 auto;
                    }
                }
            }
        }
    }

    // 底部版权信息
    .footer-bottom {
        margin-top: 2.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #eee;

        .footer-bottom-content {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            align-items: center;
            text-align: center;

            .copyright {
                font-size: 0.8rem;
                color: #999;
                margin: 0;
            }

            .footer-policy {
                display: flex;
                gap: 1.2rem;

                .policy-link {
                    font-size: 0.8rem;
                    color: #888;
                    transition: all 0.3s ease;

                    &:hover {
                        color: #42b983;
                    }
                }
            }
        }
    }
}

// 加载动画
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(15px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.footer-grid>div {
    animation: fadeInUp 0.5s ease forwards;
    opacity: 0;
}

.footer-brand {
    animation-delay: 0.1s;
}

.footer-links:nth-child(2) {
    animation-delay: 0.2s;
}

.footer-links:nth-child(3) {
    animation-delay: 0.3s;
}

.footer-contact {
    animation-delay: 0.4s;
}

.footer-bottom {
    animation: fadeInUp 0.5s ease forwards 0.6s;
    opacity: 0;
}
</style>