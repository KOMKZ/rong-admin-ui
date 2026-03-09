import { describe, expect, it } from 'vitest'
import { createDashboardExportPayload, parseDashboardImportPayload } from '../../src/components/dashboard-builder/workspace-io'

describe('dashboard workspace io', () => {
  it('creates valid export payload', () => {
    const payload = createDashboardExportPayload(
      { id: 'd1', name: 'Main Dashboard' },
      [{ id: 'w1', type: 'kpi', w: 4, h: 2 }],
    )

    expect(payload.version).toBe('dashboard-workspace-v1')
    expect(payload.dashboard.name).toBe('Main Dashboard')
    expect(payload.layout.length).toBe(1)
  })

  it('parses imported payload', () => {
    const raw = JSON.stringify({
      version: 'dashboard-workspace-v1',
      dashboard: { id: 'd1', name: 'Imported' },
      layout: [{ id: 'w1', type: 'kpi', w: 4, h: 2 }],
    })

    const parsed = parseDashboardImportPayload(raw)
    expect(parsed.dashboard.name).toBe('Imported')
    expect(parsed.layout.length).toBe(1)
  })
})
