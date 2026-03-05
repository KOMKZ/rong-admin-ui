import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RPageSkeleton from '../../src/components/page-skeleton/RPageSkeleton.vue'

describe('RPageSkeleton', () => {
  it('renders list mode', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'list' },
    })
    expect(wrapper.find('[data-testid="page-skeleton-list"]').exists()).toBe(true)
  })

  it('renders detail mode', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'detail' },
    })
    expect(wrapper.find('[data-testid="page-skeleton-detail"]').exists()).toBe(true)
  })

  it('renders form mode', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'form' },
    })
    expect(wrapper.find('[data-testid="page-skeleton-form"]').exists()).toBe(true)
  })

  it('respects rows prop in list mode', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'list', rows: 4 },
    })
    expect(wrapper.findAll('.r-skel__table-row').length).toBe(4)
  })

  it('respects rows prop in detail mode', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'detail', rows: 3 },
    })
    expect(wrapper.findAll('.r-skel__detail-pair').length).toBeGreaterThan(0)
  })

  it('respects rows prop in form mode', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'form', rows: 5 },
    })
    expect(wrapper.findAll('.r-skel__form-field').length).toBe(5)
  })

  it('applies animation class by default', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'list' },
    })
    expect(wrapper.find('.r-page-skeleton--animated').exists()).toBe(true)
  })

  it('disables animation when animated=false', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'list', animated: false },
    })
    expect(wrapper.find('.r-page-skeleton--animated').exists()).toBe(false)
  })

  it('hides header when showHeader=false', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'list', showHeader: false },
    })
    expect(wrapper.find('.r-skel__header').exists()).toBe(false)
  })

  it('hides toolbar when showToolbar=false in list mode', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'list', showToolbar: false },
    })
    expect(wrapper.find('.r-skel__toolbar').exists()).toBe(false)
  })

  it('hides pagination when showPagination=false', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'list', showPagination: false },
    })
    expect(wrapper.find('.r-skel__pagination').exists()).toBe(false)
  })

  it('renders column count in list table header', () => {
    const wrapper = mount(RPageSkeleton, {
      props: { mode: 'list', columns: 6 },
    })
    const headerCells = wrapper.find('.r-skel__table-header').findAll('.r-skel__bar--cell')
    expect(headerCells.length).toBe(6)
  })
})
