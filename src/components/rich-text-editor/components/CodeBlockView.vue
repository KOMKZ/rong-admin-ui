<script lang="ts" setup>
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'
import { ref, computed, watch } from 'vue'
import { Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps(nodeViewProps)
const isEditable = computed(() => props.editor?.isEditable ?? true)
const collapsed = ref(false)

const code = computed(() => props.node.textContent || '')
const language = computed(() => props.node.attrs.language || null)
const selectedLanguage = ref<string | null>(language.value)

let _hljs: any = null
async function loadHljs() {
  if (!_hljs) {
    try { _hljs = (await import('highlight.js')).default } catch { /* optional */ }
  }
  return _hljs
}

const renderedHtml = ref('')
async function renderHighlight() {
  const text = code.value
  if (!text) { renderedHtml.value = ''; return }
  const hljs = await loadHljs()
  if (!hljs) { renderedHtml.value = escapeHtml(text); return }
  try {
    renderedHtml.value = language.value
      ? hljs.highlight(text, { language: language.value, ignoreIllegals: true }).value
      : hljs.highlightAuto(text).value
  } catch {
    renderedHtml.value = escapeHtml(text)
  }
}

watch(code, renderHighlight, { immediate: true })
watch(language, renderHighlight)

const LANGUAGES = [
  { label: '自动检测', value: '' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JSON', value: 'json' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'C/C++', value: 'cpp' },
  { label: 'C#', value: 'csharp' },
  { label: 'PHP', value: 'php' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'SQL', value: 'sql' },
  { label: 'Shell', value: 'bash' },
  { label: 'YAML', value: 'yaml' },
  { label: 'XML', value: 'xml' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'Dockerfile', value: 'dockerfile' },
  { label: 'Plain Text', value: 'plaintext' },
]

function handleLanguageChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value || null
  selectedLanguage.value = val
  props.updateAttributes({ language: val })
}

async function copyCode() {
  try { await navigator.clipboard.writeText(code.value) } catch { /* ignore */ }
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function escapeHtml(text: string) {
  const d = document.createElement('div')
  d.textContent = text
  return d.innerHTML
}

watch(() => props.node.attrs.language, (v) => { selectedLanguage.value = v || null }, { immediate: true })
watch(isEditable, (v) => { if (v) collapsed.value = false }, { immediate: true })
</script>

<template>
  <NodeViewWrapper class="rte-code-block">
    <div class="rte-code-block__toolbar">
      <select
        class="rte-code-block__lang-select"
        :value="selectedLanguage || ''"
        @change="handleLanguageChange"
      >
        <option v-for="lang in LANGUAGES" :key="lang.value" :value="lang.value">
          {{ lang.label }}
        </option>
      </select>
      <div class="rte-code-block__actions">
        <button
          v-if="!isEditable"
          class="rte-code-block__btn"
          @click="toggleCollapse"
          :title="collapsed ? '展开' : '折叠'"
        >
          <component :is="collapsed ? ChevronDown : ChevronUp" :size="14" />
        </button>
        <button class="rte-code-block__btn" @click="copyCode" title="复制">
          <Copy :size="14" />
        </button>
        <button
          v-if="isEditable"
          class="rte-code-block__btn rte-code-block__btn--danger"
          @click="deleteNode"
          title="删除"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <div class="rte-code-block__content" :class="{ 'rte-code-block__content--collapsed': collapsed && !isEditable }">
      <div v-if="isEditable" class="rte-code-block__editor">
        <NodeViewContent class="rte-code-block__editor-content" spellcheck="false" />
      </div>
      <pre v-else class="rte-code-block__preview"><code v-html="renderedHtml" /></pre>

      <div v-if="collapsed && !isEditable" class="rte-code-block__overlay">
        <div class="rte-code-block__gradient" />
        <div class="rte-code-block__expand-wrap">
          <button class="rte-code-block__expand-btn" @click="toggleCollapse">展开代码</button>
        </div>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<style>
.rte-code-block {
  position: relative;
  margin: 16px 0;
  border-radius: var(--ra-radius-lg, 8px);
  overflow: hidden;
  border: 1px solid var(--ra-color-border-default, #e5e7eb);
  background: #f6f8fa;
}

.rte-code-block__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: var(--ra-color-bg-surface, #fff);
  border-bottom: 1px solid var(--ra-color-border-light, #e5e7eb);
}

.rte-code-block__lang-select {
  padding: 3px 8px;
  font-size: 12px;
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-sm, 4px);
  background: var(--ra-color-bg-surface, #fff);
  color: var(--ra-color-text-secondary, #57606a);
  outline: none;
  cursor: pointer;
}

.rte-code-block__lang-select:focus {
  border-color: var(--ra-color-brand-primary, #0969da);
}

.rte-code-block__actions {
  display: flex;
  gap: 2px;
}

.rte-code-block__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--ra-radius-sm, 4px);
  background: transparent;
  color: var(--ra-color-text-secondary, #57606a);
  cursor: pointer;
  transition: all 0.12s ease;
}

.rte-code-block__btn:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
  color: var(--ra-color-text-primary, #24292f);
}

.rte-code-block__btn--danger:hover {
  color: var(--ra-color-danger, #cf222e);
}

.rte-code-block__content {
  position: relative;
  overflow-x: auto;
  background: var(--ra-color-bg-surface, #fff);
}

.rte-code-block__editor .rte-code-block__editor-content {
  margin: 0;
  padding: 16px;
  min-height: 80px;
  background: var(--ra-color-bg-surface, #fff);
  color: #24292e;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
  word-wrap: normal;
  border: none;
  outline: none;
}

.rte-code-block__preview {
  margin: 0;
  padding: 16px;
  background: var(--ra-color-bg-surface, #fff);
  color: #24292e;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
}

.rte-code-block__preview code {
  display: block;
  padding: 0;
  background: transparent;
  color: inherit;
  font-size: inherit;
  font-family: inherit;
  white-space: pre;
  word-wrap: normal;
}

.rte-code-block__content--collapsed {
  max-height: 260px;
  overflow: hidden;
}

.rte-code-block__overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px;
  pointer-events: none;
}

.rte-code-block__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #fff 70%);
}

.rte-code-block__expand-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  pointer-events: auto;
}

.rte-code-block__expand-btn {
  padding: 4px 16px;
  font-size: 13px;
  border: 1px solid var(--ra-color-border-default, #d0d7de);
  border-radius: var(--ra-radius-md, 4px);
  background: var(--ra-color-bg-surface, #fff);
  color: var(--ra-color-brand-primary, #0969da);
  cursor: pointer;
  transition: all 0.15s ease;
}

.rte-code-block__expand-btn:hover {
  background: var(--ra-color-bg-muted, #f3f4f6);
}
</style>
