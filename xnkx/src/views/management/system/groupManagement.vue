<template>
  <div class="manager-page system-management-animation">
    <h2 class="page-title">小组管理</h2>
    
    <!-- 操作按钮区域 -->
    <el-card class="search-card" shadow="hover">
      <div class="search-bar">
        <div class="search-actions">
          <el-button type="primary" :icon="Plus" @click="openAddDialog">
            新建小组
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 小组列表表格 -->
    <el-card class="table-card" shadow="hover">
      <div class="table-wrapper">
        <el-table v-loading="loading" :data="groupStore.groupInfo || []" border stripe
          :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
          empty-text="暂无小组数据">
          <el-table-column prop="id" label="小组ID" width="80" align="center" />
          <el-table-column prop="group_name" label="小组名称" min-width="100" align="center" />
          <el-table-column prop="group_position" label="小组定位" min-width="150" align="center"/>
          <el-table-column prop="function_desc" label="小组描述" min-width="200" />
          <el-table-column prop="core_achievements" label="核心成果" min-width="200" />
          <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
            <template #default="scope">
              {{ formatTime(scope.row, 'createdAt') }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center">
            <template #default="scope">
              <el-button size="small" :icon="Edit" type="primary" @click="openEditDialog(scope.row)">
                编辑
              </el-button>
              <el-button size="small" :icon="Delete" type="danger" @click="handleDelete(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 新增/编辑小组弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑小组' : '新增小组'" width="500px" destroy-on-close>
      <el-form ref="groupFormRef" :model="groupForm" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item label="小组名称" prop="group_name">
          <el-input v-model="groupForm.group_name" placeholder="请输入2-20个字符的小组名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="小组定位" prop="group_position">
          <el-input v-model="groupForm.group_position" placeholder="请输入小组定位" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="小组描述" prop="desc">
          <el-input v-model="groupForm.desc" type="textarea" placeholder="请输入小组描述（可选，最多200字）" maxlength="200"
            show-word-limit rows="4" />
        </el-form-item>
        <el-form-item label="核心成果" prop="core_achievements">
          <el-input v-model="groupForm.core_achievements" type="textarea" placeholder="请输入核心成果（可选，最多300字）"
            maxlength="300" show-word-limit rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">
            {{ isEdit ? '保存修改' : '创建小组' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import useGroupStore from '@/stores/group'

// ========== 接收父组件传递的props ==========
const props = defineProps({
  refreshKey: {
    type: Number,
    required: true
  }
})

// ========== 核心数据与状态 ==========
const groupStore = useGroupStore()
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentGroupId = ref('')

// ========== 表单相关 ==========
const groupFormRef = ref(null)
const groupForm = reactive({
  group_name: '',
  group_position: '',
  desc: '',
  core_achievements: ''
})
const formRules = reactive({
  group_name: [
    { required: true, message: '请输入小组名称', trigger: 'blur' },
    { min: 2, max: 20, message: '小组名称长度需在2-20个字符之间', trigger: 'blur' }
  ],
  group_position: [
    { required: true, message: '请输入小组定位', trigger: 'blur' },
    { max: 50, message: '小组定位最多50个字符', trigger: 'blur' }
  ],
  desc: [
    { max: 200, message: '小组描述最多200个字符', trigger: 'blur' }
  ],
  core_achievements: [
    { max: 300, message: '核心成果最多300个字符', trigger: 'blur' }
  ]
})

// 格式化时间
const formatTime = (row, timeKey = 'createdAt') => {
  if (!row || !row[timeKey]) return '-';
  return new Date(row[timeKey]).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai'
  });
};


// ========== 数据获取 ==========
const getGroupList = async () => {
  try {
    loading.value = true
    await groupStore.GetGroupInfo()
  } catch (error) {
    ElMessage.error(`获取小组列表失败：${error.message}`)
  } finally {
    loading.value = false
    // 数据获取完成后关闭刷新状态
    // isRefreshing.value = false
  }
}

// ========== 事件处理 ==========
const openAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  currentGroupId.value = row.id
  // 回显接口返回的字段
  groupForm.group_name = row.group_name
  groupForm.group_position = row.group_position || ''
  groupForm.desc = row.function_desc || ''
  groupForm.core_achievements = row.core_achievements || ''
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!groupFormRef.value) return
  try {
    await groupFormRef.value.validate()
    const submitData = {
      group_name: groupForm.group_name,
      group_position: groupForm.group_position,
      function_desc: groupForm.desc,
      core_achievements: groupForm.core_achievements
    }
    if (isEdit.value) {
      await groupStore.PutGroupInfo(currentGroupId.value, submitData)
      ElMessage.success('小组修改成功！')
    } else {
      await groupStore.CreateGroupInfo(submitData)
      ElMessage.success('小组创建成功！')
    }
    dialogVisible.value = false
    getGroupList()
  } catch (error) {
    if (error.name !== 'ValidationError') {
      ElMessage.error(`${isEdit.value ? '修改' : '创建'}小组失败：${error.message}`)
    }
  }
}

