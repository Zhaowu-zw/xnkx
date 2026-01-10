<template>
  <div class="task-detail-container">
    <div class="task-detail-header">
      <h2>任务详情</h2>
      <el-button type="primary" @click="goBack">返回</el-button>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="!taskDetail" class="error-container">
      <el-empty description="任务不存在或已删除" />
    </div>

    <div v-else class="task-detail-content">
      <!-- 任务基本信息 -->
      <div class="task-basic-info">
        <div class="task-title-section">
          <h3>{{ taskDetail.title }}</h3>
          <div class="task-status-tag" :class="getStatusTagClass()">{{ getStatusText() }}</div>
        </div>
        <div class="task-meta-info">
          <div class="meta-item">
            <span class="meta-label">任务类型：</span>
            <span class="meta-value">{{ taskDetail.task_type === 'group' ? '小组任务' : '社团任务' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">截止时间：</span>
            <span class="meta-value">{{ formatDate(taskDetail.deadline) }}</span>
          </div>
          <div class="meta-item" v-if="taskDetail.task_type === 'group'">
            <span class="meta-label">所属小组：</span>
            <span class="meta-value">{{ groupNameMap[taskDetail.group_id] || '未知小组' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">考核标准：</span>
            <span class="meta-value">{{ taskDetail.assessment_criteria }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">发布者：</span>
            <span class="meta-value">{{ taskDetail.publisher_info?.nickname || taskDetail.publisher_info?.username || '未知' }}</span>
          </div>
        </div>

        <div class="task-description">
          <h4>任务描述</h4>
          <p>{{ taskDetail.description }}</p>
        </div>

        <!-- 任务文件 -->
        <div v-if="parsedTaskFiles.length > 0" class="task-files">
          <h4>任务文件</h4>
          <div class="file-list">
            <button 
              v-for="file in parsedTaskFiles" 
              :key="file" 
              class="file-item"
              @click="downloadFile(file)"
            >
              <el-icon class="file-icon"><Document /></el-icon>
              <span class="file-name">{{ getFileName(file) }}</span>
            </button>
          </div>
        </div>
        
        <!-- 任务图片 -->
        <div v-if="parsedTaskImages.length > 0" class="task-images">
          <h4>任务图片</h4>
          <div class="image-list">
            <div v-for="(image, index) in parsedTaskImages" :key="image" class="image-item-container">
              <el-image 
                :src="image" 
                :preview-src-list="taskPreviewImages" 
                class="task-image-item"
                fit="cover"
                :initial-index="index"
              />
              <button 
                class="image-download-btn"
                title="下载图片"
                @click="downloadImage(image)"
              >
                <el-icon><Download /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 如果是任务发布者或任务已结束 -->
      <div v-if="isPublisher || isTaskEnded" class="publisher-section">
        <!-- 任务用户列表 -->
        <div class="task-users-section">
          <h3>任务用户列表</h3>
          
          <div v-if="filteredTaskUsers.length === 0" class="empty-submissions">
            <el-empty description="暂无用户分配到该任务" />
          </div>

          <div v-else class="task-users-list">
            <div class="task-user-item" v-for="submission in filteredTaskUsers" :key="submission.user_id">
              <div class="user-info">
                <span class="user-name">{{ submission.user?.userinfo?.nickname || submission.user?.username || '未知用户' }}</span>
                <span class="submission-status" :class="`status-${submission.status}`">{{ getSubmissionStatusText(submission.status) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 任务提交记录 -->
        <div class="task-submissions-section">
          <h3>任务提交记录</h3>
          
          <div v-if="submissions.length === 0" class="empty-submissions">
            <el-empty description="暂无用户提交任务" />
          </div>

          <div v-else class="submissions-list">
            <div class="submission-item" v-for="submission in submissions" :key="submission.id">
              <div class="submission-header">
                <div class="user-info">
                  <span class="user-name">{{ submission.user?.userinfo?.nickname || submission.user?.username || '未知用户' }}</span>
                  <span class="submission-status" :class="`status-${submission.status}`">{{ getSubmissionStatusText(submission.status) }}</span>
                </div>
                <div class="submission-time">{{ formatDate(submission.updatedAt) }}</div>
              </div>
              
              <div class="submission-content">
                <div v-if="submission.submit_content" class="submit-content">
                  <h5>提交内容：</h5>
                  <p>{{ submission.submit_content }}</p>
                </div>
                <div v-else class="no-result">未提交内容</div>
                
                <!-- 提交的文件 -->
                <div v-if="submission.submit_files.length > 0" class="submit-files">
                  <h5>提交的文件：</h5>
                  <div class="file-list">
                    <button 
                      v-for="file in submission.submit_files" 
                      :key="file" 
                      class="file-item"
                      @click="downloadFile(file)"
                    >
                      <el-icon class="file-icon"><Document /></el-icon>
                      <span class="file-name">{{ getFileName(file) }}</span>
                    </button>
                  </div>
                </div>
                
                <!-- 提交的图片 -->
                <div v-if="submission.submit_images.length > 0" class="submit-images">
                  <h5>提交的图片：</h5>
                  <div class="image-list">
                    <div v-for="image in submission.submit_images" :key="image" class="image-item-container">
                      <el-image 
                        :src="image" 
                        :preview-src-list="submitPreviewImages[submission.id] || submission.submit_images" 
                        class="submit-image-item"
                      />
                      <button 
                        class="image-download-btn"
                        title="下载图片"
                        @click="downloadImage(image)"
                      >
                        <el-icon><Download /></el-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="submission-actions">
                <!-- 只有发布者可以评分 -->
                <div class="score-section" v-if="!submission.score && isPublisher">
                  <span>评分：</span>
                  <el-rate v-model="submission.tempScore" :max="10" show-score />
                  <el-button type="primary" size="small" @click="scoreSubmission(submission)">
                    提交评分
                  </el-button>
                </div>
                <div class="score-display" v-else-if="submission.score !== null && submission.score !== undefined">
                  <span>评分：</span>
                  <el-rate :model-value="(submission.score / 10)" :max="10" disabled show-score />
                </div>
                <div class="score-display" v-else>
                  <span>评分：</span>
                  <span class="no-score">评分</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 只有发布者可以看到操作按钮 -->
        <div v-if="isPublisher" class="publisher-actions">
          <el-button type="primary" @click="handleEditTask">编辑任务</el-button>
          <el-button type="danger" @click="handleDeleteTask">删除任务</el-button>
          <el-button type="warning" @click="handleChangeTaskStatus">结束任务</el-button>
        </div>
        
        <!-- 任务编辑对话框（使用TaskSubmit组件） -->
        <TaskSubmit
          v-model="editTaskDialogVisible"
          :edit-task="editingTask"
          @submit-success="handleTaskSubmitSuccess"
        />
      </div>

      <!-- 如果不是任务发布者且任务未结束 -->
      <div v-else-if="!isTaskEnded" class="submit-section">
        <h3>提交任务成果</h3>
        
        <div class="submit-form">
          <el-form :model="submitForm" :rules="submitRules" ref="submitFormRef" label-width="100px">
            <el-form-item label="成果描述">
              <el-input 
                v-model="submitForm.submitContent" 
                type="textarea" 
                placeholder="请输入任务成果描述"
                rows="4"
              />
            </el-form-item>
            
            <el-form-item label="上传文件">
              <el-upload
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
                :file-list="submitFiles"
                multiple
                accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.zip,.rar,.txt,.md,.jpg,.jpeg,.png,.gif,.webp"
              >
                <el-button type="primary" :icon="Upload">选择文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    支持上传Word、Excel、PowerPoint、PDF、压缩文件、文本文件等，单个文件不超过10MB
                  </div>
                </template>
              </el-upload>
            </el-form-item>
            
            <el-form-item label="上传图片">
              <el-upload
                action="#"
                :auto-upload="false"
                :on-change="handleImageChange"
                :file-list="submitImages"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp"
              >
                <el-button type="primary" :icon="Upload">选择图片</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    支持上传JPG、PNG、GIF、WebP格式图片，单个图片不超过5MB
                  </div>
                </template>
              </el-upload>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="submitTask" :loading="submitting">
                提交成果
              </el-button>
            </el-form-item>
          </el-form>
          
          <div v-if="userSubmission" class="user-submission-info">
            <h4>我的提交记录</h4>
            <div class="submission-info-item">
              <span class="label">提交状态：</span>
              <span class="value">{{ getSubmissionStatusText(userSubmission.status) }}</span>
              <div class="status-actions">
                <el-button 
                  v-if="userSubmission.status === 'ongoing'" 
                  type="success" 
                  size="small" 
                  @click="markTaskCompleted(userSubmission)"
                >
                  标记完成
                </el-button>
              </div>
            </div>
            <div class="submission-info-item" v-if="userSubmission.submit_content">
              <span class="label">提交内容：</span>
              <div class="submit-content">{{ userSubmission.submit_content }}</div>
            </div>
            <!-- 我的提交文件 -->
            <div v-if="userSubmission.submit_files && userSubmission.submit_files.length > 0" class="submission-info-item">
              <span class="label">提交文件：</span>
              <div class="file-list">
                <a 
                  v-for="(file, index) in userSubmission.submit_files" 
                  :key="index" 
                  :href="file" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="file-item"
                >
                  <el-icon class="file-icon"><Document /></el-icon>
                  <span class="file-name">{{ getFileName(file) }}</span>
                </a>
              </div>
            </div>
            <!-- 我的提交图片 -->
            <div v-if="userSubmission.submit_images && userSubmission.submit_images.length > 0" class="submission-info-item">
              <span class="label">提交图片：</span>
              <div class="image-list">
                <el-image 
                  v-for="(image, index) in userSubmission.submit_images" 
                  :key="index" 
                  :src="image" 
                  :preview-src-list="userSubmission.submit_images" 
                  class="task-image-item"
                />
              </div>
            </div>
            <div class="submission-info-item" v-if="userSubmission.score !== null && userSubmission.score !== undefined">
              <span class="label">评分：</span>
              <el-rate :model-value="(userSubmission.score / 10)" :max="10" disabled show-score />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, ElRate, ElSkeleton, ElEmpty, ElForm, ElFormItem, ElInput, ElButton, ElImage, ElIcon, ElUpload } from 'element-plus'
import { Document, Upload, Download } from '@element-plus/icons-vue'
import useTaskStore from '@/stores/task'
import TaskSubmit from '@/components/TaskSubmit.vue'
import useUserStore from '@/stores/user'

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()
const userStore = useUserStore()

const loading = ref(true)
const submitting = ref(false)
const submitFormRef = ref(null)
const groupNameMap = ref({
  1: '网页组',
  2: '虚拟组',
  3: '维修组',
  4: '人工组',
  5: '大数据组'
})

// 提交表单
const submitForm = ref({
  submitContent: ''
})

// 上传的文件和图片
const submitFiles = ref([])
const submitImages = ref([])

// 辅助方法：从URL中获取文件名
const getFileName = (url) => {
  if (!url) return ''
  const parts = url.split('/')
  return parts[parts.length - 1]
}

const submitRules = {}

// 任务编辑相关
const editTaskDialogVisible = ref(false)
const editingTask = ref(null)



// 计算属性
const taskDetail = computed(() => taskStore.currentTaskDetail)
const rawSubmissions = computed(() => taskStore.taskSubmissions)

// 解析任务文件和图片为数组
const parsedTaskFiles = computed(() => {
  if (!taskDetail.value || !taskDetail.value.task_files) return []
  
  try {
    // 尝试解析任务文件，处理可能的双重JSON字符串情况
    let files = taskDetail.value.task_files
    if (typeof files === 'string') {
      files = JSON.parse(files)
      // 如果解析后还是字符串，再次解析
      if (typeof files === 'string') {
        files = JSON.parse(files)
      }
    }
    // 如果是数组，直接返回
    if (Array.isArray(files)) {
      return files
    }
    // 如果是对象，检查是否有fileUrls字段
    if (typeof files === 'object' && files.fileUrls) {
      return files.fileUrls
    }
    return []
  } catch (error) {
    console.error('解析任务文件失败:', error)
    return []
  }
})

// 解析任务图片为数组
const parsedTaskImages = computed(() => {
  if (!taskDetail.value || !taskDetail.value.task_images) return []
  
  try {
    // 尝试解析任务图片，处理可能的双重JSON字符串情况
    let images = taskDetail.value.task_images
    if (typeof images === 'string') {
      images = JSON.parse(images)
      // 如果解析后还是字符串，再次解析
      if (typeof images === 'string') {
        images = JSON.parse(images)
      }
    }
    // 如果是数组，直接返回
    if (Array.isArray(images)) {
      return images
    }
    // 如果是对象，检查是否有imageUrls字段
    if (typeof images === 'object' && images.imageUrls) {
      return images.imageUrls
    }
    return []
  } catch (error) {
    console.error('解析任务图片失败:', error)
    return []
  }
})

// 稳定的预览列表，避免闪烁
const taskPreviewImages = ref([])
const submitPreviewImages = ref({})

// 创建ref数组存储带有tempScore字段的提交记录
const parsedSubmissionsRef = ref([])

// 解析提交记录的函数
const parseSubmissions = (submissionsArray) => {
  return submissionsArray.map(submission => {
    if (!submission) return null
    
    // 深拷贝，避免直接修改原始数据
    const parsedSubmission = JSON.parse(JSON.stringify(submission))
    
    try {
      // 解析提交文件
      if (parsedSubmission.submit_files && typeof parsedSubmission.submit_files === 'string') {
        let parsedFiles = parsedSubmission.submit_files
        // 处理双重JSON转义
        parsedFiles = JSON.parse(parsedFiles)
        if (typeof parsedFiles === 'string') {
          parsedFiles = JSON.parse(parsedFiles)
        }
        // 如果是数组，直接返回
        if (Array.isArray(parsedFiles)) {
          parsedSubmission.submit_files = parsedFiles
        } else if (typeof parsedFiles === 'object' && parsedFiles.fileUrls) {
          // 如果是对象，检查是否有fileUrls字段
          parsedSubmission.submit_files = parsedFiles.fileUrls
        } else {
          parsedSubmission.submit_files = []
        }
      } else if (!Array.isArray(parsedSubmission.submit_files)) {
        parsedSubmission.submit_files = []
      }
      
      // 解析提交图片
      if (parsedSubmission.submit_images && typeof parsedSubmission.submit_images === 'string') {
        let parsedImages = parsedSubmission.submit_images
        // 处理双重JSON转义
        parsedImages = JSON.parse(parsedImages)
        if (typeof parsedImages === 'string') {
          parsedImages = JSON.parse(parsedImages)
        }
        // 如果是数组，直接返回
        if (Array.isArray(parsedImages)) {
          parsedSubmission.submit_images = parsedImages
        } else if (typeof parsedImages === 'object' && parsedImages.imageUrls) {
          // 如果是对象，检查是否有imageUrls字段
          parsedSubmission.submit_images = parsedImages.imageUrls
        } else {
          parsedSubmission.submit_images = []
        }
      } else if (!Array.isArray(parsedSubmission.submit_images)) {
        parsedSubmission.submit_images = []
      }
      
      // 确保submit_content是字符串
      if (typeof parsedSubmission.submit_content !== 'string') {
        parsedSubmission.submit_content = parsedSubmission.submit_content || ''
      }
      
      // 为每个提交记录添加tempScore字段，用于评分组件，初始值为0
      parsedSubmission.tempScore = parsedSubmission.tempScore || 0
      
      return parsedSubmission
    } catch (error) {
      console.error('解析提交记录失败:', error, '原始记录:', submission)
      // 返回原始记录的安全版本
      return {
        ...parsedSubmission,
        submit_files: [],
        submit_images: [],
        submit_content: parsedSubmission.submit_content || '',
        tempScore: 0 // 确保即使解析失败也有tempScore字段
      }
    }
  }).filter(Boolean)
}

// 监听原始提交记录变化，更新ref数组
watch(rawSubmissions, (newVal) => {
  // console.log('原始提交记录变化:', newVal)
  // 确保newVal是数组
  const submissionsArray = Array.isArray(newVal) ? newVal : []
  // 解析提交记录
  const parsed = parseSubmissions(submissionsArray)
  // 更新ref数组
  parsedSubmissionsRef.value = parsed
  // console.log('更新后的提交记录:', parsedSubmissionsRef.value)
}, { deep: true, immediate: true })

// 解析后的提交记录（从ref数组获取）
const parsedSubmissions = computed(() => parsedSubmissionsRef.value)

// 过滤出有提交内容的记录
const submissions = computed(() => {
  return parsedSubmissions.value.filter(submission => {
    return submission.submit_files.length > 0 || 
           submission.submit_images.length > 0 || 
           (submission.submit_content && submission.submit_content.trim() !== '')
  })
})

// 监听任务图片变化，更新预览列表
watch(parsedTaskImages, (newImages) => {
  taskPreviewImages.value = [...newImages]
}, { immediate: true, deep: true })

// 监听提交列表变化，更新预览列表
watch(submissions, (newSubmissions) => {
  // 为每个提交创建稳定的预览列表
  const newSubmitPreviewImages = {}
  newSubmissions.forEach(submission => {
    if (submission.submit_images && submission.submit_images.length > 0) {
      newSubmitPreviewImages[submission.id] = [...submission.submit_images]
    }
  })
  submitPreviewImages.value = { ...newSubmitPreviewImages }
}, { immediate: true, deep: true })

// 过滤掉发布人，展示所有拥有该任务的用户
const filteredTaskUsers = computed(() => {
  if (!parsedSubmissions.value || parsedSubmissions.value.length === 0) return []
  
  // 获取发布者ID
  const publisherId = taskDetail.value?.publisher_id
  
  // 过滤掉发布人，返回所有拥有该任务的用户
  return parsedSubmissions.value.filter(submission => {
    return submission.user?.id !== publisherId
  })
})

const isPublisher = computed(() => {
  // 统一使用user_id作为用户ID
  return taskDetail.value && userStore.userInfo && taskDetail.value.publisher_id === (userStore.userInfo.user_id || userStore.userInfo.id)
})

// 判断任务是否已结束
const isTaskEnded = computed(() => {
  if (!taskDetail.value) return false
  // 使用任务全局状态判断任务是否已结束
  const status = taskDetail.value.status || 'ongoing'
  return status === 'pending'
})

// 获取当前用户的提交记录
const userSubmission = computed(() => {
  if (!userStore.userInfo || submissions.value.length === 0) return null
  // 统一使用user_id作为用户ID
  const currentUserId = userStore.userInfo.user_id || userStore.userInfo.id
  return submissions.value.find(item => item.user_id === currentUserId) || null
})




// 方法
const goBack = () => {
  router.back()
}



const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

// 验证文件大小和类型
const validateFile = (file, isImage) => {
  const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024
  const fileSize = file.raw ? file.raw.size : file.size
  
  if (fileSize > maxSize) {
    ElMessage.error(`文件大小不能超过${isImage ? '5MB' : '10MB'}`)
    return false
  }
  
  // 这里可以添加文件类型验证，根据需求调整
  return true
}

// 处理文件选择，立即上传
const handleFileChange = async (file, fileList) => {
  // 只处理新增的文件
  const newFile = fileList.find(f => f.uid === file.uid)
  if (newFile && newFile.raw && newFile.status === 'ready') {
    // 验证文件
    if (!validateFile(newFile, false)) {
      // 验证失败，从列表中移除
      submitFiles.value = fileList.filter(f => f.uid !== file.uid)
      return
    }
    
    // 更新文件列表
    submitFiles.value = fileList
    
    // 更新文件状态为上传中
    newFile.status = 'uploading'
    
    try {
      const taskId = route.params.id
      const formData = new FormData()
      formData.append('submitFiles', newFile.raw)
      
      // 调用上传API
      const res = await taskStore.UploadSubmitFiles(taskId, formData)
      if (res.code === 200 && res.data.fileUrls && res.data.fileUrls.length > 0) {
        // 上传成功，更新文件URL和状态
        newFile.url = res.data.fileUrls[0]
        newFile.status = 'success'
        ElMessage.success('文件上传成功')
      } else {
        newFile.status = 'fail'
        ElMessage.error('文件上传失败')
      }
    } catch (error) {
      newFile.status = 'fail'
      ElMessage.error('文件上传失败：' + error.message)
    }
  } else {
    // 更新文件列表
    submitFiles.value = fileList
  }
}

// 处理图片选择，立即上传
const handleImageChange = async (file, fileList) => {
  // 只处理新增的图片
  const newImage = fileList.find(f => f.uid === file.uid)
  if (newImage && newImage.raw && newImage.status === 'ready') {
    // 验证图片
    if (!validateFile(newImage, true)) {
      // 验证失败，从列表中移除
      submitImages.value = fileList.filter(f => f.uid !== file.uid)
      return
    }
    
    // 更新图片列表
    submitImages.value = fileList
    
    // 更新图片状态为上传中
    newImage.status = 'uploading'
    
    try {
      const taskId = route.params.id
      const formData = new FormData()
      formData.append('submitImages', newImage.raw)
      
      // 调用上传API
      const res = await taskStore.UploadSubmitImages(taskId, formData)
      if (res.code === 200 && res.data.imageUrls && res.data.imageUrls.length > 0) {
        // 上传成功，更新图片URL和状态
        newImage.url = res.data.imageUrls[0]
        newImage.status = 'success'
        ElMessage.success('图片上传成功')
      } else {
        newImage.status = 'fail'
        ElMessage.error('图片上传失败')
      }
    } catch (error) {
      newImage.status = 'fail'
      ElMessage.error('图片上传失败：' + error.message)
    }
  } else {
    // 更新图片列表
    submitImages.value = fileList
  }
}


const getStatusTagClass = () => {
  if (!taskDetail.value) return ''
  // 优先使用任务全局状态，其次使用用户任务状态
  const status = taskDetail.value.status || userSubmission.value?.status || 'ongoing'
  switch (status) {
    case 'ongoing': return 'tag-ongoing'
    case 'completed': return 'tag-completed'
    case 'pending': return 'tag-pending'
    default: return 'tag-ongoing'
  }
}

const getStatusText = () => {
  if (!taskDetail.value) return ''
  // 优先使用任务全局状态，其次使用用户任务状态
  const status = taskDetail.value.status || userSubmission.value?.status || 'ongoing'
  return getSubmissionStatusText(status)
}





const getSubmissionStatusText = (status) => {
  switch (status) {
    case 'ongoing': return '进行中'
    case 'completed': return '已完成'
    case 'pending': return '已结束'
    default: return '未知状态'
  }
}

// 下载图片方法，确保能正确下载到本地浏览器
const downloadImage = (imageUrl) => {
  try {
    // 创建下载链接
    const link = document.createElement('a')
    // 直接使用URL，不使用fetch避免CORS问题
    link.href = imageUrl
    link.download = getFileName(imageUrl) // 设置文件名
    link.target = '_blank' // 在新标签页打开，避免CORS问题
    link.rel = 'noopener noreferrer' // 安全设置
    
    // 模拟点击下载
    document.body.appendChild(link)
    link.click()
    
    // 清理临时资源
    document.body.removeChild(link)
    
    ElMessage.success('图片下载成功')
  } catch (error) {
    console.error('图片下载失败:', error)
    ElMessage.error('图片下载失败：' + error.message)
    
    // 提供备选方案
    ElMessage.warning('您也可以尝试右键点击图片，选择"在新标签页中打开图片"，然后右键保存')
  }
}

// 下载文件方法，确保能正确下载到本地浏览器
const downloadFile = (fileUrl) => {
  try {
    // 创建下载链接
    const link = document.createElement('a')
    // 直接使用URL，不使用fetch避免CORS问题
    link.href = fileUrl
    link.download = getFileName(fileUrl) // 设置文件名
    link.target = '_blank' // 在新标签页打开，避免CORS问题
    link.rel = 'noopener noreferrer' // 安全设置
    
    // 模拟点击下载
    document.body.appendChild(link)
    link.click()
    
    // 清理临时资源
    document.body.removeChild(link)
    
    ElMessage.success('文件下载成功')
  } catch (error) {
    console.error('文件下载失败:', error)
    ElMessage.error('文件下载失败：' + error.message)
    
    // 提供备选方案
    ElMessage.warning('您也可以尝试复制链接到新标签页打开进行下载')
  }
}

const loadTaskDetail = async () => {
  const taskId = route.params.id
  // console.log('加载任务详情 - 任务ID:', taskId)
  if (!taskId) {
    console.error('加载任务详情 - 任务ID无效')
    ElMessage.error('任务ID无效')
    goBack()
    return
  }
  
  loading.value = true
  try {
    // console.log('加载任务详情 - 开始请求后端数据')
    const result = await taskStore.GetTaskDetail(taskId)
    console.log('加载任务详情 - 请求成功结果:', result)
    // console.log('加载任务详情 - 任务详情:', taskDetail.value)
    // console.log('加载任务详情 - 提交列表:', submissions.value)
    
    // 为每个submission对象添加tempScore字段，用于评分组件，初始值为0
    if (submissions.value && submissions.value.length > 0) {
      submissions.value = submissions.value.map(submission => ({
        ...submission,
        tempScore: submission.tempScore || 0
      }))
    }
  } catch (error) {
    console.error('加载任务详情 - 请求失败:', error)
    ElMessage.error(error.message || '获取任务详情失败')
  } finally {
    loading.value = false
    // console.log('加载任务详情 - 加载完成，loading状态:', loading.value)
  }
}

const submitTask = async () => {
  // console.log('提交任务 - 开始，表单数据:', submitForm.value)
  // console.log('提交任务 - 提交文件:', submitFiles.value)
  // console.log('提交任务 - 提交图片:', submitImages.value)
  
  // 验证是否有提交内容
  if (!submitForm.value.submitContent && submitFiles.value.length === 0 && submitImages.value.length === 0) {
    console.warn('提交任务 - 未填写任何成果内容')
    ElMessage.warning('请至少填写一项成果内容')
    return
  }
  
  submitting.value = true
  try {
    const taskId = route.params.id
    // console.log('提交任务 - 任务ID:', taskId)
    
    // 直接获取所有已上传的文件和图片URL
    const allFiles = submitFiles.value.filter(file => file.url).map(file => file.url)
    const allImages = submitImages.value.filter(file => file.url).map(file => file.url)
    // console.log('提交任务 - 最终提交文件:', allFiles)
    // console.log('提交任务 - 最终提交图片:', allImages)
    
    // 提交任务成果
    // console.log('提交任务 - 开始提交成果')
     await taskStore.SubmitTaskResult(taskId, {
      submit_files: allFiles,
      submit_images: allImages,
      submit_content: submitForm.value.submitContent
    })
    // console.log('提交任务 - 提交结果:', submitResult)
    
    // 明确更新任务状态为已完成
    // console.log('提交任务 - 更新任务状态为已完成')
    await taskStore.updateTaskStatus(taskId, {
      status: 'completed'
    })
    
    ElMessage.success('任务成果提交成功')
    
    // 重新加载任务详情
    await loadTaskDetail()
  } catch (error) {
    console.error('提交任务 - 失败:', error)
    ElMessage.error(error.message || '提交失败')
  } finally {
    submitting.value = false
    // console.log('提交任务 - 完成，submitting状态:', submitting.value)
  }
}

const scoreSubmission = async (submission) => {
  // console.log('评分任务 - 开始，提交记录:', submission)
  if (!submission.tempScore) {
    console.warn('评分任务 - 未填写评分')
    ElMessage.warning('请先评分')
    return
  }
  
  try {
    // 验证评分范围
    if (submission.tempScore < 0 || submission.tempScore > 10) {
      // console.warn('评分任务 - 评分超出范围:', submission.tempScore)
      ElMessage.warning('评分必须在0-10星之间')
      return
    }
    
    // 将星星数量转换为100分制（1星=10分）
    const score = submission.tempScore * 10
    const taskId = route.params.id
    // console.log('评分任务 - 任务ID:', taskId, '评分:', score)
    await taskStore.ScoreTaskResult(taskId, {
      score: score,
      user_id: submission.user_id
    })
    // console.log('评分任务 - 成功')
    ElMessage.success('评分成功')
    // 重新加载任务详情
    await loadTaskDetail()
  } catch (error) {
    console.error('评分任务 - 失败:', error)
    ElMessage.error(error.message || '评分失败')
  }
}

const markTaskCompleted = async (submission) => {
  // console.log('标记任务完成 - 开始，提交记录:', submission)
  try {
    await taskStore.updateTaskStatus(submission.task_id, {
      status: 'completed',
      user_id: submission.user_id
    })
    // console.log('标记任务完成 - 成功')
    ElMessage.success('任务状态已更新为已完成')
    // 重新加载任务详情
    await loadTaskDetail()
  } catch (error) {
    console.error('标记任务完成 - 失败:', error)
    ElMessage.error(error.message || '更新状态失败')
  }
}



// 编辑任务
const handleEditTask = () => {
  // console.log('编辑任务 - 开始，当前任务详情:', taskDetail.value)
  if (!taskDetail.value) {
    console.error('编辑任务 - 任务详情为空')
    return
  }
  
  // 设置编辑任务数据
  editingTask.value = {
    ...taskDetail.value,
    deadline: taskDetail.value.deadline ? new Date(taskDetail.value.deadline) : ''
  }
  
  // console.log('编辑任务 - 设置编辑任务数据:', editingTask.value)
  // 打开编辑对话框
  editTaskDialogVisible.value = true
}

// 处理任务提交成功（新增/编辑）
const handleTaskSubmitSuccess = async () => {
  // console.log('任务提交成功 - 开始重新加载任务详情')
  editTaskDialogVisible.value = false
  // 重新加载任务详情
  await loadTaskDetail()
}

// 删除任务
const handleDeleteTask = async () => {
  // console.log('删除任务 - 开始')
  // 添加确认提示
  try {
    await ElMessageBox.confirm('确定要删除这个任务吗？删除后将无法恢复！', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    const taskId = route.params.id
    // console.log('删除任务 - 确认，任务ID:', taskId)
    await taskStore.deleteTask(taskId)
    // console.log('删除任务 - 成功')
    ElMessage.success('任务删除成功')
    // 返回上一页
    goBack()
  } catch (error) {
    // 如果是用户取消，则不显示错误信息
    if (error === 'cancel') {
      // console.log('删除任务 - 用户取消')
      return
    }
    console.error('删除任务 - 失败:', error)
    ElMessage.error(error.message || '删除任务失败')
  }
}

// 结束任务
const handleChangeTaskStatus = async () => {
  // console.log('结束任务 - 开始')
  try {
    const taskId = route.params.id
    // 直接将任务状态改为结束
    const newStatus = 'pending'
    // console.log('结束任务 - 任务ID:', taskId, '新状态:', newStatus)
    await taskStore.updateTaskStatus(taskId, {
      status: newStatus,
      end_all: true // 添加end_all参数，通知后端结束所有用户的任务状态
    })
    // console.log('结束任务 - 成功')
    ElMessage.success(`任务状态已更新为${getSubmissionStatusText(newStatus)}`)
    // 重新加载任务详情
    await loadTaskDetail()
  } catch (error) {
    // console.error('结束任务 - 失败:', error)
    ElMessage.error(error.message || '更新任务状态失败')
  }
}

// 初始化表单数据
const initSubmitForm = () => {
  // console.log('初始化提交表单 - 开始，用户提交记录:', userSubmission.value)
  if (!userSubmission.value) {
    // console.log('初始化提交表单 - 用户无提交记录，重置表单') 
    submitForm.value.submitContent = ''
    submitFiles.value = []
    submitImages.value = []
    return
  }
  
  // 初始化提交内容
  submitForm.value.submitContent = userSubmission.value.submit_content || ''
  
  // 初始化提交文件（转换为上传组件需要的格式）
  submitFiles.value = (userSubmission.value.submit_files || []).map(url => ({
    name: getFileName(url),
    url: url,
    status: 'success'
  }))
  
  // 初始化提交图片（转换为上传组件需要的格式）
  submitImages.value = (userSubmission.value.submit_images || []).map(url => ({
    name: getFileName(url),
    url: url,
    status: 'success'
  }))
  
  // console.log('初始化提交表单 - 完成，表单数据:', submitForm.value)
}

// 生命周期
onMounted(() => {
  // console.log('组件加载 - 当前用户信息:', userStore.userInfo)
  // console.log('组件加载 - 路由参数:', route.params)
  loadTaskDetail()
})

// 监听路由变化，重新加载数据
watch(() => route.params.id, (newId) => {
  // console.log('路由变化 - 新任务ID:', newId)  
  if (newId) {
    loadTaskDetail()
  }
})


// 监听用户提交记录变化，初始化表单
watch(userSubmission, (newSubmission) => {
  // console.log('用户提交记录变化 - 新记录:', newSubmission)
  initSubmitForm()
}, { deep: true })

// 组件销毁时重置状态
onUnmounted(() => {
  // console.log('组件销毁 - 重置任务详情')
  taskStore.ResetTaskDetail()
})
</script>

<style scoped>
.task-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.task-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.task-detail-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.task-basic-info {
  margin-bottom: 30px;
}

.task-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.task-title-section h3 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.task-status-tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.tag-ongoing {
  background-color: #e8f5e9;
  color: #42b983;
}

.tag-completed {
  background-color: #f0f7f3;
  color: #359469;
}

.tag-pending {
  background-color: #fff8e1;
  color: #ff9800;
}

.tag-active {
  background-color: #e8f5e9;
  color: #42b983;
}

.task-meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-weight: 500;
  color: #666;
}

.meta-value {
  color: #333;
}

.task-description {
  margin-bottom: 20px;
}

.task-description h4 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.task-description p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

/* 任务文件和图片样式 */
.task-files,
.task-images {
  margin-bottom: 20px;
}

.task-files h4,
.task-images h4 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.file-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  font-size: 14px;
}

.file-item:hover {
  background-color: #e9ecef;
  text-decoration: none;
}

.file-icon {
  color: #42b983;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.task-image-item,
.submit-image-item {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #eee;
}

.task-image-item:hover,
.submit-image-item:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 图片项容器，用于定位下载按钮 */
.image-item-container {
  position: relative;
  display: inline-block;
  margin: 0 10px 10px 0;
}

/* 图片下载按钮样式 */
.image-download-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
}

/* 鼠标悬停在图片上时显示下载按钮 */
.image-item-container:hover .image-download-btn {
  opacity: 1;
}

/* 下载按钮悬停效果 */
.image-download-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

/* 下载图标样式 */
.image-download-btn .el-icon {
  font-size: 16px;
}

/* 提交内容样式 */
.submit-content {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
  color: #333;
  line-height: 1.6;
}

/* 提交的文件和图片样式 */
.submit-files,
.submit-images {
  margin-top: 15px;
}

.submit-files h5,
.submit-images h5 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

/* 发布者区域 */
.publisher-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.publisher-section h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
}

/* 任务用户列表样式 */
.task-users-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.task-users-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-user-item {
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 任务提交记录样式 */
.task-submissions-section {
  margin-bottom: 30px;
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.submission-item {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.submission-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

/* 根据不同状态显示不同样式 */
.submission-status.status-ongoing {
  background-color: #e8f5e9;
  color: #42b983;
}

.submission-status.status-completed {
  background-color: #e3f2fd;
  color: #1976d2;
}

.submission-status.status-pending {
  background-color: #fff8e1;
  color: #ff9800;
}

.submission-time {
  font-size: 12px;
  color: #999;
}

.submission-content {
  margin-bottom: 15px;
}

.result-link a {
  color: #42b983;
  text-decoration: none;
}

.result-link a:hover {
  text-decoration: underline;
}

.no-result {
  color: #999;
  font-style: italic;
}

.no-score {
  color: #999;
  font-size: 14px;
}

.submission-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 提交区域 */
.submit-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.submit-section h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
}

.submit-form {
  margin-bottom: 30px;
}

.user-submission-info {
  margin-top: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.user-submission-info h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.submission-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.submission-info-item:last-child {
  margin-bottom: 0;
}

.submission-info-item .label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.submission-info-item .value {
  color: #333;
}

/* 空状态和加载状态 */
.loading-container,
.error-container,
.empty-submissions {
  padding: 40px 0;
  text-align: center;
}

/* 发布者操作按钮样式 */
.publisher-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-detail-container {
    padding: 10px;
  }
  
  .task-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .task-meta-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .submission-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .submission-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .score-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .publisher-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>