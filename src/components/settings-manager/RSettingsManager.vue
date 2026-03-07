<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NButton,
  NSpin,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NRadioGroup,
  NRadio,
  NColorPicker,
  NDatePicker,
  NTimePicker,
  NSpace,
  NText,
  NBadge,
} from 'naive-ui'
import type { SettingsManagerProps, SettingsManagerExpose, SettingsGroup } from './types'
import type { ProUploadFileItem } from '../pro-upload/types'
import RIcon from '../icon/RIcon.vue'
import REmptyState from '../empty-state/REmptyState.vue'
import RProUpload from '../pro-upload/RProUpload.vue'

const props = withDefaults(defineProps<SettingsManagerProps>(), {
  title: '系统设置',
  description: '',
  showSearch: true,
  showGroupNav: true,
  saveMode: 'batch',
  layout: 'card',
  customUploadRequest: undefined,
  parseUploadResponse: undefined,
})

const emit = defineEmits<{
  saved: [key: string, value: string]
  'batch-saved': [fields: Array<{ key: string; value: string }>]
  error: [error: Error]
  loaded: [groups: SettingsGroup[]]
}>()

const loading = ref(true)
const saving = ref(false)
const savingField = ref<string | null>(null)
const savedField = ref<string | null>(null)
const errorMessage = ref('')
const groups = ref<SettingsGroup[]>([])
const originalValues = ref<Record<string, string>>({})
const currentValues = ref<Record<string, string>>({})
const searchQuery = ref('')
const activeGroupKey = ref<string>('')
const contentEl = ref<HTMLElement | null>(null)

let savedTimer: ReturnType<typeof setTimeout> | null = null

const filteredGroups = computed(() => {
  if (!searchQuery.value) return groups.value
  const q = searchQuery.value.toLowerCase()
  return groups.value
    .map((g) => ({
      ...g,
      fields: g.fields.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.key.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q)),
      ),
    }))
    .filter((g) => g.fields.length > 0)
})

const dirtyFields = computed(() => {
  const dirty: Array<{ key: string; value: string }> = []
  for (const [key, val] of Object.entries(currentValues.value)) {
    if (val !== originalValues.value[key]) {
      dirty.push({ key, value: val })
    }
  }
  return dirty
})

const hasDirty = computed(() => dirtyFields.value.length > 0)

const groupDirtyCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const g of groups.value) {
    counts[g.key] = g.fields.filter(
      (f) => currentValues.value[f.key] !== originalValues.value[f.key],
    ).length
  }
  return counts
})

function isDirty(key: string): boolean {
  return currentValues.value[key] !== originalValues.value[key]
}

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await props.adapter.fetchGroups()
    groups.value = result
    const vals: Record<string, string> = {}
    for (const g of result) {
      for (const f of g.fields) {
        vals[f.key] = f.value
      }
    }
    originalValues.value = { ...vals }
    currentValues.value = { ...vals }
    if (result.length > 0 && !activeGroupKey.value) {
      activeGroupKey.value = result[0].key
    }
    emit('loaded', result)
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    errorMessage.value = err.message
    emit('error', err)
  } finally {
    loading.value = false
  }
}

async function saveField(key: string) {
  savingField.value = key
  try {
    await props.adapter.saveField(key, currentValues.value[key])
    originalValues.value[key] = currentValues.value[key]
    emit('saved', key, currentValues.value[key])
    showSavedFeedback(key)
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    emit('error', err)
  } finally {
    savingField.value = null
  }
}

async function saveAll() {
  if (!hasDirty.value) return
  saving.value = true
  try {
    const fields = dirtyFields.value
    if (props.adapter.saveBatch) {
      await props.adapter.saveBatch(fields)
    } else {
      for (const f of fields) {
        await props.adapter.saveField(f.key, f.value)
      }
    }
    for (const f of fields) {
      originalValues.value[f.key] = f.value
    }
    emit('batch-saved', fields)
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    emit('error', err)
  } finally {
    saving.value = false
  }
}

function showSavedFeedback(key: string) {
  savedField.value = key
  if (savedTimer) clearTimeout(savedTimer)
  savedTimer = setTimeout(() => { savedField.value = null }, 2000)
}

function resetDirty() {
  currentValues.value = { ...originalValues.value }
}

function getValues(): Record<string, string> {
  return { ...currentValues.value }
}

