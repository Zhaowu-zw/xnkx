<template>
  <div class="user-center">
    <!-- 顶部导航栏 -->
    <HeaderView />

    <!-- 未登录访客：直接显示登录提示 -->
    <div v-if="!isLogin" class="login-prompt">
      <div class="prompt-container">
        <i class="icon-login"></i>
        <h2>请先登录后访问</h2>
        <p>个人中心需要登录才能查看相关内容</p>
        <el-button type="primary" @click="goToLogin">立即登录</el-button>
      </div>
    </div>

    <!-- 已登录用户：显示个人中心内容 -->
    <div v-else class="center-container">
      <!-- 个人信息卡片（精简优化） -->
      <div class="profile-card">
        <div class="profile-header">
          <!-- 头像 + 基础信息 -->
          <div class="profile-base">
            <div class="avatar-box">
              <img :src="userInfo.avatar ?  userInfo.avatar: '../../assets/images/default.png'" alt="用户头像" class="user-avatar" />
              <!-- 新增：头像上传按钮（覆盖在头像右下角） -->
              <label class="edit-avatar-btn" for="avatar-upload">
                <el-icon>
                  <Camera />
                </el-icon>
              </label>
              <input type="file" id="avatar-upload" class="avatar-upload-input" accept="image/*"
                @change="handleAvatarChange" />
            </div>
            <div class="base-info">
              <h2 class="user-name">{{ userInfo.nickname || userInfo.user.username }}</h2>
              <p class="user-role">{{ role_name }} | {{ userInfo.department || '未设置' }}</p>
              <div class="info-actions">
                <el-button class="edit-info-btn" @click="openInfoEdit" v-if="!isNormalUser" :icon="Edit">
                  编辑资料
                </el-button>
                <!-- 角色操作按钮组 -->
                <div class="role-actions" v-if="!isNormalUser">
                  <!-- 组员角色的按钮 -->
                  <el-button v-if="role_name === '组员'" type="primary" size="small" @click="handleRoleAction('组长', 'promote', '申请成为组长')">
                    申请成为组长
                  </el-button>
                  <el-button v-if="role_name === '组员'" type="primary" size="small" @click="handleRoleAction('社长', 'promote', '申请成为社长')">
                    申请成为社长
                  </el-button>
                  
                  <!-- 组长角色的按钮 -->
                  <el-button v-if="role_name === '组长'" type="primary" size="small" @click="handleRoleAction('社长', 'promote', '申请成为社长')">
                    申请成为社长
                  </el-button>
                  <el-button v-if="role_name === '组长'" type="warning" size="small" @click="handleRoleAction('组员', 'resign', '申请卸任组长')">
                    卸任组长
                  </el-button>
                  
                  <!-- 指导老师或社长角色的按钮 -->
                  <el-button v-if="role_name === '指导老师' || role_name === '社长'" type="warning" size="small" @click="handleRoleAction('组员', 'resign', '申请卸任')">
                    卸任
                  </el-button>
                  
                  <!-- 所有社团成员都有退出社团按钮 -->
                  <el-button type="danger" size="small" @click="handleResignClub('resign_club')">
                    退出社团
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 核心数据统计 - 所有登录用户都显示消息数 -->
          <div class="profile-stats" v-if="isLogin">
            <div class="stat-item" v-if="!isNormalUser">
              <p class="stat-num">{{ ongoingTaskCount }}</p>
              <p class="stat-label">进行中任务</p>
            </div>
            <div class="stat-item" v-if="!isNormalUser">
              <p class="stat-num">{{ completedTaskCount }}</p>
              <p class="stat-label">已完成任务</p>
            </div>
            <div class="stat-item">
              <p class="stat-num">{{ unreadNoticeCount }}</p>
              <p class="stat-label">未读消息</p>
            </div>
            <div class="stat-item">
              <p class="stat-num">{{ totalNoticeCount }}</p>
              <p class="stat-label">收到消息</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能标签页 + 内容区域 -->
      <div class="function-content">
        <!-- 标签切换栏：消息标签只要登录就显示 -->
        <div class="tab-nav">
          <button class="tab-btn" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
            <i class="icon-user"></i> 个人信息
          </button>
          <!-- 非普通用户显示任务标签 -->
          <button class="tab-btn" :class="{ active: activeTab === 'tasks' }" @click="activeTab = 'tasks'"
            v-if="!isNormalUser">
            <i class="icon-task"></i> 我的任务
          </button>
          <!-- 只要登录就显示消息标签 -->
          <button class="tab-btn" :class="{ active: activeTab === 'messages' }" @click="activeTab = 'messages'">
            <i class="icon-message"></i> 消息中心
            <span class="msg-badge" v-if="unreadNoticeCount > 0">{{ unreadNoticeCount }}</span>
          </button>
        </div>

        <!-- 个人信息内容（默认显示，所有已登录用户可见） -->
        <div class="tab-content" v-if="activeTab === 'profile'">
          <div class="info-form">
            <div class="form-group">
              <label class="form-label">基本信息</label>
              <div class="form-row">
                <div class="form-item">
                  <span class="item-label">姓名：</span>
                  <span class="item-value">{{ userInfo.nickname || '未设置' }}</span>
                </div>
                <div class="form-item">
                  <span class="item-label">学号：</span>
                  <span class="item-value">{{ userInfo.student_number || '未设置' }}</span>
                </div>
                <div class="form-item">
                  <span class="item-label">院系：</span>
                  <span class="item-value">{{ userInfo.department || '未设置' }}</span>
                </div>
                <div class="form-item">
                  <span class="item-label">年级：</span>
                  <span class="item-value">{{ userInfo.grade || '未设置' }}</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">联系信息</label>
              <div class="form-row">
                <div class="form-item">
                  <span class="item-label">联系电话：</span>
                  <span class="item-value">{{ formatPhone(userInfo.telephone) || '未设置' }}</span>
                </div>
                <div class="form-item">
                  <span class="item-label">性别：</span>
                  <span class="item-value">{{ userInfo.sex || '未设置' }}</span>
                </div>
                <div class="form-item">
                  <span class="item-label">年龄：</span>
                  <span class="item-value">{{ userInfo.age || '未设置' }}</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">个人简介</label>
              <div class="form-row">
                <div class="form-item" style="flex: 100%">
                  <span class="item-label">爱好：</span>
                  <span class="item-value">{{ userInfo.hobbit || '未设置' }}</span>
                </div>
                <div class="form-item" style="flex: 100%">
                  <span class="item-label">简介：</span>
                  <span class="item-value">{{ userInfo.description || '未设置' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 我的任务内容（封装为组件） -->
        <UserTasks
          v-if="activeTab === 'tasks' && !isNormalUser"
          :filtered-tasks="taskInfo"
          :is-finite="isFinite"
          :is-normal-user="isNormalUser"
          :group-name-map="groupNameMap"
          :user-id="userInfo.user_id"
          @create="openTaskDialog"
          @edit="handleEditTask"
          @mark-complete="handleMarkCompleted"
          @delete-task="handleDeleteTask"
        />

        <!-- 消息中心内容（封装为组件） -->
        <UserMessages
          v-if="activeTab === 'messages'"
          :notices="noticeList"
          :unread-count="unreadNoticeCount"
          :read-count="readNoticeCount"
          @mark-all-read="handleMarkAllRead"
          @delete-all-read="handleDeleteAllRead"
          @mark-read="handleMarkNoticeRead"
          @delete="handleDeleteNotice"
        />
      </div>
    </div>

    <!-- 任务提交/编辑弹窗 -->
    <taskSubmit v-model="taskShow" @submit-success="fetchTaskList" v-if="!isNormalUser" :edit-task="editTask">
    </taskSubmit>

    <!-- 确认删除弹窗 -->
    <el-dialog title="确认删除" v-model="deleteDialogShow" width="30%" :before-close="handleDialogClose">
      <span>确定要删除这个任务吗？删除后不可恢复！</span>
      <template #footer>
        <el-button @click="deleteDialogShow = false">取消</el-button>
        <el-button type="danger" @click="confirmDeleteTask">确定删除</el-button>
      </template>
    </el-dialog>

    <!-- 角色操作弹窗 -->
    <el-dialog v-model="roleActionDialog" :title="roleActionTitle" width="40%" :before-close="handleRoleDialogClose">
      <el-form ref="roleFormRef" :model="roleActionForm" :rules="roleActionRules" label-position="top">
        <el-form-item label="申请理由" prop="content">
          <el-input
            v-model="roleActionForm.content"
            type="textarea"
            placeholder="请输入申请理由"
            rows="4"
            maxlength="500"
            show-word-limit
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleActionDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRoleAction">提交申请</el-button>
      </template>
    </el-dialog>

    <Footer />
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import HeaderView from '@/components/HeaderView.vue';
import taskSubmit from '@/components/TaskSubmit.vue';
import Footer from '@/components/FooterView.vue';
import UserTasks from '@/views/task/index.vue';
import UserMessages from '@/views/message/index.vue';
import useUserStore from '@/stores/user';
import useTaskStore from '@/stores/task';
import useNoticeStore from '@/stores/notice';
import useRoleStore from '@/stores/role';

import { useRouter } from 'vue-router'
// Element Plus图标
import { Edit, Camera } from '@element-plus/icons-vue';
import { ElMessage, ElDialog } from 'element-plus';

const userStore = useUserStore()
const taskStore = useTaskStore()
const noticeStore = useNoticeStore()
const roleStore = useRoleStore()
const $router = useRouter()
// 获取用户仓库中的用户信息
const userInfo = userStore.userInfo
const taskInfo = computed(() => taskStore.taskMyInfo || []);
let role_name = userStore.role_name
let isFinite = ref(false)
let taskShow = ref(false)

// 编辑任务相关状态
const editTask = ref(null)
const deleteDialogShow = ref(false)
const currentDeleteTaskId = ref(null)

// 角色操作相关状态
const roleActionDialog = ref(false)
const roleActionForm = ref({
  role_name: '',
  changeType: '',
  content: ''
})
const roleActionTitle = ref('')
const isResignClub = ref(false)
const roleFormRef = ref(null)

// 角色操作表单验证规则
const roleActionRules = ref({
  content: [
    { required: true, message: '请输入申请理由', trigger: 'blur' }
  ]
})

// 核心权限判断
const isLogin = computed(() => {
  return !!userStore.userInfo && Object.keys(userStore.userInfo).length > 0;
});

const isNormalGroup = computed(() => {
  return role_name === '组员';
})
const isNormalUser = computed(() => {
  return role_name === '普通用户';
});

// 非普通用户才显示发布任务按钮
if (!isNormalGroup.value) {
  isFinite.value = true
}

const openTaskDialog = () => {
  editTask.value = null;
  taskShow.value = true;
};

// 标签切换状态
let activeTab = ref('profile');
// 监听普通用户，强制停留在个人信息页
watch(isNormalUser, (isNormal) => {
  if (isNormal) {
    activeTab.value = 'profile';
  }
});

// 左滑操作相关状态（移到子组件处理）


// 消息列表（兼容类数组）
const noticeList = computed(() => {
  const rawList = noticeStore.noticeList || [];
  return Array.isArray(rawList) ? rawList : Array.from(rawList);
});

// 未读消息数量（所有登录用户可见）
const unreadNoticeCount = computed(() => {
  return noticeList.value.filter(notice => !notice.is_read).length;
});

// 已读消息数量（新增：用于删除全部已读按钮禁用判断）
const readNoticeCount = computed(() => {
  return noticeList.value.filter(notice => notice.is_read).length;
});

// 收到消息总数（所有登录用户可见）
const totalNoticeCount = computed(() => {
  return noticeList.value.length;
});


// 一键标记所有未读为已读（适配后端：不传id）
const handleMarkAllRead = async () => {
  if (unreadNoticeCount.value === 0) {
    ElMessage.info('暂无未读消息');
    return;
  }

  try {
    // 后端规则：不传id = 全部已读
    await noticeStore.MarkNotice({});
    // 刷新列表保证数据一致
    await noticeStore.GetNotice();
    ElMessage.success(`成功标记${unreadNoticeCount.value}条消息为已读`);
  } catch (error) {
    ElMessage.error(error.message || '一键已读失败');
  }
};

// 新增：删除全部已读消息（适配后端：不传id）
const handleDeleteAllRead = async () => {
  if (readNoticeCount.value === 0) {
    ElMessage.info('暂无已读消息可删除');
    return;
  }

  try {
    // 后端规则：不传id = 删除全部已读
    await noticeStore.DeleteNotice({});
    // 刷新列表
    await noticeStore.GetNotice();
    ElMessage.success(`成功删除${readNoticeCount.value}条已读消息`);
  } catch (error) {
    ElMessage.error(error.message || '删除全部已读失败');
  }
};

// 标记单条消息为已读（适配后端：传id）
const handleMarkNoticeRead = async (noticeId) => {
  try {
    // 后端规则：传id = 单条已读
    await noticeStore.MarkNotice({ id: noticeId });
    await noticeStore.GetNotice();
    ElMessage.success('消息已标记为已读');
  } catch (error) {
    ElMessage.error(error.message || '标记已读失败');
  }
};

// 删除单条消息（适配后端：传id）
const handleDeleteNotice = async (noticeId) => {
  try {
    // 后端规则：传id = 单条删除
    await noticeStore.DeleteNotice({ id: noticeId });
    await noticeStore.GetNotice();
    ElMessage.success('消息已删除');
  } catch (error) {
    ElMessage.error(error.message || '删除消息失败');
  }
};

// 格式化手机号
const formatPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1****$3')
}

// 打开资料编辑
const openInfoEdit = () => {
  $router.push('/user/profile');
};

// 跳转登录页
const goToLogin = () => {
  $router.push('/login');
};

// 处理头像上传
const handleAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 限制文件大小（2MB）
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!');
    e.target.value = '';
    return;
  }

  // 限制文件类型
  const isImage = /^image\//.test(file.type);
  if (!isImage) {
    ElMessage.error('请选择图片格式的文件！');
    e.target.value = '';
    return;
  }

  try {
    await userStore.uploadUserAvatar(file);
    ElMessage.success('头像上传成功！');
    e.target.value = '';
  } catch (error) {
    console.error('头像上传失败：', error);
    ElMessage.error('头像上传失败，请重试！');
    e.target.value = '';
  }
};

