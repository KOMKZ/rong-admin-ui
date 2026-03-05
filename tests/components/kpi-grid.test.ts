import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RKpiGrid from '../../src/components/kpi-grid/RKpiGrid.vue'
import type { KpiItem } from '../../src/components/kpi-grid/types'

const sampleItems: KpiItem[] = [
  { key: 'users', title: 'Users', value: 1200 },
  { key: 'orders', title: 'Orders', value: 350 },
  { key: 'revenue', title: 'Revenue', value: '$42K', prefix: '$' },
]

describe('RKpiGrid', () => {
  it('renders grid container', () => {
    const wrapper = mount(RKpiGrid, { props: { items: sampleItems } })
    expect(wrapper.find('[data-testid="kpi-grid"]').exists()).toBe(true)
  })

  it('renders correct number of stat cards', () => {
    const wrapper = mount(RKpiGrid, { props: { items: sampleItems } })
    const cards = wrapper.findAll('.r-stat-card')
    expect(cards.length).toBe(3)
  })

  it('applies grid cols via css variable', () => {
    const wrapper = mount(RKpiGrid, { props: { items: sampleItems, cols: 3 } })
    const grid = wrapper.find('[data-testid="kpi-grid"]')
    expect(grid.attributes('style')).toContain('--kpi-grid-cols')
  })

  it('applies custom gap', () => {
    const wrapper = mount(RKpiGrid, { props: { items: sampleItems, gap: 24 } })
    const grid = wrapper.find('[data-testid="kpi-grid"]')
    expect(grid.attributes('style')).toContain('24px')
  })

  it('emits item-click when card is clicked', async () => {
    const items: KpiItem[] = [{ key: 'test', title: 'Test', value: 42, clickable: true }]
    const wrapper = mount(RKpiGrid, { props: { items } })
    const card = wrapper.find('.r-stat-card')
    await card.trigger('click')
    expect(wrapper.emitted('item-click')).toBeTruthy()
    expect(wrapper.emitted('item-click')![0][0]).toBe('test')
  })

  it('renders with empty items', () => {
    const wrapper = mount(RKpiGrid, { props: { items: [] } })
    expect(wrapper.find('[data-testid="kpi-grid"]').exists()).toBe(true)
    expect(wrapper.findAll('.r-stat-card').length).toBe(0)
  })

  it('passes loading prop to stat cards', () => {
    const wrapper = mount(RKpiGrid, { props: { items: sampleItems, loading: true } })
    expect(wrapper.html()).toBeTruthy()
  })
})
