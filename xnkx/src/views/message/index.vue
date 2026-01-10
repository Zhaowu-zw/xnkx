<template>
  <div class="tab-content user-messages">
    <div class="msg-header">
      <div class="msg-filter">
        <button class="filter-btn" :class="{ active: localFilter === 'all' }" @click="localFilter='all'">全部消息</button>
        <button class="filter-btn" :class="{ active: localFilter === 'system' }" @click="localFilter='system'">系统通知</button>
        <button class="filter-btn" :class="{ active: localFilter === 'task' }" @click="localFilter='task'">任务通知</button>
        <button class="filter-btn" :class="{ active: localFilter === 'approval' }" @click="localFilter='approval'">审批通知</button>
        <button class="filter-btn" :class="{ active: localFilter === 'recruit' }" @click="localFilter='recruit'">招新通知</button>
      </div>

      <div class="msg-actions">
        <el-button type="primary" size="small" @click="$emit('mark-all-read')" :disabled="unreadCount===0"><el-icon><Check /></el-icon></el-button>
        <el-button type="danger" size="small" @click="$emit('delete-all-read')" :disabled="readCount===0"><el-icon><Delete /></el-icon></el-button>
      </div>
    </div>

    <div class="msg-list">
      <div class="msg-swipe-item" v-for="notice in displayedNotices" :key="notice.id" @touchstart="handleTouchStart($event, notice.id)" @touchmove="handleTouchMove($event, notice.id)" @touchend="handleTouchEnd(notice.id)" :style="{ transform: `translateX(${swipeOffset[notice.id] || 0}px)` }">
        <div class="msg-item" :class="{ unread: !notice.is_read }">
          <div class="msg-avatar"><el-icon :size="20"><component :is="getNoticeIcon(notice.notice_type)"/></el-icon></div>
          <div class="msg-content">
            <div class="msg-header"><h4 class="msg-title">{{ getNoticeTitle(notice.notice_type) }}</h4><span class="msg-time">{{ formatTime(notice.send_time) }}</span></div>
            <p class="msg-desc">{{ notice.content }}</p>
            <!-- 纳新通知专用：添加查询纳新状态按钮 -->
            <div class="msg-actions" v-if="notice.notice_type === 'recruit'">
              <el-button type="primary" size="small" @click="handleQueryStatus">查询纳新状态</el-button>
            </div>
          </div>
        </div>
        <div class="msg-swipe-actions">
          <button class="swipe-btn mark-read-btn" v-if="!notice.is_read" @click="$emit('mark-read', notice.id)"><el-icon :size="16"><Check /></el-icon> 已读</button>
          <button class="swipe-btn delete-btn" v-if="notice.is_read" @click="$emit('delete', notice.id)"><el-icon :size="16"><Delete /></el-icon> 删除</button>
        </div>
      </div>

      <div v-if="displayedNotices.length===0" class="msg-empty">暂无{{ getFilterName() }}消息</div>
    </div>

    <!-- 纳新状态查询结果显示 -->
    <div class="recruit-status-section" v-if="showQueryResult">
      <h3 class="status-title">纳新状态查询结果</h3>
      
      <!-- 查询结果 -->
      <div class="status-result" v-if="recruitInfo">
        <div class="result-header">
          <h4>查询结果</h4>
          <el-tag :type="getStatusTagType" class="status-tag">{{ recruitInfo.first_review_status_desc ==='passed'?'通过':'驳回'}}</el-tag>
        </div>

        <div class="result-details">
          <p><span class="label">姓名：</span>{{ recruitInfo.name }}</p>
          <p><span class="label">学号：</span>{{ recruitInfo.sno }}</p>
          <p><span class="label">意向组别：</span>{{ recruitInfo.group_name }}</p>
          <p><span class="label">个人简介：</span>{{ recruitInfo.application_info }}</p>
          <p><span class="label">初审状态：</span>
            <span :class="recruitInfo.first_review_status === 'passed' ? 'status-pass' : recruitInfo.first_review_status === 'rejected' ? 'status-reject' : 'status-pending'">
              {{ recruitInfo.first_review_status === 'passed' ? '通过' : recruitInfo.first_review_status === 'rejected' ? '驳回' : '待审核' }}
            </span>
          </p>
          <p><span class="label">终审状态：</span>
            <span :class="recruitInfo.final_review_status === 'passed' ? 'status-pass' : recruitInfo.final_review_status === 'rejected' ? 'status-reject' : 'status-pending'">
              {{ recruitInfo.final_review_status === 'passed' ? '通过' : recruitInfo.final_review_status === 'rejected' ? '驳回' : '待审核' }}
            </span>
          </p>
          <p class="result-note" v-if="recruitInfo.first_review_status === 'pending' || recruitInfo.final_review_status === 'pending'">
            审核结果将在3个工作日内通过短信通知，请耐心等待
          </p>
        </div>
        
        <!-- 重置按钮 -->
        <div class="result-actions">
          <el-button type="default" @click="resetQuery">关闭结果</el-button>
        </div>
      </div>
      
      <!-- 查询失败或无结果提示 -->
      <div class="status-result" v-else-if="showQueryResult">
        <div class="no-result">
          <p>未查询到您的报名信息</p>
          <el-button type="default" @click="resetQuery">关闭</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Check, Delete } from '@element-plus/icons-vue'
