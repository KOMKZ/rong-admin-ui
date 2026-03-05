import type { GlobalThemeOverrides } from 'naive-ui'

export type ThemePresetName = 'enterprise-blue' | 'teal-ops' | 'graphite-pro' | 'cloud-ops' | 'slate-pro'
export type ThemeMode = 'light' | 'dark'

export interface ThemePreset {
  name: ThemePresetName
  label: string
  mode: ThemeMode
  cssClass: string
  naiveOverrides: GlobalThemeOverrides
}

export interface ThemeProviderOptions {
  defaultPreset?: ThemePresetName
  defaultMode?: ThemeMode
  storageKey?: string
  /** Custom storage; defaults to localStorage */
  storage?: {
    get: (key: string) => string | null
    set: (key: string, value: string) => void
  }
  /** Root element selector for applying theme class; defaults to ':root' */
  rootSelector?: string
}

export interface ThemeProviderInstance {
  readonly currentPreset: ThemePresetName
  readonly currentMode: ThemeMode
  readonly naiveOverrides: GlobalThemeOverrides
  setPreset: (name: ThemePresetName) => void
  setMode: (mode: ThemeMode) => void
  toggle: () => void
  destroy: () => void
}
