import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      outDir: 'dist',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'app-core/index': resolve(__dirname, 'src/app-core/index.ts'),
        'app-plugin/index': resolve(__dirname, 'src/app-plugin/index.ts'),
        'app-layout/index': resolve(__dirname, 'src/app-layout/index.ts'),
        'app-router/index': resolve(__dirname, 'src/app-router/index.ts'),
        'app-permission/index': resolve(__dirname, 'src/app-permission/index.ts'),
        'app-request/index': resolve(__dirname, 'src/app-request/index.ts'),
        'app-auth/index': resolve(__dirname, 'src/app-auth/index.ts'),
        'app-config/index': resolve(__dirname, 'src/app-config/index.ts'),
        'app-preset/index': resolve(__dirname, 'src/app-preset/index.ts'),
        'theme/index': resolve(__dirname, 'src/theme/index.ts'),
        'components/data-table/index': resolve(__dirname, 'src/components/data-table/index.ts'),
        'components/form-renderer/index': resolve(__dirname, 'src/components/form-renderer/index.ts'),
        'components/modal-dialog/index': resolve(__dirname, 'src/components/modal-dialog/index.ts'),
        'components/file-upload/index': resolve(__dirname, 'src/components/file-upload/index.ts'),
        'components/query-table/index': resolve(__dirname, 'src/components/query-table/index.ts'),
        'components/crud-form-dialog/index': resolve(__dirname, 'src/components/crud-form-dialog/index.ts'),
        'components/layout/index': resolve(__dirname, 'src/components/layout/index.ts'),
        'components/showcase/index': resolve(__dirname, 'src/components/showcase/index.ts'),
        'components/primitives/index': resolve(__dirname, 'src/components/primitives/index.ts'),
        'components/filter-bar/index': resolve(__dirname, 'src/components/filter-bar/index.ts'),
        'components/table-toolbar/index': resolve(__dirname, 'src/components/table-toolbar/index.ts'),
        'components/descriptions-panel/index': resolve(__dirname, 'src/components/descriptions-panel/index.ts'),
        'components/pro-list/index': resolve(__dirname, 'src/components/pro-list/index.ts'),
        'components/step-form/index': resolve(__dirname, 'src/components/step-form/index.ts'),
        'components/page-skeleton/index': resolve(__dirname, 'src/components/page-skeleton/index.ts'),
        'components/batch-action-bar/index': resolve(__dirname, 'src/components/batch-action-bar/index.ts'),
        'components/form-table/index': resolve(__dirname, 'src/components/form-table/index.ts'),
        'components/password-strength/index': resolve(__dirname, 'src/components/password-strength/index.ts'),
        'components/check-card-group/index': resolve(__dirname, 'src/components/check-card-group/index.ts'),
        'components/check-button-group/index': resolve(__dirname, 'src/components/check-button-group/index.ts'),
        'components/code-verify/index': resolve(__dirname, 'src/components/code-verify/index.ts'),
        'components/icon-button/index': resolve(__dirname, 'src/components/icon-button/index.ts'),
        'components/icon/index': resolve(__dirname, 'src/components/icon/index.ts'),
        'components/stat-card/index': resolve(__dirname, 'src/components/stat-card/index.ts'),
        'components/kpi-grid/index': resolve(__dirname, 'src/components/kpi-grid/index.ts'),
        'components/drawer-form/index': resolve(__dirname, 'src/components/drawer-form/index.ts'),
        'components/empty-state/index': resolve(__dirname, 'src/components/empty-state/index.ts'),
        'components/result-state/index': resolve(__dirname, 'src/components/result-state/index.ts'),
        'components/command-palette/index': resolve(__dirname, 'src/components/command-palette/index.ts'),
        'components/notification-center/index': resolve(__dirname, 'src/components/notification-center/index.ts'),
        'components/pro-tree-editor/index': resolve(__dirname, 'src/components/pro-tree-editor/index.ts'),
        'components/markdown-preview/index': resolve(__dirname, 'src/components/markdown-preview/index.ts'),
        'components/markdown-editor/index': resolve(__dirname, 'src/components/markdown-editor/index.ts'),
        'components/rich-text-editor/index': resolve(__dirname, 'src/components/rich-text-editor/index.ts'),
        'components/data-grid/index': resolve(__dirname, 'src/components/data-grid/index.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
          'vue',
          'vue-router',
          'pinia',
          'naive-ui',
          'markdown-it',
          'highlight.js',
          'mermaid',
          /^@tiptap\//,
          'ag-grid-vue3',
          'ag-grid-community',
        ],
      output: {
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          pinia: 'Pinia',
          'naive-ui': 'NaiveUi',
        },
      },
    },
  },
})
