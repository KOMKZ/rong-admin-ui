import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RRowActions from '../../src/components/row-actions/RRowActions.vue'

const row = { id: 1, name: 'Alpha' }

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
