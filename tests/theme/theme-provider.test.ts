import { describe, it, expect, beforeEach } from 'vitest'
import {
  createThemeProvider,
  resetThemeProvider,
  getActiveThemeProvider,
} from '../../src/theme/theme-provider'

function clearRootClasses(): void {
  document.documentElement.className = ''
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    resetThemeProvider()
    clearRootClasses()
    localStorage.clear()
  })

  it('creates with default enterprise-blue light preset', () => {
    const tp = createThemeProvider()

    expect(tp.currentPreset).toBe('enterprise-blue')
    expect(tp.currentMode).toBe('light')
    expect(document.documentElement.classList.contains('ra-theme-enterprise-blue')).toBe(true)
    expect(document.documentElement.classList.contains('ra-dark')).toBe(false)
  })

  it('applies custom default preset', () => {
    const tp = createThemeProvider({ defaultPreset: 'teal-ops' })

    expect(tp.currentPreset).toBe('teal-ops')
    expect(document.documentElement.classList.contains('ra-theme-teal-ops')).toBe(true)
  })

  it('applies dark mode', () => {
    const tp = createThemeProvider({ defaultMode: 'dark' })

    expect(tp.currentMode).toBe('dark')
    expect(document.documentElement.classList.contains('ra-dark')).toBe(true)
  })

  it('switches preset at runtime', () => {
    const tp = createThemeProvider()

    tp.setPreset('graphite-pro')
    expect(tp.currentPreset).toBe('graphite-pro')
    expect(document.documentElement.classList.contains('ra-theme-graphite-pro')).toBe(true)
    expect(document.documentElement.classList.contains('ra-theme-enterprise-blue')).toBe(false)
  })

  it('switches mode at runtime', () => {
    const tp = createThemeProvider()

    tp.setMode('dark')
    expect(tp.currentMode).toBe('dark')
    expect(document.documentElement.classList.contains('ra-dark')).toBe(true)

    tp.setMode('light')
    expect(tp.currentMode).toBe('light')
    expect(document.documentElement.classList.contains('ra-dark')).toBe(false)
  })

  it('toggles mode', () => {
    const tp = createThemeProvider()

    expect(tp.currentMode).toBe('light')
    tp.toggle()
    expect(tp.currentMode).toBe('dark')
    tp.toggle()
    expect(tp.currentMode).toBe('light')
  })

  it('persists to localStorage', () => {
    const tp = createThemeProvider()
    tp.setPreset('teal-ops')
    tp.setMode('dark')

    expect(localStorage.getItem('ra-theme-preset')).toBe('teal-ops')
    expect(localStorage.getItem('ra-theme-mode')).toBe('dark')
  })

  it('restores from localStorage', () => {
    localStorage.setItem('ra-theme-preset', 'graphite-pro')
    localStorage.setItem('ra-theme-mode', 'dark')

    const tp = createThemeProvider()

    expect(tp.currentPreset).toBe('graphite-pro')
    expect(tp.currentMode).toBe('dark')
  })

  it('ignores invalid stored values', () => {
    localStorage.setItem('ra-theme-preset', 'invalid-theme')
    localStorage.setItem('ra-theme-mode', 'purple')

    const tp = createThemeProvider()

    expect(tp.currentPreset).toBe('enterprise-blue')
    expect(tp.currentMode).toBe('light')
  })

  it('supports custom storage key', () => {
    const tp = createThemeProvider({ storageKey: 'my-app' })
    tp.setPreset('teal-ops')

    expect(localStorage.getItem('my-app-preset')).toBe('teal-ops')
    expect(localStorage.getItem('ra-theme-preset')).toBeNull()
  })

  it('supports custom storage backend', () => {
    const store: Record<string, string> = {}
    const tp = createThemeProvider({
      storage: {
        get: (k) => store[k] ?? null,
        set: (k, v) => { store[k] = v },
      },
    })

    tp.setPreset('graphite-pro')
    expect(store['ra-theme-preset']).toBe('graphite-pro')
    expect(localStorage.getItem('ra-theme-preset')).toBeNull()
  })

  it('returns naive-ui overrides matching current state', () => {
    const tp = createThemeProvider()

    const overrides = tp.naiveOverrides
    expect(overrides.common?.primaryColor).toBe('#2080f0')

    tp.setPreset('graphite-pro')
    expect(tp.naiveOverrides.common?.primaryColor).toBe('#5856d6')

    tp.setMode('dark')
    expect(tp.naiveOverrides.common?.primaryColor).toBe('#7b79e8')
  })

  it('only one instance active at a time (HMR safe)', () => {
    const tp1 = createThemeProvider({ defaultPreset: 'teal-ops' })
    expect(getActiveThemeProvider()).toBe(tp1)
    expect(tp1.currentPreset).toBe('teal-ops')

    const tp2 = createThemeProvider({ defaultPreset: 'graphite-pro' })
    expect(getActiveThemeProvider()).toBe(tp2)
    // tp1 persisted 'teal-ops', so tp2 restores it from storage (not defaultPreset)
    expect(tp2.currentPreset).toBe('teal-ops')
  })

  it('new instance uses defaultPreset when storage is empty', () => {
    const tp = createThemeProvider({ defaultPreset: 'graphite-pro' })
    expect(tp.currentPreset).toBe('graphite-pro')
  })

  it('getActiveThemeProvider returns null after reset', () => {
    createThemeProvider()
    resetThemeProvider()
    expect(getActiveThemeProvider()).toBeNull()
  })

  it('ignores setPreset with invalid name', () => {
    const tp = createThemeProvider()
    tp.setPreset('invalid' as never)
    expect(tp.currentPreset).toBe('enterprise-blue')
  })

  it('ignores setMode with invalid value', () => {
    const tp = createThemeProvider()
    tp.setMode('purple' as never)
    expect(tp.currentMode).toBe('light')
  })

  it('destroy clears active instance', () => {
    const tp = createThemeProvider()
    tp.destroy()
    expect(getActiveThemeProvider()).toBeNull()
  })

  it('works with custom storage that throws', () => {
    const tp = createThemeProvider({
      storage: {
        get: () => { throw new Error('storage read failed') },
        set: () => { throw new Error('storage write failed') },
      },
    })
    expect(tp.currentPreset).toBe('enterprise-blue')
  })
})
