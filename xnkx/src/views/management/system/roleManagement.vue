<template>
  <div class="manager-page system-management-animation">
    <h2 class="page-title">角色管理</h2>
    
    <!-- 操作按钮区域 -->
    <el-card class="search-card" shadow="hover">
      <div class="search-bar">
        <div class="search-actions">
          <el-button type="primary" :icon="Plus" @click="openAddDialog">
            新建角色
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 角色列表表格 -->
    <el-card class="table-card" shadow="hover">
      <div class="table-wrapper">
        <el-table v-loading="loading" :data="Array.isArray(roleStore.roleInfo) ? roleStore.roleInfo : []" border stripe
          :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
          empty-text="暂无角色数据">
          <el-table-column prop="id" label="角色ID" width="80" align="center" />
          <el-table-column prop="role_name" label="角色名称" min-width="100" align="center" />
          <el-table-column prop="permission_desc" label="角色描述" min-width="200" />
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

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'" width="500px" destroy-on-close>
      <el-form ref="roleFormRef" :model="roleForm" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item label="角色名称" prop="role_name">
          <el-input v-model="roleForm.role_name" placeholder="请输入2-20个字符的角色名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="角色描述" prop="permission_desc">
          <el-input v-model="roleForm.permission_desc" type="textarea" placeholder="请输入角色描述（可选，最多200字）" maxlength="200"
            show-word-limit rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">
            {{ isEdit ? '保存修改' : '创建角色' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import{Plus,Edit,Delete} from '@element-plus/icons-vue'
// 导入角色仓库
import useRoleStore from '@/stores/role'

// ========== 接收父组件传递的props ==========
const props = defineProps({
  refreshKey: {
    type: Number,
    required: true
  }
})

// ========== 核心数据与状态 ==========
// 2. 替换：角色仓库实例化
const roleStore = useRoleStore()
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentRoleId = ref('')

// ========== 表单相关 ==========
// 3. 替换：表单ref和表单数据（移除小组相关字段，新增角色字段）
const roleFormRef = ref(null)
const roleForm = reactive({
  role_name: '',
  permission_desc: '',
})
// 4. 替换：表单验证规则（适配角色字段）
const formRules = reactive({
  role_name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度需在2-20个字符之间', trigger: 'blur' }
  ],
  permission_desc: [
    { required: true,max: 50, message: '角色描述最多50个字符', trigger: 'blur' }
  ]
})

// 格式化时间（保留原有逻辑）
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
// 5. 替换：获取角色列表（替换小组列表逻辑）
const getRoleList = async () => {
  try {
    loading.value = true
    await roleStore.GetRoleInfo()
  } catch (error) {
    ElMessage.error(`获取角色列表失败：${error.message}`)
  } finally {
    loading.value = false
  }
}

// ========== 事件处理 ==========
// 新增角色弹窗
const openAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑角色弹窗（替换字段回显逻辑）
const openEditDialog = (row) => {
  isEdit.value = true
  currentRoleId.value = row.id
  // 6. 替换：角色字段回显
  roleForm.role_name = row.role_name
  roleForm.permission_desc = row.permission_desc || ''
  dialogVisible.value = true
}

// 提交表单（替换接口调用逻辑）
const submitForm = async () => {
  if (!roleFormRef.value) return
  try {
    await roleFormRef.value.validate()
    const submitData = {
      role_name: roleForm.role_name,
      permission_desc: roleForm.permission_desc,
    }
    if (isEdit.value) {
      // 7. 替换：调用编辑角色接口
      await roleStore.UpdateRole(currentRoleId.value, submitData)
      ElMessage.success('角色修改成功！')
    } else {
      // 8. 替换：调用新增角色接口
      await roleStore.CreateRole(submitData)
      ElMessage.success('角色创建成功！')
    }
    dialogVisible.value = false
    getRoleList()
  } catch (error) {
    if (error.name !== 'ValidationError') {
      ElMessage.error(`${isEdit.value ? '修改' : '创建'}角色失败：${error.message}`)
    }
  }
}

// 删除角色（替换接口调用逻辑）
const handleDelete = async (roleId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该角色吗？删除后数据不可恢复！',
      '删除确认',
      { type: 'warning' }
    )
    // 9. 替换：调用删除角色接口
    await roleStore.DeleteRole(roleId)
    ElMessage.success('角色删除成功！')
    getRoleList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`删除角色失败：${error.message}`)
    }
  }
}

// 重置表单（替换为角色表单）
const resetForm = () => {
  roleForm.role_name = ''
  roleForm.permission_desc = ''
  currentRoleId.value = ''
  roleFormRef.value?.clearValidate()
}

// ========== 生命周期 ==========
// 角色管理页面的script部分
onMounted(() => {
  // console.log('roleInfo类型：', typeof roleStore.roleInfo, '是否为数组：', Array.isArray(roleStore.roleInfo));
  getRoleList();
});

watch(() => props.refreshKey, () => {
  getRoleList()
})

defineExpose({
  refresh: getRoleList
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