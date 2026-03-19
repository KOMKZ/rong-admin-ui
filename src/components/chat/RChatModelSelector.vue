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
  /** Mapping of tier -> model. Keys: instant, thinking, pro */
  tierModels?: Partial<Record<TierKey, string>>
  /** @deprecated Use tierModels instead */
  options?: Array<{ label: string; value: string }>
  disabled?: boolean
}

const defaultTierModels: Record<TierKey, string> = {
  instant: 'gpt-4o-mini',
  thinking: 'o1-mini',
  pro: 'gpt-4o',
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

const tierModelsResolved = computed(() => ({
  ...defaultTierModels,
  ...props.tierModels,
}))

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
  const model = tierModelsResolved.value[tier] ?? defaultTierModels[tier]
  emit('update:modelValue', model)
  emit('change', { tier, model })
}
</script>

<template>
  <NTabs
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