import { ElButton, ElTag, ElMessage } from 'element-plus'
import useRecruitStore from '@/stores/recruit'
import useUserStore from '@/stores/user'

const props = defineProps({
  notices: { type: Array, default: () => [] },
  unreadCount: { type: Number, default: 0 },
  readCount: { type: Number, default: 0 }
})

defineEmits(['mark-all-read','delete-all-read','mark-read','delete'])

const localFilter = ref('all')
const swipeOffset = ref({})

// 纳新状态查询相关
const recruitStore = useRecruitStore()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo || {})

// 查询结果显示状态
const showQueryResult = ref(false)
const tempRecruitInfo = ref(null)
const recruitInfo = computed(() => tempRecruitInfo.value)

// 根据接口状态返回Tag类型
const getStatusTagType = computed(() => {
  if (!recruitInfo.value) return 'info'
  switch (recruitInfo.value.first_review_status) {
    case 'pending':
      return 'info'
    case 'passed':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'info'
  }
})

const displayedNotices = computed(() => {
  if (localFilter.value === 'all') return props.notices || []
  return (props.notices || []).filter(n => n.notice_type === localFilter.value)
})

const handleTouchStart = (e, id) => { swipeOffset.value[id] = 0; touchStartX[id]= e.touches[0].clientX; touchStartTime[id]=Date.now() }
const touchStartX = {}
const touchStartTime = {}
const handleTouchMove = (e, id) => { const moveX = e.touches[0].clientX - touchStartX[id]; if (moveX < 0) swipeOffset.value[id] = Math.max(moveX, -100) }
const handleTouchEnd = (id) => { const endX = swipeOffset.value[id] || 0; const t = Date.now() - (touchStartTime[id]||0); swipeOffset.value[id] = (endX < -60 || (endX < -30 && t < 300)) ? -100 : 0 }

const getNoticeIcon = (type) => {
  const map = { system: 'Bell', task: 'Document', approval: 'Check', recruit: 'UserFilled' }
  return map[type] || 'Bell'
}

const getNoticeTitle = (type) => ({ system: '系统通知', task: '任务通知', approval: '审批通知', recruit: '招新通知' }[type] || '系统通知')

const formatTime = (timeStr) => { if (!timeStr) return ''; const d = new Date(timeStr); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }

const getFilterName = () => ({ all: '', system: '系统', task: '任务', approval: '审批', recruit: '招新' }[localFilter.value] || '')

const unreadCount = computed(()=>props.unreadCount)
const readCount = computed(()=>props.readCount)

// 查询纳新状态
const queryStatus = async () => {
  // 直接使用userInfo中的学号和手机号作为查询参数
  const queryParams = {
    sno: userInfo.value.student_number || '',
    iphone: userInfo.value.telephone || ''
  }

  // 验证必要参数
  if (!queryParams.sno || !queryParams.iphone) {
    ElMessage.warning('请先完善个人信息，包括学号和手机号')
    return
  }

  try {
    // 调用接口获取数据
    const res = await recruitStore.GetMyRecruitInfo(queryParams)
    if (res && res.data) {
      tempRecruitInfo.value = res.data
      showQueryResult.value = true
      ElMessage.success('查询成功')
    } else {
      tempRecruitInfo.value = null
      showQueryResult.value = false
      ElMessage.warning('未查询到您的报名信息')
    }
  } catch (error) {
    showQueryResult.value = false
    tempRecruitInfo.value = null
    ElMessage.error('查询失败，请稍后重试')
    console.error('查询失败：', error)
  }
}

