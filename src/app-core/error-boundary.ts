import type { AppErrorHandler } from './types'

export interface ErrorLogEntry {
  timestamp: number
  source: 'vue' | 'promise' | 'global'
  message: string
  stack?: string
  componentName?: string | null
  info?: string
}

export type ErrorLogger = (entry: ErrorLogEntry) => void

const consoleLogger: ErrorLogger = (entry) => {
  console.error(`[${entry.source}] ${entry.message}`, entry)
}

export function createErrorHandler(logger: ErrorLogger = consoleLogger): AppErrorHandler {
  return {
    onVueError(err, instance, info) {
      logger({
        timestamp: Date.now(),
        source: 'vue',
        message: err.message,
        stack: err.stack,
        componentName: instance,
        info,
      })
    },
    onUnhandledRejection(event) {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      logger({
        timestamp: Date.now(),
        source: 'promise',
        message: reason.message,
        stack: reason.stack,
      })
    },
    onGlobalError(event) {
      logger({
        timestamp: Date.now(),
        source: 'global',
        message: event.message,
        stack: event.error?.stack,
      })
    },
  }
}
