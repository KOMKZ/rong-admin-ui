<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
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
  NCard,
  NSpace,
  NText,
  NAlert,
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
const errorMessage = ref('')
const groups = ref<SettingsGroup[]>([])
const originalValues = ref<Record<string, string>>({})
const currentValues = ref<Record<string, string>>({})
const searchQuery = ref('')
const activeGroupKey = ref<string>('')
const contentEl = ref<HTMLElement | null>(null)

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
  nextTick(() => {
    const el = document.getElementById(`settings-group-${key}`)
    if (el && contentEl.value) {
      const top = el.offsetTop - contentEl.value.offsetTop
      contentEl.value.scrollTo({ top, behavior: 'smooth' })
    }
  })
}

function handleContentScroll() {
  if (!contentEl.value) return
  const scrollTop = contentEl.value.scrollTop + 20
  for (const g of groups.value) {
    const el = document.getElementById(`settings-group-${g.key}`)
    if (el) {
      const top = el.offsetTop - contentEl.value.offsetTop
      if (top <= scrollTop) {
        activeGroupKey.value = g.key
      }
    }
  }
}

function urlToFileList(url: string): ProUploadFileItem[] {
  if (!url) return []
  return url
    .split(',')
    .filter(Boolean)
    .map((u, i) => ({
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
  <div class="rsm" :class="[`rsm--${layout}`]">
    <!-- Header -->
    <div class="rsm__header">
      <div>
        <h2 class="rsm__title">{{ title }}</h2>
        <p v-if="description" class="rsm__desc">{{ description }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="rsm__center">
      <NSpin size="large" />
    </div>

    <!-- Error -->
    <NAlert
      v-else-if="errorMessage"
      type="error"
      title="加载设置失败"
      class="rsm__alert"
    >
      {{ errorMessage }}
      <br />
      <NButton size="small" style="margin-top: 8px" @click="loadData">重试</NButton>
    </NAlert>

    <!-- Empty -->
    <REmptyState
      v-else-if="filteredGroups.length === 0"
      description="没有找到匹配的设置项"
    />

    <!-- Main Layout -->
    <div v-else class="rsm__body">
      <!-- Left sidebar -->
      <aside v-if="showGroupNav && groups.length > 1" class="rsm__sidebar">
        <!-- Search in sidebar -->
        <div v-if="showSearch" class="rsm__search">
          <NInput
            v-model:value="searchQuery"
            placeholder="搜索设置项…"
            clearable
            size="small"
          >
            <template #prefix><RIcon name="search" :size="14" /></template>
          </NInput>
        </div>

        <nav class="rsm__nav">
          <button
            v-for="g in groups"
            :key="g.key"
            type="button"
            class="rsm__nav-btn"
            :class="{ 'rsm__nav-btn--active': activeGroupKey === g.key }"
            @click="scrollToGroup(g.key)"
          >
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

      <!-- Right content -->
      <div
        ref="contentEl"
        class="rsm__content"
        @scroll="handleContentScroll"
      >
        <!-- Inline search if no sidebar -->
        <div v-if="showSearch && (!showGroupNav || groups.length <= 1)" class="rsm__search rsm__search--inline">
          <NInput
            v-model:value="searchQuery"
            placeholder="搜索设置项…"
            clearable
            size="small"
          >
            <template #prefix><RIcon name="search" :size="14" /></template>
          </NInput>
        </div>

        <div
          v-for="group in filteredGroups"
          :key="group.key"
          :id="`settings-group-${group.key}`"
          class="rsm__group"
        >
          <div class="rsm__group-header">
            <div>
              <h3 class="rsm__group-title">{{ group.label }}</h3>
              <p v-if="group.description" class="rsm__group-desc">{{ group.description }}</p>
            </div>
          </div>

          <NCard size="small" class="rsm__group-card">
            <div
              v-for="(field, idx) in group.fields"
              :key="field.key"
              class="rsm__field"
              :class="{ 'rsm__field--last': idx === group.fields.length - 1 }"
            >
              <div class="rsm__field-meta">
                <label class="rsm__field-label">
                  {{ field.label }}
                  <span
                    v-if="currentValues[field.key] !== originalValues[field.key]"
                    class="rsm__field-dirty"
                  >已修改</span>
                </label>
                <p v-if="field.description" class="rsm__field-help">{{ field.description }}</p>
              </div>

              <div class="rsm__field-ctrl">
                <!-- Input -->
                <NInput
                  v-if="field.type === 'input'"
                  :value="currentValues[field.key]"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  size="small"
                  @update:value="(v: string) => (currentValues[field.key] = v)"
                />
                <!-- Textarea -->
                <NInput
                  v-else-if="field.type === 'textarea'"
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
                <div v-else-if="field.type === 'image'" class="rsm__field-image">
                  <RProUpload
                    :value="urlToFileList(currentValues[field.key])"
                    :accept="field.accept || 'image/*'"
                    :max-count="field.maxCount || 1"
                    :max-size-m-b="field.maxSizeMB || 5"
                    :disabled="field.disabled"
                    list-type="picture-card"
                    :custom-request="customUploadRequest"
                    :parse-response="
                      parseUploadResponse
                        ? (raw: unknown) => {
                            const parsed = parseUploadResponse!(raw)
                            return { url: parsed.url, thumbUrl: parsed.url, storageId: parsed.storageId }
                          }
                        : undefined
                    "
                    @change="(files: ProUploadFileItem[]) => handleImageChange(field.key, files)"
                  />
                </div>
                <!-- Fallback -->
                <NInput
                  v-else
                  :value="currentValues[field.key]"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  size="small"
                  @update:value="(v: string) => (currentValues[field.key] = v)"
                />

                <!-- Per-field save -->
                <NButton
                  v-if="saveMode === 'field' && currentValues[field.key] !== originalValues[field.key]"
                  size="tiny"
                  type="primary"
                  :loading="savingField === field.key"
                  class="rsm__field-save"
                  @click="saveField(field.key)"
                >
                  保存
                </NButton>
              </div>
            </div>
          </NCard>
        </div>
      </div>
    </div>

    <!-- Sticky save bar -->
    <Transition name="rsm-bar">
      <div v-if="saveMode === 'batch' && hasDirty && !loading" class="rsm__bar">
        <div class="rsm__bar-inner">
          <NText class="rsm__bar-text">
            <RIcon name="alert-circle" :size="16" />
            {{ dirtyFields.length }} 项未保存的更改
          </NText>
          <NSpace :size="8">
            <NButton size="small" @click="resetDirty">放弃更改</NButton>
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
.rsm {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.rsm__header {
  flex-shrink: 0;
  padding: 0 0 20px;
}

.rsm__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--n-text-color);
  letter-spacing: -0.02em;
}

.rsm__desc {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--n-text-color-3);
}

.rsm__center {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.rsm__alert {
  margin-bottom: 16px;
}

/* === Main Body: sidebar + content === */
.rsm__body {
  display: flex;
  gap: 0;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--n-divider-color);
  border-radius: 12px;
  overflow: hidden;
  background: var(--n-card-color);
}

/* === Sidebar === */
.rsm__sidebar {
  flex-shrink: 0;
  width: 220px;
  border-right: 1px solid var(--n-divider-color);
  background: var(--n-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.rsm__search {
  padding: 16px 16px 8px;
}

.rsm__search--inline {
  padding: 0 0 16px;
}

.rsm__nav {
  display: flex;
  flex-direction: column;
  padding: 0 8px 16px;
  gap: 2px;
}

.rsm__nav-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
  color: var(--n-text-color-3);
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
  position: relative;
}

.rsm__nav-btn:hover {
  background: var(--n-color-hover, rgba(0, 0, 0, 0.04));
  color: var(--n-text-color);
}

.rsm__nav-btn--active {
  background: var(--n-primary-color-hover, rgba(99, 147, 245, 0.08));
  color: var(--n-primary-color);
  font-weight: 600;
}

.rsm__nav-btn--active .rsm__nav-icon {
  color: var(--n-primary-color);
}

.rsm__nav-icon {
  flex-shrink: 0;
  color: var(--n-text-color-3);
  transition: color 0.15s ease;
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

/* === Content === */
.rsm__content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 24px 32px;
}

.rsm__group {
  margin-bottom: 32px;
}

.rsm__group:last-child {
  margin-bottom: 0;
}

.rsm__group-header {
  margin-bottom: 12px;
}

.rsm__group-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color);
}

.rsm__group-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--n-text-color-3);
}