function getDirtyFields() {
  return dirtyFields.value
}

function scrollToGroup(key: string) {
  activeGroupKey.value = key
}

function urlToFileList(url: string): ProUploadFileItem[] {
  if (!url) return []
  return url.split(',').filter(Boolean).map((u, i) => ({
    uid: `existing-${i}`,
    name: u.split('/').pop() || 'image',
    size: 0,
    type: 'image/*',
    status: 'success' as const,
    progress: 100,
    url: u,
    thumbUrl: u,
  }))
}

function handleImageChange(fieldKey: string, files: ProUploadFileItem[]) {
  const urls = files
    .filter((f) => f.status === 'success' && f.url)
    .map((f) => f.url!)
    .join(',')
  currentValues.value[fieldKey] = urls
}

function tsToDate(val: string): number | null {
  if (!val) return null
  const ts = Date.parse(val)
  return isNaN(ts) ? null : ts
}

function dateToStr(ts: number | null): string {
  if (!ts) return ''
  return new Date(ts).toISOString().split('T')[0]
}

function datetimeToStr(ts: number | null): string {
  if (!ts) return ''
  return new Date(ts).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
}

function timeToStr(ts: number | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

onMounted(loadData)

defineExpose<SettingsManagerExpose>({
  reload: loadData,
  getValues,
  getDirtyFields,
  resetDirty,
  saveAll,
})
</script>

<template>
  <div class="rsm" :class="[`rsm--${layout}`]" data-testid="settings-manager">
    <!-- Header -->
    <div class="rsm__header">
      <div class="rsm__header-text">
        <h2 class="rsm__title">{{ title }}</h2>
        <p v-if="description" class="rsm__desc">{{ description }}</p>
      </div>
      <div v-if="saveMode === 'batch' && hasDirty && !loading" class="rsm__header-actions">
        <NButton size="small" quaternary @click="resetDirty">
          放弃更改
        </NButton>
        <NButton type="primary" size="small" :loading="saving" @click="saveAll">
          <template #icon><RIcon name="save" :size="14" /></template>
          保存 {{ dirtyFields.length }} 项更改
        </NButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="rsm__loading">
      <NSpin size="large" />
      <span class="rsm__loading-text">加载设置中…</span>
    </div>

    <!-- Error -->
    <div v-else-if="errorMessage" class="rsm__error">
      <RIcon name="alert-triangle" :size="40" class="rsm__error-icon" />
      <h3 class="rsm__error-title">加载设置失败</h3>
      <p class="rsm__error-msg">{{ errorMessage }}</p>
      <NButton type="primary" size="small" @click="loadData">
        <template #icon><RIcon name="refresh-cw" :size="14" /></template>
        重试
      </NButton>
    </div>

    <!-- Empty -->
    <REmptyState
      v-else-if="filteredGroups.length === 0 && searchQuery"
      :description="`没有找到匹配「${searchQuery}」的设置项`"
    />

    <!-- Main Layout -->
    <div v-else class="rsm__body">
      <!-- Left sidebar -->
      <aside v-if="showGroupNav && groups.length > 1" class="rsm__sidebar">
        <div v-if="showSearch" class="rsm__search">
          <NInput
            v-model:value="searchQuery"
            placeholder="搜索设置项…"
            clearable
            size="small"
            data-testid="settings-search"
          >
            <template #prefix><RIcon name="search" :size="14" /></template>
          </NInput>
        </div>

        <nav class="rsm__nav" role="tablist" aria-label="设置分组">
          <button
            v-for="g in groups"
            :key="g.key"
            type="button"
            role="tab"
            :aria-selected="activeGroupKey === g.key"
            class="rsm__nav-item"
            :class="{ 'rsm__nav-item--active': activeGroupKey === g.key }"
            :data-testid="`settings-nav-${g.key}`"
            @click="scrollToGroup(g.key)"
          >
            <span class="rsm__nav-indicator" />
            <RIcon v-if="g.icon" :name="g.icon" :size="16" class="rsm__nav-icon" />
            <span class="rsm__nav-label">{{ g.label }}</span>
            <NBadge
              v-if="groupDirtyCounts[g.key] > 0"
              :value="groupDirtyCounts[g.key]"
              :max="9"
              type="warning"
              class="rsm__nav-badge"
            />
          </button>
        </nav>
      </aside>

      <!-- Content -->
      <div ref="contentEl" class="rsm__content">
        <!-- Inline search (no sidebar) -->
        <div v-if="showSearch && (!showGroupNav || groups.length <= 1)" class="rsm__search rsm__search--inline">
          <NInput v-model:value="searchQuery" placeholder="搜索设置项…" clearable size="small">
            <template #prefix><RIcon name="search" :size="14" /></template>
          </NInput>
        </div>

        <div
          v-for="group in filteredGroups"
          v-show="activeGroupKey === group.key || !showGroupNav || groups.length <= 1"
          :key="group.key"
          :id="`settings-group-${group.key}`"
          class="rsm__section"
        >
          <!-- Section header -->
          <div class="rsm__section-header">
            <RIcon v-if="group.icon" :name="group.icon" :size="18" class="rsm__section-icon" />
            <div>
              <h3 class="rsm__section-title">{{ group.label }}</h3>
              <p v-if="group.description" class="rsm__section-desc">{{ group.description }}</p>
            </div>
          </div>

          <!-- Fields card -->
          <div class="rsm__fields-card">
            <div
              v-for="(field, idx) in group.fields"
              :key="field.key"
              class="rsm__row"
              :class="{
                'rsm__row--last': idx === group.fields.length - 1,
                'rsm__row--dirty': isDirty(field.key),
              }"
              :data-testid="`settings-field-${field.key}`"
            >
              <!-- Left: label + description -->
              <div class="rsm__row-info">
                <label :for="`rsm-ctrl-${field.key}`" class="rsm__row-label">
                  {{ field.label }}
                </label>
                <p v-if="field.description" class="rsm__row-help">{{ field.description }}</p>
              </div>

              <!-- Right: control + status -->
              <div class="rsm__row-ctrl">
                <div class="rsm__ctrl-wrap">
                  <!-- Input -->
                  <NInput
                    v-if="field.type === 'input'"
                    :id="`rsm-ctrl-${field.key}`"
                    :value="currentValues[field.key]"
                    :placeholder="field.placeholder"
                    :disabled="field.disabled"
                    size="small"
                    @update:value="(v: string) => (currentValues[field.key] = v)"
                  />
                  <!-- Textarea -->
                  <NInput
                    v-else-if="field.type === 'textarea'"
                    :id="`rsm-ctrl-${field.key}`"
                    type="textarea"
                    :value="currentValues[field.key]"
                    :placeholder="field.placeholder"
                    :disabled="field.disabled"
                    :rows="3"
                    size="small"
                    @update:value="(v: string) => (currentValues[field.key] = v)"
                  />
                  <!-- Number -->
                  <NInputNumber
                    v-else-if="field.type === 'number'"
                    :id="`rsm-ctrl-${field.key}`"
                    :value="Number(currentValues[field.key]) || 0"
                    :disabled="field.disabled"
                    size="small"
                    style="width: 100%"
                    @update:value="(v: number | null) => (currentValues[field.key] = String(v ?? 0))"
                  />
                  <!-- Select -->
                  <NSelect
                    v-else-if="field.type === 'select'"
                    :value="currentValues[field.key]"
                    :options="(field.options || []).map((o) => ({ label: o.label, value: String(o.value) }))"
                    :placeholder="field.placeholder"
                    :disabled="field.disabled"
                    size="small"
                    @update:value="(v: string) => (currentValues[field.key] = v)"
                  />
                  <!-- Switch -->
                  <NSwitch
                    v-else-if="field.type === 'switch'"
                    :value="currentValues[field.key] === 'true' || currentValues[field.key] === '1'"
                    :disabled="field.disabled"
                    @update:value="(v: boolean) => (currentValues[field.key] = v ? 'true' : 'false')"
                  />
                  <!-- Radio -->
                  <NRadioGroup
                    v-else-if="field.type === 'radio'"
                    :value="currentValues[field.key]"
                    :disabled="field.disabled"
                    size="small"
                    @update:value="(v: string) => (currentValues[field.key] = v)"
                  >
                    <NRadio
                      v-for="opt in field.options"
                      :key="String(opt.value)"
                      :value="String(opt.value)"
                      :disabled="opt.disabled"
                    >{{ opt.label }}</NRadio>
                  </NRadioGroup>
                  <!-- Color -->
                  <NColorPicker
                    v-else-if="field.type === 'color'"
                    :value="currentValues[field.key] || '#000000'"
                    :disabled="field.disabled"
                    size="small"
                    @update:value="(v: string) => (currentValues[field.key] = v)"
                  />
                  <!-- Date -->
                  <NDatePicker
                    v-else-if="field.type === 'date'"
                    type="date"
                    :value="tsToDate(currentValues[field.key])"
                    :disabled="field.disabled"
                    size="small"
                    clearable
                    style="width: 100%"
                    @update:value="(v: number | null) => (currentValues[field.key] = dateToStr(v))"
                  />
                  <!-- Time -->
                  <NTimePicker
                    v-else-if="field.type === 'time'"
                    :value="tsToDate(currentValues[field.key] ? `1970-01-01T${currentValues[field.key]}` : '')"
                    :disabled="field.disabled"
                    size="small"
                    clearable
                    style="width: 100%"
                    @update:value="(v: number | null) => (currentValues[field.key] = timeToStr(v))"
                  />
                  <!-- DateTime -->
                  <NDatePicker
                    v-else-if="field.type === 'datetime'"
                    type="datetime"
                    :value="tsToDate(currentValues[field.key])"
                    :disabled="field.disabled"
                    size="small"
                    clearable
                    style="width: 100%"
                    @update:value="(v: number | null) => (currentValues[field.key] = datetimeToStr(v))"
                  />
                  <!-- Image -->
                  <div v-else-if="field.type === 'image'" class="rsm__image-wrap">
                    <RProUpload
                      :value="urlToFileList(currentValues[field.key])"
                      :accept="field.accept || 'image/*'"
                      :max-count="field.maxCount || 1"
                      :max-size-m-b="field.maxSizeMB || 5"
                      :disabled="field.disabled"
                      list-type="picture-card"
                      :custom-request="customUploadRequest"
                      :parse-response="parseUploadResponse ? (raw: unknown) => { const p = parseUploadResponse!(raw); return { url: p.url, thumbUrl: p.url, storageId: p.storageId } } : undefined"
                      @change="(files: ProUploadFileItem[]) => handleImageChange(field.key, files)"
                    />
                  </div>
                  <!-- Fallback -->
                  <NInput
                    v-else
                    :id="`rsm-ctrl-${field.key}`"
                    :value="currentValues[field.key]"
                    :placeholder="field.placeholder"
                    :disabled="field.disabled"
                    size="small"
                    @update:value="(v: string) => (currentValues[field.key] = v)"
                  />
                </div>

                <!-- Per-field save + status -->
                <div v-if="saveMode === 'field'" class="rsm__row-status">
                  <Transition name="rsm-fade">
                    <span v-if="savedField === field.key" class="rsm__saved-badge">
                      <RIcon name="check" :size="12" /> 已保存
                    </span>
                  </Transition>
                  <NButton
                    v-if="isDirty(field.key)"
                    size="tiny"
                    type="primary"
                    :loading="savingField === field.key"
                    @click="saveField(field.key)"
                  >
                    保存
                  </NButton>
                </div>
                <div v-else-if="isDirty(field.key)" class="rsm__row-dirty-dot" title="已修改" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky save bar (batch mode) -->
    <Transition name="rsm-slide">
      <div v-if="saveMode === 'batch' && hasDirty && !loading" class="rsm__save-bar">
        <div class="rsm__save-bar-inner">
          <div class="rsm__save-bar-info">
            <span class="rsm__save-bar-dot" />
            <NText class="rsm__save-bar-text">
              {{ dirtyFields.length }} 项未保存的更改
            </NText>
          </div>
          <NSpace :size="8">
            <NButton size="small" @click="resetDirty">放弃</NButton>
            <NButton type="primary" size="small" :loading="saving" @click="saveAll">
              <template #icon><RIcon name="save" :size="14" /></template>
              保存全部
            </NButton>
          </NSpace>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════
   RSettingsManager — Premium Design System v2
   All colors via semantic tokens. No hardcoded values.
   ═══════════════════════════════════════════════════════ */

