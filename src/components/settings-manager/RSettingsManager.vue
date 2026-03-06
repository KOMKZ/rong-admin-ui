<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NButton, NSpin, NInput, NInputNumber, NSelect, NSwitch, NRadioGroup, NRadio, NColorPicker, NCard, NSpace, NText, NAlert, NImage } from 'naive-ui'
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
  const el = document.getElementById(`settings-group-${key}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    .filter(f => f.status === 'success' && f.url)
    .map(f => f.url!)
    .join(',')
  currentValues.value[fieldKey] = urls
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
  <div class="r-settings-manager" :class="[`r-settings-manager--${layout}`]">
    <!-- Header -->
    <div class="r-settings-manager__header">
      <div class="r-settings-manager__title-area">
        <h2 class="r-settings-manager__title">{{ title }}</h2>
        <p v-if="description" class="r-settings-manager__description">{{ description }}</p>
      </div>
      <div v-if="saveMode === 'batch' && hasDirty" class="r-settings-manager__actions">
        <NSpace>
          <NButton size="small" @click="resetDirty">
            <template #icon><RIcon name="rotate-ccw" :size="14" /></template>
            重置
          </NButton>
          <NButton type="primary" size="small" :loading="saving" @click="saveAll">
            <template #icon><RIcon name="save" :size="14" /></template>
            保存 {{ dirtyFields.length }} 项更改
          </NButton>
        </NSpace>
      </div>
    </div>

    <!-- Search -->
    <div v-if="showSearch" class="r-settings-manager__search">
      <NInput
        v-model:value="searchQuery"
        placeholder="搜索设置项..."
        clearable
        size="small"
      >
        <template #prefix><RIcon name="search" :size="14" /></template>
      </NInput>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="r-settings-manager__loading">
      <NSpin size="large" />
    </div>

    <!-- Error -->
    <NAlert v-else-if="errorMessage" type="error" :title="errorMessage" class="r-settings-manager__error">
      <template #header>加载设置失败</template>
      <NButton size="small" @click="loadData">重试</NButton>
    </NAlert>

    <!-- Empty -->
    <REmptyState v-else-if="filteredGroups.length === 0 && !loading" description="没有找到匹配的设置项" />

    <!-- Content -->
    <div v-else class="r-settings-manager__content">
      <!-- Group nav sidebar -->
      <nav v-if="showGroupNav && groups.length > 1" class="r-settings-manager__nav">
        <ul class="r-settings-manager__nav-list">
          <li
            v-for="g in groups"
            :key="g.key"
            class="r-settings-manager__nav-item"
            :class="{ 'r-settings-manager__nav-item--active': activeGroupKey === g.key }"
            @click="scrollToGroup(g.key)"
          >
            <RIcon v-if="g.icon" :name="g.icon" :size="16" />
            <span>{{ g.label }}</span>
          </li>
        </ul>
      </nav>

      <!-- Settings groups -->
      <div class="r-settings-manager__groups">
        <div
          v-for="group in filteredGroups"
          :key="group.key"
          :id="`settings-group-${group.key}`"
          class="r-settings-manager__group"
        >
          <NCard :title="group.label" size="small" :bordered="layout === 'card'">
            <template v-if="group.description" #header-extra>
              <NText depth="3" style="font-size: 13px;">{{ group.description }}</NText>
            </template>

            <div class="r-settings-manager__fields">
              <div
                v-for="field in group.fields"
                :key="field.key"
                class="r-settings-manager__field"
              >
                <div class="r-settings-manager__field-info">
                  <label class="r-settings-manager__field-label">{{ field.label }}</label>
                  <p v-if="field.description" class="r-settings-manager__field-desc">{{ field.description }}</p>
                </div>
                <div class="r-settings-manager__field-control">
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
                    @update:value="(v: number | null) => (currentValues[field.key] = String(v ?? 0))"
                  />
                  <!-- Select -->
                  <NSelect
                    v-else-if="field.type === 'select'"
                    :value="currentValues[field.key]"
                    :options="(field.options || []).map(o => ({ label: o.label, value: String(o.value) }))"
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
                  <!-- Image (pro-upload) -->
                  <div v-else-if="field.type === 'image'" class="r-settings-manager__field-image">
                    <RProUpload
                      :value="urlToFileList(currentValues[field.key])"
                      :accept="field.accept || 'image/*'"
                      :max-count="field.maxCount || 1"
                      :max-size-m-b="field.maxSizeMB || 5"
                      :disabled="field.disabled"
                      list-type="picture-card"
                      :custom-request="customUploadRequest"
                      :parse-response="parseUploadResponse ? (raw: unknown) => {
                        const parsed = parseUploadResponse!(raw)
                        return { url: parsed.url, thumbUrl: parsed.url, storageId: parsed.storageId }
                      } : undefined"
                      @change="(files: ProUploadFileItem[]) => handleImageChange(field.key, files)"
                    />
                    <NImage
                      v-if="currentValues[field.key] && !currentValues[field.key].includes(',')"
                      :src="currentValues[field.key]"
                      :width="80"
                      :preview-disabled="false"
                      class="r-settings-manager__field-image-preview"
                    />
                  </div>
                  <!-- Fallback input -->
                  <NInput
                    v-else
                    :value="currentValues[field.key]"
                    :placeholder="field.placeholder"
                    :disabled="field.disabled"
                    size="small"
                    @update:value="(v: string) => (currentValues[field.key] = v)"
                  />

                  <!-- Per-field save button (field mode) -->
                  <NButton
                    v-if="saveMode === 'field' && currentValues[field.key] !== originalValues[field.key]"
                    size="tiny"
                    type="primary"
                    :loading="savingField === field.key"
                    class="r-settings-manager__field-save"
                    @click="saveField(field.key)"
                  >
                    保存
                  </NButton>
                </div>
              </div>
            </div>
          </NCard>
        </div>
      </div>
    </div>

    <!-- Sticky batch save bar -->
    <Transition name="r-settings-manager-bar">
      <div v-if="saveMode === 'batch' && hasDirty && !loading" class="r-settings-manager__save-bar">
        <NSpace align="center" justify="space-between" style="width: 100%;">
          <NText>{{ dirtyFields.length }} 项未保存的更改</NText>
          <NSpace>
            <NButton size="small" @click="resetDirty">放弃更改</NButton>
            <NButton type="primary" size="small" :loading="saving" @click="saveAll">保存全部</NButton>
          </NSpace>
        </NSpace>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.r-settings-manager {
  display: flex;
  flex-direction: column;
  gap: var(--r-space-4, 16px);
  max-width: 960px;
}

.r-settings-manager__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--r-space-4, 16px);
}

.r-settings-manager__title {
  margin: 0;
  font-size: var(--r-font-size-xl, 20px);
  font-weight: 600;
  color: var(--r-text-primary, var(--n-text-color));
}

.r-settings-manager__description {
  margin: 4px 0 0;
  font-size: var(--r-font-size-sm, 13px);
  color: var(--r-text-secondary, var(--n-text-color-3));
}

.r-settings-manager__search {
  max-width: 320px;
}

.r-settings-manager__loading {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.r-settings-manager__error {
  margin: var(--r-space-4, 16px) 0;
}

.r-settings-manager__content {
  display: flex;
  gap: var(--r-space-6, 24px);
}

.r-settings-manager__nav {
  flex-shrink: 0;
  width: 180px;
  position: sticky;
  top: var(--r-space-4, 16px);
  align-self: flex-start;
}

.r-settings-manager__nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.r-settings-manager__nav-item {
  display: flex;
  align-items: center;
  gap: var(--r-space-2, 8px);
  padding: 8px 12px;
  border-radius: var(--r-radius-md, 6px);
  cursor: pointer;
  font-size: var(--r-font-size-sm, 13px);
  color: var(--r-text-secondary, var(--n-text-color-3));
  transition: all 0.15s ease;
}

.r-settings-manager__nav-item:hover {
  background: var(--r-bg-hover, var(--n-color-hover));
  color: var(--r-text-primary, var(--n-text-color));
}

.r-settings-manager__nav-item--active {
  background: var(--r-bg-active, var(--n-primary-color-hover));
  color: var(--r-color-primary, var(--n-primary-color));
  font-weight: 500;
}

.r-settings-manager__groups {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--r-space-4, 16px);
}

.r-settings-manager__fields {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.r-settings-manager__field {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--r-space-6, 24px);
  padding: 16px 0;
  border-bottom: 1px solid var(--r-border-light, var(--n-divider-color));
}

.r-settings-manager__field:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.r-settings-manager__field:first-child {
  padding-top: 0;
}

.r-settings-manager__field-info {
  flex: 1;
  min-width: 0;
}

.r-settings-manager__field-label {
  display: block;
  font-size: var(--r-font-size-base, 14px);
  font-weight: 500;
  color: var(--r-text-primary, var(--n-text-color));
}

.r-settings-manager__field-desc {
  margin: 4px 0 0;
  font-size: var(--r-font-size-xs, 12px);
  color: var(--r-text-tertiary, var(--n-text-color-3));
  line-height: 1.5;
}

.r-settings-manager__field-control {
  flex-shrink: 0;
  width: 280px;
  display: flex;
  align-items: center;
  gap: var(--r-space-2, 8px);
}

.r-settings-manager__field-save {
  flex-shrink: 0;
}

.r-settings-manager__field-image {
  display: flex;
  flex-direction: column;
  gap: var(--r-space-2, 8px);
  width: 100%;
}

.r-settings-manager__field-image-preview {
  border-radius: var(--r-radius-md, 6px);
  border: 1px solid var(--r-border-light, var(--n-divider-color));
}

.r-settings-manager__save-bar {
  position: sticky;
  bottom: 0;
  padding: 12px 16px;
  background: var(--r-bg-surface, var(--n-card-color));
  border: 1px solid var(--r-border-light, var(--n-divider-color));
  border-radius: var(--r-radius-lg, 8px);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  z-index: 10;
}

.r-settings-manager-bar-enter-active,
.r-settings-manager-bar-leave-active {
  transition: all 0.2s ease;
}

.r-settings-manager-bar-enter-from,
.r-settings-manager-bar-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 768px) {
  .r-settings-manager__content {
    flex-direction: column;
  }
  .r-settings-manager__nav {
    width: 100%;
    position: static;
  }
  .r-settings-manager__nav-list {
    flex-direction: row;
    overflow-x: auto;
  }
  .r-settings-manager__field {
    flex-direction: column;
    gap: var(--r-space-2, 8px);
  }
  .r-settings-manager__field-control {
    width: 100%;
  }
}
</style>
