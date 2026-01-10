<template>
  <!-- 使用PageContainer组件作为页面容器 -->
  <PageContainer title="纳新审批">
    <!-- 页面主体内容 -->
    <div class="approval-content">
      <!-- 1. 搜索筛选区域 -->
      <el-card shadow="hover" class="search-card">
        <div class="card-content-wrapper">
          <div class="status-buttons">
            <el-button 
              type="primary" 
              :plain="searchForm.approval_status !== 'pending'" 
              @click="handleStatusChange('pending')">
              待审批
            </el-button>
            <el-button 
              type="success" 
              :plain="searchForm.approval_status !== 'approved'" 
              @click="handleStatusChange('approved')">
              已通过
            </el-button>
            <el-button 
              type="danger" 
              :plain="searchForm.approval_status !== 'rejected'" 
              @click="handleStatusChange('rejected')">
              已驳回
            </el-button>
          </div>
          <!-- 纳新报名入口控制滑动条 -->
          <div class="recruit-entry-control">
            <span class="control-label">纳新报名入口</span>
            <el-switch 
              v-model="recruitEntryEnabled" 
              :loading="isLoading" 
              active-text="开启" 
              inactive-text="关闭" 
              @change="handleRecruitEntryChange"
              size="large"
            >
            </el-switch>
          </div>
        </div>
      </el-card>

      <!-- 2. 审批列表表格 -->
      <el-card shadow="hover" class="table-card">
        <div class="table-wrapper">
          <el-table v-loading="approvalStore.loading" :data="approvalStore.approvalList" 
            style="width: 100%" empty-text="暂无审批数据" :key="tableKey">
            <!-- 序号 -->
            <el-table-column label="序号" width="80" align="center">
              <template #default="scope">
                {{ scope.$index + 1 }}
              </template>
            </el-table-column>
            <!-- 审批类型 -->
            <el-table-column prop="approval_type" label="审批类型" width="120" align="center">
              <template #default="scope">
                <el-tag :type="getApprovalTypeTag(scope.row.approval_type)" size="small">
                  {{ getApprovalTypeText(scope.row.approval_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <!-- 审批节点 -->
            <el-table-column prop="approval_node" label="审批节点" width="120" align="center" />
            <!-- 申请人 -->
            <el-table-column prop="applicant" label="申请人" width="140" align="center">
              <template #default="scope">
                {{ scope.row.applicant?.userinfo?.nickname || scope.row.applicant?.username || '未知' }}
              </template>
            </el-table-column>
            <!-- 申请组名 -->
            <el-table-column prop="applied_group_name" label="申请组名" width="140" align="center">
              <template #default="scope">
                {{ scope.row.applied_group_name || '未知组名' }}
              </template>
            </el-table-column>
            <!-- 审批状态 -->
            <el-table-column prop="approval_status" label="状态" width="120" align="center">
              <template #default="scope">
                <el-tag :type="getStatusTag(scope.row.approval_status)" size="small">
                  {{ getStatusText(scope.row.approval_status) }}
                </el-tag>
              </template>
            </el-table-column>
            <!-- 审批内容 -->
            <el-table-column label="审批内容" min-width="200" align="center">
              <template #default="scope">
                <div class="table-approval-content">
                  {{ parseApprovalContent(scope.row.content) }}
                </div>
              </template>
            </el-table-column>
            <!-- 提交时间 -->
            <el-table-column prop="created_at" label="提交时间" min-width="120" align="center">
              <template #default="scope">
                {{ formatTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <!-- 操作 -->
            <el-table-column label="操作" width="240" align="center" fixed="right">
              <template #default="scope">
                <el-button size="small" :icon="View" type="info" @click="openViewDrawer(scope.row)">
                  查看
                </el-button>
                <el-button size="small" :icon="Edit" type="primary" @click="openApprovalDrawer(scope.row)" v-if="scope.row.approval_status === 'pending'">
                  审批
                </el-button>
                <el-button size="small" :icon="Delete" type="danger" @click="handleDelete(scope.row.id)" v-if="scope.row.approval_status !== 'pending'">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        

      </el-card>
    </div>

    <!-- 3. 查看审批详情抽屉 -->
    <el-drawer v-model="viewDrawerVisible" title="查看审批详情" direction="rtl" size="600px" destroy-on-close>
      <div class="drawer-inner-container view-drawer-container">
        <el-card shadow="hover" class="simple-view-card">
          <el-descriptions :column="1">
            <el-descriptions-item label="审批类型">
              <el-tag :type="getApprovalTypeTag(currentApproval.approval_type)" size="small">
                {{ getApprovalTypeText(currentApproval.approval_type) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审批节点">{{ currentApproval.approval_node }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ currentApproval.applicant?.userinfo?.nickname || currentApproval.applicant?.username || '未知' }}</el-descriptions-item>
            <el-descriptions-item label="申请组名">{{ currentApproval.applied_group_name || '未知组名' }}</el-descriptions-item>
            <el-descriptions-item label="审批内容">
              <div v-if="currentApproval.content" class="approval-content-text">
                {{ parseApprovalContent(currentApproval.content) }}
              </div>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="审批状态">
              <el-tag :type="getStatusTag(currentApproval.approval_status)" size="small">
                {{ getStatusText(currentApproval.approval_status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审批人">{{ currentApproval.approver?.userinfo?.nickname || currentApproval.approver?.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formatTime(currentApproval.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="审批时间">{{ formatTime(currentApproval.approval_time) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
      <div class="drawer-footer">
        <el-button @click="viewDrawerVisible = false">关闭</el-button>
      </div>
    </el-drawer>

    <!-- 4. 审批操作抽屉 -->
    <el-drawer v-model="approvalDrawerVisible" title="审批操作" direction="rtl" size="600px" destroy-on-close>
      <div class="drawer-inner-container">
        <el-form ref="approvalFormRef" :model="approvalForm" :rules="approvalFormRules" label-width="120px"
          label-position="top" class="approval-form">
          <el-form-item label="申请人" prop="applicant" disabled>
            <el-input v-model="approvalForm.applicant" disabled />
          </el-form-item>
          <el-form-item label="申请节点" prop="approvalNode" disabled>
            <el-input v-model="approvalForm.approvalNode" disabled />
          </el-form-item>
          <el-form-item label="申请组名" prop="appliedGroupName" disabled>
            <el-input v-model="approvalForm.appliedGroupName" disabled />
          </el-form-item>
          <el-form-item label="审批内容" prop="content" disabled>
            <el-input v-model="approvalForm.content" type="textarea" rows="4" disabled />
          </el-form-item>
          <el-form-item label="当前状态" prop="currentStatus" disabled>
            <el-tag :type="getStatusTag(approvalForm.currentStatus)" size="small">
              {{ getStatusText(approvalForm.currentStatus) }}
            </el-tag>
          </el-form-item>
          <el-form-item label="审批结果" prop="status">
            <el-radio-group v-model="approvalForm.status" class="approval-radio-group">
              <el-radio label="approved" class="approval-radio">
                <el-tag type="success" size="small" class="radio-tag">通过</el-tag>
              </el-radio>
              <el-radio label="rejected" class="approval-radio">
                <el-tag type="danger" size="small" class="radio-tag">驳回</el-tag>
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <div class="drawer-footer">
        <el-button @click="approvalDrawerVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApprovalForm">
          提交审批结果
        </el-button>
      </div>
    </el-drawer>
  </PageContainer>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, View } from '@element-plus/icons-vue'
import PageContainer from '@/components/PageContainer.vue'
import useApprovalStore from '@/stores/approval'
// 导入系统配置API
import { getRecruitEntryStatus, updateRecruitEntryStatus } from '@/api/systemConfig'



// ========== 核心实例与状态 ==========
const approvalStore = useApprovalStore()

// ========== 抽屉相关 ==========
const viewDrawerVisible = ref(false)
const approvalDrawerVisible = ref(false)
const currentApproval = ref({})
const approvalFormRef = ref(null)
const tableKey = ref(0)

// ========== 纳新报名入口控制相关 ==========
const recruitEntryEnabled = ref(false)
const isLoading = ref(false)

// ========== 搜索表单 ==========
const searchForm = reactive({
  approval_type: 'recruitment',
  approval_status: 'pending'
})

// ========== 审批表单 ==========
const approvalForm = reactive({
  content: '',
  currentStatus: '',
  status: '',
  applicant: '',
  approvalNode: '',
  appliedGroupName: ''
})

// 表单验证规则
const approvalFormRules = reactive({
  status: [
    { required: true, message: '请选择审批结果', trigger: 'change' }
  ]
})

// ========== 获取报名入口状态 ==========
const fetchRecruitEntryStatus = async () => {
  try {
    isLoading.value = true
    const response = await getRecruitEntryStatus()
    if (response.status === 'success' && response.data) {
      recruitEntryEnabled.value = response.data.enabled
    }
  } catch (error) {
    console.error('获取报名入口状态失败:', error)
    ElMessage.error('获取报名入口状态失败')
  } finally {
    isLoading.value = false
  }
}

// ========== 处理报名入口状态变化 ==========
const handleRecruitEntryChange = async (newValue) => {
  try {
    isLoading.value = true
    const response = await updateRecruitEntryStatus({ enabled: newValue })
    if (response.status === 'success') {
      ElMessage.success(`纳新报名入口已${newValue ? '开启' : '关闭'}`)
      // 刷新状态，确保数据一致性
      await fetchRecruitEntryStatus()
    }
  } catch (error) {
    console.error('更新报名入口状态失败:', error)
    ElMessage.error('更新报名入口状态失败')
    // 恢复原始状态
    await fetchRecruitEntryStatus()
  } finally {
    isLoading.value = false
  }
}

// ========== 页面初始化 ==========
onMounted(async () => {
  await approvalStore.SetSearchParams(searchForm)
  await approvalStore.GetApprovalList()
  // 获取报名入口状态
  await fetchRecruitEntryStatus()
})

// ========== 列表相关方法 ==========
// 状态切换
const handleStatusChange = (status) => {
  searchForm.approval_status = status
  // 确保始终查询纳新审批
  searchForm.approval_type = 'recruitment'
  approvalStore.SetSearchParams(searchForm)
  approvalStore.GetApprovalList()
  tableKey.value += 1
};



// ========== 抽屉相关方法 ==========
// 打开查看抽屉
const openViewDrawer = (row) => {
  currentApproval.value = JSON.parse(JSON.stringify(row))
  viewDrawerVisible.value = true
}

// 打开审批抽屉
const openApprovalDrawer = (row) => {
  currentApproval.value = JSON.parse(JSON.stringify(row))
  // 回显数据，content字段可能是JSON，解析后显示
  approvalForm.content = parseApprovalContent(row.content)
  approvalForm.currentStatus = row.approval_status
  approvalForm.status = ''
  approvalForm.applicant = row.applicant?.userinfo?.nickname || row.applicant?.username || '未知'
  approvalForm.approvalNode = row.approval_node
  approvalForm.appliedGroupName = row.applied_group_name || '未知组名'
  approvalDrawerVisible.value = true
}

// 解析审批内容，提取原因
const parseApprovalContent = (content) => {
  if (!content) return ''
  try {
    // 尝试解析JSON
    const parsedContent = JSON.parse(content)
    return parsedContent.reason || JSON.stringify(parsedContent, null, 2)
  } catch {
    // 如果不是JSON，直接返回
    return content
  }
}

// 提交审批表单
const submitApprovalForm = async () => {
  if (!approvalFormRef.value) return
  try {
    await approvalFormRef.value.validate()
    
    // 只提交需要的字段
    const submitData = {
      status: approvalForm.status
    }
    
    await approvalStore.UpdateApprovalStatus(currentApproval.value.id, submitData)
    ElMessage.success('审批成功！')
    approvalDrawerVisible.value = false
    approvalStore.GetApprovalList()
  } catch (error) {
    if (error.name !== 'ValidationError') {
      ElMessage.error(`审批失败：${error.message}`)
    }
  }
};

// 删除审批记录
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该审批记录吗？删除后数据不可恢复！',
      '删除确认',
      { type: 'warning' }
    )
    await approvalStore.DeleteApprovalRecord(id)
    ElMessage.success('删除成功！')
    approvalStore.GetApprovalList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`删除失败：${error.message}`)
    }
  }
};



// ========== 工具方法 ==========
// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  if (isNaN(date.getTime())) {
    return '无效时间'
  }
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai'
  }).replace(/\//g, '-')
}

// 获取审批类型标签
const getApprovalTypeTag = (type) => {
  const typeMap = {
    recruitment: 'info',
    permission: 'warning'
  }
  return typeMap[type] || 'info'
}

// 获取审批类型文本
const getApprovalTypeText = (type) => {
  const typeMap = {
    recruitment: '纳新审批',
    permission: '权限审批'
  }
  return typeMap[type] || type
}

// 获取状态标签
const getStatusTag = (status) => {
  const statusMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回'
  }
  return statusMap[status] || status
}
// console.log('当前审批状态:', approvalStore.approvalList)
</script>

