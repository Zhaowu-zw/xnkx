<template>
  <!-- 使用PageContainer组件作为页面容器 -->
  <PageContainer title="社团成就管理">
    <!-- 操作按钮插槽：新增按钮 -->
    <template #actions>
      <el-button type="primary" :icon="Plus" @click="openAddDrawer">
        新增成就
      </el-button>
    </template>

    <!-- 页面主体内容 -->
    <div class="achievement-content business-management-animation">
      <!-- 1. 搜索筛选区域 -->
      <el-card shadow="hover" class="search-card business-card-animation">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="竞赛名称">
            <el-input v-model="searchForm.keyword" placeholder="请输入竞赛名称" clearable style="width: 300px" @input="getAchievementList" />
          </el-form-item>
          <el-form-item label="年份">
            <el-select v-model="searchForm.year" placeholder="请选择年份" clearable style="width: 150px">
              <el-option v-for="year in getYearOptions" :key="year" :label="year + '年'" :value="year" />
            </el-select>
          </el-form-item>
          <el-form-item label="级别">
            <el-select v-model="searchForm.level" placeholder="请选择级别" clearable style="width: 150px">
              <el-option label="国际级" value="国际" />
              <el-option label="国家级" value="国家级" />
              <el-option label="省级" value="省级" />
              <el-option label="学院级" value="学院级" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="searchForm.participation_type" placeholder="请选择类型" clearable style="width: 150px">
              <el-option label="个人" value="个人" />
              <el-option label="团队" value="团队" />
              <el-option label="个人及团队" value="个人及团队" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getAchievementList">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 2. 成就列表表格 -->
      <el-card shadow="hover" class="table-card business-card-animation" :style="{ animationDelay: '0.15s' }">
        <el-table v-loading="clubachievementStore.loading" :data="clubachievementStore.clubachievementInfo.list" 
          border stripe style="width: 100%" empty-text="暂无成就数据" :key="tableKey" @sort-change="handleSortChange">
          <!-- 前端排序序号（删除后自动补位） -->
          <el-table-column label="序号" width="80" align="center">
            <template #default="scope">
              {{ (pagination.page - 1) * pagination.pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="year" label="年份" width="100" align="center" sortable />
          <el-table-column prop="competition_name" label="竞赛名称" min-width="280" show-overflow-tooltip />
          <el-table-column prop="participants" label="参与者" min-width="200" show-overflow-tooltip />
          <el-table-column prop="participation_type" label="参与类型" width="120" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.participation_type === '团队' ? 'success' : 'primary'" size="small">
                {{ scope.row.participation_type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="级别" width="120" align="center">
            <template #default="scope">
              <el-tag :type="getLevelType(scope.row.level)" size="small">
                {{ scope.row.level }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="成就图片" width="120" align="center">
            <template #default="scope">
              <el-image v-if="scope.row.image_url" :src="scope.row.image_url" :preview-src-list="[scope.row.image_url]" 
                fit="cover" style="width: 80px; height: 80px; border-radius: 4px" />
              <span v-else class="no-image">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" min-width="180" align="center" sortable>
            <template #default="scope">
              {{ formatTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center" fixed="right">
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
          <el-pagination v-model:current-page="pagination.page" 
            v-model:page-size="pagination.pageSize" :page-sizes="[10, 20, 50]"
            :total="clubachievementStore.clubachievementInfo.pagination.total" layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange" @current-change="handleCurrentPageChange" />
        </div>
      </el-card>
    </div>

    <!-- 3. 新增/编辑成就抽屉 -->
    <el-drawer v-model="drawerVisible" :title="isEdit ? '编辑成就' : '新增成就'" direction="rtl" size="800px" destroy-on-close>
      <div class="drawer-inner-container">
        <el-form ref="achievementFormRef" :model="achievementForm" :rules="formRules" label-width="120px"
          label-position="top" class="achievement-form">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="年份" prop="year">
                <el-select v-model="achievementForm.year" placeholder="请选择年份" style="width: 100%">
                  <el-option v-for="year in getYearOptions" :key="year" :label="year + '年'" :value="year" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="参与类型" prop="participation_type">
                <el-select v-model="achievementForm.participation_type" placeholder="请选择参与类型" style="width: 100%">
                  <el-option label="团队" value="团队" />
                  <el-option label="个人" value="个人" />
                  <el-option label="个人及团队" value="个人及团队" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="级别" prop="level">
                <el-select v-model="achievementForm.level" placeholder="请选择级别" style="width: 100%">
                  <el-option label="国际级" value="国际" />
                  <el-option label="国家级" value="国家级" />
                  <el-option label="省级" value="省级" />
                  <el-option label="学院级" value="学院级" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="参与者" prop="participants">
                <el-input v-model="achievementForm.participants" placeholder="请输入参与者" maxlength="100" show-word-limit />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="竞赛名称" prop="competition_name">
            <el-input v-model="achievementForm.competition_name" placeholder="请输入竞赛名称" maxlength="200" show-word-limit />
          </el-form-item>
          
          <el-form-item label="描述" prop="description">
            <el-input v-model="achievementForm.description" type="textarea" placeholder="请输入描述" maxlength="500" show-word-limit rows="4" />
          </el-form-item>
          
          <el-form-item label="成就图片">
            <div class="upload-container">
              <el-upload class="avatar-uploader" action="#" :auto-upload="false" :on-change="handleFileChange"
                :show-file-list="false" accept="image/jpg,image/jpeg,image/png,image/gif">
                <el-button :icon="Upload" type="primary">选择图片</el-button>
              </el-upload>
              <!-- 预览区域 -->
              <div class="upload-preview" v-if="submitImageUrl">
                <div class="preview-item">
                  <el-image :src="submitImageUrl" fit="cover" class="preview-img" :error="handleImageError"
                    empty-text="图片加载失败" />
                  <el-icon class="delete-icon" @click="removeImage">
                    <Close />
                  </el-icon>
                </div>
              </div>
              <div class="tips">提示：支持上传JPG、JPEG、PNG、GIF格式图片，大小不超过5MB，只能上传一张</div>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <div class="drawer-footer">
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">
          {{ isEdit ? '保存修改' : '创建成就' }}
        </el-button>
      </div>
    </el-drawer>
  </PageContainer>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Close, Upload } from '@element-plus/icons-vue'
import PageContainer from '@/components/PageContainer.vue'
import useClubachievementStore from '@/stores/clubachievement'

// ========== 核心实例与状态 ==========
const clubachievementStore = useClubachievementStore()

const drawerVisible = ref(false)
const isEdit = ref(false)
const currentAchievementId = ref('')
const achievementFormRef = ref(null)
const tableKey = ref(0)

// 新增：标记组件是否活跃
const isMounted = ref(false);

// 图片地址，只支持单张图片
const submitImageUrl = ref('')

// ========== 分页配置 ==========
const pagination = reactive({
  page: 1,
  pageSize: 10
})

// ========== 搜索表单 ==========
const searchForm = reactive({
  keyword: '',
  year: '',
  level: '',
  participation_type: ''
})

// ========== 新增/编辑表单 ==========
const achievementForm = reactive({
  year: new Date().getFullYear(),
  participants: '',
  competition_name: '',
  participation_type: '团队',
  level: '省级',
  description: '',
  image_url: ''
})

// ========== 表单验证规则 ==========
const formRules = reactive({
  year: [
    { required: true, message: '请选择年份', trigger: 'change' }
  ],
  competition_name: [
    { required: true, message: '请输入竞赛名称', trigger: 'blur' },
    { min: 2, max: 200, message: '竞赛名称长度需在2-200个字符之间', trigger: 'blur' }
  ],
  participants: [
    { required: true, message: '请输入参与者', trigger: 'blur' },
    { min: 1, max: 100, message: '参与者长度需在1-100个字符之间', trigger: 'blur' }
  ],
  participation_type: [
    { required: true, message: '请选择参与类型', trigger: 'change' }
  ],
  level: [
    { required: true, message: '请选择级别', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' },
    { min: 1, max: 500, message: '描述长度需在1-500个字符之间', trigger: 'blur' }
  ]
})

// ========== 计算属性 ==========
// 生成年份选项（最近10年）
const getYearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 10; i--) {
    years.push(i);
  }
  return years;
});

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

// 根据级别获取标签类型
const getLevelType = (level) => {
  const typeMap = {
    '国际': 'danger',
    '国家级': 'warning',
    '省级': 'primary',
    '学院级': 'success'
  };
  return typeMap[level] || 'info';
};

// 图片加载失败处理
const handleImageError = () => {
  ElMessage.warning('图片加载失败，已移除');
  
  removeImage();
};

// ========== 页面初始化 ==========
onMounted(async () => {
  isMounted.value = true; // 组件挂载后标记为活跃
  try {
    await getAchievementList();
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
const getAchievementList = async () => {
  try {
    // 只传递有值的搜索条件，无值的条件不传递，这样会返回所有数据
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    
    // 只添加有值的搜索条件
    Object.keys(searchForm).forEach(key => {
      if (searchForm[key]) {
        params[key] = searchForm[key];
      }
    });
    
    await clubachievementStore.GetClubAchievement(params);
    tableKey.value += 1;
  } catch (error) {
    ElMessage.error(`获取列表失败：${error.message}`);
  }
};

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = '';
  });
  pagination.page = 1;
  getAchievementList();
};

const handlePageSizeChange = () => {
  pagination.page = 1;
  getAchievementList();
};

const handleCurrentPageChange = () => {
  getAchievementList();
};

// 排序处理
const handleSortChange = (sort) => {
  // 这里可以添加排序逻辑，根据需要调用API
  console.log('排序参数:', sort);
};

// ========== 抽屉相关方法 ==========
const openAddDrawer = () => {
  isEdit.value = false;
  resetForm();
  drawerVisible.value = true;
};

// 编辑回显
const openEditDrawer = (row) => {
  isEdit.value = true;
  currentAchievementId.value = row.id;
  
  // 回显基础字段
  achievementForm.year = row.year;
  achievementForm.participants = row.participants;
  achievementForm.competition_name = row.competition_name;
  achievementForm.participation_type = row.participation_type;
  achievementForm.level = row.level;
  achievementForm.description = row.description || '';
  
  // 处理图片地址，只取第一张或字符串
  const imageUrl = row.image_url 
    ? (Array.isArray(row.image_url) ? row.image_url[0] : row.image_url)
    : '';
  achievementForm.image_url = imageUrl;
  submitImageUrl.value = imageUrl;
  
  drawerVisible.value = true;
};

// 重置表单
const resetForm = () => {
  // 基础字段重置
  achievementForm.year = new Date().getFullYear();
  achievementForm.participants = '';
  achievementForm.competition_name = '';
  achievementForm.participation_type = '团队';
  achievementForm.level = '省级';
  achievementForm.description = '';
  achievementForm.image_url = '';
  // 图片地址清空
  submitImageUrl.value = '';
  currentAchievementId.value = '';
  achievementFormRef.value?.clearValidate();
};

// ========== 图片上传/删除相关 ==========
// 上传图片
const handleFileChange = async (file) => {
  try {
    if (!file.raw || !(file.raw instanceof File)) {
      throw new Error('请选择有效的图片文件');
    }
    
    // 检查文件大小（5MB）
    if (file.raw.size > 5 * 1024 * 1024) {
      throw new Error('图片大小不能超过5MB');
    }
    
    // 调用上传接口，获取新图片地址
    const res = await clubachievementStore.UploadClubAchievementImg(file.raw);
    if (res) {
      // 设置单张图片地址
      submitImageUrl.value = res.imageUrl;
      achievementForm.image_url = res.imageUrl;
      console.log('上传成功返回：', res.imageUrl);
      
    }
  } catch (error) {
    ElMessage.error(`图片上传失败：${error.message}`);
    console.error('上传详情：', error);
  }
};

// 删除图片
const removeImage = () => {
  submitImageUrl.value = '';
  achievementForm.image_url = '';
  ElMessage.success('图片已移除');
};

// ========== 提交表单 ==========
const submitForm = async () => {
  if (!achievementFormRef.value) return;
  try {
    // 表单验证
    await achievementFormRef.value.validate();
    
    let submitData = {
      year: achievementForm.year,
      participants: achievementForm.participants,
      competition_name: achievementForm.competition_name,
      participation_type: achievementForm.participation_type,
      level: achievementForm.level,
      description: achievementForm.description,
      image_url: achievementForm.image_url
    };
    
    if (isEdit.value) {
      await clubachievementStore.UpdateClubAchievement(currentAchievementId.value, submitData);
      ElMessage.success('成就修改成功！');
    } else {
      await clubachievementStore.PostClubAchievement(submitData);
      ElMessage.success('成就创建成功！');
    }
    
    drawerVisible.value = false;
    getAchievementList();
  } catch (error) {
    console.error('提交失败：', error);
    if (error.name !== 'ValidationError') {
      ElMessage.error(`${isEdit.value ? '修改' : '创建'}成就失败：${error.message}`);
    }
  }
};

// ========== 删除成就 ==========
const handleDelete = async (achievementId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该成就吗？删除后数据不可恢复！',
      '删除确认',
      { type: 'warning' }
    );
    await clubachievementStore.DeleteClubAchievement(achievementId);
    ElMessage.success('成就删除成功！');
    getAchievementList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`删除成就失败：${error.message}`);
    }
  }
};
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

