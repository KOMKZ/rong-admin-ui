import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import RAppShell from '../../src/components/layout/RAppShell.vue'
import RSideNav from '../../src/components/layout/RSideNav.vue'
import RTopbar from '../../src/components/layout/RTopbar.vue'
import RBreadcrumb from '../../src/components/layout/RBreadcrumb.vue'
import RTabsView from '../../src/components/layout/RTabsView.vue'
import type { MenuItem } from '../../src/app-layout/types'
import type { BreadcrumbItem } from '../../src/app-layout/types'
import type { TabItem } from '../../src/components/layout/types'

describe('RAppShell', () => {
  let wrapper: VueWrapper<InstanceType<typeof RAppShell>>

  const originalInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth')

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    if (originalInnerWidth) {
      Object.defineProperty(window, 'innerWidth', originalInnerWidth)
    } else {
      delete (window as { innerWidth?: number }).innerWidth
    }
  })

  it('renders with data-testid="app-shell"', () => {
    wrapper = mount(RAppShell)
    expect(wrapper.find('[data-testid="app-shell"]').exists()).toBe(true)
  })

  it('renders with default props', () => {
    wrapper = mount(RAppShell)
    const el = wrapper.find('.r-app-shell')
    expect(el.exists()).toBe(true)
    expect(wrapper.find('.r-app-shell__header').exists()).toBe(true)
    expect(wrapper.find('.r-app-shell__content').exists()).toBe(true)
    expect(wrapper.find('.r-app-shell__footer').exists()).toBe(false)
  })

  it('applies custom sidebarWidth and collapsedWidth when collapsed', async () => {
    wrapper = mount(RAppShell, {
      props: {
        sidebarCollapsed: true,
        sidebarWidth: 240,
        collapsedWidth: 80,
      },
      slots: {
        sidebar: '<div class="sidebar-content">Sidebar</div>',
      },
    })
    const sidebar = wrapper.find('.r-app-shell__sidebar')
    expect(sidebar.attributes('style')).toContain('80px')
  })

  it('applies sidebarWidth when expanded', () => {
    wrapper = mount(RAppShell, {
      props: {
        sidebarCollapsed: false,
        sidebarWidth: 240,
      },
      slots: {
        sidebar: '<div class="sidebar-content">Sidebar</div>',
      },
    })
    const sidebar = wrapper.find('.r-app-shell__sidebar')
    expect(sidebar.attributes('style')).toContain('240px')
  })

  it('applies custom headerHeight', () => {
    wrapper = mount(RAppShell, {
      props: { headerHeight: 64 },
    })
    const header = wrapper.find('.r-app-shell__header')
    expect(header.attributes('style')).toContain('64px')
  })

  it('shows footer when footerVisible is true and footer slot provided', () => {
    wrapper = mount(RAppShell, {
      props: { footerVisible: true },
      slots: {
        footer: '<span>Footer content</span>',
      },
    })
    const footer = wrapper.find('.r-app-shell__footer')
    expect(footer.exists()).toBe(true)
    expect(footer.text()).toBe('Footer content')
  })

  it('hides footer when footerVisible is false', () => {
    wrapper = mount(RAppShell, {
      props: { footerVisible: false },
      slots: {
        footer: '<span>Footer</span>',
      },
    })
    expect(wrapper.find('.r-app-shell__footer').exists()).toBe(false)
  })

  it('emits update:sidebarCollapsed when sidebar toggle is invoked', async () => {
    wrapper = mount(RAppShell, {
      slots: {
        sidebar: `<template #sidebar="{ toggle }">
          <button data-testid="toggle-btn" @click="toggle()">Toggle</button>
        </template>`,
      },
    })
    const toggleBtn = wrapper.find('[data-testid="toggle-btn"]')
    await toggleBtn.trigger('click')
    expect(wrapper.emitted('update:sidebarCollapsed')).toBeTruthy()
    expect(wrapper.emitted('update:sidebarCollapsed')![0]).toEqual([true])
  })

  it('passes collapsed and toggle to sidebar slot', () => {
    wrapper = mount(RAppShell, {
      props: { sidebarCollapsed: true },
      slots: {
        sidebar: `<template #sidebar="{ collapsed }">
          <span data-testid="collapsed">{{ collapsed }}</span>
        </template>`,
      },
    })
    expect(wrapper.find('[data-testid="collapsed"]').text()).toBe('true')
  })

  it('passes toggle-sidebar to header slot', async () => {
    wrapper = mount(RAppShell, {
      slots: {
        header: `<template #header="{ toggleSidebar }">
          <button data-testid="header-toggle" @click="toggleSidebar()">Menu</button>
        </template>`,
      },
    })
    await wrapper.find('[data-testid="header-toggle"]').trigger('click')
    expect(wrapper.emitted('update:sidebarCollapsed')).toBeTruthy()
  })

  it('renders tabs slot when provided', () => {
    wrapper = mount(RAppShell, {
      slots: {
        tabs: '<div data-testid="tabs-slot">Tabs</div>',
      },
    })
    expect(wrapper.find('[data-testid="tabs-slot"]').exists()).toBe(true)
  })

  it('renders default slot content', () => {
    wrapper = mount(RAppShell, {
      slots: {
        default: '<main>Main content</main>',
      },
    })
    expect(wrapper.find('main').text()).toBe('Main content')
  })

  it('emits update:sidebarCollapsed when mounting on mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    })
    wrapper = mount(RAppShell)
    expect(wrapper.emitted('update:sidebarCollapsed')).toBeTruthy()
    expect(wrapper.emitted('update:sidebarCollapsed')![0]).toEqual([true])
  })

  it('hides overlay on desktop (innerWidth >= 768)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    wrapper = mount(RAppShell)
    expect(wrapper.find('.r-app-shell__overlay').exists()).toBe(false)
  })

  it('shows overlay when mobile and sidebar open', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    })
    wrapper = mount(RAppShell, {
      slots: {
        sidebar: `<template #sidebar="{ toggle }">
          <button data-testid="mobile-toggle" @click="toggle()">Open</button>
        </template>`,
      },
    })
    await wrapper.find('[data-testid="mobile-toggle"]').trigger('click')
    expect(wrapper.find('.r-app-shell__overlay').exists()).toBe(true)
  })

  it('closes overlay when overlay is clicked', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    })
    wrapper = mount(RAppShell, {
      slots: {
        sidebar: `<template #sidebar="{ toggle }">
          <button data-testid="mobile-toggle" @click="toggle()">Open</button>
        </template>`,
      },
    })
    await wrapper.find('[data-testid="mobile-toggle"]').trigger('click')
    expect(wrapper.find('.r-app-shell__overlay').exists()).toBe(true)
    await wrapper.find('.r-app-shell__overlay').trigger('click')
    expect(wrapper.find('.r-app-shell__overlay').exists()).toBe(false)
  })

  it('adds header--fixed class when headerFixed is true', () => {
    wrapper = mount(RAppShell, { props: { headerFixed: true } })
    expect(wrapper.find('.r-app-shell__header').classes()).toContain('r-app-shell__header--fixed')
  })

  it('does not add header--fixed when headerFixed is false', () => {
    wrapper = mount(RAppShell, { props: { headerFixed: false } })
    expect(wrapper.find('.r-app-shell__header').classes()).not.toContain('r-app-shell__header--fixed')
  })
})

