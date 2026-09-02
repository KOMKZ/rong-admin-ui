<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { NEmpty, NSpin, NTag } from 'naive-ui'
  import RIcon from '../icon/RIcon.vue'
  import RJsonResourceViewer from './RJsonResourceViewer.vue'
  import type { ArtifactPreviewItem } from './types'

  defineOptions({ name: 'RArtifactPreview' })

  const props = withDefaults(
    defineProps<{
      items?: ArtifactPreviewItem[]
      loading?: boolean
      statusText?: string
      emptyText?: string
      maxHeight?: number | string
    }>(),
    {
      items: () => [],
      loading: false,
      statusText: '',
      emptyText: '暂时没有产物',
      maxHeight: 560,
    },
  )

  const activeID = ref('')
  const visibleItems = computed(() => props.items ?? [])
  const activeItem = computed(() => {
    if (!visibleItems.value.length) return null
    return visibleItems.value.find((item) => item.id === activeID.value) ?? visibleItems.value[0]
  })
  const stageStyle = computed(() => ({
    maxHeight: normalizeSize(props.maxHeight),
  }))

  function select(item: ArtifactPreviewItem): void {
    activeID.value = item.id
  }

  function kind(item: ArtifactPreviewItem | null): 'image' | 'video' | 'audio' | 'json' {
    const mime = item?.mimeType?.toLowerCase() ?? ''
    if (mime.startsWith('image/')) return 'image'
    if (mime.startsWith('video/')) return 'video'
    if (mime.startsWith('audio/')) return 'audio'
    return 'json'
  }

  function iconName(item: ArtifactPreviewItem): string {
    const itemKind = kind(item)
    if (itemKind === 'audio') return 'volume-2'
    if (itemKind === 'json') return 'file-text'
    return itemKind
  }

  function title(item: ArtifactPreviewItem): string {
    return item.title || item.type || item.id
  }

  function previewValue(item: ArtifactPreviewItem | null): unknown {
    if (!item) return null
    return item.raw ?? item
  }

  function formatSize(size?: number): string {
    if (!size || size <= 0) return '-'
    const units = ['B', 'KB', 'MB', 'GB']
    let value = size
    let index = 0
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024
      index += 1
    }
    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
  }

  function normalizeSize(value?: number | string): string | undefined {
    if (value === undefined || value === null || value === '') return undefined
    return typeof value === 'number' ? `${value}px` : value
  }
</script>

<template>
  <section class="r-artifact-preview" data-testid="artifact-preview">
    <div v-if="statusText" class="r-artifact-preview__status">
      <n-tag size="small">{{ statusText }}</n-tag>
    </div>

    <n-spin v-if="loading" :show="loading">
      <div class="r-artifact-preview__loading">产物加载中...</div>
    </n-spin>

    <n-empty v-else-if="visibleItems.length === 0" :description="emptyText" />

    <div v-else class="r-artifact-preview__layout">
      <nav class="r-artifact-preview__list" aria-label="产物列表">
        <button
          v-for="item in visibleItems"
          :key="item.id"
          type="button"
          class="r-artifact-preview__item"
          :class="{ 'is-active': item.id === activeItem?.id }"
          @click="select(item)"
        >
          <RIcon :name="iconName(item)" :size="16" />
          <span>
            <strong>{{ title(item) }}</strong>
            <small>{{ item.mimeType || item.type || '-' }} · {{ formatSize(item.size) }}</small>
          </span>
        </button>
      </nav>

      <div class="r-artifact-preview__stage" :style="stageStyle">
        <template v-if="activeItem && activeItem.uri">
          <img
            v-if="kind(activeItem) === 'image'"
            :src="activeItem.uri"
            :alt="title(activeItem)"
            loading="lazy"
          />
          <video
            v-else-if="kind(activeItem) === 'video'"
            :src="activeItem.uri"
            controls
            playsinline
          />
          <audio v-else-if="kind(activeItem) === 'audio'" :src="activeItem.uri" controls />
          <RJsonResourceViewer
            v-else
            :title="title(activeItem)"
            :value="previewValue(activeItem)"
            :max-height="maxHeight"
          />
        </template>
        <RJsonResourceViewer
          v-else
          title="产物数据"
          :value="previewValue(activeItem)"
          :max-height="maxHeight"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
  .r-artifact-preview {
    display: grid;
    gap: var(--ra-spacing-3, 12px);
  }

  .r-artifact-preview__status {
    display: flex;
    justify-content: flex-start;
  }

  .r-artifact-preview__loading {
    min-height: 160px;
  }

  .r-artifact-preview__layout {
    display: grid;
    grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
    gap: var(--ra-spacing-3, 12px);
    min-height: 320px;
  }

  .r-artifact-preview__list {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: var(--ra-spacing-2, 8px);
    overflow: auto;
  }

  .r-artifact-preview__item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--ra-spacing-2, 8px);
    align-items: center;
    width: 100%;
    padding: var(--ra-spacing-2, 8px);
    border: 1px solid var(--ra-color-border-default, #d8e0ea);
    background: var(--ra-color-bg-surface, #fff);
    color: var(--ra-color-text-primary, #1f2a37);
    text-align: left;
    cursor: pointer;
  }

  .r-artifact-preview__item:hover,
  .r-artifact-preview__item.is-active {
    border-color: var(--ra-color-border-interactive, #2f75d6);
  }

  .r-artifact-preview__item strong,
  .r-artifact-preview__item small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .r-artifact-preview__item small {
    margin-top: 2px;
    color: var(--ra-color-text-secondary, #5f6f85);
  }

  .r-artifact-preview__stage {
    min-width: 0;
    overflow: auto;
    border: 1px solid var(--ra-color-border-light, #e6edf5);
    background: var(--ra-color-bg-surface-secondary, #f8fafc);
  }

  .r-artifact-preview__stage > img,
  .r-artifact-preview__stage > video {
    display: block;
    max-width: 100%;
    max-height: inherit;
    margin: 0 auto;
  }

  .r-artifact-preview__stage > audio {
    width: 100%;
    margin: var(--ra-spacing-4, 16px) 0;
  }

  @media (max-width: 768px) {
    .r-artifact-preview__layout {
      grid-template-columns: 1fr;
    }
  }
</style>
