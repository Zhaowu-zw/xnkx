<template>
  <!-- 使用PageContainer组件作为页面容器 -->
  <PageContainer title="动态活动管理">
    <!-- 操作按钮插槽：新增按钮 -->
    <template #actions>
      <el-button type="primary" :icon="Plus" @click="openAddDrawer">
        新增动态
      </el-button>
    </template>

    <!-- 页面主体内容 -->
    <div class="activity-content business-management-animation">
      <!-- 1. 搜索筛选区域 -->
      <el-card shadow="hover" class="search-card business-card-animation">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="动态标题">
            <el-input v-model="searchForm.keyword" placeholder="请输入标题关键词" clearable style="width: 200px" @input="getActivityList" />
          </el-form-item>
          <el-form-item label="所属小组">
            <el-select v-model="searchForm.group_id" placeholder="请选择小组" clearable style="width: 180px"
              v-if="groupStore.groupInfo">
              <el-option v-for="group in groupStore.groupInfo" :key="group.id" :label="group.group_name"
                :value="group.id" />
            </el-select>
            <el-select v-else placeholder="加载中..." disabled style="width: 180px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getActivityList">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 2. 动态列表表格 -->
      <el-card shadow="hover" class="table-card business-card-animation" :style="{ animationDelay: '0.15s' }">
        <el-table v-loading="activityStore.loading || !groupStore.isGroupInfoFetched" :data="activityStore.activityList"
          border stripe style="width: 100%" empty-text="暂无动态数据" :key="tableKey">
          <!-- 前端排序序号（删除后自动补位） -->
          <el-table-column label="序号" width="80" align="center">
            <template #default="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="title" label="动态标题" min-width="200" />
          <el-table-column prop="brief" label="动态简介" min-width="200" show-overflow-tooltip />
          <el-table-column label="所属小组" min-width="120" align="center">
            <template #default="scope">
              {{ getGroupNameById(scope.row.group_id) || '' }}
            </template>
          </el-table-column>
          <el-table-column label="发布时间" min-width="180" align="center">
            <template #default="scope">
              {{ formatTime(scope.row.activity_time) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center">
            <template #default="scope">
              <el-button size="small" :icon="Edit" type="primary" @click="openEditDrawer(scope.row)">
                编辑
              </el-button>
              <el-button size="small" :icon="Delete" type="danger" @click="handleDelete(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页组件 -->
        <div class="pagination-container">
          <el-pagination v-model:current-page="activityStore.pagination.page"
            v-model:page-size="activityStore.pagination.pageSize" :page-sizes="[10, 20, 50]"
            :total="activityStore.pagination.total" layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange" @current-change="handleCurrentPageChange" />
        </div>
      </el-card>
    </div>

    <!-- 3. 新增/编辑动态抽屉（替换原弹窗） -->
    <el-drawer v-model="drawerVisible" :title="isEdit ? '编辑动态' : '新增动态'" direction="rtl" size="800px" destroy-on-close>
      <div class="drawer-inner-container">
        <el-form ref="activityFormRef" :model="activityForm" :rules="formRules" label-width="100px"
          label-position="left" class="activity-form">
          <el-form-item label="动态标题" prop="title">
            <el-input v-model="activityForm.title" placeholder="请输入动态标题" maxlength="50" show-word-limit />
          </el-form-item>
          <el-form-item label="动态简介" prop="brief">
            <el-input v-model="activityForm.brief" placeholder="请输入动态简介" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="详细描述" prop="description">
            <el-input v-model="activityForm.description" type="textarea" placeholder="请输入动态详细描述" maxlength="500"
              show-word-limit rows="4" />
          </el-form-item>
          <el-form-item label="所属小组" prop="group_id">
            <el-select v-model="activityForm.group_id" placeholder="请选择所属小组" style="width: 100%"
              v-if="groupStore.groupInfo">
              <el-option v-for="group in groupStore.groupInfo" :key="group.id" :label="group.group_name"
                :value="group.id" />
            </el-select>
            <el-select v-else placeholder="加载中..." disabled style="width: 100%" />
          </el-form-item>
          <el-form-item label="发布时间" prop="activity_time">
            <el-date-picker v-model="activityForm.activity_time" type="datetime" placeholder="请选择发布时间"
              style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item label="动态图片">
            <div class="upload-container">
              <el-upload class="avatar-uploader" action="#" :auto-upload="false" :on-change="handleFileChange"
                :show-file-list="false" accept="image/jpg,image/jpeg,image/png,image/gif">
                <el-button :icon="Upload" type="primary">选择图片</el-button>
              </el-upload>
              <!-- 核心修改：预览直接使用submitImageUrls数组 -->
              <div class="upload-preview" v-if="submitImageUrls.length > 0">
                <div class="preview-item" v-for="(url, index) in submitImageUrls" :key="`${url}-${index}`">
                  <el-image :src="url" fit="cover" class="preview-img" :error="() => handleImageError(index)"
                    empty-text="图片加载失败" />
                  <el-icon class="delete-icon" @click="removeImage(index)">
                    <Close />
                  </el-icon>
                </div>
              </div>
              <div class="tips">提示：可多次上传图片，最多支持5张</div>
            </div>
          </el-form-item>
          <el-form-item label="创建人" disabled>
            <el-input v-model="activityForm.creator_nickname" disabled placeholder="系统自动填充" />
          </el-form-item>
        </el-form>
      </div>
      <div class="drawer-footer">
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :disabled="!groupStore.groupInfo">
          {{ isEdit ? '保存修改' : '创建动态' }}
        </el-button>
      </div>
    </el-drawer>
  </PageContainer>
</template>

<script setup>
import { ref, reactive, onMounted,onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Close, Upload } from '@element-plus/icons-vue'
import PageContainer from '@/components/PageContainer.vue'
import useActivityStore from '@/stores/activity'
import useGroupStore from '@/stores/group'

// ========== 核心实例与状态 ==========
const activityStore = useActivityStore()
const groupStore = useGroupStore()

const drawerVisible = ref(false)
const isEdit = ref(false)
const currentActivityId = ref('')
const activityFormRef = ref(null)
const tableKey = ref(0)

// 新增：标记组件是否活跃
const isMounted = ref(false);

// 唯一图片数组：预览+提交都基于这个数组
const submitImageUrls = ref([])

// ========== 搜索表单 ==========
const searchForm = reactive({
  keyword: '',
  group_id: ''
})

// ========== 新增/编辑表单（移除原image_url字段） ==========
const activityForm = reactive({
  title: '',
  brief: '',
  description: '',
  group_id: '',
  activity_time: '',
  creator_nickname: ''
})

// ========== 表单验证规则 ==========
const formRules = reactive({
  title: [
    { required: true, message: '请输入动态标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度需在2-50个字符之间', trigger: 'blur' }
  ],
  brief: [
    { required: true, message: '请输入动态简介', trigger: 'blur' },
    { min: 2, max: 100, message: '简介长度需在2-100个字符之间', trigger: 'blur' }
  ],
  group_id: [
    { required: false, message: '请选择所属小组', trigger: 'change' }
  ],
  activity_time: [
    { required: true, message: '请选择发布时间', trigger: 'change' }
  ],
  description: [
    { required: false, max: 500, message: '详细描述最多500个字符', trigger: 'blur' }
  ]
})

// ========== 工具方法 ==========
const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  // 判断是否为有效日期
  if (isNaN(date.getTime())) {
    return '无效时间';
  }
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Shanghai'
  }).replace(/\//g, '-');
};