// 获取任务列表
const fetchTaskList = async () => {
  if (isNormalUser.value) return;
  try {
    if (editTask.value) {
      const taskIndex = taskStore.taskMyInfo.value.findIndex(t => t.id === editTask.value.id);
      if (taskIndex !== -1) {
        taskStore.taskMyInfo.value.splice(taskIndex, 1, editTask.value);
        taskStore.$persist();
      }
    } else {
      await taskStore.GetMyTask();
    }
  } catch (error) {
    console.error('更新任务列表失败：', error);
    await taskStore.GetMyTask();
  }
};

// 已完成任务数
const completedTaskCount = computed(() => {
  if (isNormalUser.value) return 0;
  return taskInfo.value.filter(task => task.user_task_status === 'completed').length;
});

// 进行中任务数
const ongoingTaskCount = computed(() => {
  if (isNormalUser.value) return 0;
  return taskInfo.value.filter(task => task.user_task_status === 'ongoing').length;
});

// 任务相关展示逻辑已移入 `UserTasks.vue`

// 任务样式与筛选逻辑已移至 `UserTasks.vue`

// 将 store 的 groupMap 转换为对象传给子组件（便于展示）
const groupNameMap = computed(() => {
  const map = {};
  for (let i = 1; i <= 10; i++) {
    const name = taskStore.groupMap(i);
    if (name) map[i] = name;
  }
  return map;
});

