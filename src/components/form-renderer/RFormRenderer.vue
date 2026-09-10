<script lang="ts" setup>
  import { computed, ref, reactive, watch, onMounted, type PropType } from 'vue'
  import {
    NForm,
    NGrid,
    NFormItemGi,
    NInput,
    NInputNumber,
    NSelect,
    NRadioGroup,
    NRadio,
    NCheckboxGroup,
    NCheckbox,
    NSwitch,
    NDatePicker,
    NButton,
    NSpace,
    type FormRules,
  } from 'naive-ui'
  import { RCheckButtonGroup } from '../check-button-group'
  import type {
    FormFieldSchema,
    FormFieldOption,
    FormFieldGroup,
    FormRendererExpose,
  } from './types'
  import RStorageIdField from './RStorageIdField.vue'
  import RTextareaField from './RTextareaField.vue'

  const props = defineProps({
    schema: { type: Array as PropType<FormFieldSchema[]>, required: true },
    model: { type: Object as PropType<Record<string, unknown>>, required: true },
    labelWidth: { type: [Number, String] as PropType<number | string>, default: 'auto' },
    labelPlacement: { type: String as PropType<'left' | 'top'>, default: 'left' },
    cols: { type: Number, default: 1 },
    rowGap: { type: Number, default: 12 },
    columnGap: { type: Number, default: 16 },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'medium' },
    showFeedback: { type: Boolean, default: true },
    groups: { type: Array as PropType<FormFieldGroup[]>, default: undefined },
  })

  const emit = defineEmits<{
    'update:model': [model: Record<string, unknown>]
    submit: [model: Record<string, unknown>]
    reset: []
  }>()

  const formRef = ref<InstanceType<typeof NForm> | null>(null)
  const asyncOptionsMap = reactive<Record<string, FormFieldOption[]>>({})
  const asyncLoadingMap = reactive<Record<string, boolean>>({})
  const schemaPatchMap = reactive<Record<string, Partial<FormFieldSchema>>>({})
  const collapsedGroups = reactive<Record<string, boolean>>({})
  let latestModel: Record<string, unknown> = { ...props.model }

  watch(
    () => props.model,
    (model) => {
      latestModel = { ...model }
    },
    { deep: true },
  )

  const effectiveSchema = computed(() =>
    props.schema.map((field) => {
      const patch = schemaPatchMap[field.key]
      return patch ? { ...field, ...patch } : field
    }),
  )

  const visibleFields = computed(() =>
    effectiveSchema.value.filter((field) => {
      if (typeof field.hidden === 'function') return !field.hidden(props.model)
      return !field.hidden
    }),
  )

  const groupedFields = computed(() => {
    if (!props.groups?.length) return null
    const fieldMap = new Map(visibleFields.value.map((f) => [f.key, f]))
    return props.groups.map((g) => ({
      group: g,
      fields: g.fields.map((k) => fieldMap.get(k)).filter(Boolean) as FormFieldSchema[],
      collapsed: collapsedGroups[g.key] ?? g.defaultCollapsed ?? false,
    }))
  })

  const ungroupedFields = computed(() => {
    if (!props.groups?.length) return visibleFields.value
    const groupedKeys = new Set(props.groups.flatMap((g) => g.fields))
    return visibleFields.value.filter((f) => !groupedKeys.has(f.key))
  })

  const naiveRules = computed<FormRules>(() => {
    const rules: FormRules = {}
    for (const field of effectiveSchema.value) {
      if (!field.rules?.length) continue
      rules[field.key] = field.rules.map((r) => ({
        required: r.required,
        message: r.message,
        trigger: r.trigger ?? 'blur',
        min: r.min,
        max: r.max,
        pattern: r.pattern,
        validator: r.validator
          ? (_rule: unknown, value: unknown) => {
              const result = r.validator!(value)
              if (result instanceof Promise) {
                return result.then((v) => {
                  if (v !== true) {
                    throw new Error(typeof v === 'string' ? v : (r.message ?? 'Validation failed'))
                  }
                })
              }
              if (result === true) return undefined
              return new Error(
                typeof result === 'string' ? result : (r.message ?? 'Validation failed'),
              )
            }
          : undefined,
      }))
    }
    return rules
  })

  async function loadAsyncOptions(field: FormFieldSchema): Promise<void> {
    if (!field.asyncOptions) return
    asyncLoadingMap[field.key] = true
    try {
      const options = await field.asyncOptions(props.model)
      asyncOptionsMap[field.key] = options
    } catch {
      asyncOptionsMap[field.key] = []
    } finally {
      asyncLoadingMap[field.key] = false
    }
  }

  onMounted(() => {
    for (const field of props.schema) {
      if (field.asyncOptions) loadAsyncOptions(field)
    }
    for (const g of props.groups ?? []) {
      if (g.defaultCollapsed) collapsedGroups[g.key] = true
    }
  })

  for (const field of props.schema) {
    if (field.dependency) {
      const depFields = field.dependency.fields
      watch(
        () => depFields.map((k) => props.model[k]),
        () => {
          const depValues: Record<string, unknown> = {}
          for (const k of depFields) depValues[k] = props.model[k]
          const patch = field.dependency!.effect(depValues, field)
          if (patch) schemaPatchMap[field.key] = { ...schemaPatchMap[field.key], ...patch }
          if (field.asyncOptions) loadAsyncOptions(field)
        },
        { deep: true },
      )
    }
  }

  function isFieldDisabled(field: FormFieldSchema): boolean {
    if (props.disabled) return true
    if (typeof field.disabled === 'function') return field.disabled(props.model)
    return !!field.disabled
  }

  function isFieldClearable(field: FormFieldSchema): boolean {
    return !!field.clearable && !props.readonly && !isFieldDisabled(field)
  }

  function updateField(key: string, value: unknown): void {
    latestModel = { ...latestModel, [key]: value }
    emit('update:model', { ...latestModel })
  }

  function fieldStr(key: string): string {
    const v = props.model[key]
    return typeof v === 'string' ? v : ''
  }

  function fieldNum(key: string): number | null {
    const v = props.model[key]
    return typeof v === 'number' ? v : null
  }

  function fieldBool(key: string): boolean {
    return !!props.model[key]
  }

  function fieldStrNum(key: string): string | number | null {
    const v = props.model[key]
    if (typeof v === 'string' || typeof v === 'number') return v
    return null
  }

  function fieldArr(key: string): Array<string | number> {
    const v = props.model[key]
    return Array.isArray(v) ? (v as Array<string | number>) : []
  }

  function fieldDateRange(key: string): [number, number] | null {
    const v = props.model[key]
    return Array.isArray(v) && v.length === 2 ? (v as [number, number]) : null
  }

  function fieldButtonGroupValue(key: string): (string | number)[] | string | number | null {
    const v = props.model[key]
    if (Array.isArray(v)) return v as (string | number)[]
    if (typeof v === 'string' || typeof v === 'number') return v
    return null
  }

  function isUploadField(field: FormFieldSchema): boolean {
    return field.type === 'upload' || field.type === 'storage_id'
  }

  function toStrNum(v: unknown): string | number {
    if (typeof v === 'number') return v
    return String(v ?? '')
  }

  function customComponentListeners(
    field: FormFieldSchema,
  ): Record<string, (value: unknown) => void> {
    const listeners: Record<string, (value: unknown) => void> = {
      'update:modelValue': (value) => updateField(field.key, value),
      'update:value': (value) => updateField(field.key, value),
    }
    for (const [eventName, targetKey] of Object.entries(field.componentEventMap ?? {})) {
      listeners[eventName] = (value) => updateField(targetKey, value)
    }
    return listeners
  }

  function resolvedOptions(
    field: FormFieldSchema,
  ): Array<{ label: string; value: string | number; disabled?: boolean }> {
    const opts = asyncOptionsMap[field.key] ?? field.options ?? []
    return opts.map((o) => ({
      label: o.label,
      value: toStrNum(o.value),
      disabled: o.disabled,
    }))
  }

  async function handleSubmit(e?: Event): Promise<void> {
    e?.preventDefault()
    try {
      await formRef.value?.validate()
      emit('submit', { ...props.model })
    } catch {
      // validation failed
    }
  }

  function handleReset(): void {
    const defaults: Record<string, unknown> = {}
    for (const field of props.schema) {
      defaults[field.key] = field.defaultValue ?? null
    }
    emit('update:model', defaults)
    emit('reset')
  }

  function toggleGroup(key: string): void {
    collapsedGroups[key] = !collapsedGroups[key]
  }

  const expose: FormRendererExpose = {
    validate: async () => {
      try {
        await formRef.value?.validate()
        return true
      } catch {
        return false
      }
    },
    resetFields: handleReset,
    getValues: () => ({ ...props.model }),
    setValues: (values) => emit('update:model', { ...props.model, ...values }),
    clearValidate: () => {
      formRef.value?.restoreValidation()
    },
    patchField: (key, patch) => {
      schemaPatchMap[key] = { ...schemaPatchMap[key], ...patch }
    },
    reloadOptions: async (key) => {
      const field = props.schema.find((f) => f.key === key)
      if (field) await loadAsyncOptions(field)
    },
  }

  defineExpose(expose)
void [NButton, NCheckbox, NCheckboxGroup, NDatePicker, NFormItemGi, NGrid, NInput, NInputNumber, NRadio, NRadioGroup, NSelect, NSpace, NSwitch, RCheckButtonGroup, RStorageIdField, RTextareaField, customComponentListeners, fieldArr, fieldBool, fieldButtonGroupValue, fieldDateRange, fieldNum, fieldStr, fieldStrNum, groupedFields, handleSubmit, isFieldClearable, isUploadField, naiveRules, resolvedOptions, toggleGroup, ungroupedFields]
</script>

<template src="./RFormRenderer.template.html"></template>