const getGroupNameById = (groupId) => {
  if (!groupId || !groupStore.groupInfo) return '';
  const targetGroup = groupStore.groupInfo.find(item => item.id === groupId);
  return targetGroup?.group_name || '';
};

// 图片加载失败处理（直接操作submitImageUrls）
const handleImageError = (index) => {
  ElMessage.warning(`第${index + 1}张图片加载失败，已移除`);
  removeImage(index);
};

// ========== 页面初始化 ==========

onMounted(async () => {
  isMounted.value = true; // 组件挂载后标记为活跃
  try {
    await groupStore.GetGroupInfo();
    // 仅在组件活跃时执行后续操作
    if (isMounted.value) {
      await getActivityList();
    }
  } catch (error) {
    if (isMounted.value) { // 仅在组件活跃时提示错误
      ElMessage.error(`初始化失败：${error.message}`);
    }
  }
});

// 组件卸载时标记为非活跃
onUnmounted(() => {
  isMounted.value = false;
});

// ========== 列表相关方法 ==========
const getActivityList = async () => {
  try {
    await activityStore.GetActivityInfo({
      keyword: searchForm.keyword,
      group_id: searchForm.group_id,
      page: activityStore.pagination.page,
      pageSize: activityStore.pagination.pageSize
    });
    tableKey.value += 1;
  } catch (error) {
    ElMessage.error(`获取列表失败：${error.message}`);
  }
};

