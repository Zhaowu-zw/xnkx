<template>
  <div class="manager-page system-management-animation">
    <h2 class="page-title">用户管理</h2>
    <el-card class="search-card" shadow="hover">
      <div class="search-bar">
        <el-input v-model="keyword" placeholder="请输入用户名/邮箱/昵称搜索" class="search-input" clearable
          @keyup.enter="loadUserList" @input="loadUserList" />
        <el-select v-model="group_id" placeholder="请选择分组" class="search-select" clearable>
          <el-option label="全部分组" value="" />
          <el-option v-for="group in groupStore.groupInfo" :key="group.id" :label="group.group_name"
            :value="group.id" />
        </el-select>
        <el-button type="primary" @click="loadUserList" :icon="Search">查询</el-button>
        <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
      </div>
    </el-card>

      <el-card class="table-card" shadow="hover">
      <div class="table-wrapper">
        <el-table v-loading="userStore.userListLoading" :data="userStore.userList" border stripe
          :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
          :empty-text="userStore.userListLoading ? '加载中...' : '暂无用户数据'">
          <!-- 序号（居中） -->
          <el-table-column label="序号" width="60" align="center">
            <template #default="scope">
              {{ (page - 1) * pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <!-- 用户名（居中） -->
          <el-table-column prop="username" label="用户名" min-width="80" align="center" />
          <!-- 昵称（居中） -->
          <el-table-column label="昵称" min-width="80" align="center">
            <template #default="scope">
              {{ scope.row.userinfo?.nickname || '-' }}
            </template>
          </el-table-column>
          <!-- 年龄（居中） -->
          <el-table-column label="年龄" width="70" align="center">
            <template #default="scope">
              {{ scope.row.userinfo?.age || '-' }}
            </template>
          </el-table-column>
          <!-- 性别（居中） -->
          <el-table-column label="性别" width="70" align="center">
            <template #default="scope">
              {{ scope.row.userinfo?.sex || '未知' }}
            </template>
          </el-table-column>
          <!-- 邮箱（居中） -->
          <el-table-column prop="email" label="邮箱" min-width="150" align="center" />
          <!-- 电话（居中） -->
          <el-table-column label="电话" min-width="110" align="center">
            <template #default="scope">
              {{ scope.row.userinfo?.telephone || '-' }}
            </template>
          </el-table-column>
          <!-- 爱好（左对齐，不居中） -->
          <el-table-column label="爱好" min-width="130">
            <template #default="scope">
              {{ scope.row.userinfo?.hobbit || '-' }}
            </template>
          </el-table-column>
          <!-- 组别（居中） -->
          <el-table-column label="组别" min-width="80" align="center">
            <template #default="scope">
              {{ getGroupName(scope.row.group_id) }}
            </template>
          </el-table-column>
          <!-- 角色（居中） -->
          <el-table-column prop="role_name" label="角色" min-width="80" align="center" />
          <!-- 创建时间（居中） -->
          <el-table-column prop="createdAt" label="创建时间" min-width="140" align="center">
            <template #default="scope">
              {{ formatTime(scope.row) }}
            </template>
          </el-table-column>
          <!-- 操作（居中） -->
          <el-table-column label="操作" width="180" align="center">
            <template #default="scope">
              <el-button type="primary" size="small" @click="openUserDetail(scope.row)" :icon="View">
                详情
              </el-button>
              <el-button type="danger" size="small" @click="deleteUser(scope.row)" :icon="Delete"
                :loading="userStore.deleteLoading">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <!-- 分页部分保持不变 -->
         <div class="pagination-wrapper">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          :total="userStore.total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" :disabled="userStore.userListLoading" />
      </div>
    </el-card>


    <!-- 用户详情抽屉 -->
    <el-drawer v-model="detailDrawerVisible" title="用户详细信息" size="40%" :destroy-on-close="true" @close="closeUserDetail"
      :before-close="handleDrawerClose" :close-on-click-modal="true" class="user-detail-drawer">
      <div class="drawer-content">
        <!-- 顶部用户信息卡片 -->
        <el-card shadow="hover" class="user-header-card">
          <div class="user-header">
            <div class="user-avatar">
              <img v-if="currentUser?.userinfo?.avatar" :src="currentUser.userinfo.avatar" alt="用户头像" class="avatar-img"
                @error="handleAvatarError">
              <div v-else class="avatar-placeholder">
                {{ currentUser?.userinfo?.nickname ? currentUser.userinfo.nickname.charAt(0) :
                  currentUser?.username?.charAt(0) || '用' }}
              </div>
            </div>
            <div class="user-basic">
              <h3 class="user-name">
                {{ currentUser?.userinfo?.nickname || currentUser?.username || '未知用户' }}
                <el-tag size="small" :type="getRoleTagType(currentUser?.role_name)">
                  {{ currentUser?.role_name || '普通用户' }}
                </el-tag>
              </h3>
              <p class="user-id">用户ID: {{ currentUser?.id || '-' }}
                <el-tooltip content="复制用户ID" placement="top">
                  <el-icon class="copy-icon" @click="copyToClipboard(currentUser?.id)">
                    <CopyDocument />
                  </el-icon>
                </el-tooltip>
              </p>
              <div class="user-roles">
                <div class="role-tags">
                  <el-tag
                    v-for="role in currentUserRoles"
                    :key="role.id"
                    :type="getRoleTagType(role.role_name)"
                    :closable="currentUser?.role_name !== '普通用户'"
                    @close="removeUserRole(role.id)"
                    :class="['role-tag', { disabled: currentUser?.role_name === '普通用户' }]"
                  >
                    {{ role.role_name }}
                  </el-tag>
                  <el-button
                    v-if="currentUser?.role_name !== '普通用户'"
                    type="primary"
                    size="small"
                    circle
                    @click="toggleRoleSelector"
                    :icon="Plus"
                    class="add-role-btn"
                  >
                  </el-button>
                </div>
                
                <!-- 角色选择器 -->
                <div v-if="showRoleSelector && currentUser?.role_name !== '普通用户'" class="role-selector">
                  <h5>所有角色</h5>
                  <div class="available-roles">
                    <el-tag
                      v-for="role in allRoles"
                      :key="role.id"
                      :type="!currentUserRoles.some(r => r.id === role.id) ? 'info' : 'success'"
                      :closable="false"
                      class="available-role-tag"
                    >
                      {{ role.role_name }}
                      <el-button
                        v-if="!currentUserRoles.some(r => r.id === role.id)"
                        size="small"
                        circle
                        @click="assignUserRole(role.id)"
                        :icon="Plus"
                        class="tag-btn add-btn"
                      >
                      </el-button>
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 详情内容区域 -->
        <div class="detail-sections">
          <!-- 基础信息区块 -->
          <section class="detail-section">
            <h4 class="section-title">
              <el-icon class="section-icon">
                <User />
              </el-icon> 基础信息
            </h4>
            <el-descriptions :column="isMobile ? 1 : 2" border size="small" label-width="80px" label-align="center"
              align="left" class="desc-compact">
              <el-descriptions-item label="用户名">
                {{ formatEmptyValue(currentUser?.username) }}
              </el-descriptions-item>
              <el-descriptions-item label="邮箱">
                {{ formatEmptyValue(currentUser?.email) }}
                <el-tooltip v-if="currentUser?.email" content="复制邮箱" placement="top">
                  <el-icon class="copy-icon inline-copy" @click="copyToClipboard(currentUser?.email)">
                    <CopyDocument />
                  </el-icon>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="角色">
                {{ formatEmptyValue(currentUser?.role_name) }}
              </el-descriptions-item>
              <el-descriptions-item label="所属分组">
                {{ getGroupName(currentUser?.group_id) || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </section>

          <!-- 个人资料区块 -->
          <section class="detail-section">
            <h4 class="section-title">
              <el-icon class="section-icon">
                <UserFilled />
              </el-icon> 个人资料
            </h4>
            <el-descriptions :column="isMobile ? 1 : 2" border size="small" label-width="80px" label-align="center"
              align="left" class="desc-compact">
              <el-descriptions-item label="昵称">
                {{ formatEmptyValue(currentUser?.userinfo?.nickname) }}
              </el-descriptions-item>
              <el-descriptions-item label="年龄">
                {{ formatEmptyValue(currentUser?.userinfo?.age) }}
              </el-descriptions-item>
              <el-descriptions-item label="性别">
                {{ currentUser?.userinfo?.sex || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="学号">
                {{ formatEmptyValue(currentUser?.userinfo?.student_number) }}
              </el-descriptions-item>
              <el-descriptions-item label="年级">
                {{ formatEmptyValue(currentUser?.userinfo?.grade) }}
              </el-descriptions-item>
              <el-descriptions-item label="系别">
                {{ formatEmptyValue(currentUser?.userinfo?.department) }}
              </el-descriptions-item>
              <el-descriptions-item label="爱好">
                {{ formatEmptyValue(currentUser?.userinfo?.hobbit) }}
              </el-descriptions-item>
              <el-descriptions-item label="联系电话">
                {{ formatEmptyValue(currentUser?.userinfo?.telephone) }}
                <el-tooltip v-if="currentUser?.userinfo?.telephone" content="复制电话" placement="top">
                  <el-icon class="copy-icon inline-copy" @click="copyToClipboard(currentUser?.userinfo?.telephone)">
                    <CopyDocument />
                  </el-icon>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="个人简介" :span="isMobile ? 1 : 2">
                {{ formatEmptyValue(currentUser?.userinfo?.description) }}
              </el-descriptions-item>
            </el-descriptions>
          </section>

          <!-- 扩展信息区块 -->
          <section class="detail-section">
            <h4 class="section-title">
              <el-icon class="section-icon">
                <InfoFilled />
              </el-icon> 扩展信息
            </h4>
            <el-descriptions :column="isMobile ? 1 : 2" border size="small" label-width="80px" label-align="center"
              align="left" class="desc-compact">
              <el-descriptions-item label="头像路径" :span="isMobile ? 1 : 2">
                {{ formatEmptyValue(currentUser?.userinfo?.avatar ) }}
                <el-tooltip v-if="currentUser?.userinfo?.avatar " content="复制路径"
                  placement="top">
                  <el-icon class="copy-icon inline-copy"
                    @click="copyToClipboard(currentUser?.userinfo?.avatar)">
                    <CopyDocument />
                  </el-icon>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatTime(currentUser) }}
              </el-descriptions-item>
              <el-descriptions-item label="最后更新时间">
                {{ formatTime(currentUser.userinfo, 'updatedAt') }}
              </el-descriptions-item>
            </el-descriptions>
          </section>
        </div>

        <!-- 底部关闭按钮 -->
        <div class="drawer-footer">
          <el-button type="primary" @click="closeUserDetail">
            关闭详情
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 用户角色列表对话框 -->
    <el-dialog v-model="userRolesDialogVisible" title="用户角色列表" width="500px" destroy-on-close>
      <div class="user-roles-dialog">
        <el-table v-loading="userRolesLoading" :data="userRolesList" border stripe style="width: 100%" :empty-text="userRolesLoading ? '加载中...' : '暂无角色数据'">
          <el-table-column prop="id" label="角色ID" width="80" align="center" />
          <el-table-column prop="role_name" label="角色名称" width="150" align="center" />
          <el-table-column prop="permission_desc" label="权限描述" min-width="200" align="center" />
        </el-table>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="userRolesDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search, Refresh, Delete, User, View, UserFilled,
  InfoFilled, CopyDocument, Plus
} from '@element-plus/icons-vue';

// 导入状态管理（根据你的项目实际路径调整）
import useUserStore from '@/stores/user';
import useGroupStore from '@/stores/group';
import useRoleStore from '@/stores/role';

// 初始化仓库
const userStore = useUserStore();
const groupStore = useGroupStore();
const roleStore = useRoleStore();

// 分页/筛选参数
const page = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const group_id = ref('');

// 详情抽屉相关变量
const detailDrawerVisible = ref(false);
const currentUser = ref(null);
const isMobile = computed(() => window.innerWidth <= 768);

// 角色相关变量
const currentUserRoles = ref([]);
const allRoles = ref([]);
const showRoleSelector = ref(false);
const roleLoading = ref(false);

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

// 根据group_id匹配分组名称
const getGroupName = (groupId) => {
  if (!groupId || !groupStore.groupInfo?.length) return '-';
  const targetGroup = groupStore.groupInfo.find(item => item.id === Number(groupId));
  return targetGroup?.group_name || '-';
};

// 加载用户列表
const loadUserList = async () => {
  try {
    if (!groupStore.groupInfo?.length) await groupStore.GetGroupInfo();
    await userStore.getAllUserInfo({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim(),
      group_id: group_id.value ? Number(group_id.value) : undefined,
    });
  } catch (err) {
    ElMessage.error('加载失败：' + err.message);
  }
};

// 分页相关方法
const handleSizeChange = (val) => {
  pageSize.value = val;
  loadUserList();
};
const handleCurrentChange = (val) => {
  page.value = val;
  loadUserList();
};
const resetSearch = () => {
  keyword.value = '';
  group_id.value = '';
  page.value = 1;
  loadUserList();
};

// 抽屉相关方法
const openUserDetail = async (row) => {
  currentUser.value = JSON.parse(JSON.stringify(row));
  detailDrawerVisible.value = true;
  await loadUserRoles(row.id);
  await loadAllRoles();
};
const closeUserDetail = () => {
  detailDrawerVisible.value = false;
  showRoleSelector.value = false; // 关闭角色选择器
  setTimeout(() => {
    currentUser.value = null; // 延迟清空，避免动画卡顿
    currentUserRoles.value = []; // 清空用户角色列表
    allRoles.value = []; // 清空所有角色列表
  }, 300);
};
const handleDrawerClose = (done) => {
  showRoleSelector.value = false; // 关闭角色选择器
  done(); // 关闭前的确认逻辑可在此扩展
};

// 头像加载失败处理
const handleAvatarError = (e) => {
  e.target.style.display = 'none';
  e.target.nextElementSibling.style.display = 'flex';
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  if (!text) return ElMessage.warning('无可用复制内容');
  navigator.clipboard.writeText(text.toString()).then(() => {
    ElMessage.success('复制成功');
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制');
  });
};

// 格式化空值显示
const formatEmptyValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return '无';
  }
  if (typeof value === 'boolean') return value ? '是' : '否';
  return value;
};

// 获取角色标签类型
const getRoleTagType = (roleName) => {
  const roleMap = {
    '管理员': 'primary',
    '编辑': 'success',
    '审核员': 'warning',
    '普通用户': 'info'
  };
  return roleMap[roleName] || 'info';
};

// 删除用户
const deleteUser = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该用户吗？', '提示', { type: 'warning' });
    await userStore.deleteUserInfo(row.id);
    loadUserList();
  } catch (err) {
    if (err.message !== 'cancel') ElMessage.error('删除失败');
  }
};