const handleDelete = async (groupId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该小组吗？删除后数据不可恢复！',
      '删除确认',
      { type: 'warning' }
    )
    await groupStore.DeleteGroupInfo(groupId)
    ElMessage.success('小组删除成功！')
    getGroupList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`删除小组失败：${error.message}`)
    }
  }
}

const resetForm = () => {
  groupForm.group_name = ''
  groupForm.group_position = ''
  groupForm.desc = ''
  groupForm.core_achievements = ''
  currentGroupId.value = ''
  groupFormRef.value?.clearValidate()
}

// ========== 生命周期 ==========
onMounted(() => {
  if (!groupStore.isGroupInfoFetched) {
    getGroupList()
  }
})

watch(() => props.refreshKey, () => {
  getGroupList()
})

defineExpose({
  refresh: getGroupList
})
</script>

<style scoped lang="scss">
// 基础变量
$mobile-break: 480px;
$tablet-break: 768px;
$desktop-break: 1200px;

// 页面整体样式
.manager-page {
  --primary-bg: #f5f7fa;
  --card-radius: 8px;
  --base-padding: 20px;
  --mobile-padding: 10px;
  --base-font-size: 14px;
  --mobile-font-size: 12px;

  font-size: var(--base-font-size);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: var(--base-padding);
  box-sizing: border-box; // 关键：避免padding导致页面宽度超出

  @media (max-width: $desktop-break) {
    --base-padding: 16px;
  }

  @media (max-width: $tablet-break) {
    padding: var(--mobile-padding);
    min-height: calc(100vh - 70px);
    font-size: var(--mobile-font-size);
    gap: 12px;
  }

  @media (max-width: $mobile-break) {
    --base-padding: 8px;
    gap: 8px;
  }
}

// 页面标题
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;

  @media (max-width: $tablet-break) {
    font-size: 16px;
  }

  @media (max-width: $mobile-break) {
    font-size: 14px;
  }
  
  // 深色主题下标题不要太暗
  :deep(.dark-theme) & {
    color: #e5e7eb !important;
  }
}

// 搜索卡片
.search-card {
  border-radius: var(--card-radius);
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__body) {
    padding: 12px 16px;
  }

  @media (max-width: $tablet-break) {
    max-width: 100%;
    border-radius: 6px;

    :deep(.el-card__body) {
      padding: 8px 12px;
    }
  }

  @media (max-width: $mobile-break) {
    :deep(.el-card__body) {
      padding: 8px;
    }
  }
}

// 搜索栏
.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  .search-input {
    flex: 1;
    min-width: 200px;
    max-width: 300px;
  }

  .search-select {
    flex: 0 0 auto;
    width: 180px;
  }

  .search-actions {
    flex: 0 0 auto;
  }

  :deep(.el-button) {
    border-radius: 6px;
    padding: 8px 16px;
    font-size: var(--base-font-size);
  }

  @media (max-width: $tablet-break) {
    flex-direction: column;
    align-items: stretch;

    .search-input,
    .search-select {
      width: 100% !important;
      max-width: 100%;
      min-width: unset;
    }

    :deep(.el-button) {
      padding: 6px 12px;
      font-size: var(--mobile-font-size);
    }
  }
}

// 表格卡片
.table-card {
  border-radius: var(--card-radius);
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  @media (max-width: $tablet-break) {
    border-radius: 6px;
  }
}