// 重置查询结果
const resetQuery = () => {
  showQueryResult.value = false
  tempRecruitInfo.value = null
}

// 处理查询按钮点击
const handleQueryStatus = () => {
  queryStatus()
}

</script>

<style scoped>
.user-messages { padding: 1rem }

.msg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
  gap: 0.8rem;

  .msg-actions {
    display: flex;
    gap: 8px;
  }
}

.msg-filter {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;

  .filter-btn {
    padding: 0.3rem 0.8rem;
    background: none;
    border: 1px solid #eee;
    border-radius: 20px;
    font-size: 0.85rem;
    color: #666;
    cursor: pointer;
    transition: all 0.3s ease;

    &.active {
      background-color: #42b983;
      color: #fff;
      border-color: #42b983;
    }

    &:hover {
      border-color: #42b983;
      color: #42b983;
    }
  }
}

.msg-swipe-item {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 0.6rem;
  transition: transform 0.3s ease;
  height: auto;

  &:not(:hover) .msg-swipe-actions {
    visibility: hidden;
  }

  &:hover .msg-swipe-actions {
    visibility: visible;
  }
}

.msg-item {
  display: flex;
  gap: 0.8rem;
  padding: 0.8rem;
  background-color: #fff;
  border-radius: 8px;
  transition: all 0.3s ease;
  min-height: 80px;

  &.unread {
    background-color: #f9fafb;
    border-left: 3px solid #42b983;
  }

  &:hover {
    background-color: #fafafa;
  }

  .msg-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #f0f7f3;
    color: #42b983;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .el-icon {
      font-size: 18px;
    }
  }

  .msg-content {
    flex: 1;
    overflow: hidden;
  }

  .msg-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.2rem;
    padding: 0;

    .msg-title {
      font-size: 0.9rem;
      color: #2c3e50;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .msg-time {
      font-size: 0.7rem;
      color: #999;
    }
  }

  .msg-desc {
    font-size: 0.8rem;
    color: #666;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }
}

.msg-swipe-actions {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: center;
  z-index: 1;
  visibility: hidden;
}

.swipe-btn {
  height: 100%;
  padding: 0 1.2rem;
  border: none;
  color: #fff;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.2rem;

  .el-icon {
    font-size: 16px;
  }
}

.mark-read-btn {
  background-color: #42b983;
  width: 80px;
}

.delete-btn {
  background-color: #ef4444;
  width: 80px;
}

.swipe-btn:hover {
  opacity: 0.9;
}

.msg-empty {
  text-align: center;
  padding: 2rem 0;
  color: #999;
  font-size: 0.9rem;
}

/* 纳新状态查询样式 */
.recruit-status-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.status-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #42b983;
}

.status-form {
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.inline-group {
  flex: 1;
  min-width: 200px;
}

.query-btn-group {
  display: flex;
  gap: 0.5rem;
}

.query-button {
  background-color: #42b983 !important;
  border-color: #42b983 !important;
}

.query-button:hover {
  background-color: #359469 !important;
  border-color: #359469 !important;
}

.status-result {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
  border-left: 4px solid #42b983;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.result-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.status-tag {
  font-size: 0.8rem;
  font-weight: 500;
}

.result-details {
  color: #4b5563;
  line-height: 1.6;
}

.result-details p {
  margin: 0.5rem 0;
}

.result-details .label {
  font-weight: 500;
  color: #374151;
  display: inline-block;
  width: 80px;
}

.result-note {
  margin-top: 1rem !important;
  padding: 0.8rem;
  background-color: #f0fdf4;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #15803d;
  border: 1px solid #dcfce7;
}

/* 状态样式 */
.status-pass {
  color: #15803d;
  font-weight: 500;
}

.status-reject {
  color: #dc2626;
  font-weight: 500;
}

.status-pending {
  color: #6b7280;
  font-weight: 500;
}

/* 消息操作按钮样式 */
.msg-actions {
  margin-top: 0.8rem;
  display: flex;
  gap: 0.5rem;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .inline-group {
    min-width: auto;
  }
  
  .query-btn-group {
    justify-content: stretch;
  }
  
  .query-btn-group .el-button {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .msg-filter, .task-filter { gap: 0.4rem }
  .task-actions { flex-wrap: wrap; justify-content: flex-start }
  .msg-item { padding: 0.6rem; gap: 0.6rem }
  .msg-avatar { width: 36px; height: 36px }
}

</style>
