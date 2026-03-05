import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RShowcaseLayout, RDemoSection, RPropsTable, RQualityPanel } from '@/components/showcase'
import type { PropsTableRow, QualityPanelItem } from '@/components/showcase'

describe('RShowcaseLayout', () => {
  it('should render title', () => {
    const wrapper = mount(RShowcaseLayout, {
      props: { title: 'DataTable' },
    })
    expect(wrapper.find('.r-showcase__title').text()).toBe('DataTable')
    expect(wrapper.find('[data-testid="showcase-layout"]').exists()).toBe(true)
  })

  it('should render description when provided', () => {
    const wrapper = mount(RShowcaseLayout, {
      props: { title: 'T', description: '通用数据表格' },
    })
    expect(wrapper.find('.r-showcase__desc').text()).toBe('通用数据表格')
  })

  it('should not render description when not provided', () => {
    const wrapper = mount(RShowcaseLayout, {
      props: { title: 'T' },
    })
    expect(wrapper.find('.r-showcase__desc').exists()).toBe(false)
  })

  it('should render version badge when provided', () => {
    const wrapper = mount(RShowcaseLayout, {
      props: { title: 'T', version: 'v0.4' },
    })
    expect(wrapper.find('.r-showcase__version').text()).toBe('v0.4')
  })

  it('should not render version badge when not provided', () => {
    const wrapper = mount(RShowcaseLayout, {
      props: { title: 'T' },
    })
    expect(wrapper.find('.r-showcase__version').exists()).toBe(false)
  })

  it('should render import statement when componentName provided', () => {
    const wrapper = mount(RShowcaseLayout, {
      props: { title: 'T', componentName: 'RDataTable' },
    })
    expect(wrapper.find('.r-showcase__import').text()).toContain('RDataTable')
  })

  it('should not render import statement when componentName not provided', () => {
    const wrapper = mount(RShowcaseLayout, {
      props: { title: 'T' },
    })
    expect(wrapper.find('.r-showcase__import').exists()).toBe(false)
  })

  it('should render default slot content', () => {
    const wrapper = mount(RShowcaseLayout, {
      props: { title: 'T' },
      slots: { default: '<div class="demo">Demo</div>' },
    })
    expect(wrapper.find('.demo').exists()).toBe(true)
  })

  it('should render footer slot when provided', () => {
    const wrapper = mount(RShowcaseLayout, {
      props: { title: 'T' },
      slots: { footer: '<p class="foot">Footer</p>' },
    })
    expect(wrapper.find('.r-showcase__footer').exists()).toBe(true)
    expect(wrapper.find('.foot').exists()).toBe(true)
  })

  it('should not render footer when slot not provided', () => {
    const wrapper = mount(RShowcaseLayout, {
      props: { title: 'T' },
    })
    expect(wrapper.find('.r-showcase__footer').exists()).toBe(false)
  })
})

describe('RDemoSection', () => {
  it('should render title and testid', () => {
    const wrapper = mount(RDemoSection, {
      props: { title: '基础用法' },
    })
    expect(wrapper.find('[data-testid="demo-section"]').exists()).toBe(true)
    expect(wrapper.find('.r-demo__title').text()).toBe('基础用法')
  })

  it('should render description when provided', () => {
    const wrapper = mount(RDemoSection, {
      props: { title: 'T', description: '说明文本' },
    })
    expect(wrapper.find('.r-demo__desc').text()).toBe('说明文本')
  })

  it('should not render description when not provided', () => {
    const wrapper = mount(RDemoSection, {
      props: { title: 'T' },
    })
    expect(wrapper.find('.r-demo__desc').exists()).toBe(false)
  })

  it('should show body by default (collapsed=false)', () => {
    const wrapper = mount(RDemoSection, {
      props: { title: 'T' },
      slots: { default: '<span class="inner">Content</span>' },
    })
    const body = wrapper.find('.r-demo__body')
    expect(body.exists()).toBe(true)
    expect(body.attributes('style') ?? '').not.toContain('display: none')
    expect(wrapper.find('.inner').exists()).toBe(true)
  })

  it('should hide body when collapsed=true', () => {
    const wrapper = mount(RDemoSection, {
      props: { title: 'T', collapsed: true },
      slots: { default: '<span>Content</span>' },
    })
    expect(wrapper.find('.r-demo__body').attributes('style')).toContain('display: none')
  })

  it('should toggle collapse on button click', async () => {
    const wrapper = mount(RDemoSection, {
      props: { title: 'T' },
      slots: { default: '<span>Content</span>' },
    })
    const body = wrapper.find('.r-demo__body')
    expect(body.attributes('style') ?? '').not.toContain('display: none')
    await wrapper.find('.r-demo__toggle').trigger('click')
    expect(body.attributes('style')).toContain('display: none')
    await wrapper.find('.r-demo__toggle').trigger('click')
    expect(body.attributes('style') ?? '').not.toContain('display: none')
  })

  it('should set aria-expanded correctly', async () => {
    const wrapper = mount(RDemoSection, {
      props: { title: 'T' },
    })
    expect(wrapper.find('.r-demo__toggle').attributes('aria-expanded')).toBe('true')
    await wrapper.find('.r-demo__toggle').trigger('click')
    expect(wrapper.find('.r-demo__toggle').attributes('aria-expanded')).toBe('false')
  })

  it('should render code slot when provided', () => {
    const wrapper = mount(RDemoSection, {
      props: { title: 'T' },
      slots: {
        default: '<span>Preview</span>',
        code: '<pre>const x = 1</pre>',
      },
    })
    expect(wrapper.find('.r-demo__code').exists()).toBe(true)
  })

  it('should not render code slot when not provided', () => {
    const wrapper = mount(RDemoSection, {
      props: { title: 'T' },
      slots: { default: '<span>Preview</span>' },
    })
    expect(wrapper.find('.r-demo__code').exists()).toBe(false)
  })
})

