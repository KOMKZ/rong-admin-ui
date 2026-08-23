import type { FlowData } from '../flow/types'
import type RFlowTimeline from '../flow/RFlowTimeline.vue'

export type EntityExecutionType = 'agent' | 'team'

export interface EntityExecutionPanelProps {
  show: boolean
  entityType: EntityExecutionType
  entityId?: number | null
  fetchGraph?: (id: number) => Promise<FlowData>
}

export interface EntityExecutionPanelEmits {
  'update:show': [value: boolean]
}

export interface EntityExecutionPanelExpose {
  getTimeline: () => InstanceType<typeof RFlowTimeline> | null
}
