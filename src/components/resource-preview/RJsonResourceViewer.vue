<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { NModal } from 'naive-ui'
  import RIcon from '../icon/RIcon.vue'
  import RJsonViewer from '../json-viewer/RJsonViewer.vue'
  import RResourcePreview from './RResourcePreview.vue'
  import { detectJsonResources } from './resource-detect'
  import type { DetectedResource, ResourcePreviewUrlResolver } from './types'

  defineOptions({ name: 'RJsonResourceViewer' })

  const props = withDefaults(
    defineProps<{
      value?: unknown
      title?: string
      size?: 'small' | 'medium' | 'large'
      height?: number | string
      maxHeight?: number | string
      emptyText?: string
      copyable?: boolean
      expandable?: boolean
      showHeader?: boolean
      showResources?: boolean
      inlineResources?: boolean
      maxResources?: number
      resourceUrlResolver?: ResourcePreviewUrlResolver
    }>(),
    {
      title: 'JSON',
      size: 'medium',
      height: undefined,
      maxHeight: 220,
      emptyText: '-',
      copyable: true,
      expandable: true,
      showHeader: true,
      showResources: true,
      inlineResources: false,
      maxResources: 80,
      resourceUrlResolver: undefined,
    },
  )

  const emit = defineEmits<{
    copy: [value: string]
    expand: [value: string]
    'resource-preview': [resource: DetectedResource]
    'resource-copy': [resource: DetectedResource]
    'resource-open': [resource: DetectedResource]
  }>()

  const expanded = ref(false)
  const normalized = computed(() => normalizeJsonValue(props.value, props.emptyText))
  const displayText = computed(() => normalized.value.text)
  const isEmpty = computed(() => normalized.value.empty)
  const shouldResolveResources = computed(() => props.inlineResources || expanded.value)
  const resources = computed(() =>
    props.showResources && shouldResolveResources.value
      ? detectJsonResources(props.value, {
          maxItems: props.maxResources,
          resolveUrl: props.resourceUrlResolver,
        })
      : [],
  )
  const metaText = computed(() => {
    if (isEmpty.value) return 'empty'
    const bytes = new Blob([displayText.value]).size
    const resourceText = resources.value.length ? ` · ${resources.value.length} 资源` : ''
    return `${normalized.value.json ? 'JSON' : 'Text'} · ${displayText.value.split('\n').length} 行 · ${bytes} B${resourceText}`
  })

  function open(): void {
    if (!props.expandable || isEmpty.value) return
    expanded.value = true
    emit('expand', displayText.value)
  }

  async function copy(): Promise<void> {
    if (!props.copyable || isEmpty.value) return
    try {
      await navigator.clipboard?.writeText(displayText.value)
    } catch {
      /* Clipboard can be unavailable in tests or restricted browsers. */
    }
    emit('copy', displayText.value)
  }

  function normalizeSize(value?: number | string): string | undefined {
    if (value === undefined || value === null || value === '') return undefined
    return typeof value === 'number' ? `${value}px` : value
  }

  function normalizeJsonValue(value: unknown, emptyText: string) {
    if (value === null || value === undefined || value === '') {
      return { text: emptyText, empty: true, json: false }
    }
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed || trimmed === '{}') return { text: emptyText, empty: true, json: false }
      try {
        return { text: JSON.stringify(JSON.parse(trimmed), null, 2), empty: false, json: true }
      } catch {
        return { text: value, empty: false, json: false }
      }
    }
    try {
      return { text: JSON.stringify(value, null, 2), empty: false, json: true }
    } catch {
      return { text: String(value), empty: false, json: false }
    }
  }
</script>

