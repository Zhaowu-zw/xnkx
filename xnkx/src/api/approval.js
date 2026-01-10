import request from '@/utils/request.js'

// 更新审批状态
export const updateApprovalStatus = (id, data) => request.patch(`/approval/${id}`, data);

// 查看审批记录列表
export const getApprovalRecords = (params) => request.get('/approval', {
    params: {
        approval_type: params.approval_type,
        approval_status: params.approval_status||'pending'
    }
    
 });

// 删除审批记录
export const deleteApprovalRecord = (id) => request.delete(`/approval/${id}`);