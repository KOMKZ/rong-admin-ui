import { describe, expect, it } from 'vitest'
import { defineComponent, h, withDirectives } from 'vue'
import { mount } from '@vue/test-utils'
import { createPermissionDirective } from '@/app-permission/permission-directive'
import type { PermissionPolicy } from '@/app-permission/types'

function createPolicy(allowed: string[]): PermissionPolicy {
  const set = new Set(allowed)
  return {
    hasPermission: (action) => set.has(action),
    hasAnyPermission: (actions) => actions.some((a) => set.has(a)),
    hasAllPermissions: (actions) => actions.every((a) => set.has(a)),
    isSuperAdmin: () => false,
  }
}

describe('createPermissionDirective', () => {
  it('should hide element when permission is denied (default effect)', () => {
    const directive = createPermissionDirective(createPolicy([]))

    const Comp = defineComponent({
      render() {
        return withDirectives(h('button', 'Delete'), [
          [directive, { action: 'user:delete' }],
        ])
      },
    })

    const wrapper = mount(Comp)
    expect(wrapper.find('button').attributes('style')).toContain('display: none')
  })

  it('should show element when permission is granted', () => {
    const directive = createPermissionDirective(createPolicy(['user:delete']))

    const Comp = defineComponent({
      render() {
        return withDirectives(h('button', 'Delete'), [
          [directive, { action: 'user:delete' }],
        ])
      },
    })

    const wrapper = mount(Comp)
    expect(wrapper.find('button').attributes('style') ?? '').not.toContain('display: none')
  })

  it('should disable element when effect is disabled', () => {
    const directive = createPermissionDirective(createPolicy([]))

    const Comp = defineComponent({
      render() {
        return withDirectives(h('button', 'Edit'), [
          [directive, { action: 'user:edit', effect: 'disabled' }],
        ])
      },
    })

    const wrapper = mount(Comp)
    const btn = wrapper.find('button')
    expect(btn.attributes('disabled')).toBe('true')
    expect(btn.attributes('style')).toContain('pointer-events: none')
    expect(btn.attributes('style')).toContain('opacity: 0.5')
  })

  it('should re-evaluate on directive value change (hidden → visible)', async () => {
    const directive = createPermissionDirective(createPolicy(['user:view']))

    const Comp = defineComponent({
      props: { action: { type: String, required: true } },
      render() {
        return withDirectives(h('button', 'Action'), [
          [directive, { action: this.action }],
        ])
      },
    })

    const wrapper = mount(Comp, { props: { action: 'user:delete' } })
    expect(wrapper.find('button').attributes('style')).toContain('display: none')

    await wrapper.setProps({ action: 'user:view' })
    expect(wrapper.find('button').attributes('style') ?? '').not.toContain('display: none')
  })

  it('should fully restore from disabled state (deny → allow)', async () => {
    const directive = createPermissionDirective(createPolicy(['user:edit']))

    const Comp = defineComponent({
      props: { action: { type: String, required: true } },
      render() {
        return withDirectives(h('button', 'Action'), [
          [directive, { action: this.action, effect: 'disabled' }],
        ])
      },
    })

    const wrapper = mount(Comp, { props: { action: 'user:delete' } })
    const btn = wrapper.find('button')

    expect(btn.attributes('disabled')).toBe('true')
    expect(btn.attributes('style')).toContain('pointer-events: none')
    expect(btn.attributes('style')).toContain('opacity: 0.5')

    await wrapper.setProps({ action: 'user:edit' })

    expect(btn.attributes('disabled')).toBeUndefined()
    expect(btn.attributes('style') ?? '').not.toContain('pointer-events')
    expect(btn.attributes('style') ?? '').not.toContain('opacity')
  })
})