.rsm {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-6, 24px);
  height: 100%;
  min-height: 0;
  font-family: var(--ra-font-family-body);
}

/* ── Header ── */
.rsm__header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ra-spacing-4);
  padding: var(--ra-spacing-3) var(--ra-card-padding-x);
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-light);
  border-radius: var(--ra-radius-lg);
  box-shadow: var(--ra-shadow-card);
}

.rsm__title {
  margin: 0;
  font-size: var(--ra-font-size-xl);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-primary);
  letter-spacing: var(--ra-letter-spacing-tight);
  line-height: var(--ra-line-height-tight);
}

.rsm__desc {
  margin: var(--ra-spacing-1) 0 0;
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-tertiary);
  line-height: var(--ra-line-height-base);
}

.rsm__header-actions {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  flex-shrink: 0;
}

/* ── Loading ── */
.rsm__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ra-spacing-4);
  padding: var(--ra-spacing-20) 0;
}

.rsm__loading-text {
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-tertiary);
}

/* ── Error ── */
.rsm__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ra-spacing-3);
  padding: var(--ra-spacing-16) 0;
  text-align: center;
}

.rsm__error-icon {
  color: var(--ra-color-danger);
  opacity: 0.6;
}

.rsm__error-title {
  margin: 0;
  font-size: var(--ra-font-size-lg);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-primary);
}

