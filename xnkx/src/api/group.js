import request from '@/utils/request.js'

//查询所有小组信息
export const getGroupInfo = () => request.get('/group/group_views');

//查询小组人员信息
export const getGroupMemberShow = (groupId) => request.get('/group/member_shows', {
    params: {
        group_id: groupId
    }
})

//创建小组
export const createGroupInfo = (data) => request.post('/group/group_create',data);
//修改小组信息
export const putGroupInfo = (id, data) => request.put(`/group/group_edit/${id}`, data);
//删除小组
export const deleteGroupInfo = (id) => request.delete(`/group/group_delete/${id}`);