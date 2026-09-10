<script setup lang="ts">
import './RSettingsManager.css'
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
    savedTimer = setTimeout(() => {
      savedField.value = null
    }, 2000)
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

  function parseUploadResult(raw: unknown) {
    if (!props.parseUploadResponse) return undefined
    const parsed = props.parseUploadResponse(raw)
    return { url: parsed.url, thumbUrl: parsed.url, storageId: parsed.storageId }
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
    return new Date(ts)
      .toISOString()
      .replace('T', ' ')
      .replace(/\.\d+Z$/, '')
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
void [NBadge, NButton, NColorPicker, NDatePicker, NInput, NInputNumber, NRadio, NRadioGroup, NSelect, NSpace, NSpin, NSwitch, NText, NTimePicker, REmptyState, RIcon, RProUpload, contentEl, dateToStr, datetimeToStr, filteredGroups, groupDirtyCounts, handleImageChange, isDirty, parseUploadResult, saveField, scrollToGroup, timeToStr, tsToDate, urlToFileList]
</script>

<template src="./RSettingsManager.template.html"></template>
