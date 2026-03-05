import { ref, computed, type Ref } from 'vue'
import type {
  ThemePresetName,
  ThemeMode,
  ThemeProviderOptions,
  ThemeProviderInstance,
} from './types'
import { getPreset, getPresetNames } from './presets'

const STORAGE_KEY_PRESET = 'ra-theme-preset'
const STORAGE_KEY_MODE = 'ra-theme-mode'

function safeStorage(
  custom?: ThemeProviderOptions['storage'],
): NonNullable<ThemeProviderOptions['storage']> {
  if (custom) return custom
  return {
    get: (key: string): string | null => {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    set: (key: string, value: string): void => {
      try {
        localStorage.setItem(key, value)
      } catch {
        /* noop */
      }
    },
  }
}

function isValidPreset(name: string): name is ThemePresetName {
  return (getPresetNames() as string[]).includes(name)
}

function isValidMode(mode: string): mode is ThemeMode {
  return mode === 'light' || mode === 'dark'
}

let activeInstance: ThemeProviderInstance | null = null

/**
 * Create a reactive theme provider.
 *
 * Only one instance should exist at a time; calling again
 * will destroy the previous instance (safe for HMR).
 */
export function createThemeProvider(options: ThemeProviderOptions = {}): ThemeProviderInstance {
  if (activeInstance) {
    activeInstance.destroy()
  }

  const storage = safeStorage(options.storage)
  const storageKeyPreset = options.storageKey ? `${options.storageKey}-preset` : STORAGE_KEY_PRESET
  const storageKeyMode = options.storageKey ? `${options.storageKey}-mode` : STORAGE_KEY_MODE

  let storedPreset: string | null = null
  let storedMode: string | null = null
  try {
    storedPreset = storage.get(storageKeyPreset)
  } catch {
    /* storage unavailable */
  }
  try {
    storedMode = storage.get(storageKeyMode)
  } catch {
    /* storage unavailable */
  }

  const currentPreset: Ref<ThemePresetName> = ref(
    storedPreset && isValidPreset(storedPreset)
      ? storedPreset
      : (options.defaultPreset ?? 'enterprise-blue'),
  )
  const currentMode: Ref<ThemeMode> = ref(
    storedMode && isValidMode(storedMode) ? storedMode : (options.defaultMode ?? 'light'),
  )

  const naiveOverrides = computed(() => {
    return getPreset(currentPreset.value, currentMode.value).naiveOverrides
  })

  function applyToDOM(): void {
    const root = document.querySelector(options.rootSelector ?? ':root')
    if (!root) return

    const htmlEl = root as HTMLElement

    for (const name of getPresetNames()) {
      htmlEl.classList.remove(`ra-theme-${name}`)
    }
    htmlEl.classList.remove('ra-dark')

    htmlEl.classList.add(`ra-theme-${currentPreset.value}`)
    if (currentMode.value === 'dark') {
      htmlEl.classList.add('ra-dark')
    }
  }

  function persist(): void {
    try {
      storage.set(storageKeyPreset, currentPreset.value)
    } catch {
      /* storage unavailable */
    }
    try {
      storage.set(storageKeyMode, currentMode.value)
    } catch {
      /* storage unavailable */
    }
  }

  function setPreset(name: ThemePresetName): void {
    if (!isValidPreset(name)) return
    currentPreset.value = name
    applyToDOM()
    persist()
  }

  function setMode(mode: ThemeMode): void {
    if (!isValidMode(mode)) return
    currentMode.value = mode
    applyToDOM()
    persist()
  }

  function toggle(): void {
    setMode(currentMode.value === 'light' ? 'dark' : 'light')
  }

  function destroy(): void {
    activeInstance = null
  }

  applyToDOM()
  persist()

  const instance: ThemeProviderInstance = {
    get currentPreset() {
      return currentPreset.value
    },
    get currentMode() {
      return currentMode.value
    },
    get naiveOverrides() {
      return naiveOverrides.value
    },
    setPreset,
    setMode,
    toggle,
    destroy,
  }

  activeInstance = instance
  return instance
}

export function getActiveThemeProvider(): ThemeProviderInstance | null {
  return activeInstance
}

/** Reset module-level singleton (for testing / HMR) */
export function resetThemeProvider(): void {
  if (activeInstance) {
    activeInstance.destroy()
  }
  activeInstance = null
}
