<script lang="ts" setup generic="T extends object = object">
  import { computed, h } from 'vue'
  import { NButton, NDropdown, NSpace, type DropdownOption } from 'naive-ui'
  import RIcon from '../icon/RIcon.vue'
  import type { RowAction, RowActionsProps } from './types'

  const props = withDefaults(defineProps<RowActionsProps<T>>(), {
    maxInline: 3,
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

  const normalizedMaxInline = computed(() => Math.max(0, props.maxInline))
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
      return {
        key: action.key,
        label: action.label,
        disabled: isDisabled(action),
        props: {
          class: action.danger || action.type === 'error' ? 'r-row-actions__menu-item--danger' : '',
          'data-testid': `${props.testIdPrefix}-menu-${action.key}`,
        },
        icon: iconName ? () => h(RIcon, { name: iconName, size: 14 }) : undefined,
      }
    }),
  )

  function isDisabled(action: RowAction<T>): boolean {
    return typeof action.disabled === 'function'
      ? action.disabled(props.row)
      : action.disabled === true
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

  function triggerAction(action: RowAction<T>): void {
    if (isDisabled(action)) return
    action.onClick?.(props.row)
    emit('action', action.key, props.row)
  }

  function handleSelect(key: string | number): void {
    const action = overflowActions.value.find((item) => item.key === String(key))
    if (action) triggerAction(action)
  }
</script>

<template>
  <NSpace class="r-row-actions" :size="6" :wrap="false" @click.stop>
    <template v-for="action in visibleActions" :key="action.key">
      <NButton
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

  :global(.r-row-actions__menu-item--danger) {
    color: var(--ra-color-danger-text);
  }
</style>
