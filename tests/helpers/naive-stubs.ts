/**
 * Naive UI component name → stub mapping for Vitest + @vue/test-utils.
 *
 * WHY: Naive UI registers components under internal names that differ from
 * the import name (e.g. `NDrawer` renders as `<n-drawer>`, but the internal
 * component name is "Drawer"). When stubbing via `global.stubs`, you must
 * use the **resolved component name**, not the import alias.
 *
 * USAGE:
 *   import { NAIVE_STUBS, naiveStubs } from '../helpers/naive-stubs'
 *
 *   // Option A — object spread (type-safe, selective)
 *   mount(MyComponent, {
 *     global: { stubs: { ...NAIVE_STUBS } },
 *   })
 *
 *   // Option B — function with allowlist
 *   mount(MyComponent, {
 *     global: { stubs: naiveStubs(['Drawer', 'Button', 'Spin']) },
 *   })
 */

import { defineComponent, h } from 'vue'

type NaiveComponentName =
  | 'Button'
  | 'Spin'
  | 'Drawer'
  | 'DrawerContent'
  | 'Modal'
  | 'Card'
  | 'Space'
  | 'Tag'
  | 'Badge'
  | 'Tooltip'
  | 'Popover'
  | 'Input'
  | 'InputNumber'
  | 'Select'
  | 'Checkbox'
  | 'CheckboxGroup'
  | 'Radio'
  | 'RadioGroup'
  | 'Switch'
  | 'Slider'
  | 'DatePicker'
  | 'TimePicker'
  | 'Upload'
  | 'UploadDragger'
  | 'Form'
  | 'FormItem'
  | 'DataTable'
  | 'Pagination'
  | 'Tabs'
  | 'TabPane'
  | 'Collapse'
  | 'CollapseItem'
  | 'Divider'
  | 'Text'
  | 'Descriptions'
  | 'DescriptionsItem'
  | 'Steps'
  | 'Step'
  | 'Skeleton'
  | 'Empty'
  | 'Result'
  | 'Alert'
  | 'Message'
  | 'Dialog'
  | 'Dropdown'
  | 'Menu'
  | 'Breadcrumb'
  | 'BreadcrumbItem'
  | 'ConfigProvider'
  | 'MessageProvider'
  | 'DialogProvider'
  | 'ScrollBar'
  | 'Grid'
  | 'GridItem'
  | 'Layout'
  | 'LayoutHeader'
  | 'LayoutSider'
  | 'LayoutContent'
  | 'LayoutFooter'
  | 'Icon'
  | 'Popconfirm'

function makeStub(name: string) {
  return defineComponent({
    name: `Naive${name}Stub`,
    inheritAttrs: false,
    setup(_, { slots }) {
      return () => h('div', { class: `n-${toKebab(name)}-stub`, 'data-stub': name }, slots.default?.())
    },
  })
}

function toKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

const ALL_NAMES: NaiveComponentName[] = [
  'Button', 'Spin', 'Drawer', 'DrawerContent', 'Modal', 'Card', 'Space',
  'Tag', 'Badge', 'Tooltip', 'Popover', 'Input', 'InputNumber', 'Select',
  'Checkbox', 'CheckboxGroup', 'Radio', 'RadioGroup', 'Switch', 'Slider',
  'DatePicker', 'TimePicker', 'Upload', 'UploadDragger', 'Form', 'FormItem',
  'DataTable', 'Pagination', 'Tabs', 'TabPane', 'Collapse', 'CollapseItem',
  'Divider', 'Text', 'Descriptions', 'DescriptionsItem', 'Steps', 'Step',
  'Skeleton', 'Empty', 'Result', 'Alert', 'Message', 'Dialog', 'Dropdown',
  'Menu', 'Breadcrumb', 'BreadcrumbItem', 'ConfigProvider', 'MessageProvider',
  'DialogProvider', 'ScrollBar', 'Grid', 'GridItem', 'Layout', 'LayoutHeader',
  'LayoutSider', 'LayoutContent', 'LayoutFooter', 'Icon', 'Popconfirm',
]

export const NAIVE_STUBS: Record<string, ReturnType<typeof defineComponent>> = Object.fromEntries(
  ALL_NAMES.map((name) => [name, makeStub(name)]),
)

export function naiveStubs(
  names: NaiveComponentName[],
): Record<string, ReturnType<typeof defineComponent>> {
  return Object.fromEntries(names.map((name) => [name, makeStub(name)]))
}

export { type NaiveComponentName }
