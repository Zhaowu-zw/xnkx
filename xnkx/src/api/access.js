import request from '@/utils/request.js'

//访问量埋点接口
export const reportAccess = (data) => request.post('/access/report', data)
// 统计聚合接口
export const getAllStat = () => request.get('/statistics/all')