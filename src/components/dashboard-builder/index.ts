export { default as RDashboardBuilder } from './RDashboardBuilder.vue'
export { default as RDashboardWorkspace } from './RDashboardWorkspace.vue'
export * from './widgets/route-quick-actions'
export type {
  DashboardWidgetRegistryEntry,
  DashboardRouteOption,
  DashboardDefinition,
  DashboardExportPayload,
  DashboardWorkspaceAdapter,
  DashboardBuilderAdapter,
  DashboardBuilderEmits,
  DashboardBuilderExpose,
  DashboardBreakpoint,
  DashboardRect,
  DashboardResponsiveColumns,
  DashboardBuilderProps,
  DashboardLayoutItem,
  DashboardSizePreset,
  DashboardWidgetDefinition,
} from './types'

export { createDashboardExportPayload, parseDashboardImportPayload } from './workspace-io'
