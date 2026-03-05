import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RStatCard } from '@/components/stat-card'

describe('RStatCard', () => {
  it('renders title and value', () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'Users', value: 1024 },
    })
    expect(wrapper.find('.r-stat-card__title').text()).toBe('Users')
    expect(wrapper.find('.r-stat-card__value').text()).toBe('1,024')
  })

  it('renders string value as-is', () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'Rate', value: '0.12' },
    })
    expect(wrapper.find('.r-stat-card__value').text()).toBe('0.12')
  })

  it('renders prefix and suffix', () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'Revenue', value: 500, prefix: '$', suffix: 'USD' },
    })
    expect(wrapper.find('.r-stat-card__prefix').text()).toBe('$')
    expect(wrapper.find('.r-stat-card__suffix').text()).toBe('USD')
  })

  it('renders trend up with icon', () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, trend: 'up', trendValue: '+12%' },
    })
    expect(wrapper.find('.r-stat-card__trend--up').exists()).toBe(true)
    expect(wrapper.find('.r-stat-card__trend-value').text()).toBe('+12%')
  })

  it('renders trend down', () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, trend: 'down', trendValue: '-5%' },
    })
    expect(wrapper.find('.r-stat-card__trend--down').exists()).toBe(true)
  })

  it('renders trend flat', () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, trend: 'flat' },
    })
    expect(wrapper.find('.r-stat-card__trend--flat').exists()).toBe(true)
  })

  it('renders loading skeleton', () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, loading: true },
    })
    expect(wrapper.find('.r-stat-card__skeleton').exists()).toBe(true)
    expect(wrapper.find('.r-stat-card__value').exists()).toBe(false)
  })

  it('handles click when clickable', async () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, clickable: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when not clickable', async () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, clickable: false },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('does not emit click when loading', async () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, clickable: true, loading: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('sets role=button and tabindex when clickable', () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, clickable: true },
    })
    const el = wrapper.find('[data-testid="stat-card"]')
    expect(el.attributes('role')).toBe('button')
    expect(el.attributes('tabindex')).toBe('0')
  })

  it('handles keyboard enter click', async () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, clickable: true },
    })
    await wrapper.trigger('keydown.enter')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('applies size class', () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, size: 'small' },
    })
    expect(wrapper.find('.r-stat-card--small').exists()).toBe(true)
  })

  it('applies variant class', () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, variant: 'outlined' },
    })
    expect(wrapper.find('.r-stat-card--outlined').exists()).toBe(true)
  })

  it('renders description', () => {
    const wrapper = mount(RStatCard, {
      props: { title: 'T', value: 100, description: 'Some info' },
    })
    expect(wrapper.find('.r-stat-card__description').text()).toBe('Some info')
  })

  describe('compare (period-over-period)', () => {
    it('auto-calculates trend from compare values (up)', () => {
      const wrapper = mount(RStatCard, {
        props: {
          title: 'Users',
          value: 1024,
          compare: { previousValue: 910, currentValue: 1024, period: 'month' },
        },
      })
      expect(wrapper.find('.r-stat-card__trend--up').exists()).toBe(true)
      expect(wrapper.find('.r-stat-card__trend-value').text()).toContain('+')
      expect(wrapper.find('.r-stat-card__trend-label').text()).toBe('vs last month')
    })

    it('auto-calculates trend from compare values (down)', () => {
      const wrapper = mount(RStatCard, {
        props: {
          title: 'Errors',
          value: 5,
          compare: { previousValue: 10, currentValue: 5, period: 'week' },
        },
      })
      expect(wrapper.find('.r-stat-card__trend--down').exists()).toBe(true)
      expect(wrapper.find('.r-stat-card__trend-value').text()).toContain('-')
      expect(wrapper.find('.r-stat-card__trend-label').text()).toBe('vs last week')
    })

    it('shows flat when values are equal', () => {
      const wrapper = mount(RStatCard, {
        props: {
          title: 'T',
          value: 100,
          compare: { previousValue: 100, currentValue: 100, period: 'day' },
        },
      })
      expect(wrapper.find('.r-stat-card__trend--flat').exists()).toBe(true)
    })

    it('renders previous value in compare section', () => {
      const wrapper = mount(RStatCard, {
        props: {
          title: 'T',
          value: 200,
          compare: { previousValue: 150, currentValue: 200, period: 'month' },
        },
      })
      const compare = wrapper.find('[data-testid="stat-card-compare"]')
      expect(compare.exists()).toBe(true)
      expect(compare.text()).toContain('150')
    })

    it('uses custom periodLabel when provided', () => {
      const wrapper = mount(RStatCard, {
        props: {
          title: 'T',
          value: 200,
          compare: { previousValue: 150, currentValue: 200, period: 'custom', periodLabel: 'vs Q1 2025' },
        },
      })
      expect(wrapper.find('.r-stat-card__trend-label').text()).toBe('vs Q1 2025')
    })

    it('handles previousValue=0 gracefully', () => {
      const wrapper = mount(RStatCard, {
        props: {
          title: 'T',
          value: 50,
          compare: { previousValue: 0, currentValue: 50, period: 'month' },
        },
      })
      expect(wrapper.find('.r-stat-card__trend--up').exists()).toBe(true)
      expect(wrapper.find('.r-stat-card__trend-value').text()).toContain('+100%')
    })

    it('explicit trend overrides compare auto-calculation', () => {
      const wrapper = mount(RStatCard, {
        props: {
          title: 'T',
          value: 100,
          trend: 'down',
          trendValue: '-5%',
          compare: { previousValue: 50, currentValue: 100, period: 'month' },
        },
      })
      expect(wrapper.find('.r-stat-card__trend--down').exists()).toBe(true)
      expect(wrapper.find('.r-stat-card__trend-value').text()).toBe('-5%')
    })
  })
})