.rsm__error-msg {
  margin: 0;
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-text-tertiary);
  max-width: 400px;
}

/* ═══ Main Body: sidebar + content ═══ */
.rsm__body {
  display: flex;
  gap: var(--ra-spacing-6, 24px);
  flex: 1;
  min-height: 0;
}

/* ═══ Sidebar ═══ */
.rsm__sidebar {
  flex-shrink: 0;
  width: 230px;
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-light);
  border-radius: var(--ra-radius-lg);
  box-shadow: var(--ra-shadow-card);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  position: sticky;
  top: 0;
  align-self: flex-start;
  max-height: 100%;
}

.rsm__search {
  padding: var(--ra-spacing-4) var(--ra-spacing-4) var(--ra-spacing-2);
}

.rsm__search--inline {
  padding: 0 0 var(--ra-spacing-4);
}

.rsm__nav {
  display: flex;
  flex-direction: column;
  padding: var(--ra-spacing-1) var(--ra-spacing-2) var(--ra-spacing-4);
  gap: var(--ra-spacing-0-5);
}

.rsm__nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2-5);
  padding: var(--ra-spacing-2-5) var(--ra-spacing-3);
  border: none;
  border-radius: var(--ra-radius-md);
  background: transparent;
  cursor: pointer;
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-normal);
  font-family: inherit;
  color: var(--ra-color-text-secondary);
  transition: all var(--ra-duration-fast) var(--ra-ease-default);
  text-align: left;
  width: 100%;
  outline: none;
}

