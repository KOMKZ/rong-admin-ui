import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { createRouteGenerator } from '@/app-router/route-generator'
import type { MenuDataItem, RouteGeneratorOptions } from '@/app-router/types'

const Layout = defineComponent({ render: () => h('div', 'layout') })
const ParentLayout = defineComponent({ render: () => h('div', 'parent') })
const NotFound = defineComponent({ render: () => h('div', '404') })

const options: RouteGeneratorOptions = {
  layoutComponent: Layout,
  parentLayoutComponent: ParentLayout,
  viewModules: {
    '/views/dashboard/index.vue': () => Promise.resolve(defineComponent({ render: () => h('div') })),
    '/views/user/list.vue': () => Promise.resolve(defineComponent({ render: () => h('div') })),
    '/views/user/detail.vue': () => Promise.resolve(defineComponent({ render: () => h('div') })),
    '/views/settings/profile.vue': () =>
      Promise.resolve(defineComponent({ render: () => h('div') })),
  },
  notFoundComponent: NotFound,
}

const generate = createRouteGenerator(options)

describe('createRouteGenerator', () => {
  it('should generate top-level route with layout component', () => {
    const menus: MenuDataItem[] = [
      {
        id: 1,
        parentId: null,
        name: 'Dashboard',
        path: '/dashboard',
        children: [
          { id: 2, parentId: 1, name: 'Home', path: '/dashboard/home', component: 'dashboard' },
        ],
      },
    ]

    const routes = generate(menus)
    expect(routes).toHaveLength(1)
    expect(routes[0].component).toBe(Layout)
    expect(routes[0].redirect).toBe('/dashboard/home')
    expect(routes[0].children).toHaveLength(1)
  })

  it('should map menu component to view module', () => {
    const menus: MenuDataItem[] = [
      {
        id: 1,
        parentId: null,
        name: 'Users',
        path: '/users',
        children: [
          { id: 2, parentId: 1, name: 'List', path: '/users/list', component: 'user/list' },
        ],
      },
    ]

    const routes = generate(menus)
    expect(routes[0].children).toHaveLength(1)
    expect(typeof routes[0].children![0].component).toBe('function')
  })

  it('should handle multi-level nested children', () => {
    const menus: MenuDataItem[] = [
      {
        id: 1,
        parentId: null,
        name: 'Settings',
        path: '/settings',
        children: [
          {
            id: 2,
            parentId: 1,
            name: 'Account',
            path: '/settings/account',
            children: [
              {
                id: 3,
                parentId: 2,
                name: 'Profile',
                path: '/settings/account/profile',
                component: 'settings/profile',
              },
            ],
          },
        ],
      },
    ]

    const routes = generate(menus)
    expect(routes[0].children).toHaveLength(1)
    const accountRoute = routes[0].children![0]
    expect(accountRoute.component).toBe(ParentLayout)
    expect(accountRoute.children).toHaveLength(1)
    expect(typeof accountRoute.children![0].component).toBe('function')
  })

  it('should handle explicit redirect on top-level menu', () => {
    const menus: MenuDataItem[] = [
      {
        id: 1,
        parentId: null,
        name: 'Redirect',
        path: '/redirect',
        redirect: '/target',
        children: [],
      },
    ]

    const routes = generate(menus)
    expect(routes[0].redirect).toBe('/target')
  })

  it('should use notFoundComponent when component path is not in viewModules', () => {
    const menus: MenuDataItem[] = [
      {
        id: 1,
        parentId: null,
        name: 'Missing',
        path: '/missing',
        children: [
          {
            id: 2,
            parentId: 1,
            name: 'Gone',
            path: '/missing/gone',
            component: 'nonexistent/page',
          },
        ],
      },
    ]

    const routes = generate(menus)
    expect(routes[0].children![0].component).toBe(NotFound)
  })

  it('should use notFoundComponent when leaf menu has no component', () => {
    const menus: MenuDataItem[] = [
      {
        id: 1,
        parentId: null,
        name: 'NoComp',
        path: '/no-comp',
        children: [
          { id: 2, parentId: 1, name: 'Leaf', path: '/no-comp/leaf' },
        ],
      },
    ]

    const routes = generate(menus)
    expect(routes[0].children![0].component).toBe(NotFound)
  })

  it('should merge menu.meta into route.meta', () => {
    const menus: MenuDataItem[] = [
      {
        id: 1,
        parentId: null,
        name: 'WithMeta',
        path: '/meta',
        icon: 'icon-star',
        hidden: true,
        orderNum: 5,
        meta: { keepAlive: true, custom: 'value' },
        children: [],
      },
    ]

    const routes = generate(menus)
    const meta = routes[0].meta as Record<string, unknown>
    expect(meta.title).toBe('WithMeta')
    expect(meta.icon).toBe('icon-star')
    expect(meta.hidden).toBe(true)
    expect(meta.orderNum).toBe(5)
    expect(meta.keepAlive).toBe(true)
    expect(meta.custom).toBe('value')
  })

  it('should handle empty menus', () => {
    const routes = generate([])
    expect(routes).toHaveLength(0)
  })
})