.rsm__group-card {
  border-radius: 10px;
}

/* === Field === */
.rsm__field {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
  padding: 18px 0;
  border-bottom: 1px solid var(--n-divider-color);
}

.rsm__field--last {
  border-bottom: none;
  padding-bottom: 0;
}

.rsm__field:first-child {
  padding-top: 0;
}

.rsm__field-meta {
  min-width: 0;
}

.rsm__field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--n-text-color);
}

.rsm__field-dirty {
  font-size: 11px;
  font-weight: 500;
  color: var(--n-warning-color, #f0a020);
  background: var(--n-warning-color-hover, rgba(240, 160, 32, 0.1));
  padding: 1px 6px;
  border-radius: 4px;
}

.rsm__field-help {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--n-text-color-3);
  line-height: 1.5;
}

.rsm__field-ctrl {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.rsm__field-save {
  flex-shrink: 0;
}

.rsm__field-image {
  width: 100%;
}

/* === Save Bar === */
.rsm__bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  padding: 0 0 0;
  margin-top: 16px;
}

.rsm__bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--n-card-color);
  border: 1px solid var(--n-divider-color);
  border-radius: 10px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
}

.rsm__bar-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

/* Transition */
.rsm-bar-enter-active,
.rsm-bar-leave-active {
  transition: all 0.2s ease;
}

.rsm-bar-enter-from,
.rsm-bar-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* === Responsive === */
@media (max-width: 900px) {
  .rsm__body {
    flex-direction: column;
  }

  .rsm__sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--n-divider-color);
  }

  .rsm__nav {
    flex-direction: row;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding: 8px;
  }

  .rsm__nav-btn {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .rsm__content {
    padding: 20px 16px;
  }

  .rsm__field {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
