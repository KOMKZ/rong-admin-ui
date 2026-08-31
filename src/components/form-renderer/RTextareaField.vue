<script lang="ts" setup>
  import { computed } from 'vue'
  import { NButton, NInput, NModal, NTooltip } from 'naive-ui'
  import { RIcon } from '../icon'
  import type { FormFieldSchema } from './types'

  const props = defineProps<{
    field: FormFieldSchema
    modelValue: unknown
    disabled?: boolean
    readonly?: boolean
    clearable?: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: string]
  }>()

  const expanded = defineModel<boolean>('expanded', { default: false })

  const value = computed({
    get: () => (typeof props.modelValue === 'string' ? props.modelValue : ''),
    set: (next: string) => emit('update:modelValue', next),
  })

  function openExpandedEditor(): void {
    if (props.disabled) return
    expanded.value = true
  }
</script>

<template>
  <div class="r-textarea-field">
    <NInput
      v-model:value="value"
      class="r-textarea-field__input"
      type="textarea"
      :placeholder="field.placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :clearable="clearable"
      :rows="3"
    />
    <NTooltip>
      <template #trigger>
        <NButton
          class="r-textarea-field__expand"
          type="default"
          size="tiny"
          circle
          secondary
          :disabled="disabled"
          :aria-label="`放大编辑${field.label}`"
          data-testid="textarea-expand"
          @click="openExpandedEditor"
        >
          <template #icon>
            <RIcon name="maximize-2" :size="14" />
          </template>
        </NButton>
      </template>
      放大编辑
    </NTooltip>

    <NModal
      v-model:show="expanded"
      preset="card"
      class="r-textarea-field__modal"
      :title="field.label"
      style="width: min(960px, calc(100vw - 32px))"
    >
      <NInput
        v-model:value="value"
        class="r-textarea-field__modal-input"
        type="textarea"
        :placeholder="field.placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :clearable="clearable"
        :autosize="{ minRows: 18, maxRows: 28 }"
      />
    </NModal>
  </div>
</template>

<style scoped>
  .r-textarea-field {
    position: relative;
    width: 100%;
  }

  .r-textarea-field__input {
    width: 100%;
  }

  .r-textarea-field__input :deep(.n-input__textarea-el) {
    padding-right: var(--ra-spacing-10, 40px);
  }

  .r-textarea-field__expand {
    position: absolute;
    top: var(--ra-spacing-2, 8px);
    right: var(--ra-spacing-2, 8px);
    z-index: 1;
  }

  .r-textarea-field__modal-input {
    width: 100%;
  }
</style>
