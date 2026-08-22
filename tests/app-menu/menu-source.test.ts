import { describe, expect, it, vi } from 'vitest'
import { createMenuSource, normalizeMenuTree, routeRecordsToMenuTree } from '../../src/app-menu'

describe('app-menu menu source', () => {
  it('uses local mode by default', () => {
    const source = createMenuSource({
      localMenus: [{ name: 'Dashboard', path: '/dashboard', title: 'Dashboard' }],
    })

    expect(source.mode.value).toBe('local')
    expect(source.menus.value).toEqual([
      { name: 'Dashboard', path: '/dashboard', title: 'Dashboard' },
    ])
  })

  it('loads remote menus only when remote mode is enabled', async () => {
    const loadRemoteMenus = vi
      .fn()
      .mockResolvedValue([
        { name: 'RoleList', path: '/system/role', title: 'Roles', icon: 'Shield' },
      ])
    const source = createMenuSource({
      mode: 'local',
      localMenus: [{ name: 'Dashboard', path: '/dashboard', title: 'Dashboard' }],
      loadRemoteMenus,
    })

    await source.load()
    expect(loadRemoteMenus).not.toHaveBeenCalled()
    expect(source.menus.value[0]?.name).toBe('Dashboard')

    source.setMode('remote')
    await source.load()
    expect(loadRemoteMenus).toHaveBeenCalledOnce()
    expect(source.menus.value[0]?.name).toBe('RoleList')
  })

  it('normalizes menu trees and filters hidden or invalid nodes', () => {
    const menus = normalizeMenuTree([
      {
        name: 'System',
        path: '/system',
        title: 'System',
        children: [
          { name: 'RoleList', path: '/system/role', title: 'Roles' },
          { name: 'Hidden', path: '/hidden', title: 'Hidden', hidden: true },
          { name: '', path: '/invalid', title: 'Invalid' },
        ],
      },
    ])

    expect(menus).toHaveLength(1)
    expect(menus[0]?.children).toEqual([{ name: 'RoleList', path: '/system/role', title: 'Roles' }])
  })

  it('converts route records to local menu tree', () => {
    const menus = routeRecordsToMenuTree([
      {
        path: 'system',
        name: 'System',
        component: {},
        meta: { title: 'System', icon: 'Shield' },
        children: [
          {
            path: 'role',
            name: 'RoleList',
            component: {},
            meta: { title: 'Roles', icon: 'Shield' },
          },
        ],
      },
    ])

    expect(menus).toEqual([
      {
        name: 'System',
        path: '/system',
        title: 'System',
        icon: 'Shield',
        meta: { title: 'System', icon: 'Shield' },
        children: [
          {
            name: 'RoleList',
            path: '/system/role',
            title: 'Roles',
            icon: 'Shield',
            meta: { title: 'Roles', icon: 'Shield' },
          },
        ],
      },
    ])
  })
})
