export type WorkflowNodeType = 'start' | 'approval' | 'condition' | 'cc' | 'parallel' | 'end'

export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  label: string
  x: number
  y: number
  config?: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface WorkflowGraph {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  meta?: Record<string, unknown>
}

export interface WorkflowApproverOption {
  id: number
  name: string
}

export interface WorkflowApproverDataSource {
  roles: WorkflowApproverOption[]
  departments: WorkflowApproverOption[]
  users: WorkflowApproverOption[]
}

export interface WorkflowFormFieldOption {
  label: string
  value: string
}

export type WorkflowFormFieldType = 'text' | 'number' | 'textarea' | 'select' | 'date'

export interface WorkflowFormFieldSchema {
  key: string
  label: string
  type: WorkflowFormFieldType
  required?: boolean
  placeholder?: string
  options?: WorkflowFormFieldOption[]
}

export interface WorkflowValidationIssue {
  code: string
  message: string
  level: 'error' | 'warning'
}

export interface WorkflowNodeTemplate {
  type: WorkflowNodeType
  label: string
  hint: string
}

export interface RWorkflowDesignerProps {
  modelValue: WorkflowGraph
  readonly?: boolean
  height?: string
  approverDataSource?: WorkflowApproverDataSource
  panelResizable?: boolean
}

export interface RWorkflowDesignerEmits {
  (e: 'update:modelValue', graph: WorkflowGraph): void
  (e: 'change', graph: WorkflowGraph): void
  (e: 'validate', issues: WorkflowValidationIssue[]): void
}
