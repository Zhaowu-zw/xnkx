<template>
  <!-- 使用PageContainer组件作为页面容器 -->
  <PageContainer title="反馈管理">
    <!-- 页面主体内容 -->
    <div class="feedback-content business-management-animation">
      <!-- 1. 搜索筛选区域 -->
      <el-card shadow="hover" class="search-card business-card-animation">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="反馈类型">
            <el-select v-model="searchForm.feedback_type" placeholder="请选择反馈类型" clearable style="width: 180px">
              <el-option label="功能建议" value="suggestion" />
              <el-option label="BUG反馈" value="bug" />
              <el-option label="界面优化" value="ui" />
              <el-option label="其他问题" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="反馈状态">
            <el-select v-model="searchForm.status" placeholder="请选择反馈状态" clearable style="width: 180px">
              <el-option label="待处理" value="0" />
              <el-option label="处理中" value="1" />
              <el-option label="已解决" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 2. 反馈列表表格 -->
      <el-card shadow="hover" class="table-card business-card-animation" :style="{ animationDelay: '0.15s' }">
        <div class="table-wrapper">
          <el-table v-loading="feedbackStore.loading" :data="sortedFeedbackList" 
            border stripe style="width: 100%" empty-text="暂无反馈数据" :key="tableKey">
            <!-- 序号 -->
            <el-table-column label="序号" width="80" align="center">
              <template #default="scope">
                {{ scope.$index + 1 }}
              </template>
            </el-table-column>
            <!-- 反馈类型 -->
            <el-table-column prop="feedback_type" label="反馈类型" width="120" align="center">
              <template #default="scope">
                <el-tag :type="getFeedbackTypeTag(scope.row.feedback_type)" size="small">
                  {{ getFeedbackTypeText(scope.row.feedback_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <!-- 反馈内容 -->
            <el-table-column prop="content" label="反馈内容" min-width="200" show-overflow-tooltip />
            <!-- 提交用户 -->
            <el-table-column prop="username" label="提交用户" width="140" align="center" />
            <!-- 反馈状态 -->
            <el-table-column prop="status" label="状态" width="120" align="center">
              <template #default="scope">
                <el-tag :type="getStatusTag(scope.row.status)" size="small">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <!-- 处理人 -->
            <el-table-column label="处理人" width="140" align="center">
              <template #default="scope">
                {{ scope.row.handler ? (scope.row.handler.userinfo?.nickname || scope.row.handler.username) : '-' }}
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
                <!-- 总是显示查看按钮 -->
                <el-button size="small" :icon="View" type="info" @click="openViewDrawer(scope.row)">
                  查看
                </el-button>
                
                <!-- 如果状态不是已解决，显示处理按钮 -->
                <el-button size="small" :icon="Edit" type="primary" @click="openHandleDrawer(scope.row)" v-if="scope.row.status !== 2">
                  处理
                </el-button>
                
                <!-- 如果状态是已解决，显示删除按钮 -->
                <el-button size="small" :icon="Delete" type="danger" @click="handleDelete(scope.row.id)" v-if="scope.row.status === 2">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 分页组件 -->
        <div class="pagination-container">
          <el-pagination 
            v-model:current-page="feedbackStore.currentPage" 
            v-model:page-size="feedbackStore.pageSize" 
            :page-sizes="[10, 20, 50]"
            :total="feedbackStore.total" 
            layout="total, sizes, prev, pager, next, jumper" 
            @size-change="handleSizeChange" 
            @current-change="handleCurrentChange" />
        </div>
      </el-card>
    </div>

    <!-- 3. 查看反馈详情抽屉 -->
    <el-drawer v-model="viewDrawerVisible" title="查看反馈详情" direction="rtl" size="600px" destroy-on-close>
      <div class="drawer-inner-container view-drawer-container">
        <el-card shadow="hover" class="simple-view-card">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="反馈类型">
              <el-tag :type="getFeedbackTypeTag(currentFeedback.feedback_type)" size="small">
                {{ getFeedbackTypeText(currentFeedback.feedback_type) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="评分">
              <el-rate v-model="currentFeedback.rating" disabled :max="5" show-score text-color="#999" />
            </el-descriptions-item>
            <el-descriptions-item label="反馈内容">{{ currentFeedback.content }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ currentFeedback.contact || '-' }}</el-descriptions-item>
            <el-descriptions-item label="提交用户">{{ currentFeedback.username }}</el-descriptions-item>
            <el-descriptions-item label="IP地址">{{ currentFeedback.ip_address }}</el-descriptions-item>
            <el-descriptions-item label="提交设备">{{ currentFeedback.device_info }}</el-descriptions-item>
            <el-descriptions-item label="反馈状态">
              <el-tag :type="getStatusTag(currentFeedback.status)" size="small">
                {{ getStatusText(currentFeedback.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="处理人">
              {{ currentFeedback.handler ? (currentFeedback.handler.userinfo?.nickname || currentFeedback.handler.username) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formatTime(currentFeedback.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatTime(currentFeedback.updated_at) }}</el-descriptions-item>
            <el-descriptions-item label="处理备注">{{ currentFeedback.handle_note || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
      <div class="drawer-footer">
        <el-button @click="viewDrawerVisible = false">关闭</el-button>
      </div>
    </el-drawer>

    <!-- 4. 处理反馈抽屉 -->
    <el-drawer v-model="handleDrawerVisible" title="处理反馈" direction="rtl" size="600px" destroy-on-close>
      <div class="drawer-inner-container">
        <el-form ref="handleFormRef" :model="handleForm" :rules="handleFormRules" label-width="120px"
          label-position="top" class="handle-form">
          <el-form-item label="反馈内容" prop="content" disabled>
            <el-input v-model="handleForm.content" type="textarea" rows="4" disabled />
          </el-form-item>
          <el-form-item label="当前状态" prop="currentStatus" disabled>
            <el-tag :type="getStatusTag(handleForm.currentStatus)" size="small">
              {{ getStatusText(handleForm.currentStatus) }}
            </el-tag>
          </el-form-item>
          <el-form-item label="处理状态" prop="status">
            <el-select v-model="handleForm.status" placeholder="请选择处理状态"  style="width: 100%">
              <el-option label="待处理" :value="0" />
              <el-option label="处理中" :value="1" />
              <el-option label="已解决" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理备注" prop="handle_note">
            <el-input v-model="handleForm.handle_note" type="textarea" placeholder="请输入处理备注" maxlength="500" show-word-limit rows="4" />
          </el-form-item>
        </el-form>
      </div>
      <div class="drawer-footer">
        <el-button @click="handleDrawerVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandleForm">
          保存处理结果
        </el-button>
      </div>
    </el-drawer>
  </PageContainer>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, View } from '@element-plus/icons-vue'
import PageContainer from '@/components/PageContainer.vue'
import useFeedbackStore from '@/stores/feedback'

// ========== 核心实例与状态 ==========
const feedbackStore = useFeedbackStore()

// ========== 抽屉相关 ==========
const viewDrawerVisible = ref(false)
const handleDrawerVisible = ref(false)
const currentFeedback = ref({})
const handleFormRef = ref(null)
const tableKey = ref(0)

// ========== 搜索表单 ==========
const searchForm = reactive({
  feedback_type: '',
  status: ''
})

// ========== 处理表单 ==========
const handleForm = reactive({
  content: '',
  currentStatus: 0,
  status: 0,
  handle_note: ''
})

// 表单验证规则
const handleFormRules = reactive({
  status: [
    { required: true, message: '请选择处理状态', trigger: 'change' }
  ]
})

// 计算属性：排序后的反馈列表
const sortedFeedbackList = computed(() => {
  return [...feedbackStore.feedbackList].sort((a, b) => {
    // 先按状态排序：待处理(0) > 处理中(1) > 已解决(2)
    if (a.status !== b.status) {
      return a.status - b.status;
    }
    // 状态相同则按创建时间排序：早的在前
    return new Date(a.created_at) - new Date(b.created_at);
  });
});

// ========== 页面初始化 ==========
onMounted(async () => {
  try {
    await feedbackStore.GetFeedbackList()
  } catch (error) {
    ElMessage.error(`初始化失败：${error.message}`)
  }
})

// ========== 列表相关方法 ==========
// 查询反馈列表
const handleSearch = async () => {
  try {
    feedbackStore.SetSearchParams(searchForm)
    await feedbackStore.GetFeedbackList()
    tableKey.value += 1
  } catch (error) {
    ElMessage.error(`查询失败：${error.message}`)
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.feedback_type = ''
  searchForm.status = ''
  feedbackStore.SetSearchParams(searchForm)
  feedbackStore.GetFeedbackList()
  tableKey.value += 1
}

// ========== 抽屉相关方法 ==========
// 打开查看抽屉
const openViewDrawer = (row) => {
  currentFeedback.value = JSON.parse(JSON.stringify(row))
  viewDrawerVisible.value = true
}

// 打开处理抽屉
const openHandleDrawer = (row) => {
  currentFeedback.value = JSON.parse(JSON.stringify(row))
  // 回显数据
  handleForm.content = row.content
  handleForm.currentStatus = row.status
  handleForm.status = row.status
  handleForm.handle_note = row.handle_note || ''
  handleDrawerVisible.value = true
}

// 提交处理表单
const submitHandleForm = async () => {
  if (!handleFormRef.value) return
  try {
    await handleFormRef.value.validate()
    
    // 只提交需要的两个字段
    const submitData = {
      status: handleForm.status,
      handle_note: handleForm.handle_note
    }
    
    await feedbackStore.HandleFeedback(currentFeedback.value.id, submitData)
    ElMessage.success('处理成功！')
    handleDrawerVisible.value = false
    feedbackStore.GetFeedbackList()
  } catch (error) {
    if (error.name !== 'ValidationError') {
      ElMessage.error(`处理失败：${error.message}`)
    }
  }
}

// 删除反馈
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该反馈吗？删除后数据不可恢复！',
      '删除确认',
      { type: 'warning' }
    )
    await feedbackStore.DeleteFeedback(id)
    ElMessage.success('删除成功！')
    feedbackStore.GetFeedbackList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`删除失败：${error.message}`)
    }
  }
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  feedbackStore.pageSize = size;
  feedbackStore.GetFeedbackList();
};

// 处理页码变化
const handleCurrentChange = (current) => {
  feedbackStore.currentPage = current;
  feedbackStore.GetFeedbackList();
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

// 获取反馈类型标签
const getFeedbackTypeTag = (type) => {
  const typeMap = {
    suggestion: 'info',
    bug: 'danger',
    ui: 'warning',
    other: 'success'
  }
  return typeMap[type] || 'info'
}

// 获取反馈类型文本
const getFeedbackTypeText = (type) => {
  const typeMap = {
    suggestion: '功能建议',
    bug: 'BUG反馈',
    ui: '界面优化',
    other: '其他问题'
  }
  return typeMap[type] || type
}

// 获取状态标签
const getStatusTag = (status) => {
  const statusMap = {
    0: 'warning',
    1: 'primary',
    2: 'success'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '待处理',
    1: '处理中',
    2: '已解决'
  }
  return statusMap[status] || status
}
</script>

<style scoped lang="scss">
// 样式优化
$mobile-break: 480px;
$tablet-break: 768px;
$desktop-break: 1200px;

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

.feedback-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 20px;
  margin-bottom: 20px;
}

// 搜索卡片样式优化
.search-card {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
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
    --el-table-border-color: #ebeef5;
    border-radius: 12px 12px 0 0;
    overflow: hidden;

    .el-table__header-wrapper {
      background: #fafafa;
    }

    th {
      font-weight: 600;
      background: #fafafa;
      padding: 14px 0;
    }

    td {
      padding: 12px 0;
      border-bottom: 1px solid #f0f2f5;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .el-table__body-wrapper {
      max-height: none;
      overflow-y: hidden;
      overflow-x: hidden;
    }

    .el-table__wrapper {
      overflow-x: hidden;
    }
  }

  :deep(.el-table__empty-block) {
    padding: 40px 0;
  }
}

// 评分样式
.star-rating {
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(.el-rate) {
    margin: 0;
  }
}

// 表格包装器样式，确保表格不超过页面宽度
.table-wrapper {
  overflow-x: auto;
  max-width: 100%;
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
  
  :deep(.el-rate) {
    font-size: 20px;
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

.handle-form {
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

// 业务管理模块动画效果
.business-management-animation {
  animation: businessManagementFadeIn 0.6s ease-out;
}

// 业务卡片动画
.business-card-animation {
  opacity: 0;
  animation: businessCardSlideUp 0.5s ease-out forwards;
}

// 业务管理容器动画
@keyframes businessManagementFadeIn {
  from {
    opacity: 0;
    transform: scale(0.99);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 业务卡片上滑动画
@keyframes businessCardSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>