describe('RSideNav', () => {
  const baseMenus: MenuItem[] = [
    { key: 'home', label: 'Home', icon: '🏠', path: '/home' },
    { key: 'users', label: 'Users', icon: '👥' },
    {
      key: 'settings',
      label: 'Settings',
      icon: '⚙️',
      children: [
        { key: 'profile', label: 'Profile', path: '/profile' },
        { key: 'security', label: 'Security', path: '/security' },
      ],
    },
    { key: 'hidden-item', label: 'Hidden', hidden: true },
  ]

  it('renders with data-testid="side-nav" and role="navigation"', () => {
    const wrapper = mount(RSideNav, { props: { menus: baseMenus } })
    const nav = wrapper.find('[data-testid="side-nav"]')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('role')).toBe('navigation')
    expect(nav.attributes('aria-label')).toBe('Sidebar navigation')
  })

  it('renders flat menu items', () => {
    const wrapper = mount(RSideNav, { props: { menus: baseMenus } })
    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('Users')
  })

  it('filters hidden menu items', () => {
    const wrapper = mount(RSideNav, { props: { menus: baseMenus } })
    expect(wrapper.text()).not.toContain('Hidden')
  })

  it('renders group with children', () => {
    const wrapper = mount(RSideNav, { props: { menus: baseMenus } })
    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('Profile')
    expect(wrapper.text()).toContain('Security')
  })

  it('filters hidden children in groups', () => {
    const menusWithHiddenChild: MenuItem[] = [
      {
        key: 'group',
        label: 'Group',
        children: [
          { key: 'a', label: 'A' },
          { key: 'b', label: 'B', hidden: true },
        ],
      },
    ]
    const wrapper = mount(RSideNav, { props: { menus: menusWithHiddenChild } })
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).not.toContain('B')
  })

  it('emits select when menu item clicked', async () => {
    const wrapper = mount(RSideNav, { props: { menus: baseMenus } })
    const homeBtn = wrapper.findAll('button[role="menuitem"]').find((b) => b.text().includes('Home'))
    expect(homeBtn).toBeTruthy()
    await homeBtn!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['home']])
  })

  it('emits select when child menu item clicked', async () => {
    const wrapper = mount(RSideNav, { props: { menus: baseMenus } })
    const profileBtn = wrapper
      .findAll('button[role="menuitem"]')
      .find((b) => b.text().includes('Profile'))
    expect(profileBtn).toBeTruthy()
    await profileBtn!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['profile']])
  })

  it('applies active state to flat item', () => {
    const wrapper = mount(RSideNav, {
      props: { menus: baseMenus, activeKey: 'home' },
    })
    const homeItem = wrapper.find('.r-side-nav__item--active')
    expect(homeItem.exists()).toBe(true)
    expect(homeItem.find('button').attributes('aria-current')).toBe('page')
  })

  it('applies active state to child item', () => {
    const wrapper = mount(RSideNav, {
      props: { menus: baseMenus, activeKey: 'profile' },
    })
    const activeItems = wrapper.findAll('.r-side-nav__item--active')
    expect(activeItems.length).toBeGreaterThan(0)
    const profileBtn = wrapper
      .findAll('button[role="menuitem"]')
      .find((b) => b.text().includes('Profile'))
    expect(profileBtn?.attributes('aria-current')).toBe('page')
  })

  it('applies active state to group when child is active', () => {
    const wrapper = mount(RSideNav, {
      props: { menus: baseMenus, activeKey: 'security' },
    })
    const activeGroup = wrapper.find('.r-side-nav__group--active')
    expect(activeGroup.exists()).toBe(true)
  })

  it('renders collapsed state with correct width', () => {
    const wrapper = mount(RSideNav, {
      props: { menus: baseMenus, collapsed: true, collapsedWidth: 64 },
    })
    expect(wrapper.find('.r-side-nav').classes()).toContain('r-side-nav--collapsed')
    expect(wrapper.find('.r-side-nav').attributes('style')).toContain('64px')
  })

  it('renders logo when provided', () => {
    const wrapper = mount(RSideNav, {
      props: { menus: baseMenus, logo: '/logo.png' },
    })
    const img = wrapper.find('.r-side-nav__logo')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/logo.png')
  })

  it('renders title with default "Admin"', () => {
    const wrapper = mount(RSideNav, { props: { menus: baseMenus } })
    expect(wrapper.find('.r-side-nav__title').text()).toBe('Admin')
  })

  it('renders custom title', () => {
    const wrapper = mount(RSideNav, {
      props: { menus: baseMenus, title: 'My App' },
    })
    expect(wrapper.find('.r-side-nav__title').text()).toBe('My App')
  })

  it('hides title when collapsed', () => {
    const wrapper = mount(RSideNav, {
      props: { menus: baseMenus, collapsed: true },
    })
    expect(wrapper.find('.r-side-nav__title').exists()).toBe(false)
  })

  it('emits update:collapsed when collapse button clicked', async () => {
    const wrapper = mount(RSideNav, {
      props: { menus: baseMenus, collapsed: false },
    })
    const collapseBtn = wrapper.find('.r-side-nav__collapse-btn')
    await collapseBtn.trigger('click')
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]])
  })

  it('collapse button has correct aria-label when expanded', () => {
    const wrapper = mount(RSideNav, {
      props: { menus: baseMenus, collapsed: false },
    })
    expect(wrapper.find('.r-side-nav__collapse-btn').attributes('aria-label')).toBe(
      'Collapse sidebar',
    )
  })

  it('collapse button has correct aria-label when collapsed', () => {
    const wrapper = mount(RSideNav, {
      props: { menus: baseMenus, collapsed: true },
    })
    expect(wrapper.find('.r-side-nav__collapse-btn').attributes('aria-label')).toBe(
      'Expand sidebar',
    )
  })

  it('renders icon in menu item', () => {
    const wrapper = mount(RSideNav, { props: { menus: baseMenus } })
    expect(wrapper.find('.r-side-nav__icon').text()).toContain('🏠')
  })

  it('menu items have role="menuitem" for accessibility', () => {
    const wrapper = mount(RSideNav, { props: { menus: baseMenus } })
    const menuItems = wrapper.findAll('button[role="menuitem"]')
    expect(menuItems.length).toBeGreaterThan(0)
  })
})

