import { describe, expect, it } from 'vitest'
import { createPermissionService } from '@/app-permission/permission-service'

describe('createPermissionService', () => {
  it('should return false when no permissions set', () => {
    const service = createPermissionService()
    expect(service.hasPermission('user:read')).toBe(false)
    expect(service.isSuperAdmin()).toBe(false)
  })

  it('should check single permission correctly', () => {
    const service = createPermissionService()
    service.setPermissions([
      { action: 'user:read', scope: 'element' },
      { action: 'user:write', scope: 'element' },
    ])

    expect(service.hasPermission('user:read')).toBe(true)
    expect(service.hasPermission('user:delete')).toBe(false)
  })

  it('should check hasAnyPermission correctly', () => {
    const service = createPermissionService()
    service.setPermissions([
      { action: 'user:read', scope: 'element' },
    ])

    expect(service.hasAnyPermission(['user:read', 'user:write'])).toBe(true)
    expect(service.hasAnyPermission(['user:delete', 'user:write'])).toBe(false)
  })

  it('should check hasAllPermissions correctly', () => {
    const service = createPermissionService()
    service.setPermissions([
      { action: 'user:read', scope: 'element' },
      { action: 'user:write', scope: 'element' },
    ])

    expect(service.hasAllPermissions(['user:read', 'user:write'])).toBe(true)
    expect(service.hasAllPermissions(['user:read', 'user:delete'])).toBe(false)
  })

  it('should grant all permissions when superAdmin', () => {
    const service = createPermissionService()
    service.setSuperAdmin(true)

    expect(service.hasPermission('anything')).toBe(true)
    expect(service.hasAnyPermission(['anything'])).toBe(true)
    expect(service.hasAllPermissions(['a', 'b', 'c'])).toBe(true)
    expect(service.isSuperAdmin()).toBe(true)
  })

  it('should clear all permissions', () => {
    const service = createPermissionService()
    service.setPermissions([
      { action: 'user:read', scope: 'element' },
    ])
    service.setSuperAdmin(true)

    service.clear()

    expect(service.hasPermission('user:read')).toBe(false)
    expect(service.isSuperAdmin()).toBe(false)
  })
})
