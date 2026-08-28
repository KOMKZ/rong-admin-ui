import create from 'naive-ui/es/create'
import { NAlert } from 'naive-ui/es/alert'
import { NAvatar } from 'naive-ui/es/avatar'
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui/es/breadcrumb'
import { NButton } from 'naive-ui/es/button'
import { NCheckbox } from 'naive-ui/es/checkbox'
import { NCollapse, NCollapseItem } from 'naive-ui/es/collapse'
import { NConfigProvider } from 'naive-ui/es/config-provider'
import { NDataTable } from 'naive-ui/es/data-table'
import { NDescriptions, NDescriptionsItem } from 'naive-ui/es/descriptions'
import { createDiscreteApi } from 'naive-ui/es/discrete'
import { NDialogProvider, useDialog } from 'naive-ui/es/dialog'
import { NDrawer, NDrawerContent } from 'naive-ui/es/drawer'
import { NDropdown } from 'naive-ui/es/dropdown'
import { NEmpty } from 'naive-ui/es/empty'
import { NForm, NFormItem } from 'naive-ui/es/form'
import { NIcon } from 'naive-ui/es/icon'
import { NInput } from 'naive-ui/es/input'
import { NInputNumber } from 'naive-ui/es/input-number'
import { NLoadingBarProvider } from 'naive-ui/es/loading-bar'
import { NMenu } from 'naive-ui/es/menu'
import { NMessageProvider, useMessage } from 'naive-ui/es/message'
import { NModal } from 'naive-ui/es/modal'
import { NNotificationProvider } from 'naive-ui/es/notification'
import { NPopover } from 'naive-ui/es/popover'
import { NProgress } from 'naive-ui/es/progress'
import { NRadio, NRadioButton, NRadioGroup } from 'naive-ui/es/radio'
import { NSelect } from 'naive-ui/es/select'
import { NSpace } from 'naive-ui/es/space'
import { NSpin } from 'naive-ui/es/spin'
import { NSwitch } from 'naive-ui/es/switch'
import { NTabPane, NTabs } from 'naive-ui/es/tabs'
import { NTag } from 'naive-ui/es/tag'
import { NLi, NText, NUl } from 'naive-ui/es/typography'
import { NTooltip } from 'naive-ui/es/tooltip'
import { darkTheme } from 'naive-ui/es/themes'
import { dateZhCN, zhCN } from 'naive-ui/es/locales'

const naive = /* @__PURE__ */ create({
  components: [
    NAlert,
    NAvatar,
    NBreadcrumb,
    NBreadcrumbItem,
    NButton,
    NCheckbox,
    NCollapse,
    NCollapseItem,
    NConfigProvider,
    NDataTable,
    NDescriptions,
    NDescriptionsItem,
    NDialogProvider,
    NDrawer,
    NDrawerContent,
    NDropdown,
    NEmpty,
    NForm,
    NFormItem,
    NIcon,
    NInput,
    NInputNumber,
    NLi,
    NLoadingBarProvider,
    NMenu,
    NMessageProvider,
    NModal,
    NNotificationProvider,
    NPopover,
    NProgress,
    NRadio,
    NRadioButton,
    NRadioGroup,
    NSelect,
    NSpace,
    NSpin,
    NSwitch,
    NTabPane,
    NTabs,
    NTag,
    NText,
    NTooltip,
    NUl,
  ],
})

export {
  createDiscreteApi,
  darkTheme,
  dateZhCN,
  naive,
  NAlert,
  NAvatar,
  NBreadcrumb,
  NBreadcrumbItem,
  NButton,
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NConfigProvider,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDialogProvider,
  NDrawer,
  NDrawerContent,
  NDropdown,
  NEmpty,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NLi,
  NLoadingBarProvider,
  NMenu,
  NMessageProvider,
  NModal,
  NNotificationProvider,
  NPopover,
  NProgress,
  NRadio,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  NTabPane,
  NTabs,
  NTag,
  NText,
  NTooltip,
  NUl,
  useDialog,
  useMessage,
  zhCN,
}

export type { DataTableColumns } from 'naive-ui/es/data-table'
export type { DropdownOption } from 'naive-ui/es/dropdown'
export type { FormInst, FormRules } from 'naive-ui/es/form'
export type { MenuOption } from 'naive-ui/es/menu'