.rsm__nav-item:hover {
  background: var(--ra-color-bg-hover);
  color: var(--ra-color-text-primary);
}

.rsm__nav-item:focus-visible {
  box-shadow: 0 0 0 var(--ra-ring-width) var(--ra-ring-color);
}

.rsm__nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 20px;
  border-radius: 0 var(--ra-radius-sm) var(--ra-radius-sm) 0;
  background: var(--ra-color-brand-primary);
  transition: transform var(--ra-duration-normal) var(--ra-ease-bounce);
}

.rsm__nav-item--active .rsm__nav-indicator {
  transform: translateY(-50%) scaleY(1);
}

.rsm__nav-item--active {
  background: var(--ra-color-brand-subtle);
  color: var(--ra-color-brand-primary);
  font-weight: var(--ra-font-weight-semibold);
}

.rsm__nav-item--active .rsm__nav-icon {
  color: var(--ra-color-brand-primary);
}

.rsm__nav-icon {
  flex-shrink: 0;
  color: var(--ra-color-text-tertiary);
  transition: color var(--ra-duration-fast) var(--ra-ease-default);
}

.rsm__nav-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rsm__nav-badge {
  flex-shrink: 0;
}

/* ═══ Content ═══ */
.rsm__content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: var(--ra-card-padding-y) var(--ra-card-padding-x);
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-light);
  border-radius: var(--ra-radius-lg);
  box-shadow: var(--ra-shadow-card);
}

/* ═══ Section ═══ */
.rsm__section {
  margin-bottom: var(--ra-spacing-8);
}

.rsm__section:last-child {
  margin-bottom: 0;
}

