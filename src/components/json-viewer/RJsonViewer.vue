<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import { NModal } from 'naive-ui'
  import RIcon from '../icon/RIcon.vue'
  import type {
    JsonViewerExpose,
    JsonViewerLine,
    JsonViewerToken,
    JsonViewerValue,
  } from './types'

  const props = withDefaults(
    defineProps<{
      value?: JsonViewerValue
      title?: string
      size?: 'small' | 'medium' | 'large'
      height?: number | string
      maxHeight?: number | string
      emptyText?: string
      copyable?: boolean
      expandable?: boolean
      showHeader?: boolean
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
    },
  )

  const emit = defineEmits<{
    (event: 'copy', value: string): void
    (event: 'expand', value: string): void
  }>()

  const expanded = ref(false)

  const normalized = computed(() => normalizeJsonValue(props.value, props.emptyText))
  const displayText = computed(() => normalized.value.text)
  const isEmpty = computed(() => normalized.value.empty)
  const isJson = computed(() => normalized.value.json)
  const lines = computed<JsonViewerLine[]>(() =>
    displayText.value.split('\n').map((line, index) => ({
      number: index + 1,
      tokens: isJson.value ? tokenizeJsonLine(line) : [{ text: line, type: 'plain' }],
    })),
  )
  const metaText = computed(() => {
    if (isEmpty.value) return 'empty'
    const bytes = new Blob([displayText.value]).size
    return `${isJson.value ? 'JSON' : 'Text'} · ${lines.value.length} 行 · ${bytes} B`
  })
  const bodyStyle = computed(() => ({
    height: normalizeSize(props.height),
    maxHeight: normalizeSize(props.maxHeight),
  }))

  function open(): void {
    if (!props.expandable || isEmpty.value) return
    expanded.value = true
    emit('expand', displayText.value)
  }

  function close(): void {
    expanded.value = false
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

  function onBodyKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    open()
  }

  const expose: JsonViewerExpose = { open, close, copy }
  defineExpose(expose)

  function normalizeSize(value?: number | string): string | undefined {
    if (value === undefined || value === null || value === '') return undefined
    return typeof value === 'number' ? `${value}px` : value
  }

  function normalizeJsonValue(value: JsonViewerValue, emptyText: string) {
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

  function tokenizeJsonLine(line: string): JsonViewerToken[] {
    const tokens: JsonViewerToken[] = []
    const pattern =
      /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])/g
    let cursor = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(line))) {
      if (match.index > cursor) {
        tokens.push({ text: line.slice(cursor, match.index), type: 'plain' })
      }
      const text = match[0]
      tokens.push({ text, type: tokenType(match) })
      cursor = match.index + text.length
    }
    if (cursor < line.length) {
      tokens.push({ text: line.slice(cursor), type: 'plain' })
    }
    return tokens.length ? tokens : [{ text: line, type: 'plain' }]
  }

  function tokenType(match: RegExpExecArray): JsonViewerToken['type'] {
    if (match[1]) return 'key'
    if (match[2]) return 'string'
    if (match[3]) return 'boolean'
    if (match[4]) return 'null'
    if (match[5]) return 'number'
    if (match[6]) return 'punctuation'
    return 'plain'
  }
</script>