.achievement-content {
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
  
  // 深色主题样式
  :deep(.dark-theme) & {
    background: #1f2937 !important;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
    
    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.3);
    }
    
    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      background-color: #374151 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      
      :deep(.el-input__inner) {
        color: #e5e7eb !important;
      }
      
      :deep(.el-input__placeholder) {
        color: rgba(255, 255, 255, 0.5) !important;
      }
      
      :deep(.el-select__input) {
        color: #e5e7eb !important;
      }
      
      :deep(.el-select__caret) {
        color: rgba(255, 255, 255, 0.5) !important;
      }
    }
    
    :deep(.el-button) {
      background-color: #374151 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      color: #e5e7eb !important;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
      }
      
      &.el-button--primary {
        background-color: #409eff !important;
        border-color: #409eff !important;
        color: #fff !important;
        
        &:hover {
          background-color: #69b1ff !important;
        }
      }
    }
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
  
  // 深色主题样式
  :deep(.dark-theme) & {
    background: #1f2937 !important;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
    
    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.3);
    }
    
    :deep(.el-table) {
      --el-table-header-text-color: #e5e7eb;
      --el-table-row-hover-bg-color: #374151;
      --el-table-border-color: rgba(255, 255, 255, 0.1);
      background-color: #111827 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      
      .el-table__header-wrapper {
        background: #1f2937 !important;
      }
      
      th {
        background: #1f2937 !important;
        color: #e5e7eb !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
      }
      
      td {
        background: #111827 !important;
        color: #e5e7eb !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
      }
      
      tr:last-child td {
        border-bottom: none;
      }
      
      tr:hover td {
        background-color: #374151 !important;
      }
      
      .el-table__empty-block {
        background-color: #111827 !important;
        
        .el-empty__text {
          color: #9ca3af !important;
        }
      }
    }
  }
}

