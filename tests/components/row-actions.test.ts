import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import RRowActions from '../../src/components/row-actions/RRowActions.vue'
import type { RowAction } from '../../src/components/row-actions/types'

const row = { id: 1, name: 'Alpha' }

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/detail/:id', component: { template: '<div />' } },
      { path: '/create', component: { template: '<div />' } },
    ],
  })
}

describe('RRowActions', () => {
  it('renders inline actions at or below the threshold', () => {
    const wrapper = mount(RRowActions, {
      props: {
        row,
        actions: [
          { key: 'edit', label: '编辑' },
          { key: 'delete', label: '删除', danger: true },
        ],
      },
    })

    expect(wrapper.find('[data-testid="row-action-edit"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="row-action-delete"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="row-action-more"]').exists()).toBe(false)
  })

  it('renders governed default icons for common action keys', () => {
    const wrapper = mount(RRowActions, {
      props: {
        row,
        actions: [
          { key: 'detail', label: '详情' },
          { key: 'copy', label: '复制' },
          { key: 'open', label: '打开' },
        ],
      },
    })

    const icons = wrapper.findAll('[data-testid="r-icon"]')
    expect(icons).toHaveLength(3)
    expect(icons.map((icon) => icon.attributes('aria-label'))).toEqual([
      'eye',
      'copy',
      'external-link',
    ])
  })

  it('moves overflow actions into more menu when actions exceed maxInline', () => {
    const wrapper = mount(RRowActions, {
      props: {
        row,
        maxInline: 3,
        actions: [
          { key: 'edit', label: '编辑' },
          { key: 'roles', label: '分配角色' },
          { key: 'delete', label: '删除', danger: true },
          { key: 'password', label: '修改密码' },
        ],
      },
    })

    expect(wrapper.find('[data-testid="row-action-edit"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="row-action-roles"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="row-action-delete"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="row-action-password"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="row-action-more"]').exists()).toBe(true)
  })

  it('supports stable test id prefix for generated pages', () => {
    const wrapper = mount(RRowActions, {
      props: {
        row,
        testIdPrefix: 'admin',
        actions: [{ key: 'edit', label: '编辑' }],
      },
    })

    expect(wrapper.find('[data-testid="admin-edit"]').exists()).toBe(true)
  })

  it('calls action handler and emits action event', async () => {
    let clicked = false
    const wrapper = mount(RRowActions, {
      props: {
        row,
        actions: [{ key: 'edit', label: '编辑', onClick: () => (clicked = true) }],
      },
    })

    await wrapper.find('[data-testid="row-action-edit"]').trigger('click')

    expect(clicked).toBe(true)
    expect(wrapper.emitted('action')?.[0]).toEqual(['edit', row])
  })
})

