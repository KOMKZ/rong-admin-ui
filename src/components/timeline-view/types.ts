export type TimelineEntryStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface TimelineEntry {
  nodeId: string
  label: string
  status: TimelineEntryStatus
  startMs: number
  endMs: number
  durationMs: number
  error?: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

export interface TimelineViewProps {
  entries: TimelineEntry[]
  totalMs?: number
  showDetail?: boolean
}
