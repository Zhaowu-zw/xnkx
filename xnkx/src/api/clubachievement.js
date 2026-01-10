import request from '@/utils/request.js'

//获取社团成就
export const getClubAchievement = (params) => request.get('/clubachievement/clubachievement', {
    params: {
        page:params.page||1,
        pageSize: params.pageSize || 5,
        year: params.year,
        level: params.level ,
        participation_type: params.participation_type,
        keyword: params.keyword || ''
}})

//新增社团成就
export const postClubAchievement = (data) => request.post('/clubachievement/clubachievement', data)

//编辑社团成就
export const putClubAchievement = (id, data) => request.put(`/clubachievement/clubachievement/${id}`, data)

//删除社团成就
export const deleteClubAchievement = (id) => request.delete(`/clubachievement/clubachievement/${id}`)

//上传社团成就图片
export const uploadClubAchievementImg = (data) => request.post('/clubachievement/clubachievement/img', data)