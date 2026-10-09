import type { RouteLocationRaw } from 'vue-router'

/** 中立路由按钮：页面 CTA 用真实 anchor 承载应用内导航，不承载业务字段或权限判断。 */
export interface RouteButtonProps {
  /** 目标路由；URL 由 vue-router 解析，禁止调用方手拼 base。 */
  to: RouteLocationRaw
  /** `_blank` 时自动补安全 rel（见 navigation/link-rel）。 */
  target?: '_self' | '_blank'
  replace?: boolean
  disabled?: boolean
}

export interface RouteButtonEmits {
  /** 应用内 SPA 导航即将发生时的通知；修饰键/非左键新标签与 `_blank` 不触发。导航本身由 RouterLink 承担，消费方不得再 push。 */
  navigate: []
}
