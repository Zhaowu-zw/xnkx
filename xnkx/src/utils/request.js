//进行axios二次封装：使用请求与响应拦截器
import axios from "axios"
import { ElMessage } from "element-plus";

//引入用户相关的仓库
import useUserStore from "@/stores/user.js";

// 存储 pending 状态的请求
const pendingRequests = new Map();
//第一步：利用axios对象的create方法，去创建axios实例（其他的配置：基础路径、超时的时间）
const request = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API,//基础路径上会携带、api
    timeout: 5000,//超时时间设置   
});
//第二步：request实例添加请求与拦截器
request.interceptors.request.use((config) => {
    // 生成唯一 key（url + method）
    const key = `${config.url}-${config.method}`;
    // 取消之前的相同请求
    if (pendingRequests.has(key)) {
        pendingRequests.get(key)?.cancel('取消重复请求');
    }
    // 创建新的 cancelToken
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    pendingRequests.set(key, source);
    //获取用户相关的小仓库：获取token，登录成功之后带给服务器
    //config配置对象，headers属性请求头，经常给服务器端携带公共参数
    const userStore = useUserStore();
    if (userStore.token) {
        config.headers.Authorization = userStore.token
    }
    //返回配置对象
    return config;
});
//第三步：响应拦截器
request.interceptors.response.use((response) => {  
    const key = `${response.config.url}-${response.config.method}`;
    pendingRequests.delete(key);
    //成功回调
    //简化数据
    const data = response?.data || {};
    return data;
}, (error) => {
    //失败回调：处理http网络错误
    //定义一个变量：存储网络错误信息
    let message = '';
    //http状态码
    const status = error.response?.status;
    if (error.config) {
        const key = `${error.config.url}-${error.config.method}`;
        pendingRequests.delete(key);
    }
    switch (status) {
        case 401:
            message = 'TOKEN过期'
            break;
        case 403:
            message = '无权访问'
            break;
        case 404:
            message = '请求地址错误'
            break;
        case 500:
            message = '服务器出现问题'
            break;
        default:
            message = '网络出现问题'
            break;
    }
    //提示的错误信息
    ElMessage({
        type: 'error',
        message
    })
    return Promise.reject(error.response?.data || error.message);
})

export default request;