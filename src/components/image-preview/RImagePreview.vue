<script setup lang="ts">
  import { computed } from 'vue'
  import { NImage, NImageGroup } from 'naive-ui'

  defineOptions({ name: 'RImagePreview' })

  const props = withDefaults(
    defineProps<{
      urls?: string[]
      /** 点击放大使用的原图列表；缺省回落到 urls。缩略图与放大图按索引一一对应。 */
      previewUrls?: string[]
      width?: number
      height?: number
      objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
    }>(),
    {
      urls: () => [],
      previewUrls: undefined,
      width: 96,
      height: 96,
      objectFit: 'cover',
    },
  )

  const validUrls = computed(() => props.urls.map((url) => url.trim()).filter(Boolean))

  /** 缩略图过滤空值后与原始列表的索引可能错位，放大目标按缩略图在原列表中的位置取值。 */
  function previewSrcAt(displayUrl: string): string {
    const sourceIndex = props.urls.indexOf(displayUrl)
    if (sourceIndex < 0) return displayUrl
    return props.previewUrls?.[sourceIndex]?.trim() || displayUrl
  }
</script>

<template>
  <div v-if="validUrls.length" class="r-image-preview">
    <NImageGroup>
      <NImage
        v-for="url in validUrls"
        :key="url"
        :src="url"
        :preview-src="previewSrcAt(url)"
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
    border-radius: var(--ra-radius-md);
    background: var(--ra-fill-color-light, #f5f7fa);
    cursor: zoom-in;
  }

  .r-image-preview__empty {
    color: var(--ra-text-color-3, #9ca3af);
  }
</style>
