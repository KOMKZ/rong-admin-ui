import { ref, computed, watch } from 'vue'
import type { RichTextEditorTheme } from '../types'

interface ThemeDef {
  id: RichTextEditorTheme
  name: string
  wrapperClass: string
  editorClass: string
}

const THEMES: ThemeDef[] = [
  { id: 'classic', name: '经典', wrapperClass: 'rrte-theme-classic', editorClass: 'rrte-editor-classic' },
  { id: 'minimal', name: '雾灰', wrapperClass: 'rrte-theme-minimal', editorClass: 'rrte-editor-minimal' },
  { id: 'midnight', name: '午夜', wrapperClass: 'rrte-theme-midnight', editorClass: 'rrte-editor-midnight' },
  { id: 'aurora', name: '极光', wrapperClass: 'rrte-theme-aurora', editorClass: 'rrte-editor-aurora' },
]

export function useEditorTheme(initialTheme: RichTextEditorTheme = 'classic') {
  const activeTheme = ref<RichTextEditorTheme>(initialTheme)

  const currentTheme = computed(
    () => THEMES.find((t) => t.id === activeTheme.value) ?? THEMES[0],
  )

  const themes = THEMES

  function setTheme(themeId: RichTextEditorTheme) {
    activeTheme.value = themeId
  }

  watch(
    () => initialTheme,
    (v) => {
      activeTheme.value = v
    },
  )

  return { activeTheme, currentTheme, themes, setTheme }
}