// 无图片占位符样式
.no-image {
  color: #c0c4cc;
  font-style: italic;
}

// 分页容器样式优化
.pagination-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 20px;
  margin-top: 0;
  background: #fff;
  border-top: 1px solid #f0f2f5;
  border-radius: 0 0 12px 12px;

  :deep(.el-pagination) {
    margin: 0;
  }
  
  // 深色主题样式
  :deep(.dark-theme) & {
    background: #1f2937 !important;
    border-top-color: rgba(255, 255, 255, 0.1) !important;
    
    :deep(.el-pagination) {
      color: #e5e7eb !important;
      
      .el-pagination__total {
        color: #9ca3af !important;
      }
      
      .el-pagination__prev,
      .el-pagination__next,
      .el-pagination__item {
        background-color: #374151 !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
        color: #e5e7eb !important;
        
        &:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
      }
      
      .el-pagination__active .el-pagination__item {
        background-color: #409eff !important;
        border-color: #409eff !important;
        color: #fff !important;
      }
      
      .el-pagination__sizes {
        :deep(.el-select__wrapper) {
          background-color: #374151 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          
          :deep(.el-select__input) {
            color: #e5e7eb !important;
          }
          
          :deep(.el-select__caret) {
            color: rgba(255, 255, 255, 0.5) !important;
          }
        }
      }
      
      .el-pagination__jump {
        color: #e5e7eb !important;
        
        :deep(.el-input__wrapper) {
          background-color: #374151 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          
          :deep(.el-input__inner) {
            color: #e5e7eb !important;
          }
        }
      }
    }
  }
}