<style scoped lang="scss">
// 主色调定义
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$info-color: #909399;

.manager-content[data-v-8f6386c3] .manager-page,
.manager-content[data-v-8f6386c3] .activity-content,
.manager-content[data-v-8f6386c3] .data-stat-container {
  box-sizing: border-box !important;
  min-height: auto !important;
  height: auto !important;
  max-height: 100% !important;
  overflow: auto !important;
  padding: 16px !important;
  width: 100% !important;
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
}

.approval-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 20px;
  margin-bottom: 20px;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 搜索卡片样式优化
.search-card {
  padding: 12px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  }
}

// 卡片内容包装器样式
.card-content-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

// 状态按钮样式
.status-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 0;
  
  .el-button {
    border-radius: 6px;
  }
}

// 纳新报名入口控制样式
.recruit-entry-control {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  
  .control-label {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-input),
  :deep(.el-select) {
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }
  }

  :deep(.el-button) {
    border-radius: 6px;
    font-weight: 500;
  }
}

// 表格卡片样式优化
.table-card {
  background: #fff;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
  }

  :deep(.el-table) {
    --el-table-header-text-color: #303133;
    --el-table-row-hover-bg-color: #f0f9ff;
    --el-table-border-color: transparent;
    border-radius: 12px 12px 0 0;
    overflow: hidden;

    .el-table__header-wrapper {
      background: #fafafa;
    }

    th {
      font-weight: 600;
      background: #fafafa;
      padding: 14px 0;
      border: none;
    }

    td {
      padding: 12px 0;
      border: none;
    }

    tr:last-child td {
      border: none;
    }

    .el-table__empty-block {
      border: none;
    }

    .el-table__empty-block::before {
      display: none;
    }

    .el-table__empty-block::after {
      display: none;
    }

    .el-table__body-wrapper {
      max-height: calc(100% - 60px);
      overflow-y: auto;
      overflow-x: auto;
    }

    .el-table__wrapper {
      overflow-x: hidden;
    }
  }

  :deep(.el-table__empty-block) {
    padding: 40px 0;
  }
}

