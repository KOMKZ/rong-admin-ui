import type { Component } from 'vue'

export type DashboardBreakpoint = 'lg' | 'md' | 'sm'

export interface DashboardRect {
  x: number
  y: number
  w: number
  h: number
}

export interface DashboardResponsiveColumns {
  lg: number
  md: number
  sm: number
}

export interface DashboardSizePreset {
  key: string
  label: string
  w: number
  h: number
}

export interface DashboardWidgetDefinition {
  type: string
  title: string
  description?: string
  icon?: string
  allowMultiple?: boolean
  defaultVisible?: boolean
  defaultSize?: {
    w: number
    h: number
  }
  minSize?: {
    w: number
    h: number
  }
  maxSize?: {
    w: number
    h: number
  }
  editorOptions?: Record<string, unknown>
  sizePresets?: DashboardSizePreset[]
  defaultConfig?: Record<string, unknown>
}

export interface DashboardWidgetRegistryEntry {
  renderer: Component
  editor?: Component
}

export interface DashboardRouteOption {
  label: string
  value: string
  description?: string
}

export interface DashboardDefinition {
  id: string
  name: string
  description?: string
  status?: string
  sortOrder?: number
  isEntry?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface DashboardLayoutItem {
  id: string
  type: string
  x?: number
  y?: number
  w: number
  h: number
  config?: Record<string, unknown>
  responsive?: Partial<Record<DashboardBreakpoint, DashboardRect>>
}

export interface DashboardBuilderAdapter {
  loadLayout: () => Promise<DashboardLayoutItem[]>
  saveLayout: (layout: DashboardLayoutItem[]) => Promise<void>
  listWidgets: () => Promise<DashboardWidgetDefinition[]>
}

export interface DashboardWorkspaceAdapter {
  listDashboards: () => Promise<DashboardDefinition[]>
  createDashboard: (input: { name: string; description?: string }) => Promise<DashboardDefinition>
  updateDashboard?: (input: { dashboardId: string; name: string; description?: string }) => Promise<DashboardDefinition>
  deleteDashboard: (dashboardId: string) => Promise<void>
  loadLayout: (dashboardId: string) => Promise<DashboardLayoutItem[]>
  saveLayout: (dashboardId: string, layout: DashboardLayoutItem[]) => Promise<void>
  listWidgets: () => Promise<DashboardWidgetDefinition[]>
}

export interface DashboardExportPayload {
  version: string
  dashboard: DashboardDefinition
  layout: DashboardLayoutItem[]
  exportedAt: string
}

export interface DashboardBuilderProps {
  adapter: DashboardBuilderAdapter
  widgetRegistry?: Record<string, Component | DashboardWidgetRegistryEntry>
  columns?: number
  breakpointColumns?: Partial<DashboardResponsiveColumns>
  defaultEditing?: boolean
  editing?: boolean | null
  readonly?: boolean
}

export interface DashboardBuilderEmits {
  (e: 'layout-change', layout: DashboardLayoutItem[]): void
  (e: 'saved', layout: DashboardLayoutItem[]): void
  (e: 'error', error: Error): void
}

export interface DashboardBuilderExpose {
  reload: () => Promise<void>
  save: () => Promise<void>
  toggleEditing: (next?: boolean) => void
  getLayout: () => DashboardLayoutItem[]
}
