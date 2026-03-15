import { describe, expect, it } from 'vitest'
import {
  canAccessRoute,
  filterMenusByVisibleNames,
  hasElementPermission,
  hasPageAction,
  type UIAuthPayload,
} from '@/app-permission/ui-auth'

describe('ui-auth helpers', () => {
  const auth: UIAuthPayload = {
    visible_routes: ['/dashboard', '/system', '/system/permission-hub'],
    visible_menus: ['Dashboard', 'SystemManagement', 'PermissionHub'],
    element_permissions: {
      '/system/permission-hub': ['permission:write'],
    },
    page_actions: {
      '/system/permission-hub': ['sync', 'batch-assign'],
    },
  }

  it('checks route visibility', () => {
    expect(canAccessRoute(auth, '/dashboard')).toBe(true)
    expect(canAccessRoute(auth, '/system/permission-hub/detail')).toBe(true)
    expect(canAccessRoute(auth, '/admin/list')).toBe(false)
  })

  it('checks element permissions', () => {
    expect(hasElementPermission(auth, '/system/permission-hub', 'permission:write')).toBe(true)
    expect(hasElementPermission(auth, '/system/permission-hub', 'permission:delete')).toBe(false)
    expect(hasElementPermission(auth, '/dashboard', 'anything')).toBe(true)
  })

  it('checks page actions', () => {
    expect(hasPageAction(auth, '/system/permission-hub', 'sync')).toBe(true)
    expect(hasPageAction(auth, '/system/permission-hub', 'export')).toBe(false)
  })

  it('filters menu tree by visible names', () => {
    const menus = [
      {
        name: 'Dashboard',
      },
      {
        name: 'SystemManagement',
        children: [{ name: 'RoleList' }, { name: 'PermissionHub' }],
      },
    ]

    const filtered = filterMenusByVisibleNames(menus, auth)
    expect(filtered).toHaveLength(2)
    expect(filtered[1].children).toHaveLength(1)
    expect(filtered[1].children?.[0]?.name).toBe('PermissionHub')
  })
})
