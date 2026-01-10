import './assets/main.scss'
// 引入 Element Plus 核心样式
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-notification.css'
import 'element-plus/theme-chalk/el-message-box.css'
// import 'font-awesome/css/font-awesome.min.css';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// 引入 Element Plus 核心模块
import ElementPlus from 'element-plus'
// 引入中文国际化配置
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
// 引入 dayjs（Element Plus 依赖 dayjs 处理时间）
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
// 引入图片懒加载插件
import VueLazyload from 'vue-lazyload'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 配置 dayjs 的时区插件
dayjs.extend(utc)
dayjs.extend(timezone)
// 设置默认时区为中国（东八区）
dayjs.tz.setDefault('Asia/Shanghai')
dayjs.locale('zh-cn')

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 配置并使用 Element Plus
app.use(ElementPlus, {
    locale: zhCn,
    // 配置日期选择器的默认时区
    datePicker: {
        timezone: 'Asia/Shanghai'
    }
})

// 配置并使用图片懒加载插件
app.use(VueLazyload, {
    preLoad: 1.3, // 预加载高度比例
    error: '@/assets/images/default.png', // 加载失败时显示的图片
    loading: '@/assets/images/default.png', // 加载中显示的图片
    attempt: 1, // 尝试加载次数
    lazyComponent: true // 支持懒加载组件
})

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

app.mount('#app')
