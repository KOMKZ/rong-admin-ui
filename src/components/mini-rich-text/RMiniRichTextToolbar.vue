<script setup lang="ts">
  import { ref } from 'vue'
  import type { MiniRichTextBlockTag } from './types'

  defineOptions({ name: 'RMiniRichTextToolbar' })

  defineProps<{
    colorValue: string
    colorPalette: string[]
    imageSelected?: boolean
    imageUploadEnabled?: boolean
    uploadingImage?: boolean
    showFullscreen?: boolean
  }>()

  const emit = defineEmits<{
    command: [command: string]
    formatBlock: [tag: MiniRichTextBlockTag]
    align: [align: 'left' | 'center' | 'right']
    textColor: [color: string]
    imageWidth: [width: string]
    imageUpload: []
    fullscreen: []
  }>()

  const colorPanelOpen = ref(false)

  function handleColorInput(event: Event): void {
    emit('textColor', (event.target as HTMLInputElement).value)
  }

  function applyColor(color: string): void {
    emit('textColor', color)
    colorPanelOpen.value = false
  }

  function handleImageWidthChange(event: Event): void {
    const target = event.target as HTMLSelectElement
    if (target.value) emit('imageWidth', target.value)
    target.value = ''
  }
</script>

<template>
  <div class="r-mini-rich-editor__toolbar" aria-label="小程序富文本工具栏">
    <button type="button" title="段落" @click="emit('formatBlock', 'p')">P</button>
    <button type="button" title="二级标题" @click="emit('formatBlock', 'h2')">H2</button>
    <button type="button" title="三级标题" @click="emit('formatBlock', 'h3')">H3</button>
    <button type="button" title="加粗" @click="emit('command', 'bold')">B</button>
    <button type="button" title="斜体" @click="emit('command', 'italic')">I</button>
    <button type="button" title="下划线" @click="emit('command', 'underline')">U</button>
    <button type="button" title="无序列表" @click="emit('command', 'insertUnorderedList')">
      UL
    </button>
    <button type="button" title="有序列表" @click="emit('command', 'insertOrderedList')">OL</button>
    <button type="button" title="引用" @click="emit('formatBlock', 'blockquote')">“”</button>
    <button type="button" title="分割线" @click="emit('command', 'insertHorizontalRule')">
      HR
    </button>
    <button type="button" title="链接" @click="emit('command', 'createLink')">Link</button>
    <button type="button" title="左对齐" @click="emit('align', 'left')">L</button>
    <button type="button" title="居中" @click="emit('align', 'center')">C</button>
    <button type="button" title="右对齐" @click="emit('align', 'right')">R</button>
    <div class="r-mini-rich-editor__color-picker">
      <button
        type="button"
        class="r-mini-rich-editor__color-trigger"
        title="文字颜色"
        @click="colorPanelOpen = !colorPanelOpen"
      >
        <span>Color</span>
        <span class="r-mini-rich-editor__current-color" :style="{ backgroundColor: colorValue }" />
      </button>
      <div v-if="colorPanelOpen" class="r-mini-rich-editor__color-panel">
        <div class="r-mini-rich-editor__palette" aria-label="常用文字颜色">
          <button
            v-for="color in colorPalette"
            :key="color"
            type="button"
            class="r-mini-rich-editor__swatch"
            :style="{ backgroundColor: color }"
            :title="`文字颜色 ${color}`"
            @click="applyColor(color)"
          />
        </div>
        <label class="r-mini-rich-editor__native-color" title="自定义文字颜色">
          <span>自定义</span>
          <input :value="colorValue" type="color" @input="handleColorInput" />
        </label>
      </div>
    </div>
    <select
      class="r-mini-rich-editor__select"
      title="图片宽度"
      :disabled="!imageSelected"
      @change="handleImageWidthChange"
    >
      <option value="">图片宽度</option>
      <option value="25%">25%</option>
      <option value="50%">50%</option>
      <option value="75%">75%</option>
      <option value="100%">100%</option>
    </select>
    <button
      type="button"
      title="上传图片"
      :disabled="uploadingImage || !imageUploadEnabled"
      @click="emit('imageUpload')"
    >
      {{ uploadingImage ? '...' : 'Img' }}
    </button>
    <button
      v-if="showFullscreen"
      type="button"
      class="r-mini-rich-editor__toolbar-spacer"
      title="全屏编辑和预览"
      @click="emit('fullscreen')"
    >
      Full
    </button>
  </div>
</template>
