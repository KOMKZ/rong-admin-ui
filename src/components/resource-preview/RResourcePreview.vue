<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { NModal } from 'naive-ui'
  import RIcon from '../icon/RIcon.vue'
  import type { DetectedResource } from './types'

  defineOptions({ name: 'RResourcePreview' })

  const props = withDefaults(
    defineProps<{
      resources?: DetectedResource[]
      maxInline?: number
    }>(),
    {
      resources: () => [],
      maxInline: 48,
    },
  )

  const emit = defineEmits<{
    preview: [resource: DetectedResource]
    copy: [resource: DetectedResource]
    open: [resource: DetectedResource]
  }>()

  const activeResource = ref<DetectedResource | null>(null)
  const previewVisible = ref(false)
  const visibleResources = computed(() => props.resources.slice(0, props.maxInline))
  const overflowCount = computed(() =>
    Math.max(0, props.resources.length - visibleResources.value.length),
  )

  function preview(resource: DetectedResource): void {
    if (!resource.previewable) return
    activeResource.value = resource
    previewVisible.value = true
    emit('preview', resource)
  }

  async function copy(resource: DetectedResource): Promise<void> {
    try {
      await navigator.clipboard?.writeText(resource.url || resource.value)
    } catch {
      /* Clipboard can be unavailable in restricted browsers. */
    }
    emit('copy', resource)
  }

  function open(resource: DetectedResource): void {
    if (!resource.url) return
    window.open(resource.url, '_blank', 'noopener,noreferrer')
    emit('open', resource)
  }

  function onItemKeydown(event: KeyboardEvent, resource: DetectedResource): void {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    preview(resource)
  }

  function iconName(resource: DetectedResource): string {
    if (resource.kind === 'image') return 'image'
    if (resource.kind === 'video') return 'video'
    return 'file-text'
  }
</script>