// 标记任务完成/取消
const handleMarkCompleted = async (taskId) => {
  if (isNormalUser.value) return;
  const task = taskInfo.value.find(item => item.id === taskId);
  if (!task) return;

  const taskIdNum = Number(taskId);
  if (isNaN(taskIdNum)) {
    ElMessage.error('任务ID无效');
    return;
  }

  const targetStatus = task.user_task_status === 'completed' ? 'ongoing' : 'completed';

  try {
    await taskStore.updateTaskStatus(taskIdNum, { status: targetStatus });
    task.user_task_status = targetStatus;
    ElMessage.success(`任务状态已更新为${targetStatus === 'completed' ? '已完成' : '进行中'}`);
  } catch (error) {
    console.error(`更新任务${taskIdNum}状态失败：`, error);
    ElMessage.error('状态更新失败，请重试');
  }
};

// 编辑任务
const handleEditTask = async (task) => {
  try {
    editTask.value = task;
    taskShow.value = true;
  } catch (error) {
    console.error('获取任务详情失败：', error);
    ElMessage.error('编辑任务失败，请重试');
  }
};

// 打开删除任务弹窗
const handleDeleteTask = (taskId) => {
  currentDeleteTaskId.value = taskId;
  deleteDialogShow.value = true;
};

// 确认删除任务
const confirmDeleteTask = async () => {
  if (!currentDeleteTaskId.value) return;

  try {
    await taskStore.deleteTask(currentDeleteTaskId.value);
    ElMessage.success('任务删除成功');
    const taskIndex = taskInfo.value.findIndex(task => task.id === currentDeleteTaskId.value);
    if (taskIndex !== -1) {
      taskInfo.value.splice(taskIndex, 1);
    }
    deleteDialogShow.value = false;
  } catch (error) {
    console.error('删除任务失败：', error);
    ElMessage.error('任务删除失败，请重试');
  }
};