describe('RTopbar', () => {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Users', path: '/users' },
    { label: 'Details' },
  ]

  it('renders with data-testid="topbar" and role="banner"', () => {
    const wrapper = mount(RTopbar)
    expect(wrapper.find('[data-testid="topbar"]').exists()).toBe(true)
    expect(wrapper.find('header').attributes('role')).toBe('banner')
  })

  it('renders menu button with aria-label', () => {
    const wrapper = mount(RTopbar)
    const menuBtn = wrapper.find('.r-topbar__menu-btn')
    expect(menuBtn.attributes('aria-label')).toBe('Toggle sidebar')
  })

  it('emits toggle-sidebar when menu button clicked', async () => {
    const wrapper = mount(RTopbar)
    await wrapper.find('.r-topbar__menu-btn').trigger('click')
    expect(wrapper.emitted('toggle-sidebar')).toBeTruthy()
  })

  it('renders breadcrumbs when showBreadcrumb is true and breadcrumbs provided', () => {
    const wrapper = mount(RTopbar, {
      props: { breadcrumbs, showBreadcrumb: true },
    })
    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('Users')
    expect(wrapper.text()).toContain('Details')
  })

  it('hides breadcrumb when showBreadcrumb is false', () => {
    const wrapper = mount(RTopbar, {
      props: { breadcrumbs, showBreadcrumb: false },
    })
    expect(wrapper.find('.r-topbar__breadcrumb').exists()).toBe(false)
  })

  it('renders links for non-last breadcrumb items with path', () => {
    const wrapper = mount(RTopbar, {
      props: { breadcrumbs },
    })
    const links = wrapper.findAll('.r-topbar__breadcrumb-link')
    expect(links.length).toBe(2)
    expect(links[0].attributes('href')).toBe('/')
    expect(links[1].attributes('href')).toBe('/users')
  })

  it('renders last breadcrumb as span with aria-current', () => {
    const wrapper = mount(RTopbar, {
      props: { breadcrumbs },
    })
    const current = wrapper.find('.r-topbar__breadcrumb-current')
    expect(current.exists()).toBe(true)
    expect(current.text()).toBe('Details')
    expect(current.attributes('aria-current')).toBe('page')
  })

  it('emits navigate when breadcrumb link clicked', async () => {
    const wrapper = mount(RTopbar, {
      props: { breadcrumbs },
    })
    const homeLink = wrapper.findAll('a').find((a) => a.text() === 'Home')
    expect(homeLink).toBeTruthy()
    await homeLink!.trigger('click')
    expect(wrapper.emitted('navigate')).toEqual([['/']])
  })

  it('applies custom height', () => {
    const wrapper = mount(RTopbar, { props: { height: 64 } })
    expect(wrapper.find('header').attributes('style')).toContain('64px')
  })

  it('renders actions slot', () => {
    const wrapper = mount(RTopbar, {
      slots: {
        actions: '<button data-testid="action-btn">Action</button>',
      },
    })
    expect(wrapper.find('[data-testid="action-btn"]').exists()).toBe(true)
  })
})

