<script lang="ts" setup>
  import { computed, ref, watch, type PropType } from 'vue'
  import { NAlert, NButton, NInput, NModal, NSelect, NSpace } from 'naive-ui'
  import type {
    CodeGeneratorApplyPayload,
    CodeGeneratorStrategy,
    CodeGeneratorTargetType,
  } from './types'

  const props = defineProps({
    show: { type: Boolean, required: true },
    title: { type: String, default: '智能生成编码' },
    targetTypes: {
      type: Array as PropType<CodeGeneratorTargetType[]>,
      required: true,
    },
    strategies: {
      type: Array as PropType<CodeGeneratorStrategy[]>,
      required: true,
    },
    targetType: { type: String, default: '' },
    sourceText: { type: String, default: '' },
    currentValue: { type: String, default: '' },
    extra: {
      type: Object as PropType<Record<string, unknown>>,
      default: () => ({}),
    },
    sourceLabel: { type: String, default: '来源文本' },
    sourcePlaceholder: { type: String, default: '输入中文名称或已有说明' },
    previewLabel: { type: String, default: '生成结果' },
    applyLabel: { type: String, default: '使用此编码' },
    cancelLabel: { type: String, default: '取消' },
    disabled: { type: Boolean, default: false },
  })

  const emit = defineEmits<{
    'update:show': [value: boolean]
    'update:targetType': [value: string]
    apply: [payload: CodeGeneratorApplyPayload]
  }>()

  const localTargetType = ref('')
  const localStrategyKey = ref('')
  const localSourceText = ref('')

  const targetOptions = computed(() =>
    props.targetTypes.map((item) => ({
      label: item.label,
      value: item.key,
    })),
  )

  const activeTarget = computed(() =>
    props.targetTypes.find((item) => item.key === localTargetType.value),
  )

  const availableStrategies = computed(() =>
    props.strategies.filter((strategy) =>
      strategy.targetTypes.includes(localTargetType.value),
    ),
  )

  const strategyOptions = computed(() =>
    availableStrategies.value.map((item) => ({
      label: item.label,
      value: item.key,
    })),
  )

  const activeStrategy = computed(() =>
    availableStrategies.value.find((item) => item.key === localStrategyKey.value),
  )

  const previewValue = computed(() => {
    if (!activeStrategy.value) return ''
    return activeStrategy.value.generate({
      targetType: localTargetType.value,
      sourceText: localSourceText.value,
      currentValue: props.currentValue,
      extra: props.extra,
    })
  })

  const canApply = computed(
    () => !props.disabled && Boolean(activeStrategy.value) && Boolean(previewValue.value.trim()),
  )

  watch(
    () => props.show,
    (show) => {
      if (!show) return
      localTargetType.value = props.targetType || props.targetTypes[0]?.key || ''
      localSourceText.value = props.sourceText || props.currentValue
      syncStrategy()
    },
    { immediate: true },
  )

  watch(
    () => props.targetType,
    (value) => {
      if (!props.show) return
      localTargetType.value = value || props.targetTypes[0]?.key || ''
      syncStrategy()
    },
  )

  watch(
    () => props.sourceText,
    (value) => {
      if (props.show) localSourceText.value = value
    },
  )

  watch(localTargetType, (value) => {
    emit('update:targetType', value)
    syncStrategy()
  })

  function syncStrategy(): void {
    const strategies = availableStrategies.value
    if (strategies.some((item) => item.key === localStrategyKey.value)) return
    localStrategyKey.value = strategies[0]?.key || ''
  }

  function close(): void {
    emit('update:show', false)
  }

  function apply(): void {
    if (!canApply.value || !activeStrategy.value) return
    emit('apply', {
      targetType: localTargetType.value,
      strategyKey: activeStrategy.value.key,
      value: previewValue.value.trim(),
      sourceText: localSourceText.value,
    })
    close()
  }
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="title"
    :bordered="false"
    class="r-code-generator-dialog"
    data-testid="code-generator-dialog"
    @update:show="emit('update:show', $event)"
  >
    <div class="r-code-generator-dialog__body">
      <div class="r-code-generator-dialog__grid">
        <label class="r-code-generator-dialog__field">
          <span>编码类型</span>
          <NSelect
            v-model:value="localTargetType"
            :options="targetOptions"
            :disabled="disabled"
            data-testid="code-generator-target"
          />
        </label>

        <label class="r-code-generator-dialog__field">
          <span>生成策略</span>
          <NSelect
            v-model:value="localStrategyKey"
            :options="strategyOptions"
            :disabled="disabled || strategyOptions.length === 0"
            data-testid="code-generator-strategy"
          />
        </label>
      </div>

      <NAlert
        v-if="activeTarget?.description || activeStrategy?.description"
        type="info"
        :bordered="false"
      >
        <p v-if="activeTarget?.description">{{ activeTarget.description }}</p>
        <p v-if="activeStrategy?.description">{{ activeStrategy.description }}</p>
      </NAlert>

      <label class="r-code-generator-dialog__field">
        <span>{{ sourceLabel }}</span>
        <NInput
          v-model:value="localSourceText"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 4 }"
          :placeholder="sourcePlaceholder"
          :disabled="disabled"
          data-testid="code-generator-source"
        />
      </label>

      <label class="r-code-generator-dialog__field">
        <span>{{ previewLabel }}</span>
        <NInput
          :value="previewValue"
          readonly
          placeholder="暂无生成结果"
          data-testid="code-generator-preview"
        />
      </label>

      <NAlert v-if="strategyOptions.length === 0" type="warning" :bordered="false">
        当前编码类型没有可用策略。
      </NAlert>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="close">{{ cancelLabel }}</NButton>
        <NButton
          type="primary"
          :disabled="!canApply"
          data-testid="code-generator-apply"
          @click="apply"
        >
          {{ applyLabel }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
  .r-code-generator-dialog {
    width: 60vw;
    min-width: 640px;
    max-width: 960px;
  }

  .r-code-generator-dialog__body {
    display: grid;
    gap: var(--ra-spacing-4, 16px);
  }

  .r-code-generator-dialog__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--ra-spacing-3, 12px);
  }

  .r-code-generator-dialog__field {
    display: grid;
    gap: var(--ra-spacing-2, 8px);
    color: var(--ra-color-text-secondary);
    font-size: var(--ra-font-size-sm);
  }

  .r-code-generator-dialog__field > span {
    font-weight: var(--ra-font-weight-medium, 500);
    color: var(--ra-color-text-primary);
  }

  .r-code-generator-dialog :deep(.n-alert-body__content p) {
    margin: 0;
  }

  .r-code-generator-dialog :deep(.n-alert-body__content p + p) {
    margin-top: var(--ra-spacing-1, 4px);
  }

  @media (max-width: 768px) {
    .r-code-generator-dialog {
      width: 92vw;
      min-width: 0;
    }

    .r-code-generator-dialog__grid {
      grid-template-columns: 1fr;
    }
  }
</style>