// 加载用户角色
const loadUserRoles = async (userId) => {
  try {
    roleLoading.value = true;
    const roles = await roleStore.GetUserRoles(userId);
    currentUserRoles.value = roles;
  } catch (error) {
    ElMessage.error(`获取用户角色失败：${error.message}`);
  } finally {
    roleLoading.value = false;
  }
};

// 加载所有角色
const loadAllRoles = async () => {
  try {
    roleLoading.value = true;
    const roles = await roleStore.GetRoleInfo();
    allRoles.value = roles;
  } catch (error) {
    ElMessage.error(`获取角色列表失败：${error.message}`);
  } finally {
    roleLoading.value = false;
  }
};

// 切换角色选择器显示
const toggleRoleSelector = () => {
  showRoleSelector.value = !showRoleSelector.value;
};

// 分配角色给用户
const assignUserRole = async (roleId) => {
  try {
    const userId = currentUser.value.id;
    await roleStore.AssignUserRole({ userId, roleId });
    ElMessage.success('角色分配成功');
    await loadUserRoles(userId);
  } catch (error) {
    ElMessage.error(`角色分配失败：${error.message}`);
  }
};

// 从用户移除角色
const removeUserRole = async (roleId) => {
  try {
    const userId = currentUser.value.id;
    await roleStore.RemoveUserRole(userId, roleId);
    ElMessage.success('角色移除成功');
    await loadUserRoles(userId);
  } catch (error) {
    ElMessage.error(`角色移除失败：${error.message}`);
  }
};

