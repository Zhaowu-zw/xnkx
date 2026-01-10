<template>
  <div class="tab-content user-tasks" v-if="!isNormalUser">
    <div class="task-filter">
      <button class="filter-btn" :class="{ active: taskFilter === 'all' }" @click="taskFilter = 'all'">全部任务</button>
      <button class="filter-btn" :class="{ active: taskFilter === 'ongoing' }" @click="taskFilter = 'ongoing'">进行中</button>
      <button class="filter-btn" :class="{ active: taskFilter === 'completed' }" @click="taskFilter = 'completed'">已完成</button>
      <button class="filter-btn" :class="{ active: taskFilter === 'pending' }" @click="taskFilter = 'pending'">已结束</button>
      <el-button round :icon="Plus" @click="$emit('create')" v-if="isFinite" class="create-btn">发布任务</el-button>
    </div>

    <div class="task-list">
      <div 
        class="task-item" 
        v-for="item in localFilteredTasks" 
        :key="item.id"
        :class="clickable"
        @click="goToTaskDetail(item.id)"
      >
        <div class="task-tag" :class="getTaskTagClass(item)">{{ getTaskStatusText(item) }}</div>
        <div class="task-content">
          <div class="task-header">
            <h3 class="task-title">{{ item.title }}</h3>
            <span class="task-time">任务期限：{{ formatDeadline(item.deadline) }}</span>
          </div>

          <div class="task-detail">
            <p class="task-desc"><i class="icon-desc"></i> {{ item.description }}</p>
            <div class="task-meta">
              <span class="meta-item"> <i class="icon-type"></i> 任务类型：{{ item.task_type === 'group' ? '小组任务' : '社团任务' }}</span>
              <span class="meta-item" v-if="item.task_type === 'group'"> <i class="icon-group"></i> 所属小组：{{ groupNameMap[item.group_id] || '未知小组' }}</span>
              <span class="meta-item"> <i class="icon-criteria"></i> 考核标准：{{ item.assessment_criteria }}</span>
              <span class="meta-item"> <i class="icon-publisher"></i> 发布者：{{ item.publisher_info?.nickname || item.publisher_info?.username || '未知' }}</span>
            </div>
          </div>

          <div class="task-actions">
            <el-button type="primary" :icon="View" size="small" class="view-task-btn" @click.stop="goToTaskDetail(item.id)">查看详情</el-button>
          </div>
        </div>
      </div>

      <div v-if="localFilteredTasks.length === 0" class="task-empty">暂无匹配任务</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, View } from '@element-plus/icons-vue'
import { ElButton } from 'element-plus'

const router = useRouter()

const props = defineProps({
  filteredTasks: { type: Array, default: () => [] },
  isFinite: { type: Boolean, default: false },
  isNormalUser: { type: Boolean, default: false },
  groupNameMap: { type: Object, default: () => ({}) },
  userId: { type: [Number, String], default: null }
})

defineEmits(['create','edit','mark-complete','delete-task'])

// 跳转到任务详情页面
const goToTaskDetail = (taskId) => {
  router.push(`/task/detail/${taskId}`)
}

const taskFilter = ref('all')

const localFilteredTasks = computed(() => {
  const list = props.filteredTasks || []
  if (taskFilter.value === 'all') return list
  return list.filter(item => {
    switch (taskFilter.value) {
      case 'ongoing': return item.user_task_status === 'ongoing'
      case 'completed': return item.user_task_status === 'completed'
      case 'pending': return item.user_task_status === 'pending'
      default: return true
    }
  })
})


// console.log(localFilteredTasks.value);

const getTaskStatusText = (task) => {
  switch (task.user_task_status) {
    case 'ongoing': return '进行中'
    case 'completed': return '已完成'
    case 'pending': return '已结束'
    default: return '未知状态'
  }
}

const getTaskTagClass = (task) => {
  switch (task.user_task_status) {
    case 'ongoing': return 'tag-ongoing'
    case 'completed': return 'tag-completed'
    case 'pending': return 'tag-pending'
    default: return 'tag-ongoing'
  }
}

const formatDeadline = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

// 调试：监听localFilteredTasks变化
watch(() => localFilteredTasks.value, (newValue) => {
  // console.log('localFilteredTasks changed:', newValue)
  // 检查publisher_info字段
  if (newValue.length > 0) {
    // console.log('First task publisher_info:', newValue[0].publisher_info)
  }
}, { deep: true })




// 调试：组件挂载后检查localFilteredTasks
onMounted(() => {
  // console.log('Component mounted, localFilteredTasks:', localFilteredTasks.value)
  // 检查publisher_info字段
  if (localFilteredTasks.value.length > 0) {
    // console.log('First task publisher_info:', localFilteredTasks.value[0].publisher_info)
  }
})
</script>

<style scoped>
.user-tasks { padding: 1rem }

.task-filter {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1.2rem;
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

  .create-btn {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    padding: 0.3rem 0.8rem;
    background-color: #42b983;
    color: #fff;
    border: 1px solid #42b983;
    border-radius: 20px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background-color: #359469;
      border-color: #359469;
    }

    svg,
    i {
      width: 1em;
      height: 1em;
      line-height: 1;
    }
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-item {
  border: 1px solid #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    border-color: #42b983;
  }

  .task-tag {
    padding: 0.2rem 0.8rem;
    font-size: 0.75rem;
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

  .task-content {
    padding: 1rem;
  }

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.6rem;
    flex-wrap: wrap;
    gap: 0.4rem;

    .task-title {
      font-size: 1rem;
      color: #2c3e50;
      margin: 0;
    }

    .task-time {
      font-size: 0.8rem;
      color: #666;
    }
  }

  .task-detail {
    margin-bottom: 0.8rem;

    .task-desc {
      font-size: 0.85rem;
      color: #333;
      margin: 0 0 0.6rem;
      line-height: 1.5;
      display: flex;
      align-items: flex-start;
      gap: 0.4rem;

      i {
        color: #42b983;
        margin-top: 2px;
      }
    }

    .task-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.8rem;
      color: #666;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.2rem;

        i {
          color: #999;
        }
      }
    }
  }

  .task-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
  }

  .action-btn {
    padding: 0.3rem 0.8rem;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .report-btn {
    background-color: #f0f7f3;
    color: #42b983;
  }

  .complete-btn {
    background-color: #42b983;
    color: #fff;
  }

  .view-btn {
    background-color: #f5f5f5;
    color: #666;
  }

  .accept-btn {
    background-color: #42b983;
    color: #fff;
  }

  .reject-btn {
    background-color: #fef2f2;
    color: #ef4444;
  }

  .action-btn:hover {
    opacity: 0.9;
    transform: translateY(-2px);
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

.task-empty {
  text-align: center;
  padding: 1.5rem 0;
  color: #999;
}

@media (max-width: 768px) {
  .task-meta {
    flex-direction: column;
    gap: 0.4rem;
  }

  .task-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}

</style>
