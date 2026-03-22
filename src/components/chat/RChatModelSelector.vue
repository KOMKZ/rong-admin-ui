<script setup lang="ts">
import { computed } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'

export type TierKey = 'instant' | 'thinking' | 'pro'

export interface TierConfig {
  label: string
  model: string
}

interface Props {
  /** Currently selected model (for sync with v-model) */
  modelValue: string
  /** Mapping of tier -> model from backend Provider 列表 (no 内置默认模型 ID) */
  tierModels?: Partial<Record<TierKey, string>>
  /** @deprecated Use tierModels instead */
  options?: Array<{ label: string; value: string }>
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', payload: { tier: TierKey; model: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  tierModels: () => ({}),
  disabled: false,
})

const emit = defineEmits<Emits>()

const tierModelsResolved = computed(() => props.tierModels ?? {})

const hasUsableTiers = computed(() => {
  const m = tierModelsResolved.value
  return Boolean(m.instant?.trim() && m.thinking?.trim() && m.pro?.trim())
})

function modelToTier(model: string): TierKey {
  const m = tierModelsResolved.value
  if (m.instant === model) return 'instant'
  if (m.thinking === model) return 'thinking'
  if (m.pro === model) return 'pro'
  return 'instant'
}

const activeTier = computed(() => modelToTier(props.modelValue))

function onSelect(value: string) {
  const tier = (value || 'instant') as TierKey
  const model = tierModelsResolved.value[tier]?.trim()
  if (!model) return
  emit('update:modelValue', model)
  emit('change', { tier, model })
}
</script>

<template>
  <span v-if="!hasUsableTiers" class="r-chat-model-selector r-chat-model-selector--empty">
    无可用模型
  </span>
  <NTabs
    v-else
    type="segment"
    :value="activeTier"
    size="small"
    :disabled="disabled"
    class="r-chat-model-selector"
    @update:value="onSelect"
  >
    <NTabPane name="instant" tab="Instant" />
    <NTabPane name="thinking" tab="Thinking" />
    <NTabPane name="pro" tab="Pro" />
  </NTabs>
</template>

<style scoped>
.r-chat-model-selector--empty {
  font-size: 12px;
  color: var(--n-text-color-3);
  white-space: nowrap;
}
</style>