// 关闭删除弹窗
const handleDialogClose = () => {
  currentDeleteTaskId.value = null;
  deleteDialogShow.value = false;
};

// 角色操作相关方法
// 处理角色变更操作（申请晋升、卸任）
const handleRoleAction = (targetRole, changeType, title) => {
  roleActionTitle.value = title;
  roleActionForm.value = {
    role_name: targetRole,
    changeType: changeType,
    content: ''
  };
  isResignClub.value = false;
  roleActionDialog.value = true;
};

// 处理退出社团操作
const handleResignClub = (changeType) => {
  roleActionTitle.value = '退出社团申请';
  roleActionForm.value = {
    changeType: changeType,
    content: ''
  };
  isResignClub.value = true;
  roleActionDialog.value = true;
};

// 提交角色操作申请
const submitRoleAction = async () => {
  if (!roleFormRef.value) return;
  
  try {
    await roleFormRef.value.validate();
    
    // 添加调试信息
    console.log('userInfo:', userInfo);
    
    // 确保 userId 是一个有效的值
    let userId = null;
    // 优先使用 user_id 字段，这是后端期望的真正的用户ID
    if (userInfo.user_id) {
      userId = userInfo.user_id;
    } else if (userInfo.user?.id) {
      userId = userInfo.user.id;
    } else if (userInfo.id) {
      userId = userInfo.id;
    } else {
      throw new Error('无法获取用户ID');
    }
    
    console.log('userId:', userId);
    console.log('roleActionForm:', roleActionForm.value);
    
    if (isResignClub.value) {
      // 调用退出社团方法
      console.log('调用ResignClub方法');
      await roleStore.ResignClub(userId, {
        content: roleActionForm.value.content,
        changeType: roleActionForm.value.changeType,
      });
    } else {
      console.log(1111);
      
      // 调用更新用户主角色方法
      console.log('调用UpdateUserMainRole方法');
      await roleStore.UpdateUserMainRole(userId, {
        role_name: roleActionForm.value.role_name,
        changeType: roleActionForm.value.changeType,
        content: roleActionForm.value.content
      });
    }
    
    ElMessage.success('申请已提交，等待审批');
    roleActionDialog.value = false;
    resetRoleActionForm();
  } catch (error) {
    console.error('角色操作申请失败：', error);
    console.log(error);
    
    ElMessage.error(error.message || '申请提交失败，请重试');
  }
};

