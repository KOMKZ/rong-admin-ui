export interface FlowNode {
  id: string
  type: string
  label: string
  position: { x: number; y: number }
  data?: Record<string, unknown>
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
  type?: string
}

export interface FlowData {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export interface FlowTimelineEvent {
  id: string
  type: 'node_enter' | 'node_exit' | 'tool_call' | 'tool_result'
  node_id: string
  timestamp: number
  detail?: string
}