// 表格容器（关键：强制不超出页面）
.table-wrapper {
  overflow-x: auto;
  padding: 8px;
  max-width: none;

  :deep(.el-table) {
    --el-table-row-hover-bg-color: #f8f9fa;
    --el-table-header-text-color: #333;
  }

  :deep(.el-table-cell) {
    white-space: normal;
    word-break: break-all;
    line-height: 1.5;
    padding: 12px;
    font-size: var(--base-font-size);
  }
  
  // 深色主题表格样式
  :deep(.dark-theme) & {
    :deep(.el-table) {
      --el-table-row-hover-bg-color: #374151;
      --el-table-header-text-color: #e5e7eb;
      --el-table-header-bg-color: #1f2937;
      background-color: #111827 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      
      :deep(.el-table__header-wrapper) {
        background-color: #1f2937 !important;
        
        :deep(.el-table__header) {
          background-color: #1f2937 !important;
          
          :deep(.el-table__cell) {
            background-color: #1f2937 !important;
            color: #e5e7eb !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
        }
      }
      
      :deep(.el-table__body-wrapper) {
        background-color: #111827 !important;
        
        :deep(.el-table__body) {
          :deep(.el-table__row) {
            background-color: #111827 !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            
            :deep(.el-table__cell) {
              background-color: #111827 !important;
              color: #e5e7eb !important;
              border-color: rgba(255, 255, 255, 0.1) !important;
            }
            
            &:hover {
              background-color: #374151 !important;
              
              :deep(.el-table__cell) {
                background-color: #374151 !important;
              }
            }
          }
        }
      }
      
      :deep(.el-table__empty-block) {
        background-color: #111827 !important;
        
        :deep(.el-empty__text) {
          color: #9ca3af !important;
        }
      }
    }
  }
}

// 分页容器
.pagination-wrapper {
  padding: 12px 16px;
  text-align: right;
  background-color: #f8f9fa;
  border-top: 1px solid #ebeef5;

  :deep(.el-pagination) {
    font-size: var(--base-font-size);

    :deep(.el-pagination__sizes) {
      margin-right: 10px;
    }
  }

  @media (max-width: $tablet-break) {
    padding: 8px 12px;
    text-align: center;

    :deep(.el-pagination) {
      font-size: var(--mobile-font-size);

      :deep(.el-pagination__sizes) {
        display: none;
      }
    }
  }
  
  // 深色主题下的分页容器样式
  :deep(.dark-theme) & {
    background-color: #1f2937 !important;
    border-top-color: rgba(255, 255, 255, 0.1) !important;
    
    :deep(.el-pagination) {
      background-color: #1f2937 !important;
      color: #e5e7eb !important;
      
      // 分页按钮深色主题样式
      :deep(.el-pagination__prev),
      :deep(.el-pagination__next),
      :deep(.el-pagination__item) {
        background-color: #374151 !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
        color: #e5e7eb !important;
      }
      
      // 激活状态样式
      :deep(.el-pagination__item.is-active) {
        background-color: #409eff !important;
        border-color: #409eff !important;
      }
      
      // 禁用状态样式
      :deep(.el-pagination__prev.is-disabled),
      :deep(.el-pagination__next.is-disabled) {
        background-color: #1f2937 !important;
        border-color: rgba(255, 255, 255, 0.05) !important;
        color: rgba(255, 255, 255, 0.3) !important;
      }
      
      // 分页尺寸选择器样式
      :deep(.el-select) {
        background-color: #374151 !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
        
        :deep(.el-input__inner) {
          background-color: #374151 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #e5e7eb !important;
        }
      }
    }
  }
}

// 对话框底部样式
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// 系统管理模块动画效果
.system-management-animation {
  animation: systemManagementSlideIn 0.6s ease-out;
}

// 卡片和表格元素的入场动画
.search-card,
.table-card {
  opacity: 0;
  animation: systemElementFadeIn 0.5s ease-out forwards;
}

.search-card {
  animation-delay: 0.1s;
}

.table-card {
  animation-delay: 0.2s;
}

// 系统管理容器动画
@keyframes systemManagementSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 系统元素淡入动画
@keyframes systemElementFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>