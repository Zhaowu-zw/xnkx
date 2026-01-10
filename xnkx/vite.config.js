import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
import imagemin from 'vite-plugin-imagemin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver(
        {
          importStyle: 'css', // 自动导入组件对应的 sCSS 样式（关键！）
        }
      )],
    }),
    Components({
      resolvers: [ElementPlusResolver({
        importStyle: 'css', // 自动导入组件对应的 CSS 样式（关键！）
      })],
    }),
    // 启用 gzip 压缩
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 10kb 以上的文件才会被压缩
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // 优化图片
    imagemin({
      gifsicle: { // 压缩 gif
        optimizationLevel: 3,
      },
      optipng: { // 压缩 png
        optimizationLevel: 7,
      },
      mozjpeg: { // 压缩 jpeg
        quality: 85,
      },
      svgo: { // 压缩 svg
        plugins: [
          { name: 'removeViewBox' },
          { name: 'removeEmptyAttrs', active: false },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 构建优化配置
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 优化静态资源命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // 代码分割策略
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-vendor';
            } else if (id.includes('element-plus')) {
              return 'element-plus';
            } else if (id.includes('echarts')) {
              return 'echarts';
            } else if (id.includes('axios') || id.includes('dayjs') || id.includes('lodash')) {
              return 'utils';
            }
            // 优化其他第三方库分割
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
    // 启用压缩
    minify: 'terser',
    // 配置 terser 压缩选项
    terserOptions: {
      compress: {
        // 移除 console
        drop_console: true,
        // 移除 debugger
        drop_debugger: true,
        // 移除未使用的变量和函数
        unused: true,
        // 合并连续的变量声明
        collapse_vars: true,
      },
      // 混淆变量名
      mangle: {
        toplevel: true,
      },
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 生成 sourcemap
    sourcemap: false,
    // 控制输出文件大小警告的阈值
    chunkSizeWarningLimit: 1000,
    // 启用 brotli 压缩
    brotliSize: true,
    // 优化构建速度
    incremental: true,
    // 启用多线程构建
    parallel: true,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'element-plus', 'axios', 'dayjs'],
    // 排除不需要预构建的依赖
    exclude: ['echarts'],
    // 强制预构建所有依赖
    force: true,
    // 优化扫描速度
    entries: ['src/main.js'],
  },
  // 配置 Sass 使用现代 API
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern'
      },
      sass: {
        api: 'modern'
      }
    },
    // 启用 CSS 压缩
    devSourcemap: false,
  },
  // 服务器优化
  server: {
    // 启用 gzip 压缩
    compress: true,
    // 优化热更新
    hmr: {
      overlay: false,
    },
  },
})
