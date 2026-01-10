import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 创建主题状态管理
export default function useThemeStore() {
  // 强制默认为亮色主题
  const isDark = ref(false)
  
  // 初始化主题，确保应用亮色主题
  const initTheme = () => {
    // 每次进入都重置为亮色主题
    localStorage.setItem('adminTheme', 'light')
    
    // 立即应用亮色主题
    const root = document.documentElement
    
    // 更彻底地清除深色主题类，添加浅色主题类
    root.classList.remove('dark')
    root.classList.remove('dark-theme')
    root.classList.add('light')
    
    // 确保body和所有相关元素都没有深色主题类
    document.body.classList.remove('dark', 'dark-theme')
    
    // 移除所有可能的深色主题类
    const darkElements = document.querySelectorAll('.dark, .dark-theme')
    darkElements.forEach(el => {
      el.classList.remove('dark', 'dark-theme')
    })
  }
  
  // 切换主题
  const toggleTheme = () => {
    isDark.value = !isDark.value
    localStorage.setItem('adminTheme', isDark.value ? 'dark' : 'light')
    ElMessage.success(`已切换为${isDark.value ? '深色' : '亮色'}主题`)
  }

  // 监听主题变化，添加或移除dark类到html根元素和manager-body元素
  watch(isDark, (newValue) => {
    const root = document.documentElement
    const managerBody = document.querySelector('.manager-body')
    
    if (newValue) {
      // 添加深色主题类
      root.classList.add('dark')
      root.classList.add('dark-theme')
      root.classList.remove('light')
      
      // 同时给manager-body添加dark-theme类，兼容现有样式
      if (managerBody) {
        managerBody.classList.add('dark-theme')
      }
    } else {
      // 添加浅色主题类
      root.classList.remove('dark')
      root.classList.remove('dark-theme')
      root.classList.add('light')
      
      // 同时给manager-body移除dark-theme类，兼容现有样式
      if (managerBody) {
        managerBody.classList.remove('dark-theme')
      }
    }
  }, { immediate: true })
  
  // 在组件挂载后再次确保主题是亮色
  onMounted(() => {
    initTheme()
  })

  return {
    isDark,
    toggleTheme
  }
}
