<script lang="ts" setup>
  import { computed, ref, watch } from 'vue'
  import { NInput, NText } from 'naive-ui'
  import { decimalMoneyToMinor, isValidDecimalMoney, minorMoneyToDecimal } from './format'

  const props = withDefaults(
    defineProps<{
      value?: number | null
      currency?: string
      scale?: number
      min?: number
      max?: number
      placeholder?: string
      disabled?: boolean
      size?: 'tiny' | 'small' | 'medium' | 'large'
    }>(),
    {
      value: null,
      currency: 'CNY',
      scale: 2,
      min: 0,
      max: undefined,
      placeholder: '0.00',
      disabled: false,
      size: 'medium',
    },
  )

  const emit = defineEmits<{
    'update:value': [value: number | null]
    'valid-change': [valid: boolean]
  }>()

  const inputValue = ref(minorMoneyToDecimal(props.value, props.scale))
  const focused = ref(false)

  const errorMessage = computed(() => {
    const text = inputValue.value.trim()
    if (!text) return ''
    if (!isValidDecimalMoney(text, props.scale)) {
      return `请输入最多 ${props.scale} 位小数的金额`
    }
    const minor = decimalMoneyToMinor(text, props.scale)
    if (minor === null) return '金额格式不正确'
    if (props.min !== undefined && minor < props.min) {
      return `金额不能小于 ${minorMoneyToDecimal(props.min, props.scale)}`
    }
    if (props.max !== undefined && minor > props.max) {
      return `金额不能大于 ${minorMoneyToDecimal(props.max, props.scale)}`
    }
    return ''
  })

  const valid = computed(() => errorMessage.value === '')

  watch(
    () => [props.value, props.scale] as const,
    ([value, scale]) => {
      if (focused.value) return
      inputValue.value = minorMoneyToDecimal(value, scale)
    },
  )

  watch(valid, (value) => emit('valid-change', value), { immediate: true })

  function handleUpdate(value: string): void {
    inputValue.value = value
    if (value.trim() === '') {
      emit('update:value', null)
      return
    }
    const minor = decimalMoneyToMinor(value, props.scale)
    if (minor === null) return
    if (props.min !== undefined && minor < props.min) return
    if (props.max !== undefined && minor > props.max) return
    emit('update:value', minor)
  }

  function handleBlur(): void {
    focused.value = false
    if (!valid.value) return
    inputValue.value = minorMoneyToDecimal(decimalMoneyToMinor(inputValue.value, props.scale), props.scale)
  }
</script>

<template>
  <div class="r-money-input" data-testid="money-input">
    <NInput
      :value="inputValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :size="size"
      :status="valid ? undefined : 'error'"
      inputmode="decimal"
      @focus="focused = true"
      @blur="handleBlur"
      @update:value="handleUpdate"
    >
      <template #prefix>{{ currency }}</template>
    </NInput>
    <NText v-if="errorMessage" depth="3" type="error" class="r-money-input__error">
      {{ errorMessage }}
    </NText>
  </div>
</template>

<style scoped>
  .r-money-input {
    display: grid;
    gap: var(--ra-spacing-1);
    width: 100%;
  }

  .r-money-input__error {
    font-size: var(--ra-font-size-xs);
    line-height: var(--ra-line-height-tight);
  }
</style>