// 抽屉样式优化
.drawer-inner-container {
  width: 100%;
  max-width: 750px;
  margin: 0 auto;
  overflow-x: hidden;
  padding: 20px;
  background: #fff;
  
  // 深色主题样式
  :deep(.dark-theme) & {
    background: #1f2937 !important;
    color: #e5e7eb !important;
  }
}

.achievement-form {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 240px);
  width: 100%;
  overflow-y: auto;

  :deep(.el-form-item) {
    margin-bottom: 0;
    
    // 深色主题样式
    :deep(.dark-theme) & {
      :deep(.el-form-item__label) {
        color: #e5e7eb !important;
      }
    }
  }

  :deep(.el-input),
  :deep(.el-select) {
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }
    
    // 深色主题样式
    :deep(.dark-theme) & {
      :deep(.el-input__wrapper),
      :deep(.el-select__wrapper) {
        background-color: #374151 !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
        
        :deep(.el-input__inner) {
          color: #e5e7eb !important;
        }
        
        :deep(.el-input__placeholder) {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        
        :deep(.el-select__input) {
          color: #e5e7eb !important;
        }
        
        :deep(.el-select__caret) {
          color: rgba(255, 255, 255, 0.5) !important;
        }
      }
      
      &:hover {
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      }
    }
  }

  :deep(.el-input__wrapper) {
    border-radius: 6px;
  }
}

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
  
  // 深色主题样式
  :deep(.dark-theme) & {
    background: #1f2937 !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
    
    &:hover {
      border-color: #409eff;
      background: rgba(64, 158, 255, 0.1) !important;
    }
    
    .tips {
      color: #9ca3af !important;
    }
    
    :deep(.el-button) {
      background-color: #374151 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      color: #e5e7eb !important;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
      }
      
      &.el-button--primary {
        background-color: #409eff !important;
        border-color: #409eff !important;
        color: #fff !important;
        
        &:hover {
          background-color: #69b1ff !important;
        }
      }
    }
    
    .delete-icon {
      background: rgba(31, 41, 55, 0.9) !important;
      color: #f87171 !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
      
      &:hover {
        background: #1f2937 !important;
      }
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
  
  // 深色主题样式
  :deep(.dark-theme) & {
    background: #1f2937 !important;
    border-top-color: rgba(255, 255, 255, 0.1) !important;
    
    :deep(.el-button) {
      background-color: #374151 !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      color: #e5e7eb !important;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
      }
      
      &.el-button--primary {
        background-color: #409eff !important;
        border-color: #409eff !important;
        color: #fff !important;
        
        &:hover {
          background-color: #69b1ff !important;
        }
      }
    }
  }
}