// 重置角色操作表单
const resetRoleActionForm = () => {
  roleActionForm.value = {
    role_name: '',
    changeType: '',
    content: ''
  };
  if (roleFormRef.value) {
    roleFormRef.value.resetFields();
  }
};

// 关闭角色操作对话框
const handleRoleDialogClose = () => {
  roleActionDialog.value = false;
  resetRoleActionForm();
};

// 监听用户信息变化
watch(
  () => userInfo,
  () => {
    // 用户信息变化处理（保留观察者以便未来需要）
  },
  { deep: true }
);

// 页面挂载
onMounted(() => {
  if (!isLogin.value) return;
  // 所有登录用户加载消息
  noticeStore.GetNotice();

  // 非普通用户加载任务
  if (!isNormalUser.value) {
    fetchTaskList();
    const refreshInterval = setInterval(async () => {
      await taskStore.refreshAndSyncTaskStatus();
    }, 600000);

    onUnmounted(() => {
      clearInterval(refreshInterval);
    });
  }
});
</script>

<style scoped lang="scss">
// 全局基础样式
.user-center {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: #f8f9fa;
  min-height: 100vh;
  color: #333;
  font-size: 14px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
}

// 未登录提示样式
.login-prompt {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;

  .prompt-container {
    text-align: center;
    background-color: #fff;
    padding: 2rem 3rem;
    border-radius: 12px;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);

    i.icon-login {
      font-size: 2.5rem;
      color: #42b983;
      margin-bottom: 1.2rem;
    }

    h2 {
      font-size: 1.2rem;
      color: #2c3e50;
      margin: 0 0 0.6rem;
    }

    p {
      font-size: 0.9rem;
      color: #666;
      margin: 0 0 1.5rem;
    }

    .el-button {
      padding: 0.5rem 1.5rem;
      font-size: 0.9rem;
    }
  }
}