.rsm__section-header {
  display: flex;
  align-items: flex-start;
  gap: var(--ra-spacing-3);
  margin-bottom: var(--ra-spacing-4);
  padding-bottom: var(--ra-spacing-3);
  border-bottom: 1px solid var(--ra-color-border-light);
}

.rsm__section-icon {
  flex-shrink: 0;
  color: var(--ra-color-brand-primary);
  margin-top: 2px;
}

.rsm__section-title {
  margin: 0;
  font-size: var(--ra-font-size-lg);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-primary);
  line-height: var(--ra-line-height-tight);
}

.rsm__section-desc {
  margin: var(--ra-spacing-0-5) 0 0;
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-tertiary);
  line-height: var(--ra-line-height-base);
}

/* ═══ Fields Card ═══ */
.rsm__fields-card {
  border-radius: var(--ra-radius-md);
  overflow: hidden;
}

/* ═══ Field Row ═══ */
.rsm__row {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--ra-spacing-6);
  align-items: start;
  padding: var(--ra-spacing-4) var(--ra-card-padding-x);
  border-bottom: 1px solid var(--ra-color-border-light);
  transition: background var(--ra-duration-fast) var(--ra-ease-default);
}

.rsm__row:hover {
  background: var(--ra-color-bg-hover);
}

.rsm__row--last {
  border-bottom: none;
}

.rsm__row--dirty {
  background: var(--ra-color-warning-bg);
}

.rsm__row--dirty:hover {
  background: var(--ra-color-warning-bg);
}

.rsm__row-info {
  min-width: 0;
  padding-top: var(--ra-spacing-0-5);
}

.rsm__row-label {
  display: block;
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-medium);
  color: var(--ra-color-text-primary);
  line-height: var(--ra-line-height-snug);
  cursor: default;
}

.rsm__row-help {
  margin: var(--ra-spacing-1) 0 0;
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-tertiary);
  line-height: var(--ra-line-height-relaxed);
}

.rsm__row-ctrl {
  display: flex;
  align-items: flex-start;
  gap: var(--ra-spacing-2);
  min-width: 0;
}

.rsm__ctrl-wrap {
  flex: 1;
  min-width: 0;
}

.rsm__image-wrap {
  width: 100%;
}

/* ── Per-field status ── */
.rsm__row-status {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  flex-shrink: 0;
}

.rsm__saved-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-success);
  font-weight: var(--ra-font-weight-medium);
}

.rsm__row-dirty-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: var(--ra-radius-full);
  background: var(--ra-color-warning);
  margin-top: var(--ra-spacing-2);
}

/* ═══ Save Bar ═══ */
.rsm__save-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  padding: var(--ra-spacing-3) 0 0;
}

.rsm__save-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ra-spacing-3) var(--ra-card-padding-x);
  background: var(--ra-color-bg-elevated);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
  box-shadow: var(--ra-shadow-lg);
  backdrop-filter: blur(var(--ra-backdrop-blur));
}

.rsm__save-bar-info {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
}

.rsm__save-bar-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--ra-radius-full);
  background: var(--ra-color-warning);
  animation: rsm-pulse 2s ease-in-out infinite;
}

.rsm__save-bar-text {
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-medium);
}

@keyframes rsm-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ═══ Transitions ═══ */
.rsm-fade-enter-active,
.rsm-fade-leave-active {
  transition: opacity var(--ra-duration-normal) var(--ra-ease-default);
}

.rsm-fade-enter-from,
.rsm-fade-leave-to {
  opacity: 0;
}

.rsm-slide-enter-active,
.rsm-slide-leave-active {
  transition: all var(--ra-duration-normal) var(--ra-ease-default);
}

.rsm-slide-enter-from,
.rsm-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ═══ Responsive ═══ */
@media (max-width: 900px) {
  .rsm__body {
    flex-direction: column;
    gap: var(--ra-spacing-4);
  }

  .rsm__sidebar {
    width: 100%;
    position: static;
  }

  .rsm__nav {
    flex-direction: row;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding: var(--ra-spacing-2);
  }

  .rsm__nav-item {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .rsm__nav-indicator {
    display: none;
  }

  .rsm__content {
    padding: var(--ra-spacing-4);
  }

  .rsm__row {
    grid-template-columns: 1fr;
    gap: var(--ra-spacing-2);
  }

  .rsm__header {
    flex-direction: column;
  }
}
</style>