// 审批内容文本样式
.approval-content-text {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
}

// 表格包装器样式，确保表格不超过页面宽度
.table-wrapper {
  overflow-x: auto;
  max-width: 100%;
  height: 600px;
  overflow: hidden;
}

// 分页容器样式，定位到右下角
.pagination-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 20px;
  padding: 0 20px 20px;
}

// 查看抽屉样式简化
.view-drawer-container {
  overflow: hidden;
  width: 100%;
  padding: 20px;
}

.simple-view-card {
  margin-bottom: 20px;
  width: 100%;
  padding: 20px;
  
  :deep(.el-descriptions) {
    margin-bottom: 0;
    width: 100%;
    font-size: 16px;
  }
  
  :deep(.el-descriptions-item) {
    margin-bottom: 16px;
  }
  
  :deep(.el-descriptions-item__label) {
    font-weight: 600;
    font-size: 16px;
    background-color: #f5f7fa;
    padding: 12px 16px;
    min-width: 120px;
  }
  
  :deep(.el-descriptions-item__content) {
    font-size: 16px;
    line-height: 1.8;
    word-break: break-word;
    padding: 12px 16px;
  }
}

// 抽屉样式优化
.drawer-inner-container {
  width: 100%;
  max-width: 750px;
  margin: 0 auto;
  overflow-x: hidden;
  padding: 20px;
}

.approval-form {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  overflow: hidden;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-input),
  :deep(.el-select) {
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }
  }

  :deep(.el-input__wrapper) {
    border-radius: 6px;
  }
  
  :deep(.el-input__inner) {
    min-height: 36px;
  }
  
  :deep(.el-textarea__inner) {
    min-height: 100px;
    resize: none;
  }
  
  .approval-radio-group {
    display: flex;
    gap: 20px;
    margin-top: 10px;
    
    .radio-tag {
      margin-right: 5px;
    }
  }
}

// 抽屉底部样式优化
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #ebeef5;
  margin-top: 0;
  width: 100%;
  max-width: 750px;
  margin-left: auto;
  margin-right: auto;
  background: #fafafa;

  :deep(.el-button) {
    border-radius: 6px;
    font-weight: 500;
    padding: 8px 20px;
  }
}
</style>