<template>
  <section
    class="r-json-resource-viewer"
    :class="[
      `r-json-resource-viewer--${size}`,
      { 'r-json-resource-viewer--clickable': expandable && !isEmpty },
    ]"
    data-testid="json-resource-viewer"
  >
    <header v-if="showHeader" class="r-json-resource-viewer__header">
      <div class="r-json-resource-viewer__heading">
        <strong>{{ title }}</strong>
        <span>{{ metaText }}</span>
      </div>
      <div class="r-json-resource-viewer__actions">
        <button
          v-if="copyable"
          class="r-json-resource-viewer__action"
          type="button"
          :disabled="isEmpty"
          data-testid="json-resource-viewer-copy"
          @click.stop="copy"
        >
          <RIcon name="copy" :size="14" />
          <span>复制</span>
        </button>
        <button
          v-if="expandable"
          class="r-json-resource-viewer__action"
          type="button"
          :disabled="isEmpty"
          data-testid="json-resource-viewer-expand"
          @click.stop="open"
        >
          <RIcon name="maximize-2" :size="14" />
          <span>放大</span>
        </button>
      </div>
    </header>

    <RResourcePreview
      v-if="inlineResources && resources.length"
      :resources="resources"
      :max-inline="size === 'small' ? 3 : 8"
      @preview="emit('resource-preview', $event)"
      @copy="emit('resource-copy', $event)"
      @open="emit('resource-open', $event)"
    />

    <div
      class="r-json-resource-viewer__body"
      role="button"
      :tabindex="expandable && !isEmpty ? 0 : -1"
      data-testid="json-resource-viewer-body"
      @click="open"
      @keydown.enter.prevent="open"
      @keydown.space.prevent="open"
    >
      <RJsonViewer
        :value="value"
        :title="title"
        :size="size"
        :height="height"
        :max-height="maxHeight"
        :empty-text="emptyText"
        :copyable="false"
        :expandable="false"
        :show-header="false"
      />
    </div>

    <n-modal
      v-model:show="expanded"
      preset="card"
      class="r-json-resource-viewer__modal"
      :title="`${title} 详情`"
      style="width: min(1120px, calc(100vw - 32px))"
    >
      <div class="r-json-resource-viewer__modal-toolbar">
        <span>{{ metaText }}</span>
        <button
          class="r-json-resource-viewer__action"
          type="button"
          :disabled="isEmpty"
          @click="copy"
        >
          <RIcon name="copy" :size="14" />
          <span>复制</span>
        </button>
      </div>
      <RResourcePreview
        v-if="resources.length"
        :resources="resources"
        :max-inline="resources.length"
        @preview="emit('resource-preview', $event)"
        @copy="emit('resource-copy', $event)"
        @open="emit('resource-open', $event)"
      />
      <RJsonViewer
        :value="value"
        :title="title"
        :size="size"
        :max-height="normalizeSize('min(68vh, 720px)')"
        :empty-text="emptyText"
        :copyable="false"
        :expandable="false"
        :show-header="false"
      />
    </n-modal>
  </section>
</template>

<style scoped>
  .r-json-resource-viewer {
    display: grid;
    gap: var(--ra-spacing-2);
  }

  .r-json-resource-viewer__header,
  .r-json-resource-viewer__modal-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ra-spacing-3);
    border: 1px solid var(--ra-color-border-light);
    border-radius: var(--ra-radius-md);
    background: var(--ra-color-bg-surface-secondary);
  }

  .r-json-resource-viewer__header {
    padding: var(--ra-spacing-2) var(--ra-spacing-3);
  }

  .r-json-resource-viewer__body {
    min-width: 0;
    border-radius: var(--ra-radius-md);
  }

  .r-json-resource-viewer--clickable .r-json-resource-viewer__body {
    cursor: pointer;
  }

  .r-json-resource-viewer__body:focus-visible {
    outline: 2px solid var(--ra-color-focus-ring);
    outline-offset: 2px;
  }

  .r-json-resource-viewer__modal-toolbar {
    margin-bottom: var(--ra-spacing-3);
    padding: var(--ra-spacing-2) var(--ra-spacing-3);
  }

  .r-json-resource-viewer__heading {
    display: grid;
    min-width: 0;
    gap: var(--ra-spacing-0-5);
  }

  .r-json-resource-viewer__heading strong {
    overflow: hidden;
    color: var(--ra-color-text-primary);
    font-size: var(--ra-font-size-sm);
    font-weight: var(--ra-font-weight-semibold);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .r-json-resource-viewer__heading span,
  .r-json-resource-viewer__modal-toolbar span {
    color: var(--ra-color-text-tertiary);
    font-size: var(--ra-font-size-xs);
  }

  .r-json-resource-viewer__actions {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--ra-spacing-1);
  }

  .r-json-resource-viewer__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ra-spacing-1);
    min-height: 28px;
    border: 1px solid var(--ra-color-border-default);
    border-radius: var(--ra-radius-sm);
    background: var(--ra-color-bg-surface);
    color: var(--ra-color-text-secondary);
    font-size: var(--ra-font-size-xs);
    line-height: var(--ra-line-height-tight);
    cursor: pointer;
  }

  .r-json-resource-viewer__action:hover:not(:disabled) {
    border-color: var(--ra-color-border-interactive);
    color: var(--ra-color-brand-primary);
  }

  .r-json-resource-viewer__action:focus-visible {
    outline: 2px solid var(--ra-color-focus-ring);
    outline-offset: 2px;
  }

  .r-json-resource-viewer__action:disabled {
    color: var(--ra-color-text-quaternary);
    cursor: not-allowed;
  }

  .r-json-resource-viewer__modal {
    color: var(--ra-color-text-primary);
  }

  .r-json-resource-viewer__modal :deep(.r-resource-preview) {
    margin-bottom: var(--ra-spacing-3);
  }
</style>
