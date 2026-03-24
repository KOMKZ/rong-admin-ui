<script lang="ts" setup>
import { computed } from 'vue'
import { NSelect } from 'naive-ui'

const props = defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inner = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v),
})

const FLAG_BY_LOCALE: Record<string, string> = {
  'zh-CN': '🇨🇳',
  zh: '🇨🇳',
  'en-US': '🇺🇸',
  en: '🇺🇸',
}

const displayOptions = computed(() =>
  props.options.map((o) => {
    const flag = FLAG_BY_LOCALE[o.value] || ''
    return {
      value: o.value,
      label: flag ? `${flag} ${o.label}` : o.label,
    }
  }),
)
</script>

<template>
  <NSelect
    v-model:value="inner"
    class="r-language-selector"
    size="small"
    :options="displayOptions"
    :consistent-menu-width="false"
    :style="{ minWidth: '108px' }"
  />
</template>

<style scoped>
.r-language-selector :deep(.n-base-selection) {
  min-height: 28px;
  font-size: 12px;
}
</style>
