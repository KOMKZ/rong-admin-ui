import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { loadRouteModules } from '@/app-router/route-loader'
import type { RouteModuleConfig } from '@/app-router/types'

const DummyComponent = defineComponent({
  render() { return h('div') },
})

describe('loadRouteModules', () => {
  it('should load and sort route modules by order', () => {
    const modules: Record<string, { default: RouteModuleConfig }> = {
      './modules/dashboard.ts': {
        default: {
          name: 'dashboard',
          path: '/dashboard',
          component: DummyComponent,
          order: 1,
          meta: { title: 'Dashboard' },
        },
      },
      './modules/system.ts': {
        default: {
          name: 'system',
          path: '/system',
          component: DummyComponent,
          order: 99,
          meta: { title: 'System' },
        },
      },
      './modules/user.ts': {
        default: {
          name: 'user',
          path: '/user',
          component: DummyComponent,
          order: 10,
          meta: { title: 'User' },
        },
      },
    }

    const routes = loadRouteModules(modules)

    expect(routes).toHaveLength(3)
    expect(routes[0].name).toBe('dashboard')
    expect(routes[1].name).toBe('user')
    expect(routes[2].name).toBe('system')
  })

  it('should skip modules without name or path', () => {
    const modules: Record<string, { default: RouteModuleConfig }> = {
      './empty.ts': {
        default: { name: '', path: '' },
      },
      './valid.ts': {
        default: {
          name: 'valid',
          path: '/valid',
          component: DummyComponent,
          meta: { title: 'Valid' },
        },
      },
    }

    const routes = loadRouteModules(modules)
    expect(routes).toHaveLength(1)
    expect(routes[0].name).toBe('valid')
  })

  it('should handle nested children', () => {
    const modules: Record<string, { default: RouteModuleConfig }> = {
      './parent.ts': {
        default: {
          name: 'parent',
          path: '/parent',
          component: DummyComponent,
          meta: { title: 'Parent' },
          children: [
            {
              name: 'child',
              path: 'child',
              component: DummyComponent,
              meta: { title: 'Child' },
            },
          ],
        },
      },
    }

    const routes = loadRouteModules(modules)
    expect(routes[0].children).toHaveLength(1)
    expect(routes[0].children![0].name).toBe('child')
  })
})
