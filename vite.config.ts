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
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue', 'vue-router', 'pinia'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          pinia: 'Pinia',
        },
      },
    },
  },
})
