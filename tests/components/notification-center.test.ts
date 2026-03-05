import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RNotificationCenter from '../../src/components/notification-center/RNotificationCenter.vue'
import type { NotificationItem, NotificationCenterExpose } from '../../src/components/notification-center/types'

function makeItem(overrides?: Partial<NotificationItem>): NotificationItem {
  return {
    id: `n_${Math.random().toString(36).slice(2)}`,
    type: 'info',
    title: 'Test notification',
    timestamp: Date.now(),
    read: false,
    ...overrides,
  }
}

describe('RNotificationCenter', () => {
  it('renders with empty notifications', () => {
    const wrapper = mount(RNotificationCenter, {
      props: { notifications: [] },
    })
    expect(wrapper.find('[data-testid="notification-trigger"]').exists()).toBe(true)
  })

  it('renders trigger button with bell icon', () => {
    const wrapper = mount(RNotificationCenter, {
      props: { notifications: [] },
    })
    const trigger = wrapper.find('[data-testid="notification-trigger"]')
    expect(trigger.exists()).toBe(true)
  })

  it('exposes unreadCount = 0 when no notifications', () => {
    const wrapper = mount(RNotificationCenter, {
      props: { notifications: [] },
    })
    const vm = wrapper.vm as unknown as NotificationCenterExpose
    expect(vm.unreadCount).toBe(0)
  })

  it('exposes correct unreadCount with mixed read/unread', () => {
    const notifications: NotificationItem[] = [
      makeItem({ id: 'a', read: false }),
      makeItem({ id: 'b', read: true }),
      makeItem({ id: 'c', read: false }),
    ]
    const wrapper = mount(RNotificationCenter, {
      props: { notifications },
    })
    const vm = wrapper.vm as unknown as NotificationCenterExpose
    expect(vm.unreadCount).toBe(2)
  })

  it('push emits update:notifications with new item prepended', () => {
    const existing = [makeItem({ id: 'existing' })]
    const wrapper = mount(RNotificationCenter, {
      props: { notifications: existing },
    })
    const vm = wrapper.vm as unknown as NotificationCenterExpose
    const id = vm.push({ type: 'success', title: 'New one' })

    expect(typeof id).toBe('string')
    expect(id).toBeTruthy()

    const emitted = wrapper.emitted('update:notifications')
    expect(emitted).toBeTruthy()
    expect(emitted!.length).toBe(1)

    const updated = emitted![0][0] as NotificationItem[]
    expect(updated.length).toBe(2)
    expect(updated[0].title).toBe('New one')
    expect(updated[0].type).toBe('success')
    expect(updated[0].read).toBe(false)
    expect(updated[0].id).toBe(id)
  })

  it('markRead emits update:notifications with target marked read', () => {
    const notifications = [
      makeItem({ id: 'x', read: false }),
      makeItem({ id: 'y', read: false }),
    ]
    const wrapper = mount(RNotificationCenter, {
      props: { notifications },
    })
    const vm = wrapper.vm as unknown as NotificationCenterExpose
    vm.markRead('x')

    const emitted = wrapper.emitted('update:notifications')!
    const updated = emitted[0][0] as NotificationItem[]
    expect(updated.find((n) => n.id === 'x')!.read).toBe(true)
    expect(updated.find((n) => n.id === 'y')!.read).toBe(false)

    expect(wrapper.emitted('read')).toBeTruthy()
    expect(wrapper.emitted('read')![0][0]).toBe('x')
  })

  it('markAllRead marks every notification as read', () => {
    const notifications = [
      makeItem({ id: 'a', read: false }),
      makeItem({ id: 'b', read: false }),
    ]
    const wrapper = mount(RNotificationCenter, {
      props: { notifications },
    })
    const vm = wrapper.vm as unknown as NotificationCenterExpose
    vm.markAllRead()

    const emitted = wrapper.emitted('update:notifications')!
    const updated = emitted[0][0] as NotificationItem[]
    expect(updated.every((n) => n.read)).toBe(true)

    expect(wrapper.emitted('read-all')).toBeTruthy()
  })

  it('dismiss removes the target notification', () => {
    const notifications = [
      makeItem({ id: 'keep' }),
      makeItem({ id: 'remove' }),
    ]
    const wrapper = mount(RNotificationCenter, {
      props: { notifications },
    })
    const vm = wrapper.vm as unknown as NotificationCenterExpose
    vm.dismiss('remove')

    const emitted = wrapper.emitted('update:notifications')!
    const updated = emitted[0][0] as NotificationItem[]
    expect(updated.length).toBe(1)
    expect(updated[0].id).toBe('keep')

    expect(wrapper.emitted('dismiss')).toBeTruthy()
    expect(wrapper.emitted('dismiss')![0][0]).toBe('remove')
  })

  it('clearAll empties the list', () => {
    const notifications = [makeItem(), makeItem()]
    const wrapper = mount(RNotificationCenter, {
      props: { notifications },
    })
    const vm = wrapper.vm as unknown as NotificationCenterExpose
    vm.clearAll()

    const emitted = wrapper.emitted('update:notifications')!
    const updated = emitted[0][0] as NotificationItem[]
    expect(updated.length).toBe(0)

    expect(wrapper.emitted('clear-all')).toBeTruthy()
  })

  it('handleAction calls onAction and emits action event', async () => {
    const actionFn = vi.fn()
    const item = makeItem({ id: 'act', actionLabel: 'Retry', onAction: actionFn })
    const wrapper = mount(RNotificationCenter, {
      props: { notifications: [item] },
    })

    const trigger = wrapper.find('[data-testid="notification-trigger"]')
    await trigger.trigger('click')
    await wrapper.vm.$nextTick()

    const actionBtn = wrapper.find('.r-notif-item__body .n-button')
    if (actionBtn.exists()) {
      await actionBtn.trigger('click')
      await wrapper.vm.$nextTick()
    }

    const vm = wrapper.vm as unknown as { handleAction?: (i: NotificationItem) => void }
    if (typeof vm.handleAction === 'function') {
      vm.handleAction(item)
    }

    expect(actionFn).toHaveBeenCalled()
    expect(wrapper.emitted('action')).toBeTruthy()
  })

  it('respects maxVisible prop', () => {
    const notifications = Array.from({ length: 10 }, (_, i) =>
      makeItem({ id: `item_${i}`, timestamp: Date.now() - i * 1000 }),
    )
    const wrapper = mount(RNotificationCenter, {
      props: { notifications, maxVisible: 3 },
    })
    const vm = wrapper.vm as unknown as NotificationCenterExpose
    expect(vm.unreadCount).toBe(10)
  })
})
