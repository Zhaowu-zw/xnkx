import { defineStore } from 'pinia';
import { submitRecruitInfo, getRecruitMyInfo } from '@/api/recruit' 
import {ref}from 'vue'

const useRecruitStore = defineStore('recruit', () => {
    let myRecruitInfo = ref(null)
    let isSubmitRecruit=ref(false)
    //提交纳新报名信息
    const SubmitRecruitInfo = async (data) => {
        try {
            const res = await submitRecruitInfo(data)
            // console.log('后端完整返回值：', res); // 新增日志，看真实格式
            // console.log('res.code：', res.code); // 看是否有这个属性
            // console.log('res.data：', res.data); // 看业务数据在哪
            if (res.code !== 200) {
                return Promise.reject(new Error(res.data || '提交报名信息失败'));
            }
            isSubmitRecruit.value=true
            return res.data;
         } catch (error) {
            return Promise.reject(new Error(error || '提交报名信息失败'));
        }
    }
    //查询个人报名信息
    const GetMyRecruitInfo=async (data) => {
        try {
            const res = await getRecruitMyInfo(data)
            if (res.code !== 200) {
                return Promise.reject(new Error(res.data || '获取报名信息失败'));
            }
            myRecruitInfo.value = res.data.data
            return res.data;
        } catch (error) {
            return Promise.reject(new Error(error || '获取报名信息失败'));
        }
    }


    return {
        myRecruitInfo,
        isSubmitRecruit,
        SubmitRecruitInfo,
        GetMyRecruitInfo
    }
})

export default useRecruitStore;