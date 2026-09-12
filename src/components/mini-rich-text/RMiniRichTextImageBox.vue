<script setup lang="ts">
  defineOptions({ name: 'RMiniRichTextImageBox' })

  defineProps<{
    box: {
      visible: boolean
      left: number
      top: number
      width: number
      height: number
    }
  }>()

  const emit = defineEmits<{
    resizeStart: [event: MouseEvent]
  }>()
</script>

<template>
  <div
    v-if="box.visible"
    class="r-mini-rich-editor__image-box"
    :style="{
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    }"
  >
    <button
      type="button"
      class="r-mini-rich-editor__image-handle"
      title="拖拽调整图片大小"
      @mousedown="emit('resizeStart', $event)"
    />
  </div>
</template>
