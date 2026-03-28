import { ref, computed, type Ref } from 'vue'
import type { HighlightItem, HighlightColor, SerializedRange, HighlightApiAdapter } from '../types'

const HIGHLIGHT_COLORS: HighlightColor[] = ['yellow', 'green', 'blue', 'pink', 'orange']

const COLOR_MAP: Record<HighlightColor, string> = {
  yellow: 'rgba(250, 204, 21, 0.4)',
  green: 'rgba(74, 222, 128, 0.4)',
  blue: 'rgba(96, 165, 250, 0.4)',
  pink: 'rgba(244, 114, 182, 0.4)',
  orange: 'rgba(251, 146, 60, 0.4)',
}

export function useHighlight(options: {
  api: Ref<HighlightApiAdapter | undefined>
  sourceType: Ref<string>
  sourceId: Ref<number | undefined>
  sourceKey: Ref<string>
}) {
  const highlights = ref<HighlightItem[]>([])
  const activeColor = ref<HighlightColor>('yellow')
  const highlightMode = ref(false)
  const panelVisible = ref(false)
  const loading = ref(false)
  const editingNoteId = ref<number | null>(null)
  const editingNoteText = ref('')

  const sortedHighlights = computed(() =>
    [...highlights.value].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
  )

  const hasHighlights = computed(() => highlights.value.length > 0)

  async function loadHighlights() {
    if (!options.api.value) return
    loading.value = true
    try {
      const result = await options.api.value.listHighlights({
        source_type: options.sourceType.value,
        source_id: options.sourceId.value,
        source_key: options.sourceKey.value,
      })
      highlights.value = result.items || []
    } catch (e) {
      console.error('[useHighlight] loadHighlights failed', e)
    } finally {
      loading.value = false
    }
  }

  async function createHighlight(text: string, serializedRange: SerializedRange) {
    if (!options.api.value) return null
    try {
      const item = await options.api.value.createHighlight({
        source_type: options.sourceType.value,
        source_id: options.sourceId.value,
        source_key: options.sourceKey.value,
        color: activeColor.value,
        text,
        serialized_range: JSON.stringify(serializedRange),
        sort_order: highlights.value.length,
      })
      highlights.value.push(item)
      return item
    } catch (e) {
      console.error('[useHighlight] createHighlight failed', e)
      return null
    }
  }

  async function updateHighlight(id: number, data: Partial<Pick<HighlightItem, 'color' | 'note' | 'sort_order'>>) {
    if (!options.api.value) return
    try {
      await options.api.value.updateHighlight(id, data)
      const idx = highlights.value.findIndex((h) => h.id === id)
      if (idx >= 0) {
        Object.assign(highlights.value[idx], data)
      }
    } catch (e) {
      console.error('[useHighlight] updateHighlight failed', e)
    }
  }

  async function deleteHighlight(id: number) {
    if (!options.api.value) return
    try {
      await options.api.value.deleteHighlight(id)
      highlights.value = highlights.value.filter((h) => h.id !== id)
    } catch (e) {
      console.error('[useHighlight] deleteHighlight failed', e)
    }
  }

  async function copyAllHighlights(): Promise<string> {
    if (!options.api.value) return ''
    try {
      const result = await options.api.value.copyText({
        source_type: options.sourceType.value,
        source_id: options.sourceId.value,
        source_key: options.sourceKey.value,
      })
      return result.text
    } catch (e) {
      console.error('[useHighlight] copyText failed', e)
      return ''
    }
  }

  async function clearAllHighlights() {
    if (!options.api.value) return
    try {
      await options.api.value.batchDelete({
        source_type: options.sourceType.value,
        source_id: options.sourceId.value,
        source_key: options.sourceKey.value,
      })
      highlights.value = []
    } catch (e) {
      console.error('[useHighlight] clearAll failed', e)
    }
  }

  function startEditNote(id: number) {
    const h = highlights.value.find((item) => item.id === id)
    editingNoteId.value = id
    editingNoteText.value = h?.note || ''
  }

  async function saveNote() {
    if (editingNoteId.value === null) return
    await updateHighlight(editingNoteId.value, { note: editingNoteText.value })
    editingNoteId.value = null
    editingNoteText.value = ''
  }

  function cancelEditNote() {
    editingNoteId.value = null
    editingNoteText.value = ''
  }

  return {
    highlights,
    sortedHighlights,
    hasHighlights,
    activeColor,
    highlightMode,
    panelVisible,
    loading,
    editingNoteId,
    editingNoteText,
    HIGHLIGHT_COLORS,
    COLOR_MAP,
    loadHighlights,
    createHighlight,
    updateHighlight,
    deleteHighlight,
    copyAllHighlights,
    clearAllHighlights,
    startEditNote,
    saveNote,
    cancelEditNote,
  }
}
