import request from '@/utils/request.js'

//获取角色信息
export const getRoleInfo = () => request.get('/role/role_views');
//新增角色信息
export const createRoleInfo = (data) => request.post('/role/role_create', data);
//修改角色信息
export const putRoleInfo = (roleId, data) => request.put(`/role/role_edit/${roleId}`, data);
//删除角色信息
export const deleteRoleInfo = (roleId) => request.delete(`/role/role_delete/${roleId}`);
//更新用户主角色（需审批）
export const updateUserMainRole = (userId, data) => request.put(`/role/role_user/${userId}/main`, data);
//用户退出社团
export const resignClub = (userId, data) => request.post(`/role/role_user/${userId}/resign-club`, data);
//分配角色给用户
export const assignUserRole = (data) => request.post('/role/role_assign', data);
//从用户移除角色
export const removeUserRole = (userId, roleId) => request.delete(`/role/role_remove/${userId}/${roleId}`);
//获取用户所有角色
export const getUserRoles = (userId) => request.get(`/role/role_user/${userId}`);