// 页面初始化
onMounted(async () => {
  await groupStore.GetGroupInfo().catch(err => ElMessage.error('加载分组失败' + err));
  loadUserList();
});
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
  /* 去掉宽度限制，让表格匹配截图宽度 */

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

// 抽屉样式（核心：调整内容大小）
.user-detail-drawer {
  /* 移除整体缩放，使用更精细的字体调整 */
  max-height: 100vh;
  overflow: hidden; /* 避免外部滚动条 */

  :deep(.el-drawer__body) {
    padding: 20px !important;
    overflow-y: auto;
    background-color: #fafafa;
    max-height: calc(100vh - 80px); /* 调整高度避免滚动条 */
    font-size: 16px !important; /* 抽屉整体字体基准，再小一点 */
  }

  :deep(.el-drawer__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    :deep(.el-drawer__title) {
      font-size: 30px !important; /* 抽屉标题，稍微大一点 */
      font-weight: 600;
      color: #1989fa;
    }

    :deep(.el-drawer__close) {
      color: #999;
      transition: color 0.3s;
      font-size: 18px !important;

      &:hover {
        color: #1989fa;
        transform: scale(1.1);
      }
    }
  }
  
  // 抽屉深色主题样式
  :deep(.dark-theme) & {
    :deep(.el-drawer__body) {
      background-color: #111827 !important;
      color: #e5e7eb !important;
    }
    
    :deep(.el-drawer__header) {
      background-color: #1f2937 !important;
      border-bottom-color: rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      
      :deep(.el-drawer__title) {
        color: #409eff !important;
      }
      
      :deep(.el-drawer__close) {
        color: #9ca3af !important;
        
        &:hover {
          color: #409eff !important;
        }
      }
    }
  }
}