<template>
  <section v-if="resources.length" class="r-resource-preview" data-testid="resource-preview">
    <div
      v-for="resource in visibleResources"
      :key="resource.id"
      class="r-resource-preview__item"
      :class="[
        `r-resource-preview__item--${resource.kind}`,
        { 'is-disabled': !resource.previewable },
      ]"
      :role="resource.previewable ? 'button' : undefined"
      :tabindex="resource.previewable ? 0 : undefined"
      :title="resource.value"
      data-testid="resource-preview-item"
      @click="preview(resource)"
      @keydown="onItemKeydown($event, resource)"
    >
      <span class="r-resource-preview__thumb">
        <img
          v-if="resource.kind === 'image' && resource.url"
          :src="resource.url"
          :alt="resource.label"
          loading="lazy"
        />
        <span v-else class="r-resource-preview__media-icon">
          <RIcon :name="iconName(resource)" :size="18" />
        </span>
      </span>
      <span class="r-resource-preview__meta">
        <strong>{{
          resource.kind === 'image' ? '图片' : resource.kind === 'video' ? '视频' : '文件'
        }}</strong>
        <small>{{ resource.path }}</small>
      </span>
      <span class="r-resource-preview__actions" @click.stop>
        <button
          class="r-resource-preview__icon-button"
          type="button"
          :disabled="!resource.url"
          title="复制资源地址"
          @click="copy(resource)"
        >
          <RIcon name="copy" :size="14" />
        </button>
        <button
          class="r-resource-preview__icon-button"
          type="button"
          :disabled="!resource.url"
          title="新窗口打开"
          @click="open(resource)"
        >
          <RIcon name="external-link" :size="14" />
        </button>
      </span>
    </div>

    <span v-if="overflowCount" class="r-resource-preview__overflow"> +{{ overflowCount }} </span>
  </section>

  <n-modal
    v-model:show="previewVisible"
    preset="card"
    class="r-resource-preview__modal"
    :title="activeResource?.label || '资源预览'"
    style="width: min(920px, calc(100vw - 32px))"
  >
    <div v-if="activeResource" class="r-resource-preview__stage">
      <img
        v-if="activeResource.kind === 'image'"
        :src="activeResource.url"
        :alt="activeResource.label"
      />
      <video
        v-else-if="activeResource.kind === 'video'"
        :src="activeResource.url"
        controls
        playsinline
      />
      <div class="r-resource-preview__url">
        <span>{{ activeResource.value }}</span>
        <button type="button" @click="copy(activeResource)">
          <RIcon name="copy" :size="14" />
          <span>复制</span>
        </button>
        <button type="button" @click="open(activeResource)">
          <RIcon name="external-link" :size="14" />
          <span>打开</span>
        </button>
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
  .r-resource-preview {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ra-spacing-2);
    max-height: min(30vh, 280px);
    overflow: auto;
    padding: var(--ra-spacing-2);
    border: 1px solid var(--ra-color-border-light);
    border-radius: var(--ra-radius-md);
    background: var(--ra-color-bg-surface-secondary);
  }

  .r-resource-preview__item {
    display: grid;
    grid-template-columns: 44px minmax(96px, 1fr) auto;
    align-items: center;
    gap: var(--ra-spacing-2);
    min-width: 220px;
    max-width: 320px;
    padding: var(--ra-spacing-1);
    border: 1px solid var(--ra-color-border-default);
    border-radius: var(--ra-radius-md);
    background: var(--ra-color-bg-surface);
    color: var(--ra-color-text-primary);
    text-align: left;
    cursor: pointer;
  }

  .r-resource-preview__item:hover:not(:disabled) {
    border-color: var(--ra-color-border-interactive);
  }

  .r-resource-preview__item:focus-visible,
  .r-resource-preview__icon-button:focus-visible,
  .r-resource-preview__url button:focus-visible {
    outline: 2px solid var(--ra-color-focus-ring);
    outline-offset: 2px;
  }

  .r-resource-preview__item.is-disabled {
    cursor: default;
    opacity: 0.72;
  }

  .r-resource-preview__thumb {
    display: flex;
    width: 44px;
    height: 44px;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: var(--ra-radius-sm);
    background: var(--ra-color-bg-code);
  }

  .r-resource-preview__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .r-resource-preview__media-icon {
    color: var(--ra-color-brand-primary);
  }

  .r-resource-preview__meta {
    display: grid;
    min-width: 0;
    gap: 2px;
  }

  .r-resource-preview__meta strong {
    color: var(--ra-color-text-primary);
    font-size: var(--ra-font-size-xs);
    font-weight: var(--ra-font-weight-semibold);
  }

  .r-resource-preview__meta small {
    overflow: hidden;
    color: var(--ra-color-text-tertiary);
    font-family: var(--ra-font-family-mono);
    font-size: var(--ra-font-size-xs);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .r-resource-preview__actions {
    display: inline-flex;
    gap: var(--ra-spacing-1);
  }

  .r-resource-preview__icon-button,
  .r-resource-preview__url button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ra-spacing-1);
    min-width: 28px;
    min-height: 28px;
    border: 1px solid var(--ra-color-border-default);
    border-radius: var(--ra-radius-sm);
    background: var(--ra-color-bg-surface);
    color: var(--ra-color-text-secondary);
    cursor: pointer;
  }

  .r-resource-preview__icon-button:disabled,
  .r-resource-preview__url button:disabled {
    color: var(--ra-color-text-quaternary);
    cursor: not-allowed;
  }

  .r-resource-preview__overflow {
    align-self: center;
    color: var(--ra-color-text-tertiary);
    font-size: var(--ra-font-size-xs);
  }

  .r-resource-preview__stage {
    display: grid;
    gap: var(--ra-spacing-3);
  }

  .r-resource-preview__stage img,
  .r-resource-preview__stage video {
    max-width: 100%;
    max-height: min(68vh, 720px);
    margin: 0 auto;
    border-radius: var(--ra-radius-md);
    background: var(--ra-color-bg-code);
  }

  .r-resource-preview__stage video {
    width: 100%;
  }

  .r-resource-preview__url {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: var(--ra-spacing-2);
    align-items: center;
    padding: var(--ra-spacing-2);
    border-radius: var(--ra-radius-sm);
    background: var(--ra-color-bg-surface-secondary);
  }

  .r-resource-preview__url span {
    overflow: hidden;
    color: var(--ra-color-text-secondary);
    font-family: var(--ra-font-family-mono);
    font-size: var(--ra-font-size-xs);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
