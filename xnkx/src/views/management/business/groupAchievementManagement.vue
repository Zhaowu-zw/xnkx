<template>
  <!-- 使用PageContainer组件作为页面容器 -->
  <PageContainer title="小组成果管理">
    <!-- 操作按钮插槽：新增按钮 -->
    <template #actions>
      <el-button type="primary" :icon="Plus" @click="openAddDrawer">
        新增成果
      </el-button>
    </template>

    <!-- 页面主体内容 -->
    <div class="achievement-content business-management-animation">
      <!-- 1. 搜索筛选区域 -->
      <el-card shadow="hover" class="search-card business-card-animation">
        <el-form :inline="true" :model="searchForm" class="search-form">
                    <el-form-item label="成果标题">
                                <el-input v-model="searchForm.title" placeholder="请输入成果标题" clearable style="width: 300px" @input="getAchievementList" />
                              </el-form-item>
          <el-form-item label="所属小组">
            <el-select v-model="searchForm.group_id" placeholder="请选择小组" clearable style="width: 200px">
              <el-option v-for="group in groupStore.groupInfo" :key="group.id" :label="group.group_name" :value="group.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
              <el-option label="进行中" value="ongoing" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 2. 成果列表表格 -->
      <el-card shadow="hover" class="table-card business-card-animation" :style="{ animationDelay: '0.15s' }">
        <el-table v-loading="groupAchievementStore.loading" :data="flatAchievementList" 
          border stripe style="width: 100%"  empty-text="暂无成果数据" :key="tableKey">
          <!-- 前端排序序号（删除后自动补位） -->
          <el-table-column label="序号" width="80" align="center">
            <template #default="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="group_name" label="小组名称" width="120" align="center" />
          <el-table-column prop="title" label="成果标题" min-width="240" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="120" align="center">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="activity_time" label="发布时间"  min-width="120" align="center">
            <template #default="scope">
              {{ formatTime(scope.row.activity_time) }}
            </template>
          </el-table-column>
          <el-table-column label="成果图片" width="120" align="center">
            <template #default="scope">
              <el-image v-if="scope.row.image_url" :src="scope.row.image_url" :preview-src-list="[scope.row.image_url]" 
                fit="cover" style="width: 80px; height: 80px; border-radius: 4px" />
              <span v-else class="no-image">-</span>
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
              <el-button size="small" :icon="Edit" type="primary" @click="openEditDrawer(scope.row)">
                编辑
              </el-button>
              <el-button size="small" :icon="Delete" type="danger" @click="handleDelete(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 3. 查看成果抽屉 -->
    <el-drawer v-model="viewDrawerVisible" title="查看成果详情" direction="rtl" size="800px" destroy-on-close>
      <div class="drawer-inner-container view-drawer-container">
        <el-card shadow="hover" class="simple-view-card">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="小组名称">{{ currentAchievement.group_name }}</el-descriptions-item>
            <el-descriptions-item label="成果标题">{{ currentAchievement.title }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(currentAchievement.status)">
                {{ getStatusText(currentAchievement.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="发布时间">{{ formatTime(currentAchievement.activity_time) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(currentAchievement.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatTime(currentAchievement.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="成果图片" :span="2">
              <el-image v-if="currentAchievement.image_url" :src="currentAchievement.image_url" fit="cover" 
                style="max-width: 100%; max-height: 300px; border-radius: 4px; margin-top: 8px;" 
                :preview-src-list="[currentAchievement.image_url]" :error="handleImageError" empty-text="图片加载失败" />
              <span v-else style="color: #909399; margin-top: 8px; display: inline-block;">无图片</span>
            </el-descriptions-item>
            <el-descriptions-item label="成果描述" :span="2">
              <div style="margin-top: 8px; white-space: pre-wrap; line-height: 1.6;">
                {{ currentAchievement.description || '暂无描述信息' }}
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
      <div class="drawer-footer">
        <el-button @click="viewDrawerVisible = false">关闭</el-button>
      </div>
    </el-drawer>

    <!-- 4. 新增/编辑成就抽屉 -->
    <el-drawer v-model="drawerVisible" :title="isEdit ? '编辑成果' : '新增成果'" direction="rtl" size="800px" destroy-on-close>
      <div class="drawer-inner-container">
        <el-form ref="achievementFormRef" :model="achievementForm" :rules="formRules" label-width="120px"
          label-position="top" class="achievement-form">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="所属小组" prop="group_id">
                <el-select v-model="achievementForm.group_id" placeholder="请选择小组" style="width: 100%">
                  <el-option v-for="group in groupStore.groupInfo" :key="group.id" :label="group.group_name" :value="group.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-select v-model="achievementForm.status" placeholder="请选择状态" style="width: 100%">
                  <el-option label="进行中" value="ongoing" />
                  <el-option label="已完成" value="completed" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="成果标题" prop="title">
            <el-input v-model="achievementForm.title" placeholder="请输入成果标题" maxlength="200" show-word-limit />
          </el-form-item>
          
          <el-form-item label="发布时间" prop="activity_time">
            <el-date-picker v-model="achievementForm.activity_time" type="datetime" placeholder="请选择活动时间" 
              style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          
          <el-form-item label="成果描述" prop="description">
            <el-input v-model="achievementForm.description" type="textarea" placeholder="请输入成果描述" maxlength="500" show-word-limit rows="4" />
          </el-form-item>
          
          <el-form-item label="成果图片">
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
          {{ isEdit ? '保存修改' : '创建成果' }}
        </el-button>
      </div>
    </el-drawer>
  </PageContainer>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Close, Upload, View } from '@element-plus/icons-vue'
import PageContainer from '@/components/PageContainer.vue'
import { useGroupAchievementStore } from '@/stores/groupachievement'
import useGroupStore from '@/stores/group'

// ========== 核心实例与状态 ==========
const groupAchievementStore = useGroupAchievementStore()

const drawerVisible = ref(false)
const viewDrawerVisible = ref(false)
const isEdit = ref(false)
const currentAchievementId = ref('')
const currentAchievement = ref({})
const achievementFormRef = ref(null)
const tableKey = ref(0)

// 新增：标记组件是否活跃
const isMounted = ref(false);

// 图片地址，只支持单张图片
const submitImageUrl = ref('')

// ========== 核心实例与状态 ==========
const groupStore = useGroupStore()

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

// ========== 新增/编辑表单 ==========
const achievementForm = reactive({
  group_id: '',
  title: '',
  description: '',
  activity_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
  status: 'ongoing',
  image_url: ''
})

// ========== 表单验证规则 ==========
const formRules = reactive({
  group_id: [
    { required: true, message: '请选择小组', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入成果标题', trigger: 'blur' },
    { min: 2, max: 200, message: '成果标题长度需在2-200个字符之间', trigger: 'blur' }
  ],
  activity_time: [
    { required: true, message: '请选择活动时间', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入成果描述', trigger: 'blur' },
    { min: 1, max: 500, message: '成果描述长度需在1-500个字符之间', trigger: 'blur' }
  ]
})

// ========== 计算属性 ==========
// 扁平化的成果列表
const flatAchievementList = computed(() => {
  let list = []
  groupAchievementStore.achievementList.forEach(group => {
    group.achievements.forEach(achievement => {
      list.push({
        ...achievement,
        group_name: group.group_name
      })
    })
  })
  // 搜索筛选
  if (searchForm.group_name) {
    list = list.filter(item => item.group_name.includes(searchForm.group_name))
  }
  if (searchForm.title) {
    list = list.filter(item => item.title.includes(searchForm.title))
  }
  if (searchForm.status) {
    list = list.filter(item => item.status === searchForm.status)
  }
  return list
})

// 总成果数
// const totalAchievements = computed(() => {
//   return flatAchievementList.value.length
// })

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

// 根据状态获取标签类型
const getStatusType = (status) => {
  const typeMap = {
    'ongoing': 'warning',
    'completed': 'success',
    'archived': 'info'
  }
  return typeMap[status] || 'info'
}

// 根据状态获取文本
const getStatusText = (status) => {
  const textMap = {
    'ongoing': '进行中',
    'completed': '已完成',
  }
  return textMap[status] || status
}

// 图片加载失败处理
const handleImageError = () => {
  ElMessage.warning('图片加载失败，已移除')
  
  removeImage()
}

// ========== 页面初始化 ==========
onMounted(async () => {
  isMounted.value = true; // 组件挂载后标记为活跃
  try {
    // 获取小组信息：检查仓库中是否已有数据，没有则调用接口
    if (!groupStore.groupInfo.length && !groupStore.isGroupInfoFetched) {
      await groupStore.GetGroupInfo()
    }
    await getAchievementList()
  } catch (error) {
    if (isMounted.value) { // 仅在组件活跃时提示错误
      ElMessage.error(`初始化失败：${error.message}`)
    }
  }
})

// 组件卸载时标记为非活跃
onUnmounted(() => {
  isMounted.value = false
})

// ========== 列表相关方法 ==========
// 初始加载和成果标题变化时执行
const getAchievementList = async () => {
  try {
    await groupAchievementStore.fetchGroupAchievement({
      keyword: searchForm.title,
      // group_id和status只在点击查询按钮时传递
    })
    tableKey.value += 1
  } catch (error) {
    ElMessage.error(`获取列表失败：${error.message}`)
  }
}

// 点击查询按钮时执行完整查询
const handleSearch = async () => {
  try {
    await groupAchievementStore.fetchGroupAchievement({
      keyword: searchForm.title,
      group_id: searchForm.group_id,
      status: searchForm.status
    })
    tableKey.value += 1
  } catch (error) {
    ElMessage.error(`查询失败：${error.message}`)
  }
}

const resetSearch = () => {
  // 重置所有搜索条件
  Object.assign(searchForm, initialSearchForm)
  getAchievementList() // 重置后重新加载列表（仅按标题）
}

// ========== 抽屉相关方法 ==========
const openAddDrawer = () => {
  isEdit.value = false
  resetForm()
  drawerVisible.value = true
}

const openViewDrawer = (row) => {
  currentAchievement.value = JSON.parse(JSON.stringify(row))
  viewDrawerVisible.value = true
}

// 编辑回显
const openEditDrawer = (row) => {
  isEdit.value = true
  currentAchievementId.value = row.id
  currentAchievement.value = JSON.parse(JSON.stringify(row))
  
  // 回显基础字段
  achievementForm.group_id = row.group_id
  achievementForm.title = row.title
  achievementForm.description = row.description || ''
  achievementForm.activity_time = row.activity_time
  achievementForm.status = row.status
  
  // 处理图片地址
  const imageUrl = row.image_url 
    ? (Array.isArray(row.image_url) ? row.image_url[0] : row.image_url)
    : ''
  achievementForm.image_url = imageUrl
  submitImageUrl.value = imageUrl
  
  drawerVisible.value = true
}

// 重置表单
const resetForm = () => {
  // 基础字段重置
  achievementForm.group_id = ''
  achievementForm.title = ''
  achievementForm.description = ''
  achievementForm.activity_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
  achievementForm.status = 'ongoing'
  achievementForm.image_url = ''
  // 图片地址清空
  submitImageUrl.value = ''
  currentAchievementId.value = ''
  currentAchievement.value = {}
  achievementFormRef.value?.clearValidate()
}

// ========== 图片上传/删除相关 ==========
// 上传图片
const handleFileChange = async (file) => {
  try {
    if (!file.raw || !(file.raw instanceof File)) {
      throw new Error('请选择有效的图片文件')
    }
    
    // 检查文件大小（5MB）
    if (file.raw.size > 5 * 1024 * 1024) {
      throw new Error('图片大小不能超过5MB')
    }
    
    // 创建FormData对象
    const formData = new FormData()
    formData.append('achievementImg', file.raw)
    
    // 调用上传接口，获取新图片地址
    const imageUrl = await groupAchievementStore.uploadGroupAchievementImg(formData)
    if (imageUrl) {
      // 设置单张图片地址
      submitImageUrl.value = imageUrl
      achievementForm.image_url = imageUrl
      console.log('上传成功返回：', imageUrl)
    }
  } catch (error) {
    ElMessage.error(`图片上传失败：${error.message}`)
    console.error('上传详情：', error)
  }
}

// 删除图片
const removeImage = () => {
  submitImageUrl.value = ''
  achievementForm.image_url = ''
  ElMessage.success('图片已移除')
}

// ========== 提交表单 ==========
const submitForm = async () => {
  if (!achievementFormRef.value) return
  try {
    // 表单验证
    await achievementFormRef.value.validate()
    
    let submitData = {
      group_id: achievementForm.group_id,
      title: achievementForm.title,
      description: achievementForm.description,
      activity_time: achievementForm.activity_time,
      status: achievementForm.status,
      image_url: achievementForm.image_url
    }
    
    if (isEdit.value) {
      await groupAchievementStore.editGroupAchievement({ ...submitData, id: currentAchievementId.value })
      ElMessage.success('成果修改成功！')
    } else {
      await groupAchievementStore.addGroupAchievement(submitData)
      ElMessage.success('成果创建成功！')
    }
    
    drawerVisible.value = false
    getAchievementList()
  } catch (error) {
    console.error('提交失败：', error)
    if (error.name !== 'ValidationError') {
      ElMessage.error(`${isEdit.value ? '修改' : '创建'}成果失败：${error.message}`)
    }
  }
}

// ========== 删除成就 ==========
const handleDelete = async (achievementId) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该成果吗？删除后数据不可恢复！',
      '删除确认',
      { type: 'warning' }
    )
    await groupAchievementStore.removeGroupAchievement(achievementId)
    ElMessage.success('成果删除成功！')
    getAchievementList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`删除成果失败：${error.message}`)
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
}

// 抽屉样式优化
.drawer-inner-container {
  width: 100%;
  max-width: 750px;
  margin: 0 auto;
  overflow-x: hidden;
  padding: 20px;
}

.achievement-form {
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
  :deep(.el-select),
  :deep(.el-date-picker) {
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
  :deep(.el-select),
  :deep(.el-date-picker) {
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