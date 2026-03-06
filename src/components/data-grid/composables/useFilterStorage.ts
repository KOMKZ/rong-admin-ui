export interface FilterCondition {
  field: string
  operator: string
  value: unknown
  logic: 'AND' | 'OR'
}

export function useFilterStorage(storageKey?: string) {
  function getKey(): string | null {
    return storageKey ? `rdg_filters_${storageKey}` : null
  }

  function load(): FilterCondition[] {
    const key = getKey()
    if (!key) return []
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      /* swallow */
    }
    return []
  }

  function save(conditions: FilterCondition[]): void {
    const key = getKey()
    if (!key) return
    try {
      localStorage.setItem(key, JSON.stringify(conditions))
    } catch {
      /* swallow */
    }
  }

  function clear(): void {
    const key = getKey()
    if (!key) return
    try {
      localStorage.removeItem(key)
    } catch {
      /* swallow */
    }
  }

  return { load, save, clear }
}
