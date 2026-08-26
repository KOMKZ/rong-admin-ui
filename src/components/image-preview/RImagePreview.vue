<script setup lang="ts">
  import { computed } from 'vue'
  import { NImage, NImageGroup } from 'naive-ui'

  defineOptions({ name: 'RImagePreview' })

  const props = withDefaults(
    defineProps<{
      urls?: string[]
      width?: number
      height?: number
      objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
    }>(),
    {
      urls: () => [],
      width: 96,
      height: 96,
      objectFit: 'cover',
    },
  )

  const validUrls = computed(() => props.urls.map((url) => url.trim()).filter(Boolean))
</script>

<template>
  <div v-if="validUrls.length" class="r-image-preview">
    <NImageGroup>
      <NImage
        v-for="url in validUrls"
        :key="url"
        :src="url"
        :width="width"
        :height="height"
        :object-fit="objectFit"
        class="r-image-preview__image"
        alt="反馈图片"
      />
    </NImageGroup>
  </div>
  <span v-else class="r-image-preview__empty">无</span>
</template>

<style scoped>
  .r-image-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .r-image-preview__image {
    overflow: hidden;
    border: 1px solid var(--ra-border-color, #e5e7eb);
    border-radius: 8px;
    background: var(--ra-fill-color-light, #f5f7fa);
    cursor: zoom-in;
  }

  .r-image-preview__empty {
    color: var(--ra-text-color-3, #9ca3af);
  }
</style>