describe('RRowActions route actions', () => {
  it('renders a real anchor with resolved href for route actions', () => {
    const router = createTestRouter()
    const wrapper = mount(RRowActions, {
      props: {
        row,
        actions: [{ key: 'detail', label: '详情', kind: 'route', to: { path: '/detail/1' } }],
      },
      global: { plugins: [router] },
    })

    const anchor = wrapper.find('a[data-testid="row-action-detail"]')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('href')).toContain('/detail/1')
  })

  it('navigates once on plain click and emits a single action notification', async () => {
    const router = createTestRouter()
    await router.push('/')
    const wrapper = mount(RRowActions, {
      props: {
        row,
        actions: [{ key: 'detail', label: '详情', kind: 'route', to: { path: '/detail/1' } }],
      },
      global: { plugins: [router] },
    })

    await wrapper.find('a[data-testid="row-action-detail"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/detail/1')
    expect(wrapper.emitted('action')).toHaveLength(1)
  })

  it('resolves route targets through a row callback', () => {
    const router = createTestRouter()
    const wrapper = mount(RRowActions, {
      props: {
        row,
        actions: [
          {
            key: 'detail',
            label: '详情',
            kind: 'route',
            to: (r: object) => ({ path: `/detail/${(r as { id: number }).id}` }),
          },
        ],
      },
      global: { plugins: [router] },
    })

    expect(wrapper.find('a[data-testid="row-action-detail"]').attributes('href')).toContain(
      '/detail/1',
    )
  })

  it('renders external href actions as real anchors with safe rel for _blank', () => {
    const wrapper = mount(RRowActions, {
      props: {
        row,
        actions: [
          {
            key: 'docs',
            label: '文档',
            kind: 'link',
            href: 'https://example.com/docs',
            target: '_blank',
          },
        ],
      },
    })

    const anchor = wrapper.find('a[data-testid="row-action-docs"]')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('href')).toBe('https://example.com/docs')
    expect(anchor.attributes('target')).toBe('_blank')
    expect(anchor.attributes('rel')).toContain('noopener')
    expect(anchor.attributes('rel')).toContain('noreferrer')
  })

  it('hides href from disabled route and link actions', () => {
    const wrapper = mount(RRowActions, {
      props: {
        row,
        actions: [
          {
            key: 'detail',
            label: '详情',
            kind: 'route',
            to: { path: '/detail/1' },
            disabled: true,
          },
          {
            key: 'docs',
            label: '文档',
            kind: 'link',
            href: 'https://example.com',
            target: '_blank',
            disabled: true,
          },
        ],
      },
      global: { plugins: [createTestRouter()] },
    })

    const routeAnchor = wrapper.find('a[data-testid="row-action-detail"]')
    expect(routeAnchor.exists()).toBe(true)
    expect(routeAnchor.attributes('href')).toBeUndefined()
    expect(routeAnchor.attributes('aria-disabled')).toBe('true')

    const linkAnchor = wrapper.find('a[data-testid="row-action-docs"]')
    expect(linkAnchor.attributes('href')).toBeUndefined()
    expect(linkAnchor.attributes('rel')).toBeUndefined()
  })

  it('keeps overflow route actions as anchors inside the dropdown and does not re-trigger them on select', async () => {
    const router = createTestRouter()
    const wrapper = mount(RRowActions, {
      props: {
        row,
        maxInline: 1,
        actions: [
          { key: 'edit', label: '编辑', onClick: () => {} },
          { key: 'detail', label: '详情', kind: 'route', to: { path: '/detail/1' } },
        ],
      },
      global: { plugins: [router] },
    })

    await wrapper.find('[data-testid="row-action-more"]').trigger('click')

    const menuAnchor = document.querySelector('a[data-testid="row-action-menu-detail"]')
    expect(menuAnchor).not.toBeNull()
    expect(menuAnchor?.getAttribute('href')).toContain('/detail/1')
    // icon 在 anchor 内部，option 不再渲染独立 icon 死区。
    expect(menuAnchor?.querySelector('[data-testid="r-icon"]')).not.toBeNull()
    // option 容器 padding 收敛进 anchor（整行热区唯一链接语义）。
    expect(menuAnchor?.closest('.r-row-actions__menu-item--link')).not.toBeNull()
  })

  it('emits the same action notification from overflow route clicks as inline ones', async () => {
    const router = createTestRouter()
    const wrapper = mount(RRowActions, {
      props: {
        row,
        maxInline: 1,
        actions: [
          { key: 'edit', label: '编辑', onClick: () => {} },
          { key: 'detail', label: '详情', kind: 'route', to: { path: '/detail/1' } },
        ],
      },
      global: { plugins: [router], stubs: { teleport: true } },
    })

    await wrapper.find('[data-testid="row-action-more"]').trigger('click')
    await flushPromises()

    await wrapper.find('a[data-testid="row-action-menu-detail"]').trigger('click')

    expect(wrapper.emitted('action')).toHaveLength(1)
  })
})

describe('RRowActions type contract', () => {
  it('rejects actions that mix command and navigation semantics at type level', () => {
    const actions: RowAction<{ id: number }>[] = [
      { key: 'ok', label: '命令' },
      { key: 'route', label: '路由', kind: 'route', to: '/x' },
      { key: 'link', label: '外链', kind: 'link', href: 'https://example.com' },
    ]
    // @ts-expect-error onClick 与 to 互斥：同一 action 不允许既是命令又是链接
    const mixed: RowAction[] = [{ key: 'bad', label: '坏', onClick: () => {}, to: '/x' }]
    const badLink = { key: 'bad-link', label: '坏', onClick: () => {}, href: 'https://example.com' }
    // @ts-expect-error href 与 onClick 互斥
    const mixedLink: RowAction[] = [badLink]

    expect(actions).toHaveLength(3)
    expect(mixed).toHaveLength(1)
    expect(mixedLink).toHaveLength(1)
  })
})
