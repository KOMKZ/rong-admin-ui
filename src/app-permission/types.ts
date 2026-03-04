export type PermissionScope = 'route' | 'menu' | 'element'

export interface PermissionItem {
  action: string
  label?: string
  scope: PermissionScope
}

export interface PermissionGroup {
  groupKey: string
  groupLabel: string
  items: PermissionItem[]
}

export interface PermissionPolicy {
  hasPermission: (action: string) => boolean
  hasAnyPermission: (actions: string[]) => boolean
  hasAllPermissions: (actions: string[]) => boolean
  isSuperAdmin: () => boolean
}

export interface PermissionStore {
  permissions: PermissionItem[]
  groups: PermissionGroup[]
  superAdmin: boolean
}

export type PermissionEffect = 'disabled' | 'hidden'

export interface PermissionDirectiveBinding {
  action: string
  effect?: PermissionEffect
}

export interface PermissionRouteGuardConfig {
  getPermissions: () => string[]
  isSuperAdmin: () => boolean
  onDeny: (requiredPermissions: string[]) => void
}
