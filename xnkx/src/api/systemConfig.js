import request from '@/utils/request.js'

// 获取报名入口状态
export const getRecruitEntryStatus = () => request.get('/system/recruit/status')

// 更新报名入口状态
export const updateRecruitEntryStatus = (data) => request.put('/system/recruit/status', data)