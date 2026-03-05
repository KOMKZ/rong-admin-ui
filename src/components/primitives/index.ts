/**
 * Re-export common Naive UI primitives through the admin-ui package boundary.
 * Business code should import these from @rong/admin-ui instead of naive-ui directly.
 */
export {
  NButton,
  NSpace,
  NTag,
  NCard,
  NAlert,
  NDivider,
  NSwitch,
  NIcon,
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NGrid,
  NGridItem,
  NStatistic,
  NSelect,
  NInput,
  NForm,
  NFormItem,
  NPopconfirm,
  NTooltip,
  NBreadcrumb,
  NBreadcrumbItem,
  NDropdown,
  NMenu,
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NLayoutHeader,
  NLayoutFooter,
} from 'naive-ui'

export { darkTheme } from 'naive-ui'
export type { GlobalThemeOverrides } from 'naive-ui'
