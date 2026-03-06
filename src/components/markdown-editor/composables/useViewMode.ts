import { ref, computed, watch } from 'vue'
import type { MarkdownEditorViewMode } from '../types'

interface UseViewModeOptions {
  initialMode: MarkdownEditorViewMode
  onModeChange?: (mode: MarkdownEditorViewMode) => void
}

export function useViewMode({ initialMode, onModeChange }: UseViewModeOptions) {
  const currentMode = ref<MarkdownEditorViewMode>(initialMode)

  const isEditVisible = computed(
    () => currentMode.value === 'split' || currentMode.value === 'edit',
  )
  const isPreviewVisible = computed(
    () => currentMode.value === 'split' || currentMode.value === 'preview',
  )
  const isSplit = computed(() => currentMode.value === 'split')

  function setMode(mode: MarkdownEditorViewMode) {
    if (mode === currentMode.value) return
    currentMode.value = mode
    onModeChange?.(mode)
  }

  watch(
    () => initialMode,
    (newMode) => {
      if (newMode !== currentMode.value) {
        currentMode.value = newMode
      }
    },
  )

  return {
    currentMode,
    isEditVisible,
    isPreviewVisible,
    isSplit,
    setMode,
  }
}
