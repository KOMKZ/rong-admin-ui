<script lang="ts" setup generic="T extends object = object">
  import { computed, h } from 'vue'
  import { NButton, NDropdown, NSpace, type DropdownOption } from 'naive-ui'
  import { RouterLink, type RouteLocationRaw } from 'vue-router'
  import RIcon from '../icon/RIcon.vue'
  import { resolveLinkRel } from '../navigation/link-rel'
  import type { RowAction, RowActionsProps, RowHrefAction, RowRouteAction } from './types'

  const props = withDefaults(defineProps<RowActionsProps<T>>(), {
    density: 'default',
    moreLabel: '更多',
    testIdPrefix: 'row-action',
  })

  const defaultActionIcons: Record<string, string> = {
    view: 'eye',
    detail: 'eye',
    details: 'eye',
    preview: 'eye',
    edit: 'edit',
    update: 'edit',
    copy: 'copy',
    copyUrl: 'copy',
    copyURL: 'copy',
    'copy-url': 'copy',
    open: 'external-link',
    external: 'external-link',
    delete: 'trash-2',
    remove: 'trash-2',
    roles: 'users',
    role: 'users',
    permission: 'shield',
    permissions: 'shield',
    password: 'lock',
    resetPassword: 'lock',
    reset: 'refresh-cw',
    retry: 'refresh-cw',
    refresh: 'refresh-cw',
    test: 'send',
    run: 'play',
  }

  const emit = defineEmits<{
    action: [key: string, row: T]
  }>()

  const fallbackMaxInline = computed(() => (props.density === 'compact' ? 1 : 3))
  const normalizedMaxInline = computed(() =>
    Math.max(0, props.maxInline ?? fallbackMaxInline.value),
  )
  const actionGap = computed(() => (props.density === 'compact' ? 4 : 6))
  const visibleActions = computed(() => {
    if (props.actions.length <= normalizedMaxInline.value) return props.actions
    return props.actions.slice(0, normalizedMaxInline.value)
  })
  const overflowActions = computed(() => {
    if (props.actions.length <= normalizedMaxInline.value) return []
    return props.actions.slice(normalizedMaxInline.value)
  })
  const overflowOptions = computed<DropdownOption[]>(() =>
    overflowActions.value.map((action) => {
      const iconName = resolveActionIcon(action)
      const disabled = isDisabled(action)
      const isLinkAction = isNavigationAction(action) && !disabled
      return {
        key: action.key,
        disabled,
        label: renderOverflowLabel(action, disabled),
        props: {
          class: [
            action.danger || action.type === 'error' ? 'r-row-actions__menu-item--danger' : '',
            // 链接型 option 的 padding 收敛进 anchor，整行热区保持唯一链接语义。
            isLinkAction ? 'r-row-actions__menu-item--link' : '',
          ],
          'data-testid': `${props.testIdPrefix}-menu-${action.key}`,
        },
        // route/link 的 icon 放进 anchor 内部，避免出现 anchor 外的可点击死区。
        icon: isLinkAction
          ? undefined
          : iconName
            ? () => h(RIcon, { name: iconName, size: 14 })
            : undefined,
      }
    }),
  )

  function isDisabled(action: RowAction<T>): boolean {
    return typeof action.disabled === 'function'
      ? action.disabled(props.row)
      : action.disabled === true
  }

  function isNavigationAction(
    action: RowAction<T>,
  ): action is RowRouteAction<T> | RowHrefAction<T> {
    return action.kind === 'route' || action.kind === 'link'
  }

  function actionType(action: RowAction<T>): RowAction<T>['type'] {
    if (action.danger) return 'error'
    return action.type ?? 'default'
  }

  function resolveActionIcon(action: RowAction<T>): string {
    if (action.icon) return action.icon
    if (action.danger) return 'trash-2'
    return defaultActionIcons[action.key] ?? 'circle-dot'
  }

  function resolveActionTo(action: RowRouteAction<T>): RouteLocationRaw {
    return typeof action.to === 'function' ? action.to(props.row) : action.to
  }

  function resolveActionHref(action: RowHrefAction<T>): string {
    return typeof action.href === 'function' ? action.href(props.row) : action.href
  }

  function triggerAction(action: RowAction<T>): void {
    if (isDisabled(action)) return
    if (!isNavigationAction(action)) action.onClick?.(props.row)
    emit('action', action.key, props.row)
  }

  function handleSelect(key: string | number): void {
    const action = overflowActions.value.find((item) => item.key === String(key))
    if (!action) return
    // route/link 的导航已由菜单内真实 anchor 完成；select 只触发 command，防止双导航。
    if (isNavigationAction(action)) return
    triggerAction(action)
  }

  function renderOverflowLabel(action: RowAction<T>, disabled: boolean): DropdownOption['label'] {
    // 与 inline 同一通知契约：plain click 导航一次并 emit 一次 action。
    const onActivate = () => emit('action', action.key, props.row)
    const iconNode = () => h(RIcon, { name: resolveActionIcon(action), size: 14 })
    if (action.kind === 'route' && !disabled) {
      const to = resolveActionTo(action)
      return () =>
        h(
          RouterLink,
          {
            to,
            target: action.target,
            rel: resolveLinkRel(action.target),
            class: 'r-row-actions__menu-link',
            'data-testid': `${props.testIdPrefix}-menu-${action.key}`,
            onClick: onActivate,
          },
          { default: () => [iconNode(), action.label] },
        )
    }
    if (action.kind === 'link' && !disabled) {
      const href = resolveActionHref(action)
      return () =>
        h(
          'a',
          {
            href,
            target: action.target,
            rel: resolveLinkRel(action.target, action.rel),
            class: 'r-row-actions__menu-link',
            'data-testid': `${props.testIdPrefix}-menu-${action.key}`,
            onClick: onActivate,
          },
          { default: () => [iconNode(), action.label] },
        )
    }
    return action.label
  }
