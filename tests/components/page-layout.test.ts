import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RFormPage from '../../src/components/page-layout/RFormPage.vue'
import RListPage from '../../src/components/page-layout/RListPage.vue'
import RSectionCard from '../../src/components/page-layout/RSectionCard.vue'

describe('page layout components', () => {
  it('renders a list page with fixed filter and table card regions', () => {
    const wrapper = mount(RListPage, {
      props: {
        title: '用户列表',
        dataTestid: 'users-page',
        tableTestid: 'users-card',
        exportable: true,
      },
      slots: {
        filters: '<div data-testid="filters">filters</div>',
        extra: '<button data-testid="extra-action">新增</button>',
        default: '<div data-testid="table">table</div>',
      },
    })

    expect(wrapper.find('[data-testid="users-page"]').classes()).toContain('ra-page')
    expect(wrapper.find('[data-testid="filters"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="users-card"]').classes()).toContain('ra-card')
    expect(wrapper.find('[data-testid="table"]').exists()).toBe(true)
  })

  it('does not render an empty table card header when table tools are disabled', () => {
    const wrapper = mount(RListPage, {
      props: {
        refreshable: false,
        densitySwitchable: false,
        tableTestid: 'plain-card',
      },
      slots: {
        default: '<div data-testid="table">table</div>',
      },
    })

    expect(wrapper.find('[data-testid="plain-card"] .r-table-card__header').exists()).toBe(false)
    expect(wrapper.find('[data-testid="table"]').exists()).toBe(true)
  })

  it('renders a form page with the framework card width contract', () => {
    const wrapper = mount(RFormPage, {
      props: { width: 'wide', dataTestid: 'form-page', cardTestid: 'form-card' },
      slots: { default: '<form data-testid="form-body"></form>' },
    })

    expect(wrapper.find('[data-testid="form-page"]').classes()).toContain('ra-page')
    expect(wrapper.find('[data-testid="form-card"]').classes()).toContain('r-form-page__card--wide')
    expect(wrapper.find('[data-testid="form-body"]').exists()).toBe(true)
  })

  it('renders a section card without requiring application-owned card css', () => {
    const wrapper = mount(RSectionCard, {
      props: { title: '基础信息', dataTestid: 'section-card' },
      slots: { default: '<div>body</div>' },
    })

    expect(wrapper.find('[data-testid="section-card"]').classes()).toContain('ra-card')
    expect(wrapper.text()).toContain('基础信息')
  })
})
