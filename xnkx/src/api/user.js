import  request  from '@/utils/request.js'

//获取验证码
export const getCaptcha = () => request.get('/auth/captcha');
//用户登录
export const userLogin = (data) => request.post('/auth/login', data);
//用户注册
export const userRegister = (data) => request.post('/auth/register', data);
//修改用户密码
export const putUserPassword=(data)=>request.put('/userinfo/update_password',data)
//获取用户信息
export const getUserInfo = () => request.get('/userinfo/userinfo_self_view');
//修改用户信息
export const editUserInfo = (data) => request.put('/userinfo/userinfo_edit', data);
//上传用户头像
export const uploadAvatar = (data) => request.post('/userinfo/upload-avatar', data)



//获取所有人员信息
export const getUserInfoAll = (params) => request.get('/userinfo/user_views', {
    params: {
        page: params.page,
        pageSize : params.pageSize,
        keyword: params.keyword,
        group_id:params.group_id
    }
})
//删除用户
export const deleteUser = (id) => request.delete(`/userinfo/user_delete/${id}`)