// 主容器
.center-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
}

// 个人信息卡片
.profile-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  .profile-header {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: center;
    justify-content: space-between;

    .profile-base {
      display: flex;
      align-items: center;
      gap: 1rem;

      .avatar-box {
        position: relative;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid #f0f7f3;
        cursor: pointer;

        .user-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: all 0.3s ease;
        }

        .edit-avatar-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: rgba(66, 185, 131, 0.9);
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 2;

          &:hover {
            background-color: #359469;
            transform: scale(1.1);
          }
        }

        .avatar-upload-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 1;
        }

        &:hover .user-avatar {
          filter: brightness(0.9);
        }
      }

      .base-info {
        .user-name {
          font-size: 1.2rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 0.2rem;
        }

        .user-role {
          font-size: 0.85rem;
          color: #666;
          margin: 0 0 0.8rem;
        }

        .info-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;

          .edit-info-btn {
            padding: 0.3rem 0.8rem;
            border: none;
            border-radius: 20px;
            font-size: 0.85rem;
            cursor: pointer;
            align-items: center;
            transition: all 0.3s ease;
            background-color: #f0f7f3;
            color: #42b983;
          }

          .edit-info-btn:hover {
            opacity: 0.9;
            transform: translateY(-2px);
          }
        }

        // 角色操作按钮组
        .role-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 0.6rem;
          
          .el-button {
            padding: 0.3rem 0.8rem;
            font-size: 0.8rem;
            border-radius: 20px;
          }
        }
      }
    }

    // 数据统计
    .profile-stats {
      display: flex;
      gap: 1.2rem;
      flex-wrap: wrap;

      .stat-item {
        text-align: center;
        flex: 1;
        min-width: 80px;

        .stat-num {
          font-size: 1.1rem;
          font-weight: 700;
          color: #42b983;
          margin: 0 0 0.1rem;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #666;
          margin: 0;
        }
      }
    }
  }
}

