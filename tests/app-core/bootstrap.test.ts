import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { bootstrapApp } from '@/app-core/bootstrap'
import type { AppPlugin } from '@/app-core/types'

const TestComponent = defineComponent({
  name: 'TestApp',
  render() {
    return h('div', { id: 'test-app' }, 'Hello')
  },
})

describe('bootstrapApp', () => {
  it('should mount app to container', async () => {
    const container = document.createElement('div')
    container.id = 'app'
    document.body.appendChild(container)

    const ctx = await bootstrapApp({
      rootComponent: TestComponent,
      rootContainer: container,
    })

    expect(ctx.isReady).toBe(true)
    expect(ctx.app).toBeDefined()

    ctx.destroy()
    document.body.removeChild(container)
  })

  it('should install plugins in order', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const installOrder: string[] = []
    const pluginA: AppPlugin = {
      name: 'plugin-a',
      install: () => { installOrder.push('a') },
      order: 20,
    }
    const pluginB: AppPlugin = {
      name: 'plugin-b',
      install: () => { installOrder.push('b') },
      order: 10,
    }

    const ctx = await bootstrapApp({
      rootComponent: TestComponent,
      rootContainer: container,
      plugins: [pluginA, pluginB],
    })

    expect(installOrder).toEqual(['b', 'a'])

    ctx.destroy()
    document.body.removeChild(container)
  })

  it('should call onReady callback', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const onReady = vi.fn()

    const ctx = await bootstrapApp({
      rootComponent: TestComponent,
      rootContainer: container,
      onReady,
    })

    expect(onReady).toHaveBeenCalledOnce()

    ctx.destroy()
    document.body.removeChild(container)
  })
})
