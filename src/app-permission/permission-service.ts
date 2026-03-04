import { computed, ref, type ComputedRef } from 'vue'
import type { PermissionGroup, PermissionItem, PermissionPolicy, PermissionStore } from './types'

export interface PermissionServiceInstance extends PermissionPolicy {
  setPermissions: (items: PermissionItem[], groups?: PermissionGroup[]) => void
  setSuperAdmin: (value: boolean) => void
  clear: () => void
  allActions: ComputedRef<Set<string>>
}

export function createPermissionService(): PermissionServiceInstance {
  const store = ref<PermissionStore>({
    permissions: [],
    groups: [],
    superAdmin: false,
  })

  const allActions = computed(() => {
    return new Set(store.value.permissions.map((p) => p.action))
  })

  function hasPermission(action: string): boolean {
    if (store.value.superAdmin) return true
    return allActions.value.has(action)
  }

  function hasAnyPermission(actions: string[]): boolean {
    if (store.value.superAdmin) return true
    return actions.some((action) => allActions.value.has(action))
  }

  function hasAllPermissions(actions: string[]): boolean {
    if (store.value.superAdmin) return true
    return actions.every((action) => allActions.value.has(action))
  }

  function isSuperAdmin(): boolean {
    return store.value.superAdmin
  }

  function setPermissions(items: PermissionItem[], groups?: PermissionGroup[]): void {
    store.value.permissions = items
    if (groups) {
      store.value.groups = groups
    }
  }

  function setSuperAdmin(value: boolean): void {
    store.value.superAdmin = value
  }

  function clear(): void {
    store.value = { permissions: [], groups: [], superAdmin: false }
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    setPermissions,
    setSuperAdmin,
    clear,
    allActions,
  }
}
