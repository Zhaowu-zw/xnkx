import request from '@/utils/request.js'

//提交报名信息
export const submitRecruitInfo = (data) => request.post('/recruitment/recruitment_create', data);
//查询个人报名信息
export const getRecruitMyInfo = (data) => request.post('/recruitment/recruitment_view', data);