// 响应式设计优化
@media (max-width: $desktop-break) {
  .achievement-content {
    padding: 0 16px;
  }

  .search-form {
    gap: 12px;
  }
}

@media (max-width: $tablet-break) {
  .achievement-content {
    gap: 16px;
    padding: 0 12px;
  }

  .search-form {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  :deep(.el-form-item) {
    width: 100%;
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 100% !important;
  }

  .table-card :deep(.el-table) {
    font-size: 13px;

    th {
      padding: 12px 0;
    }

    td {
      padding: 10px 0;
    }
  }

  .pagination-container {
    padding: 16px;
  }

  .drawer-inner-container {
    max-width: 100%;
    padding: 16px;
  }

  .preview-item {
    width: 160px !important;
    height: 160px !important;
  }

  .drawer-footer {
    padding: 16px;
    max-width: 100%;
  }
}

@media (max-width: $mobile-break) {
  .achievement-content {
    gap: 12px;
    padding: 0 8px;
  }

  .search-card,
  .table-card {
    padding: 12px;
    border-radius: 8px;
  }

  .table-card :deep(.el-table) {
    font-size: 12px;

    th {
      padding: 8px 0;
    }

    td {
      padding: 8px 0;
    }

    .el-table__body-wrapper {
      max-height: 500px;
    }
  }

  .pagination-container {
    padding: 12px;
  }

  .preview-item {
    width: 120px !important;
    height: 120px !important;
  }

  .drawer-inner-container {
    padding: 12px;
  }

  .drawer-footer {
    padding: 12px;
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