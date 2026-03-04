import { describe, expect, it, vi } from 'vitest'
import { createErrorHandler, type ErrorLogEntry } from '@/app-core/error-boundary'

describe('createErrorHandler', () => {
  it('should log vue errors with correct format', () => {
    const entries: ErrorLogEntry[] = []
    const logger = (entry: ErrorLogEntry) => entries.push(entry)
    const handler = createErrorHandler(logger)

    const err = new Error('test vue error')
    handler.onVueError(err, 'TestComponent', 'render')

    expect(entries).toHaveLength(1)
    expect(entries[0].source).toBe('vue')
    expect(entries[0].message).toBe('test vue error')
    expect(entries[0].componentName).toBe('TestComponent')
    expect(entries[0].info).toBe('render')
  })

  it('should log unhandled promise rejections', () => {
    const entries: ErrorLogEntry[] = []
    const logger = (entry: ErrorLogEntry) => entries.push(entry)
    const handler = createErrorHandler(logger)

    const event = {
      reason: new Error('promise error'),
    } as PromiseRejectionEvent
    handler.onUnhandledRejection!(event)

    expect(entries).toHaveLength(1)
    expect(entries[0].source).toBe('promise')
    expect(entries[0].message).toBe('promise error')
  })

  it('should use console logger by default', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = createErrorHandler()

    handler.onVueError(new Error('default logger'), null, 'setup')

    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