const resetSearch = () => {
  searchForm.keyword = '';
  searchForm.group_id = '';
  activityStore.pagination.page = 1;
  getActivityList();
};

const handlePageSizeChange = () => {
  getActivityList();
};

const handleCurrentPageChange = () => {
  getActivityList();
};

// ========== 抽屉相关方法 ==========
const openAddDrawer = () => {
  if (!groupStore.groupInfo) {
    ElMessage.warning('小组列表加载中，请稍后再试');
    return;
  }
  isEdit.value = false;
  resetForm();
  drawerVisible.value = true;
  // 新增时自动填充当前时间
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  activityForm.activity_time = now;
};

// 编辑回显：直接赋值给submitImageUrls
const openEditDrawer = (row) => {
  if (!groupStore.groupInfo) {
    ElMessage.warning('小组列表加载中，请稍后再试');
    return;
  }
  isEdit.value = true;
  currentActivityId.value = row.id;

  // 处理数据库返回的图片地址（字符串转数组）
  const dbImageUrls = row.image_url
    ? (Array.isArray(row.image_url) ? row.image_url : row.image_url.split(',').filter(Boolean))
    : [];

  // 唯一数组赋值：预览+提交都用这个
  submitImageUrls.value = [...dbImageUrls];

  // 回显基础字段
  activityForm.title = row.title;
  activityForm.brief = row.brief || '';
  activityForm.description = row.description || '';
  activityForm.group_id = row.group_id;
  activityForm.activity_time = row.activity_time
    ? new Date(row.activity_time).toISOString().slice(0, 19).replace('T', ' ')
    : '';
  activityForm.creator_nickname = row.creator_nickname || '';

  drawerVisible.value = true;
};

// 重置表单：清空唯一图片数组
const resetForm = () => {
  // 基础字段重置
  activityForm.title = '';
  activityForm.brief = '';
  activityForm.description = '';
  activityForm.group_id = '';
  activityForm.activity_time = '';
  activityForm.creator_nickname = '';
  // 唯一图片数组清空
  submitImageUrls.value = [];
  currentActivityId.value = '';
  activityFormRef.value?.clearValidate();
};

// ========== 图片上传/删除相关 ==========
// 上传图片：直接push到submitImageUrls
const handleFileChange = async (file) => {
  if (submitImageUrls.value.length >= 5) {
    ElMessage.warning('最多只能上传5张图片');
    return;
  }
  try {
    if (!file.raw || !(file.raw instanceof File)) {
      throw new Error('请选择有效的图片文件');
    }
    // console.log('准备上传的文件：', file.raw);
    // 调用上传接口，获取新图片地址
    const res = await activityStore.UploadActivityImage(file.raw);
    if (!res || !res.data || !res.data.imageUrls) {
      throw new Error('图片上传失败，未获取到图片URL');
    }
    console.log('上传返回数据：', res);
    // 补全绝对路径（确保预览正常）
    const newImageUrl = res.data.imageUrls.startsWith('http') ? res.data.imageUrls : `http://localhost:3000${res.data.imageUrls}`;

    // 直接操作唯一数组
    submitImageUrls.value.push(newImageUrl);
    // 强制响应式更新
    submitImageUrls.value = [...submitImageUrls.value];

    ElMessage.success('图片上传成功');
  } catch (error) {
    ElMessage.error(`图片上传失败：${error.message}`);
    console.error('上传详情：', error);
  }
};

// 删除图片：直接操作submitImageUrls
const removeImage = (index) => {
  submitImageUrls.value.splice(index, 1);
  // 强制响应式更新
  submitImageUrls.value = [...submitImageUrls.value];
  ElMessage.success('图片已移除');
};