// 抽屉内容容器
.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 16px !important; /* 直接在内容容器设置字体大小，再小一点 */
  /* 调整子元素字体 */
  &, & * {
    font-size: 16px !important;
    line-height: 1.5 !important; /* 减小行高，节省空间 */
  }
}

// 用户头像卡片
.user-header-card {
  border-radius: 8px !important;
  overflow: hidden;
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
  }

  :deep(.el-card__body) {
    padding: 16px;
    background-color: #fff;
  }
  
  // 深色主题样式
  :deep(.dark-theme) & {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
    }
    
    :deep(.el-card__body) {
      background-color: #1f2937 !important;
    }
  }
}

// 用户头像区域
.user-header {
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: $mobile-break) {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
}

// 头像样式
.user-avatar {
  position: relative;

  .avatar-img {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
    }
  }

  .avatar-placeholder {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: linear-gradient(135deg, #409eff 0%, #69b1ff 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
    }
  }
}

// 用户基础信息（字体放大）
.user-basic {
  flex: 1;
}

.user-name {
  font-size: 20px !important; // 用户名大小，再小一点
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: $mobile-break) {
    font-size: 18px !important;
    justify-content: center;
  }

  :deep(.el-tag) {
    margin-top: 2px;
    font-size: 12px !important; // 角色标签大小，再小一点
    padding: 2px 6px;
  }
  
  // 深色主题样式
  :deep(.dark-theme) & {
    color: #e5e7eb !important;
  }
}

