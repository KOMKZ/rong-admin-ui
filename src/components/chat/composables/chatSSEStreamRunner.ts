import type { ChatSSEOptions } from '../types'
import { createSSEFrameProcessor } from './chatSSEFrameParser'
import type { ChatSSEControl, ChatSSEState } from './chatSSEState'
import { resetChatSSEState } from './chatSSEState'

const MAX_RETRIES = 3
const HEARTBEAT_INTERVAL_MS = 120_000

export async function startChatSSEStream(
  state: ChatSSEState,
  control: ChatSSEControl,
  options: ChatSSEOptions,
) {
  resetChatSSEState(state)
  control.userStopped = false
  control.abortController = new AbortController()
  let lastError: Error | null = null
  let attemptsLeft = MAX_RETRIES

  try {
    while (attemptsLeft > 0) {
      if (control.userStopped) break
      const result = await runStreamAttempt(state, control, options)
      if (result.done) return
      lastError = result.error
      attemptsLeft -= 1
      if (attemptsLeft > 0 && !control.userStopped) {
        state.streamContent.value = ''
        control.abortController = new AbortController()
      }
    }
    state.error.value = lastError
    if (lastError && !control.userStopped) options.onError(lastError)
  } finally {
    state.isStreaming.value = false
    control.abortController = null
  }
}

async function runStreamAttempt(
  state: ChatSSEState,
  control: ChatSSEControl,
  options: ChatSSEOptions,
): Promise<{ done: true } | { done: false; error: Error }> {
  try {
    const reader = await openStreamReader(control, options)
    const doneByFrame = await readSSEFrames(state, control, options, reader)
    if (!doneByFrame) options.onDone()
    return { done: true }
  } catch (error) {
    if ((error as Error).name === 'AbortError' && control.userStopped) {
      return { done: true }
    }
    return { done: false, error: error as Error }
  }
}

async function openStreamReader(
  control: ChatSSEControl,
  options: ChatSSEOptions,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const response = await fetch(options.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    body: JSON.stringify(options.body),
    signal: control.abortController!.signal,
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')
  return reader
}

async function readSSEFrames(
  state: ChatSSEState,
  control: ChatSSEControl,
  options: ChatSSEOptions,
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<boolean> {
  const heartbeat = createHeartbeat(control)
  const decoder = new TextDecoder()
  const processor = createSSEFrameProcessor(state, options, heartbeat.clear)
  let buffer = ''
  heartbeat.reset()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      heartbeat.reset()
      buffer += decoder.decode(value, { stream: true })
      const result = processBufferedFrames(buffer, processor.processFrame)
      buffer = result.buffer
      if (result.done) return true
    }
    if (buffer.trim()) processor.processFrame(buffer)
    return false
  } finally {
    heartbeat.clear()
  }
}

function processBufferedFrames(
  buffer: string,
  processFrame: (frame: string) => boolean,
): { buffer: string; done: boolean } {
  let sep: number
  while ((sep = buffer.indexOf('\n\n')) !== -1) {
    const frame = buffer.slice(0, sep)
    buffer = buffer.slice(sep + 2)
    if (processFrame(frame)) return { buffer, done: true }
  }
  return { buffer, done: false }
}

function createHeartbeat(control: ChatSSEControl) {
  let heartbeatTimer: ReturnType<typeof setTimeout> | null = null
  const clear = () => {
    if (heartbeatTimer) clearTimeout(heartbeatTimer)
    heartbeatTimer = null
  }
  const reset = () => {
    clear()
    heartbeatTimer = setTimeout(() => {
      if (!control.userStopped && control.abortController) {
        control.abortController.abort()
      }
    }, HEARTBEAT_INTERVAL_MS)
  }
  return { clear, reset }
}