// 功能标签栏
.function-content {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  .tab-nav {
    display: flex;
    border-bottom: 1px solid #f5f5f5;

    .tab-btn {
      flex: 1;
      padding: 1rem 0;
      background: none;
      border: none;
      font-size: 0.9rem;
      color: #666;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      transition: all 0.3s ease;

      &.active {
        color: #42b983;
        border-bottom: 2px solid #42b983;
        font-weight: 500;
      }

      &:hover {
        color: #42b983;
        background-color: #fafafa;
      }

      i {
        font-size: 1rem;
      }

      .msg-badge {
        display: inline-block;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #ef4444;
        color: #fff;
        font-size: 0.65rem;
        line-height: 16px;
        text-align: center;
        margin-left: 0.2rem;
      }
    }
  }

  .tab-content {
    padding: 1rem;

    @media (max-width: 768px) {
      padding: 0.5rem;
    }
  }
}

// 个人信息表单
.info-form {
  .form-group {
    margin-bottom: 1.5rem;

    .form-label {
      display: block;
      font-size: 1rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.8rem;
      padding-left: 0.3rem;
      border-left: 3px solid #42b983;
    }

    .form-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1.2rem;
    }

    .form-item {
      flex: 1;
      min-width: 180px;
      padding: 0.6rem 0.8rem;
      background-color: #fafafa;
      border-radius: 8px;
      display: flex;
      align-items: center;

      .item-label {
        font-size: 0.85rem;
        color: #666;
        width: 60px;
      }

      .item-value {
        font-size: 0.9rem;
        color: #333;
        flex: 1;
      }
    }
  }
}


// 任务操作按钮样式
.task-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  align-items: center;

  .el-button {
    padding: 0.2rem 0.6rem;
    font-size: 0.8rem;
  }

  .edit-task-btn {
    background-color: #4299e1;
    border-color: #4299e1;

    &:hover {
      background-color: #3182ce;
      border-color: #3182ce;
    }
  }

  .delete-task-btn {
    background-color: #ef4444;
    border-color: #ef4444;

    &:hover {
      background-color: #dc2626;
      border-color: #dc2626;
    }
  }
}

// 任务发布者信息样式
.meta-item i.icon-publisher {
  color: #4299e1;
}

// 响应式适配
@media (max-width: 992px) {
  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-stats {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .profile-card {
    padding: 1rem 0.8rem;
  }

  .profile-base {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .info-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .tab-btn {
    font-size: 0.85rem;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.8rem 0;
  }

  .form-row {
    flex-direction: column;
    gap: 0.8rem;
  }

  .form-item {
    min-width: auto;
  }

  .task-meta {
    flex-direction: column;
    gap: 0.4rem;
  }

  .task-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .prompt-container {
    padding: 1.5rem 1rem;
    width: 95%;
    max-width: 300px;
  }

  .swipe-btn {
    padding: 0 1rem;
    font-size: 0.75rem;
    width: 70px;
  }

  .msg-item {
    padding: 0.6rem;
    gap: 0.6rem;
  }

  .msg-avatar {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 576px) {
  .profile-stats {
    gap: 0.8rem;
  }

  .stat-item {
    flex: 1;
    min-width: 70px;
  }

  

  .task-actions {
    flex-wrap: wrap;
  }

  .base-info {
    .user-name {
      text-align: center;
    }
  }

  .el-button {
    flex: 1;
    min-width: 80px;
    justify-content: center;
  }

  .msg-swipe-item {
    margin-bottom: 0.4rem;
  }

  .msg-header {
    margin-bottom: 1rem;
  }

  .msg-empty {
    padding: 1.5rem 0;
  }
}

// 图标基础样式
[class^="icon-"] {
  display: inline-block;
  width: 1em;
  height: 1em;
  stroke-width: 0;
  stroke: currentColor;
  fill: currentColor;
  vertical-align: middle;
}

// 禁用按钮样式
:deep(.el-button:disabled) {
  background-color: #e5e7eb !important;
  border-color: #e5e7eb !important;
  color: #9ca3af !important;
  cursor: not-allowed;
}
</style>