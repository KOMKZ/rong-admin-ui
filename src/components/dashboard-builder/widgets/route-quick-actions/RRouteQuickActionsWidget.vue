<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RIcon } from '../../../icon'
import { normalizeRouteQuickActionsConfig, type RouteQuickActionsWidgetConfig } from './types'

const props = defineProps<{
  config?: Record<string, unknown>
  fallbackTitle?: string
  fallbackDescription?: string
}>()

const router = useRouter()

const resolved = computed<RouteQuickActionsWidgetConfig>(() =>
  normalizeRouteQuickActionsConfig(props.config),
)

const title = computed(() => resolved.value.title || props.fallbackTitle || '快捷入口')
const description = computed(
  () => resolved.value.description || props.fallbackDescription || '常用路由直达',
)

async function navigate(action: RouteQuickActionsWidgetConfig['actions'][number]): Promise<void> {
  if (!action.route) return

  const isExternal = /^https?:\/\//i.test(action.route)
  const openMode = action.openMode === 'new_tab' ? 'new_tab' : 'in_app'

  if (openMode === 'new_tab') {
    if (isExternal) {
      window.open(action.route, '_blank', 'noopener')
      return
    }
    const target = router.resolve(action.route)
    window.open(target.href, '_blank', 'noopener')
    return
  }

  if (isExternal) {
    window.location.assign(action.route)
    return
  }
  await router.push(action.route)
}
</script>

<template>
  <div class="route-quick-actions" data-testid="widget-route-quick-actions">
    <header class="route-quick-actions__header">
      <h4 class="route-quick-actions__title">{{ title }}</h4>
      <p class="route-quick-actions__desc">{{ description }}</p>
    </header>

    <div v-if="resolved.actions.length" class="route-quick-actions__grid">
      <button
        v-for="action in resolved.actions"
        :key="action.id"
        class="route-quick-actions__btn"
        type="button"
        data-testid="route-quick-actions-button"
        @click="navigate(action)"
      >
        <RIcon
          :name="action.openMode === 'new_tab' ? 'arrow-up-right' : 'arrow-right'"
          :size="14"
        />
        <span>{{ action.label }}</span>
      </button>
    </div>

    <div v-else class="route-quick-actions__empty" data-testid="route-quick-actions-empty">
      尚未配置快捷按钮
    </div>
  </div>
</template>

<style scoped>
.route-quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-3);
}

.route-quick-actions__header {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-1);
}

.route-quick-actions__title {
  margin: 0;
  color: var(--ra-color-text-primary);
  font-size: var(--ra-font-size-sm);
  font-weight: var(--ra-font-weight-semibold);
}

.route-quick-actions__desc {
  margin: 0;
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-xs);
}

.route-quick-actions__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ra-spacing-2);
}

.route-quick-actions__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ra-spacing-1);
  min-height: 38px;
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-md);
  background: linear-gradient(
    180deg,
    var(--ra-color-bg-surface) 0%,
    var(--ra-color-bg-surface-secondary) 100%
  );
  color: var(--ra-color-text-primary);
  font-size: var(--ra-font-size-xs);
  font-weight: var(--ra-font-weight-medium);
  cursor: pointer;
}

.route-quick-actions__btn:hover {
  border-color: var(--ra-color-border-interactive);
  box-shadow: var(--ra-shadow-sm);
}

.route-quick-actions__empty {
  border-radius: var(--ra-radius-md);
  border: 1px dashed var(--ra-color-border-default);
  padding: var(--ra-spacing-3);
  color: var(--ra-color-text-tertiary);
  font-size: var(--ra-font-size-xs);
  text-align: center;
}

@media (max-width: 768px) {
  .route-quick-actions__grid {
    grid-template-columns: 1fr;
  }
}
</style>