</script>

<template>
  <NSpace
    class="r-row-actions"
    :class="`r-row-actions--${density}`"
    :size="actionGap"
    :wrap="false"
    @click.stop
  >
    <template v-for="action in visibleActions" :key="action.key">
      <RouterLink
        v-if="action.kind === 'route' && !isDisabled(action)"
        class="r-row-actions__link"
        :class="`r-row-actions__link--${actionType(action)}`"
        :to="resolveActionTo(action)"
        :target="action.target"
        :rel="resolveLinkRel(action.target)"
        :data-testid="`${testIdPrefix}-${action.key}`"
        @click="emit('action', action.key, props.row)"
      >
        <RIcon :name="resolveActionIcon(action)" :size="14" />
        {{ action.label }}
      </RouterLink>
      <a
        v-else-if="action.kind === 'link' && !isDisabled(action)"
        class="r-row-actions__link"
        :class="`r-row-actions__link--${actionType(action)}`"
        :href="resolveActionHref(action)"
        :target="action.target"
        :rel="resolveLinkRel(action.target, action.rel)"
        :data-testid="`${testIdPrefix}-${action.key}`"
        @click="emit('action', action.key, props.row)"
      >
        <RIcon :name="resolveActionIcon(action)" :size="14" />
        {{ action.label }}
      </a>
      <a
        v-else-if="isNavigationAction(action)"
        class="r-row-actions__link r-row-actions__link--disabled"
        :class="`r-row-actions__link--${actionType(action)}`"
        aria-disabled="true"
        :tabindex="-1"
        :data-testid="`${testIdPrefix}-${action.key}`"
      >
        <RIcon :name="resolveActionIcon(action)" :size="14" />
        {{ action.label }}
      </a>
      <NButton
        v-else
        size="small"
        text
        :type="actionType(action)"
        :disabled="isDisabled(action)"
        :data-testid="`${testIdPrefix}-${action.key}`"
        @click.stop="triggerAction(action)"
      >
        <template #icon>
          <RIcon :name="resolveActionIcon(action)" :size="14" />
        </template>
        {{ action.label }}
      </NButton>
    </template>

    <NDropdown
      v-if="overflowActions.length > 0"
      trigger="click"
      :options="overflowOptions"
      @select="handleSelect"
    >
      <NButton size="small" text type="default" :data-testid="`${testIdPrefix}-more`" @click.stop>
        <template #icon>
          <RIcon name="more-horizontal" :size="14" />
        </template>
        {{ moreLabel }}
      </NButton>
    </NDropdown>
  </NSpace>
</template>

<style scoped>
  .r-row-actions {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
  }

  .r-row-actions :deep(.n-button) {
    --n-padding: 0 var(--ra-spacing-1);
  }

  .r-row-actions :deep(.n-button__icon) {
    margin-right: var(--ra-spacing-0-5);
  }

  .r-row-actions--compact :deep(.n-button) {
    --n-padding: 0 var(--ra-spacing-0-5);
  }

  .r-row-actions__link {
    display: inline-flex;
    align-items: center;
    gap: var(--ra-spacing-0-5);
    padding: 0 var(--ra-spacing-1);
    font-size: var(--ra-font-size-sm);
    line-height: var(--ra-line-height-sm, 1.6);
    color: var(--ra-color-text-primary);
    border-radius: var(--ra-radius-sm);
    cursor: pointer;
    transition: all var(--ra-transition-fast);
  }

  .r-row-actions__link:hover {
    background: var(--ra-color-bg-hover, rgba(0, 0, 0, 0.04));
  }

  .r-row-actions__link--primary {
    color: var(--ra-color-brand-primary);
  }

  .r-row-actions__link--info {
    color: var(--ra-color-info, #4098fc);
  }

  .r-row-actions__link--success {
    color: var(--ra-color-success, #18a058);
  }

  .r-row-actions__link--warning {
    color: var(--ra-color-warning, #f0a020);
  }

  .r-row-actions__link--error {
    color: var(--ra-color-danger-text);
  }

  .r-row-actions__link--disabled {
    color: var(--ra-color-text-disabled, rgba(31, 34, 37, 0.36));
    cursor: not-allowed;
  }

  .r-row-actions__link--disabled:hover {
    background: none;
  }

  .r-row-actions__menu-link {
    color: inherit;
    text-decoration: none;
  }

  /* 链接型 option：padding 从 option 容器移入 anchor，保证整行都在链接热区内。 */
  :global(.r-row-actions__menu-item--link) {
    padding: 0 !important;
  }

  :global(.r-row-actions__menu-item--link .r-row-actions__menu-link) {
    display: flex;
    align-items: center;
    gap: var(--ra-spacing-1);
    width: 100%;
    padding: 6px 12px;
  }

  :global(.r-row-actions__menu-item--danger) {
    color: var(--ra-color-danger-text);
  }

  :global(.r-row-actions__menu-item--danger .r-row-actions__menu-link) {
    color: inherit;
  }
</style>