describe('RBreadcrumb', () => {
  const items: BreadcrumbItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Settings', path: '/settings' },
    { label: 'Profile' },
  ]

  it('renders with data-testid="breadcrumb" and aria-label', () => {
    const wrapper = mount(RBreadcrumb, { props: { items } })
    const nav = wrapper.find('[data-testid="breadcrumb"]')
    expect(nav.exists()).toBe(true)
    expect(nav.attributes('aria-label')).toBe('Breadcrumb')
  })

  it('renders all items', () => {
    const wrapper = mount(RBreadcrumb, { props: { items } })
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('Profile')
  })

  it('renders links for non-last items with path', () => {
    const wrapper = mount(RBreadcrumb, { props: { items } })
    const links = wrapper.findAll('.r-breadcrumb__link')
    expect(links.length).toBe(2)
    expect(links[0].text()).toBe('Dashboard')
    expect(links[0].attributes('href')).toBe('/dashboard')
  })

  it('renders last item as span with aria-current="page"', () => {
    const wrapper = mount(RBreadcrumb, { props: { items } })
    const current = wrapper.find('.r-breadcrumb__current')
    expect(current.exists()).toBe(true)
    expect(current.text()).toBe('Profile')
    expect(current.attributes('aria-current')).toBe('page')
  })

  it('emits navigate when link clicked', async () => {
    const wrapper = mount(RBreadcrumb, { props: { items } })
    const dashboardLink = wrapper.find('.r-breadcrumb__link')
    await dashboardLink.trigger('click')
    expect(wrapper.emitted('navigate')).toEqual([['/dashboard']])
  })

  it('renders separator between items', () => {
    const wrapper = mount(RBreadcrumb, { props: { items } })
    const seps = wrapper.findAll('.r-breadcrumb__sep')
    expect(seps.length).toBe(2)
    expect(seps[0].attributes('aria-hidden')).toBe('true')
  })

  it('renders single item without link', () => {
    const singleItems: BreadcrumbItem[] = [{ label: 'Only' }]
    const wrapper = mount(RBreadcrumb, { props: { items: singleItems } })
    expect(wrapper.find('.r-breadcrumb__link').exists()).toBe(false)
    expect(wrapper.find('.r-breadcrumb__current').text()).toBe('Only')
  })
})