.user-id {
  font-size: 14px !important; // 用户ID大小，再小一点
  color: #666;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  
  // 深色主题样式
  :deep(.dark-theme) & {
    color: #9ca3af !important;
  }
}

// 用户操作按钮区域
.user-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

// 用户角色管理样式
.user-roles {
  margin-top: 12px;
}

.role-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.role-tag {
  cursor: pointer;
  font-size: 14px !important;
  padding: 4px 10px !important;
  border-radius: 12px !important;
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
    
    &:hover {
      transform: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
}

.add-role-btn {
  margin-left: 5px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: rotate(90deg);
  }
  
  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
    
    &:hover {
      transform: none;
    }
  }
}

.role-selector {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  margin-top: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  // 深色主题样式
  :deep(.dark-theme) & {
    background-color: #374151 !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}

.role-selector h5 {
  margin: 0 0 10px 0;
  font-size: 14px !important;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  
  // 深色主题样式
  :deep(.dark-theme) & {
    color: #e5e7eb !important;
  }
}

.available-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.available-role-tag {
  cursor: pointer;
  font-size: 14px !important;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px !important;
  border-radius: 12px !important;
  transition: all 0.3s ease;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
    
    &:hover {
      transform: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }
}

.tag-btn {
  margin-left: 4px;
  padding: 0 !important;
  width: 20px;
  height: 20px;
  font-size: 12px !important;
  line-height: 20px !important;
  border-radius: 50% !important;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
    
    &:hover {
      transform: none;
    }
  }
}

.tag-btn.add-btn {
  background-color: #409eff !important;
  border-color: #409eff !important;
  color: white !important;
}

// 复制图标（放大）
.copy-icon {
  color: #409eff;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 20px !important; // 复制图标放大

  &:hover {
    color: #1989fa;
    transform: scale(1.1);
  }
}

// 详情分块区域
.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// 详情区块
.detail-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px; // 减小内边距，节省空间
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  margin-bottom: 10px; // 减小间距

  &:hover {
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  }
  
  // 深色主题样式
  :deep(.dark-theme) & {
    background-color: #1f2937 !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    
    &:hover {
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
    }
  }
}

