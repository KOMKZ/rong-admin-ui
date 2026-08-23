export type IndexStatus = 'idle' | 'indexing' | 'completed' | 'failed'

export interface IndexProgressProps {
  total: number
  indexed: number
  status?: IndexStatus
  showLabel?: boolean
  height?: number
  borderRadius?: number
}