describe('RTabsView', () => {
  const tabs: TabItem[] = [
    { key: 'tab1', label: 'Tab 1', path: '/tab1' },
    { key: 'tab2', label: 'Tab 2', path: '/tab2', closable: true },
    { key: 'tab3', label: 'Tab 3', path: '/tab3', affix: true },
    { key: 'tab4', label: 'Tab 4', path: '/tab4', closable: false },
  ]

  const mountOptions = {
    global: { stubs: { teleport: true } },
  }

  it('renders with data-testid="tabs-view" and role="tablist"', () => {
    const wrapper = mount(RTabsView, {
      props: { tabs },
      ...mountOptions,
    })
    expect(wrapper.find('[data-testid="tabs-view"]').exists()).toBe(true)
    expect(wrapper.find('.r-tabs-view').attributes('role')).toBe('tablist')
  })

  it('renders all tabs', () => {
    const wrapper = mount(RTabsView, {
      props: { tabs },
      ...mountOptions,
    })
    expect(wrapper.text()).toContain('Tab 1')
    expect(wrapper.text()).toContain('Tab 2')
    expect(wrapper.text()).toContain('Tab 3')
    expect(wrapper.text()).toContain('Tab 4')
  })

  it('emits select when tab clicked', async () => {
    const wrapper = mount(RTabsView, {
      props: { tabs },
      ...mountOptions,
    })
    const tabButtons = wrapper.findAll('button[role="tab"]')
    await tabButtons[1].trigger('click')
    expect(wrapper.emitted('select')).toEqual([['tab2']])
  })

  it('applies active state to activeKey tab', () => {
    const wrapper = mount(RTabsView, {
      props: { tabs, activeKey: 'tab2' },
      ...mountOptions,
    })
    const activeTab = wrapper.find('.r-tabs-view__tab--active')
    expect(activeTab.exists()).toBe(true)
    expect(activeTab.text()).toContain('Tab 2')
    expect(activeTab.attributes('aria-selected')).toBe('true')
    expect(activeTab.attributes('tabindex')).toBe('0')
  })

  it('non-active tabs have tabindex="-1"', () => {
    const wrapper = mount(RTabsView, {
      props: { tabs, activeKey: 'tab1' },
      ...mountOptions,
    })
    const tabButtons = wrapper.findAll('button[role="tab"]')
    const nonActive = tabButtons.filter((t) => !t.classes().includes('r-tabs-view__tab--active'))
    nonActive.forEach((tab) => {
      expect(tab.attributes('tabindex')).toBe('-1')
    })
  })

  it('tab buttons are keyboard operable (focusable with correct tabindex)', () => {
    const wrapper = mount(RTabsView, {
      props: { tabs, activeKey: 'tab2' },
      ...mountOptions,
    })
    const activeTab = wrapper.find('.r-tabs-view__tab--active')
    expect(activeTab.attributes('tabindex')).toBe('0')
  })

  it('emits close when close button clicked', async () => {
    const wrapper = mount(RTabsView, {
      props: { tabs, activeKey: 'tab2' },
      ...mountOptions,
    })
    const closeBtns = wrapper.findAll('.r-tabs-view__close')
    expect(closeBtns.length).toBeGreaterThan(0)
    await closeBtns[0].trigger('click')
    expect(wrapper.emitted('close')).toEqual([['tab1']])
  })

  it('affix tab does not show close button', () => {
    const wrapper = mount(RTabsView, {
      props: { tabs, activeKey: 'tab3' },
      ...mountOptions,
    })
    const tab3El = wrapper.findAll('.r-tabs-view__tab').find((t) => t.text().includes('Tab 3'))
    expect(tab3El?.find('.r-tabs-view__close').exists()).toBe(false)
  })

  it('closable:false tab does not show close button', () => {
    const wrapper = mount(RTabsView, {
      props: { tabs, activeKey: 'tab4' },
      ...mountOptions,
    })
    const tab4El = wrapper.findAll('.r-tabs-view__tab').find((t) => t.text().includes('Tab 4'))
    expect(tab4El?.find('.r-tabs-view__close').exists()).toBe(false)
  })

  it('default closable tab shows close button', () => {
    const wrapper = mount(RTabsView, {
      props: { tabs, activeKey: 'tab1' },
      ...mountOptions,
    })
    const tab1El = wrapper.findAll('.r-tabs-view__tab').find((t) => t.text().includes('Tab 1'))
    expect(tab1El?.find('.r-tabs-view__close').exists()).toBe(true)
  })

  it('close button has aria-label', () => {
    const wrapper = mount(RTabsView, {
      props: { tabs },
      ...mountOptions,
    })
    const closeBtn = wrapper.find('.r-tabs-view__close')
    expect(closeBtn.attributes('aria-label')).toBe('Close tab')
  })

  it('shows context menu on right-click when showContextMenu is true', async () => {
    const wrapper = mount(RTabsView, {
      props: { tabs, showContextMenu: true },
      ...mountOptions,
    })
    const tab2 = wrapper.findAll('button[role="tab"]')[1]
    await tab2.trigger('contextmenu')
    const ctxMenu = wrapper.find('[data-testid="tabs-context-menu"]')
    expect(ctxMenu.exists()).toBe(true)
  })

  it('context menu has Close, Close Others, Close All buttons', async () => {
    const wrapper = mount(RTabsView, {
      props: { tabs },
      ...mountOptions,
    })
    const tab = wrapper.findAll('button[role="tab"]')[0]
    await tab.trigger('contextmenu')
    const ctxMenu = wrapper.find('[data-testid="tabs-context-menu"]')
    expect(ctxMenu.text()).toContain('Close')
    expect(ctxMenu.text()).toContain('Close Others')
    expect(ctxMenu.text()).toContain('Close All')
  })

  it('emits close when context menu Close clicked', async () => {
    const wrapper = mount(RTabsView, {
      props: { tabs },
      ...mountOptions,
    })
    const tab2 = wrapper.findAll('button[role="tab"]')[1]
    await tab2.trigger('contextmenu')
    const closeBtn = wrapper.find('[data-testid="tabs-context-menu"] button')
    await closeBtn.trigger('click')
    expect(wrapper.emitted('close')).toEqual([['tab2']])
  })

  it('emits close-other when context menu Close Others clicked', async () => {
    const wrapper = mount(RTabsView, {
      props: { tabs },
      ...mountOptions,
    })
    const tab2 = wrapper.findAll('button[role="tab"]')[1]
    await tab2.trigger('contextmenu')
    const buttons = wrapper.findAll('[data-testid="tabs-context-menu"] button')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('close-other')).toEqual([['tab2']])
  })

  it('emits close-all when context menu Close All clicked', async () => {
    const wrapper = mount(RTabsView, {
      props: { tabs },
      ...mountOptions,
    })
    const tab = wrapper.findAll('button[role="tab"]')[0]
    await tab.trigger('contextmenu')
    const buttons = wrapper.findAll('[data-testid="tabs-context-menu"] button')
    await buttons[2].trigger('click')
    expect(wrapper.emitted('close-all')).toBeTruthy()
  })

  it('does not show context menu when showContextMenu is false', async () => {
    const wrapper = mount(RTabsView, {
      props: { tabs, showContextMenu: false },
      ...mountOptions,
    })
    const tab = wrapper.findAll('button[role="tab"]')[0]
    await tab.trigger('contextmenu')
    const ctxMenu = wrapper.find('[data-testid="tabs-context-menu"]')
    expect(ctxMenu.exists()).toBe(false)
  })

  it('exposes scrollToActive method', () => {
    const wrapper = mount(RTabsView, {
      props: { tabs },
      ...mountOptions,
    })
    expect(typeof (wrapper.vm as { scrollToActive?: () => void }).scrollToActive).toBe('function')
  })

  it('scroll container renders with tabs and arrow buttons have correct aria-labels', () => {
    const wrapper = mount(RTabsView, {
      props: { tabs },
      ...mountOptions,
    })
    const scrollEl = wrapper.find('.r-tabs-view__scroll')
    expect(scrollEl.exists()).toBe(true)
    expect(scrollEl.findAll('button[role="tab"]').length).toBe(4)
    const leftArrow = wrapper.find('.r-tabs-view__arrow--left')
    const rightArrow = wrapper.find('.r-tabs-view__arrow--right')
    if (leftArrow.exists()) {
      expect(leftArrow.attributes('aria-label')).toBe('Scroll tabs left')
    }
    if (rightArrow.exists()) {
      expect(rightArrow.attributes('aria-label')).toBe('Scroll tabs right')
    }
  })
})