<template>
  <div
    class="r-json-viewer"
    :class="[`r-json-viewer--${size}`, { 'r-json-viewer--text': !isJson }]"
    data-testid="json-viewer"
  >
    <header v-if="showHeader" class="r-json-viewer__header">
      <div class="r-json-viewer__heading">
        <strong>{{ title }}</strong>
        <span>{{ metaText }}</span>
      </div>
      <div class="r-json-viewer__actions">
        <button
          v-if="copyable"
          class="r-json-viewer__action"
          type="button"
          :disabled="isEmpty"
          data-testid="json-viewer-copy"
          @click.stop="copy"
        >
          <RIcon name="copy" :size="14" />
          <span>复制</span>
        </button>
        <button
          v-if="expandable"
          class="r-json-viewer__action"
          type="button"
          :disabled="isEmpty"
          data-testid="json-viewer-expand"
          @click.stop="open"
        >
          <RIcon name="maximize-2" :size="14" />
          <span>放大</span>
        </button>
      </div>
    </header>

    <div
      class="r-json-viewer__body"
      :class="{ 'is-clickable': expandable && !isEmpty }"
      :style="bodyStyle"
      :role="expandable && !isEmpty ? 'button' : undefined"
      :tabindex="expandable && !isEmpty ? 0 : undefined"
      data-testid="json-viewer-body"
      @click="open"
      @keydown="onBodyKeydown"
    >
      <div v-if="isEmpty" class="r-json-viewer__empty">{{ emptyText }}</div>
      <div v-else class="r-json-viewer__code">
        <div v-for="line in lines" :key="line.number" class="r-json-viewer__line">
          <span class="r-json-viewer__line-no">{{ line.number }}</span>
          <code class="r-json-viewer__line-code">
            <span
              v-for="(token, tokenIndex) in line.tokens"
              :key="`${line.number}-${tokenIndex}`"
              :class="`r-json-viewer__token r-json-viewer__token--${token.type}`"
            >{{ token.text }}</span>
          </code>
        </div>
      </div>
    </div>

    <n-modal
      v-model:show="expanded"
      preset="card"
      class="r-json-viewer__modal"
      :title="`${title} 详情`"
      style="width: min(1040px, calc(100vw - 32px))"
    >
      <div class="r-json-viewer__modal-toolbar">
        <span>{{ metaText }}</span>
        <button class="r-json-viewer__action" type="button" :disabled="isEmpty" @click="copy">
          <RIcon name="copy" :size="14" />
          <span>复制</span>
        </button>
      </div>
      <div class="r-json-viewer__body r-json-viewer__body--modal" data-testid="json-viewer-modal">
        <div v-if="isEmpty" class="r-json-viewer__empty">{{ emptyText }}</div>
        <div v-else class="r-json-viewer__code">
          <div v-for="line in lines" :key="`modal-${line.number}`" class="r-json-viewer__line">
            <span class="r-json-viewer__line-no">{{ line.number }}</span>
            <code class="r-json-viewer__line-code">
              <span
                v-for="(token, tokenIndex) in line.tokens"
                :key="`modal-${line.number}-${tokenIndex}`"
                :class="`r-json-viewer__token r-json-viewer__token--${token.type}`"
              >{{ token.text }}</span>
            </code>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<style scoped>
  .r-json-viewer {
    overflow: hidden;
    border: 1px solid var(--ra-color-border-default);
    border-radius: var(--ra-radius-md);
    background: var(--ra-color-bg-surface);
    color: var(--ra-color-text-primary);
  }

  .r-json-viewer__header,
  .r-json-viewer__modal-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ra-spacing-3);
    border-bottom: 1px solid var(--ra-color-border-light);
    background: var(--ra-color-bg-surface-secondary);
  }

  .r-json-viewer__header {
    padding: var(--ra-spacing-2) var(--ra-spacing-3);
  }

  .r-json-viewer__modal-toolbar {
    margin: calc(var(--ra-spacing-3) * -1) calc(var(--ra-spacing-3) * -1) var(--ra-spacing-3);
    padding: var(--ra-spacing-2) var(--ra-spacing-3);
    color: var(--ra-color-text-tertiary);
    font-size: var(--ra-font-size-xs);
  }

  .r-json-viewer__heading {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: var(--ra-spacing-0-5);
  }

  .r-json-viewer__heading strong {
    overflow: hidden;
    color: var(--ra-color-text-primary);
    font-size: var(--ra-font-size-sm);
    font-weight: var(--ra-font-weight-semibold);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .r-json-viewer__heading span {
    color: var(--ra-color-text-tertiary);
    font-size: var(--ra-font-size-xs);
  }

  .r-json-viewer__actions {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--ra-spacing-1);
  }

  .r-json-viewer__action {
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

  .r-json-viewer__action:hover:not(:disabled) {
    border-color: var(--ra-color-border-interactive);
    color: var(--ra-color-brand-primary);
  }

  .r-json-viewer__action:focus-visible,
  .r-json-viewer__body:focus-visible {
    outline: 2px solid var(--ra-color-focus-ring);
    outline-offset: 2px;
  }

  .r-json-viewer__action:disabled {
    color: var(--ra-color-text-quaternary);
    cursor: not-allowed;
  }

  .r-json-viewer__body {
    overflow: auto;
    min-height: 72px;
    background: var(--ra-color-bg-code);
  }

  .r-json-viewer__body.is-clickable {
    cursor: zoom-in;
  }

  .r-json-viewer__body--modal {
    max-height: min(68vh, 720px);
    border: 1px solid var(--ra-color-border-default);
    border-radius: var(--ra-radius-md);
  }

  .r-json-viewer__code {
    min-width: max-content;
    padding: var(--ra-spacing-2) 0;
  }

  .r-json-viewer__line {
    display: grid;
    grid-template-columns: 48px 1fr;
    min-height: 22px;
    font-family: var(--ra-font-family-mono);
    font-size: var(--ra-font-size-xs);
    line-height: var(--ra-line-height-relaxed);
    white-space: pre;
  }

  .r-json-viewer__line:hover {
    background: var(--ra-color-brand-subtle);
  }

  .r-json-viewer__line-no {
    user-select: none;
    border-right: 1px solid var(--ra-color-border-light);
    color: var(--ra-color-text-quaternary);
    text-align: right;
    padding-inline: var(--ra-spacing-2);
  }

  .r-json-viewer__line-code {
    padding-inline: var(--ra-spacing-3);
    color: var(--ra-color-text-code);
  }

  .r-json-viewer__token--key {
    color: var(--ra-color-brand-primary);
    font-weight: var(--ra-font-weight-medium);
  }

  .r-json-viewer__token--string {
    color: var(--ra-color-success-text);
  }

  .r-json-viewer__token--number {
    color: var(--ra-color-warning-text);
  }

  .r-json-viewer__token--boolean {
    color: var(--ra-color-info-text);
  }

  .r-json-viewer__token--null {
    color: var(--ra-color-text-tertiary);
    font-style: italic;
  }

  .r-json-viewer__token--punctuation,
  .r-json-viewer__token--plain {
    color: var(--ra-color-text-secondary);
  }

  .r-json-viewer__empty {
    display: flex;
    min-height: 72px;
    align-items: center;
    justify-content: center;
    padding: var(--ra-spacing-4);
    color: var(--ra-color-text-tertiary);
    font-size: var(--ra-font-size-sm);
  }

  .r-json-viewer--small .r-json-viewer__line {
    grid-template-columns: 40px 1fr;
    min-height: 20px;
  }

  .r-json-viewer--large .r-json-viewer__line {
    grid-template-columns: 56px 1fr;
    min-height: 24px;
    font-size: var(--ra-font-size-sm);
  }

  .r-json-viewer--text .r-json-viewer__line-code {
    color: var(--ra-color-text-secondary);
  }
</style>