// 区块标题（放大）
.section-title {
  font-size: 18px !important; // 模块标题大小，再小一点
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0; // 减小间距
  padding-left: 5px;
  border-left: 2px solid #409eff;
  display: flex;
  align-items: center;
  gap: 8px;
  
  // 深色主题样式
  :deep(.dark-theme) & {
    color: #e5e7eb !important;
  }
}

.section-icon {
  color: #409eff;
  font-size: 18px !important; // 标题图标大小，再小一点
}

// 核心：描述列表字体放大
.desc-compact {

  // 标题文字放大
  :deep(.el-descriptions-item__label) {
    font-size: 14px !important; // 标签字体大小，再小一点
    font-weight: 500;
    padding: 6px 4px !important; // 减小内边距
    color: #333;
  }

  // 内容文字放大
  :deep(.el-descriptions-item__content) {
    font-size: 14px !important; // 内容字体大小，再小一点
    line-height: 1.5 !important;
    padding: 6px 4px !important; // 减小内边距
    color: #666;
  }

  // 调整描述列表间距
  :deep(.el-descriptions-item) {
    margin-bottom: 4px !important; // 减小间距
  }
  
  // 描述列表边框样式
  :deep(.el-descriptions) {
    border-color: #ebeef5;
  }
  
  :deep(.el-descriptions__body) {
    border-color: #ebeef5;
  }
  
  :deep(.el-descriptions-item) {
    border-color: #ebeef5;
  }

  // 移动端适配：自动缩小标题宽度
  @media (max-width: $tablet-break) {
    :deep(.el-descriptions) {
      --el-descriptions-label-width: 70px !important;
    }
  }

  @media (max-width: $mobile-break) {
    :deep(.el-descriptions) {
      --el-descriptions-label-width: 60px !important;
    }
  }
  
  // 描述列表深色主题样式
  :deep(.dark-theme) & {
    :deep(.el-descriptions-item__label) {
      color: #e5e7eb !important;
    }
    
    :deep(.el-descriptions-item__content) {
      color: #9ca3af !important;
    }
    
    :deep(.el-descriptions),
    :deep(.el-descriptions__body),
    :deep(.el-descriptions-item) {
      border-color: rgba(255, 255, 255, 0.1) !important;
    }
  }
}

// 行内复制图标
.inline-copy {
  margin-left: 4px;
  font-size: 14px !important; // 行内复制图标大小，再小一点
  vertical-align: middle;
}

// 抽屉底部按钮（字体放大）
.drawer-footer {
  text-align: center;
  padding: 12px 0 0;
  margin-top: 10px;

  :deep(.el-button) {
    padding: 6px 20px; // 减小内边距
    font-size: 14px !important; // 按钮字体大小，再小一点
    border-radius: 4px;
    min-width: 100px; // 减小最小宽度
  }
  
  // 深色主题样式
  :deep(.dark-theme) & {
    :deep(.el-button) {
      background-color: #374151 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      color: #e5e7eb !important;
      
      &:hover {
        background-color: #4b5563 !important;
      }
    }
    
    :deep(.el-button--primary) {
      background-color: #409eff !important;
      border-color: #409eff !important;
      
      &:hover {
        background-color: #69b1ff !important;
      }
    }
  }
}

// 移动端适配
@media (max-width: $mobile-break) {
  .user-detail-drawer {
    :deep(.el-drawer__body) {
      padding: 12px !important;
      font-size: 14px !important;
    }

    :deep(.el-drawer__header) {
      padding: 10px 12px;
    }
  }

  .drawer-content {
    gap: 10px;
  }

  .user-header-card {
    :deep(.el-card__body) {
      padding: 12px;
    }
  }

  .avatar-img,
  .avatar-placeholder {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }

  .detail-section {
    padding: 12px;
  }

  .section-title {
    font-size: 16px !important;
  }

  .drawer-footer {
    padding: 8px 0 0;

    :deep(.el-button) {
      padding: 6px 20px;
      font-size: 14px !important;
    }
  }
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