describe('RPropsTable', () => {
  const rows: PropsTableRow[] = [
    { name: 'columns', type: 'DataTableColumn[]', required: true, description: '列定义' },
    { name: 'data', type: 'T[]', required: true, description: '表格数据' },
    { name: 'bordered', type: 'boolean', default: 'true', description: '显示边框' },
  ]

  it('should render table with testid', () => {
    const wrapper = mount(RPropsTable, { props: { rows } })
    expect(wrapper.find('[data-testid="props-table"]').exists()).toBe(true)
    expect(wrapper.find('table[role="table"]').exists()).toBe(true)
  })

  it('should render default title "Props"', () => {
    const wrapper = mount(RPropsTable, { props: { rows } })
    expect(wrapper.find('.r-props-table__title').text()).toBe('Props')
  })

  it('should render custom title', () => {
    const wrapper = mount(RPropsTable, { props: { title: 'Emits', rows } })
    expect(wrapper.find('.r-props-table__title').text()).toBe('Emits')
  })

  it('should render all rows', () => {
    const wrapper = mount(RPropsTable, { props: { rows } })
    const trs = wrapper.findAll('tbody tr')
    expect(trs.length).toBe(3)
  })

  it('should render prop names, types, and descriptions', () => {
    const wrapper = mount(RPropsTable, { props: { rows } })
    const html = wrapper.html()
    expect(html).toContain('columns')
    expect(html).toContain('DataTableColumn[]')
    expect(html).toContain('列定义')
  })

  it('should show required badge for required props', () => {
    const wrapper = mount(RPropsTable, { props: { rows } })
    const badges = wrapper.findAll('.badge--required')
    expect(badges.length).toBe(2)
  })

  it('should show optional badge for optional props', () => {
    const wrapper = mount(RPropsTable, { props: { rows } })
    const badges = wrapper.findAll('.badge--optional')
    expect(badges.length).toBe(1)
  })

  it('should render default value when provided', () => {
    const wrapper = mount(RPropsTable, { props: { rows } })
    expect(wrapper.find('.prop-default').text()).toBe('true')
  })

  it('should render dash when no default value', () => {
    const wrapper = mount(RPropsTable, { props: { rows } })
    const nones = wrapper.findAll('.prop-none')
    expect(nones.length).toBe(2)
    expect(nones[0].text()).toBe('—')
  })
})

describe('RQualityPanel', () => {
  const items: QualityPanelItem[] = [
    { label: 'TypeCheck', status: 'pass', detail: '0 errors' },
    { label: 'Coverage', status: 'fail', detail: '73%' },
    { label: 'Lint', status: 'warn' },
    { label: 'E2E', status: 'skip' },
  ]

  it('should render panel with testid', () => {
    const wrapper = mount(RQualityPanel, { props: { items } })
    expect(wrapper.find('[data-testid="quality-panel"]').exists()).toBe(true)
    expect(wrapper.find('[role="list"]').exists()).toBe(true)
  })

  it('should render default title "Quality Gates"', () => {
    const wrapper = mount(RQualityPanel, { props: { items } })
    expect(wrapper.find('.r-quality__title').text()).toBe('Quality Gates')
  })

  it('should render custom title', () => {
    const wrapper = mount(RQualityPanel, { props: { title: '门禁', items } })
    expect(wrapper.find('.r-quality__title').text()).toBe('门禁')
  })

  it('should render all items', () => {
    const wrapper = mount(RQualityPanel, { props: { items } })
    const lis = wrapper.findAll('.r-quality__item')
    expect(lis.length).toBe(4)
  })

  it('should apply correct status class', () => {
    const wrapper = mount(RQualityPanel, { props: { items } })
    const lis = wrapper.findAll('.r-quality__item')
    expect(lis[0].classes()).toContain('r-quality__item--pass')
    expect(lis[1].classes()).toContain('r-quality__item--fail')
    expect(lis[2].classes()).toContain('r-quality__item--warn')
    expect(lis[3].classes()).toContain('r-quality__item--skip')
  })

  it('should render status icons', () => {
    const wrapper = mount(RQualityPanel, { props: { items } })
    const icons = wrapper.findAll('.r-quality__icon')
    expect(icons[0].text()).toBe('✓')
    expect(icons[1].text()).toBe('✗')
    expect(icons[2].text()).toBe('!')
    expect(icons[3].text()).toBe('-')
  })

  it('should render detail when provided', () => {
    const wrapper = mount(RQualityPanel, { props: { items } })
    const details = wrapper.findAll('.r-quality__detail')
    expect(details.length).toBe(2)
    expect(details[0].text()).toBe('0 errors')
  })

  it('should set aria-label on icons', () => {
    const wrapper = mount(RQualityPanel, { props: { items } })
    const icons = wrapper.findAll('.r-quality__icon')
    expect(icons[0].attributes('aria-label')).toBe('pass')
    expect(icons[1].attributes('aria-label')).toBe('fail')
  })
})
