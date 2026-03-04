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

function createContainer(): HTMLDivElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

function removeContainer(el: HTMLDivElement): void {
  if (el.parentNode) document.body.removeChild(el)
}

describe('bootstrapApp', () => {
  it('should mount app to container', async () => {
    const container = createContainer()
    const ctx = await bootstrapApp({
      rootComponent: TestComponent,
      rootContainer: container,
    })

    expect(ctx.isReady).toBe(true)
    expect(ctx.app).toBeDefined()

    ctx.destroy()
    removeContainer(container)
  })

  it('should install plugins in order', async () => {
    const container = createContainer()
    const installOrder: string[] = []

    const pluginA: AppPlugin = {
      name: 'plugin-a',
      install: () => {
        installOrder.push('a')
      },
      order: 20,
    }
    const pluginB: AppPlugin = {
      name: 'plugin-b',
      install: () => {
        installOrder.push('b')
      },
      order: 10,
    }

    const ctx = await bootstrapApp({
      rootComponent: TestComponent,
      rootContainer: container,
      plugins: [pluginA, pluginB],
    })

    expect(installOrder).toEqual(['b', 'a'])

    ctx.destroy()
    removeContainer(container)
  })

  it('should call onReady callback', async () => {
    const container = createContainer()
    const onReady = vi.fn()

    const ctx = await bootstrapApp({
      rootComponent: TestComponent,
      rootContainer: container,
      onReady,
    })

    expect(onReady).toHaveBeenCalledOnce()

    ctx.destroy()
    removeContainer(container)
  })

  it('should remove global listeners on destroy', async () => {
    const container = createContainer()
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const rejectionHandler = vi.fn()
    const errorHandler = vi.fn()

    const ctx = await bootstrapApp({
      rootComponent: TestComponent,
      rootContainer: container,
      onError: {
        onVueError: vi.fn(),
        onUnhandledRejection: rejectionHandler,
        onGlobalError: errorHandler,
      },
    })

    ctx.destroy()

    expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', rejectionHandler)
    expect(removeSpy).toHaveBeenCalledWith('error', errorHandler)

    removeSpy.mockRestore()
    removeContainer(container)
  })

  it('should be safe to call destroy multiple times', async () => {
    const container = createContainer()

    const ctx = await bootstrapApp({
      rootComponent: TestComponent,
      rootContainer: container,
      onError: {
        onVueError: vi.fn(),
        onUnhandledRejection: vi.fn(),
      },
    })

    ctx.destroy()
    ctx.destroy()
    ctx.destroy()

    removeContainer(container)
  })
})
