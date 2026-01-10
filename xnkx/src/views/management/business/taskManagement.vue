<template>
  <PageContainer title="任务管理">
    <!-- 页面主体内容 -->
    <div class="task-content business-management-animation">
      <!-- 1. 搜索筛选区域 -->
      <el-card shadow="hover" class="search-card business-card-animation">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="任务名称">
            <el-input v-model="searchForm.title" placeholder="请输入任务名称" clearable style="width: 300px" @input="getTaskList" />
          </el-form-item>
          <el-form-item label="所属小组">
            <el-select v-model="searchForm.group_id" placeholder="请选择小组" clearable style="width: 200px">
              <el-option v-for="group in groupList" :key="group.id" :label="group.group_name" :value="group.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
              <el-option label="进行中" value="ongoing" />
              <el-option label="已完成" value="completed" />
              <el-option label="已结束" value="pending" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 2. 任务列表表格 -->
      <el-card shadow="hover" class="table-card business-card-animation" :style="{ animationDelay: '0.15s' }">
        <el-table
            :data="taskList" 
            v-loading="loading"
            stripe
            border
            style="width: 100%"
            :key="tableKey">
          <el-table-column label="序号" width="80" align="center">
            <template #default="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="title" label="任务名称" min-width="240" show-overflow-tooltip />
          <el-table-column prop="task_type" label="任务类型" width="120" align="center">
            <template #default="scope">
              <el-tag :type="getTaskType(scope.row.task_type)">
                {{ getTaskTypeText(scope.row.task_type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="group_id" label="所属小组" width="120" align="center">
            <template #default="scope">
              {{ taskStore.groupMap(scope.row.group_id) || '无' }}
            </template>
          </el-table-column>
          <el-table-column prop="deadline" label="截止时间" min-width="120" align="center">
            <template #default="scope">
              {{ formatTime(scope.row.deadline) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120" align="center">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="publisher_info.nickname" label="发布者" min-width="120" align="center">
            <template #default="scope">
              {{ scope.row.publisher_info.nickname || scope.row.publisher_info.username || '未知' }}
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" min-width="120" align="center">
            <template #default="scope">
              {{ formatTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" align="center" fixed="right">
            <template #default="scope">
              <el-button size="small" :icon="View" type="info" @click="openViewDrawer(scope.row)">
                查看
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- Pagination Component -->
        <div class="pagination-container" style="margin-top: 16px; display: flex; justify-content: center;">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </PageContainer>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import PageContainer from '@/components/PageContainer.vue'
import useTaskStore from '@/stores/task'
import useGroupStore from '@/stores/group'

// ========== 核心实例与状态 ==========
const taskStore = useTaskStore()
const groupStore = useGroupStore()

const tableKey = ref(0)

// 新增：标记组件是否活跃
const isMounted = ref(false);

// ========== 搜索表单 ==========
const searchForm = reactive({
  group_id: '',
  title: '',
  status: ''
})

// 表单初始值，用于重置
const initialSearchForm = {
  group_id: '',
  title: '',
  status: ''
}

// ========== 分页状态 ==========
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// ========== 小组列表 ==========
const groupList = computed(() => groupStore.groupInfo)

// ========== 计算属性 ==========
// 任务列表
const taskList = ref([])
const loading = ref(false)

// ========== 工具方法 ==========
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  // 判断是否为有效日期
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

// 根据任务类型获取标签类型
const getTaskType = (taskType) => {
  const typeMap = {
    'group': 'warning',
    'club': 'success'
  }
  return typeMap[taskType] || 'info'
}

// 根据任务类型获取文本
const getTaskTypeText = (taskType) => {
  const textMap = {
    'group': '小组任务',
    'club': '社团任务'
  }
  return textMap[taskType] || taskType
}

// 根据状态获取标签类型
const getStatusType = (status) => {
  const typeMap = {
    'ongoing': 'warning',
    'completed': 'success',
    'pending': 'info'
  }
  return typeMap[status] || 'info'
}

// 根据状态获取文本
const getStatusText = (status) => {
  const textMap = {
    'ongoing': '进行中',
    'completed': '已完成',
    'pending': '已结束'
  }
  return textMap[status] || status
}

// ========== 页面初始化 ==========
onMounted(async () => {
  isMounted.value = true; // 组件挂载后标记为活跃
  
  try {
    // 获取小组信息（即使失败也继续执行任务列表获取）
    if (!groupStore.groupInfo.length && !groupStore.isGroupInfoFetched) {
      await groupStore.GetGroupInfo()
    }
  } catch (groupError) {
    console.error('获取小组信息失败:', groupError)
    // 小组信息获取失败不影响任务列表获取
  }
  
  try {
    // 获取任务列表
    await getTaskList()
  } catch (taskError) {
    if (isMounted.value) { // 仅在组件活跃时提示错误
      ElMessage.error(`获取任务列表失败：${taskError.message}`)
    }
  }
})

// 组件卸载时标记为非活跃
onUnmounted(() => {
  isMounted.value = false
})

// ========== 分页事件处理 ==========
const handleSizeChange = (val) => {
  pagination.size = val
  pagination.page = 1
  getTaskList()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  getTaskList()
}

// ========== 列表相关方法 ==========
// 初始加载和任务标题变化时执行
const getTaskList = async () => {
  try {
    loading.value = true
    const params = {
      keyword: searchForm.title,
      group_id: searchForm.group_id,
      status: searchForm.status,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await taskStore.GetTask(params)
    taskList.value = res?.data || []
    pagination.total = res?.total || 0
    tableKey.value += 1
  } catch (error) {
    ElMessage.error(`获取列表失败：${error.message}`)
  } finally {
    loading.value = false
  }
}

// 点击查询按钮时执行完整查询
const handleSearch = async () => {
  pagination.page = 1
  getTaskList()
}

const resetSearch = () => {
  // 重置所有搜索条件
  Object.assign(searchForm, initialSearchForm)
  getTaskList() // 重置后重新加载列表
}

// ========== 查看任务详情方法 ==========
const openViewDrawer = (row) => {
  window.open(`/task/detail/${row.id}`, '_blank')
}

// ========== 删除任务 ==========
const handleDelete = async (taskId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该任务吗？删除后数据不可恢复！',
      '删除确认',
      { type: 'warning' }
    )
    await taskStore.deleteTask(taskId)
    ElMessage.success('任务删除成功！')
    getTaskList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`删除任务失败：${error.message}`)
    }
  }
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

.task-content {
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
      max-height: 600px;
    }
  }

  :deep(.el-table__empty-block) {
    padding: 40px 0;
  }
}

// 查看抽屉样式简化
.view-drawer-container {
  overflow: hidden;
}

.simple-view-card {
  margin-bottom: 20px;
  
  :deep(.el-descriptions) {
    margin-bottom: 0;
  }
  
  :deep(.el-descriptions-item__label) {
    font-weight: 600;
    background-color: #f5f7fa;
  }
  
  :deep(.el-descriptions-item__content) {
    font-size: 14px;
    line-height: 1.5;
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