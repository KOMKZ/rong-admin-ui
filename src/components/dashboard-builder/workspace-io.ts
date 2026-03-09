import type { DashboardDefinition, DashboardExportPayload, DashboardLayoutItem } from './types'

const EXPORT_VERSION = 'dashboard-workspace-v1'

export function createDashboardExportPayload(
  dashboard: DashboardDefinition,
  layout: DashboardLayoutItem[],
): DashboardExportPayload {
  return {
    version: EXPORT_VERSION,
    dashboard,
    layout,
    exportedAt: new Date().toISOString(),
  }
}

export function parseDashboardImportPayload(text: string): DashboardExportPayload {
  const data = JSON.parse(text) as Partial<DashboardExportPayload>
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid dashboard JSON')
  }
  if (!data.dashboard || typeof data.dashboard !== 'object') {
    throw new Error('Dashboard metadata is missing')
  }
  if (!Array.isArray(data.layout)) {
    throw new Error('Dashboard layout must be an array')
  }

  const normalizedLayout = data.layout.filter((item) => {
    if (!item || typeof item !== 'object') return false
    const typed = item as DashboardLayoutItem
    return Boolean(typed.id && typed.type && typeof typed.w === 'number' && typeof typed.h === 'number')
  })

  return {
    version: data.version || EXPORT_VERSION,
    dashboard: {
      id: String(data.dashboard.id || ''),
      name: String(data.dashboard.name || 'Imported Dashboard'),
      description: data.dashboard.description ? String(data.dashboard.description) : undefined,
      createdAt: data.dashboard.createdAt ? String(data.dashboard.createdAt) : undefined,
      updatedAt: data.dashboard.updatedAt ? String(data.dashboard.updatedAt) : undefined,
    },
    layout: normalizedLayout,
    exportedAt: data.exportedAt ? String(data.exportedAt) : new Date().toISOString(),
  }
}
