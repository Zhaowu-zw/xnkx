import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { updateApprovalStatus, getApprovalRecords, deleteApprovalRecord } from '@/api/approval'
import { ElMessage } from 'element-plus'

const useApprovalStore = defineStore('approval', () => {
  // 状态定义
  const approvalList = ref([])
  const total = ref(0)
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(10)
  
  // 搜索参数
  const searchParams = reactive({
    approval_type: '',
    approval_status: 'pending' // 默认显示待处理的审批
  })
  
  // 获取审批记录列表
  const GetApprovalList = async () => {
    loading.value = true
    try {
      const params = {
        ...searchParams
      }
      const response = await getApprovalRecords(params)
      // 适配后端响应格式（status=true视为成功）
      if (response && response.status === true) {
        approvalList.value = response.data || []
        total.value = response.pagination?.total || 0
        return response
      } else {
        // 使用后端返回的错误信息
        const errorMsg = response?.message || response?.errors?.[0] || '获取审批记录失败'
        ElMessage.error('获取审批记录失败：' + errorMsg)
        return { data: [], pagination: { total: 0 } }
      }
    } catch (error) {
      // 处理网络错误或其他异常
      const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || '获取审批记录失败'
      ElMessage.error('获取审批记录失败：' + errorMsg)
      return { data: [], pagination: { total: 0 } }
    } finally {
      loading.value = false
    }
  }
  
  // 更新审批状态
  const UpdateApprovalStatus = async (id, status) => {
    loading.value = true
    try {
      // 确保传递给API的是正确的对象格式
      const submitData = typeof status === 'object' ? status : { status }
      const response = await updateApprovalStatus(id, submitData)
      // 适配后端响应格式（status=true视为成功）
      if (response && response.status === true) {
        ElMessage.success('审批状态更新成功')
        // 重新获取审批列表
        await GetApprovalList()
        return response
      } else {
        // 使用后端返回的错误信息
        const errorMsg = response?.message || response?.errors?.[0] || '更新审批状态失败'
        ElMessage.error('更新审批状态失败：' + errorMsg)
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      // 处理网络错误或其他异常
      const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || '更新审批状态失败'
      ElMessage.error('更新审批状态失败：' + errorMsg)
      return Promise.reject(new Error(errorMsg))
    } finally {
      loading.value = false
    }
  }
  
  // 删除审批记录
  const DeleteApprovalRecord = async (id) => {
    loading.value = true
    try {
      const response = await deleteApprovalRecord(id)
      // 适配后端响应格式（status=true视为成功）
      if (response && response.status === true) {
        ElMessage.success('删除审批记录成功')
        // 重新获取审批列表
        await GetApprovalList()
        return response
      } else {
        // 使用后端返回的错误信息
        const errorMsg = response?.message || response?.errors?.[0] || '删除审批记录失败'
        ElMessage.error('删除审批记录失败：' + errorMsg)
        return Promise.reject(new Error(errorMsg))
      }
    } catch (error) {
      // 处理网络错误或其他异常
      const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0] || error.message || '删除审批记录失败'
      ElMessage.error('删除审批记录失败：' + errorMsg)
      return Promise.reject(new Error(errorMsg))
    } finally {
      loading.value = false
    }
  }
  
  // 设置搜索参数
  const SetSearchParams = (params) => {
    Object.assign(searchParams, params)
    // 重置页码
    currentPage.value = 1
  }
  
  return {
    // 状态
    approvalList,
    total,
    loading,
    currentPage,
    pageSize,
    searchParams,
    
    // 方法
    GetApprovalList,
    UpdateApprovalStatus,
    DeleteApprovalRecord,
    SetSearchParams
  }
})

export default useApprovalStore