// ========== 提交表单 ==========
const submitForm = async () => {
  if (!activityFormRef.value || !groupStore.groupInfo) return;
  try {
    // 表单验证
    await activityFormRef.value.validate();
    let submitData = {};
    // 构建提交数据：直接使用submitImageUrls
    if (!activityForm.group_id ) {
      submitData = {
        title: activityForm.title,
        brief: activityForm.brief,
        description: activityForm.description,
        activity_time: activityForm.activity_time,
        image_url: submitImageUrls.value, // 唯一数组提交给后端
      };
    } else {
      submitData = {
        title: activityForm.title,
        brief: activityForm.brief,
        description: activityForm.description,
        group_id: activityForm.group_id,
        activity_time: activityForm.activity_time,
        image_url: submitImageUrls.value, // 唯一数组提交给后端
      }
    }
 

    // 调试：打印提交的图片数组
    // console.log('最终提交的图片地址数组：', submitData.image_url);

    if (isEdit.value) {
      await activityStore.UpdateActivity(currentActivityId.value, submitData);
      ElMessage.success('动态修改成功！');
    } else {
      await activityStore.CreateActivity(submitData);
      // console.log('创建动态返回数据：', submitData);
      ElMessage.success('动态创建成功！');
    }
// console.log('提交数据：', submitData);
    drawerVisible.value = false;
    getActivityList();
    // console.log('提交成功');
  } catch (error) {
    console.error('提交失败：', error);
    if (error.name !== 'ValidationError') {
      ElMessage.error(`${isEdit.value ? '修改' : '创建'}动态失败：${error.message}`);
    }
  }
};

// ========== 删除动态 ==========
const handleDelete = async (activityId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该动态吗？删除后数据不可恢复！',
      '删除确认',
      { type: 'warning' }
    );
    await activityStore.DeleteActivity(activityId);
    ElMessage.success('动态删除成功！');
    getActivityList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`删除动态失败：${error.message}`);
    }
  }
};
</script>

<style scoped lang="scss">
// 样式无修改，保持原有逻辑
$mobile-break: 480px;
$tablet-break: 768px;
$desktop-break: 1200px;

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

.activity-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card {
  padding: 16px;
  background: #fff;
  border-radius: var(--card-radius, 8px);
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.table-card {
  background: #fff;
  border-radius: var(--card-radius, 8px);
  padding: 0;

  :deep(.el-table) {
    --el-table-header-text-color: #333;
    --el-table-row-hover-bg-color: #f8f9fa;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  margin-top: 8px;
}

.drawer-inner-container {
  width: 100%;
  max-width: 750px;
  margin: 0 auto;
  overflow-x: hidden;
  padding: 0 20px;
}

.activity-form {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 200px);
  // overflow-y: auto;
  // overflow-x: hidden;
  width: 100%;
}

// 主色调定义
$primary-color: #409eff;
$success-color: #67c23a;
$warning-color: #e6a23c;
$danger-color: #f56c6c;
$info-color: #909399;

// 图片上传容器样式优化
.upload-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
  transition: all 0.3s ease;

  &:hover {
    border-color: $primary-color;
    background: #ecf5ff;
  }

  .upload-preview {
    display: flex;
    gap: 16px;
    margin-top: 8px;
    width: 100%;
    flex-wrap: wrap;
  }

  .preview-item {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .preview-img {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      border: none;
    }

    .delete-icon {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      cursor: pointer;
      color: #ff4d4f;
      font-size: 18px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 10;
      transition: all 0.3s ease;

      &:hover {
        background: #fff;
        transform: scale(1.1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }

  .tips {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    text-align: center;
  }

  :deep(.el-button) {
    border-radius: 6px;
    font-weight: 500;
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
  margin-top: 16px;
  width: 100%;
  max-width: 750px;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: $tablet-break) {
  .activity-content {
    gap: 12px;
  }

  .search-form {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagination-container {
    padding: 12px 8px;
  }

  .drawer-inner-container {
    max-width: 100%;
    padding: 0 10px;
  }

  .upload-preview {
    grid-template-columns: repeat(2, 1fr) !important;
  }

  .preview-item {
    max-width: 120px !important;
  }

  .drawer-footer {
    padding: 12px 10px;
    max-width: 100%;
  }
}

@media (max-width: $mobile-break) {
  .activity-content {
    gap: 8px;
  }

  .table-card :deep(.el-table) {
    font-size: 12px;
  }

  .preview-item {
    max-width: 100px !important;
  }

  .preview-img {
    height: 100px !important;
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
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>