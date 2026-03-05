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
import type { FormFieldSchema, FormFieldOption, FormFieldGroup, FormRendererExpose } from './types'

const props = defineProps({
  schema: { type: Array as PropType<FormFieldSchema[]>, required: true },
  model: { type: Object as PropType<Record<string, unknown>>, required: true },
  labelWidth: { type: [Number, String] as PropType<number | string>, default: 'auto' },
  labelPlacement: { type: String as PropType<'left' | 'top'>, default: 'left' },
  cols: { type: Number, default: 1 },
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

function updateField(key: string, value: unknown): void {
  emit('update:model', { ...props.model, [key]: value })
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

function toStrNum(v: unknown): string | number {
  if (typeof v === 'number') return v
  return String(v ?? '')
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
</script>

<template>
  <NForm
    ref="formRef"
    :model="model"
    :rules="naiveRules"
    :label-width="labelWidth"
    :label-placement="labelPlacement"
    :size="size"
    :show-feedback="showFeedback"
    :disabled="disabled"
    @submit.prevent="handleSubmit"
  >
    <!-- Grouped layout -->
    <template v-if="groupedFields">
      <div v-for="gf in groupedFields" :key="gf.group.key" class="r-form-group">
        <slot name="groupHeader" :group="gf.group">
          <div class="r-form-group__header" :class="{ collapsible: gf.group.collapsible }">
            <button
              v-if="gf.group.collapsible"
              class="r-form-group__toggle"
              type="button"
              :aria-expanded="!gf.collapsed"
              @click="toggleGroup(gf.group.key)"
            >
              <span class="r-form-group__arrow" :class="{ collapsed: gf.collapsed }">&#9660;</span>
            </button>
            <h4 class="r-form-group__title">{{ gf.group.title }}</h4>
          </div>
          <p v-if="gf.group.description && !gf.collapsed" class="r-form-group__desc">
            {{ gf.group.description }}
          </p>
        </slot>
        <NGrid v-if="!gf.collapsed" :cols="cols" :x-gap="16" :y-gap="0">
          <NFormItemGi
            v-for="field in gf.fields"
            :key="field.key"
            :label="field.label"
            :path="field.key"
            :span="field.span ?? 1"
          >
            <slot name="fieldPrefix" :field="field" />
            <component :is="'span'" v-if="asyncLoadingMap[field.key]" class="r-form-async-hint"
              >Loading...</component
            >
            <template v-else>
              <NInput
                v-if="field.type === 'input'"
                :value="fieldStr(field.key)"
                :placeholder="field.placeholder"
                :disabled="isFieldDisabled(field)"
                :readonly="readonly"
                @update:value="updateField(field.key, $event)"
              />
              <NInput
                v-else-if="field.type === 'textarea'"
                type="textarea"
                :value="fieldStr(field.key)"
                :placeholder="field.placeholder"
                :disabled="isFieldDisabled(field)"
                :readonly="readonly"
                :rows="3"
                @update:value="updateField(field.key, $event)"
              />
              <NInputNumber
                v-else-if="field.type === 'number'"
                :value="fieldNum(field.key)"
                :placeholder="field.placeholder"
                :disabled="isFieldDisabled(field)"
                :readonly="readonly"
                style="width: 100%"
                @update:value="updateField(field.key, $event)"
              />
              <NSelect
                v-else-if="field.type === 'select'"
                :value="fieldStrNum(field.key)"
                :placeholder="field.placeholder"
                :disabled="isFieldDisabled(field)"
                :options="resolvedOptions(field)"
                @update:value="updateField(field.key, $event)"
              />
              <NRadioGroup
                v-else-if="field.type === 'radio'"
                :value="fieldStrNum(field.key)"
                :disabled="isFieldDisabled(field)"
                @update:value="updateField(field.key, $event)"
              >
                <NRadio
                  v-for="opt in field.options ?? []"
                  :key="String(opt.value)"
                  :value="toStrNum(opt.value)"
                  :disabled="opt.disabled"
                  >{{ opt.label }}</NRadio
                >
              </NRadioGroup>
              <NCheckboxGroup
                v-else-if="field.type === 'checkbox'"
                :value="fieldArr(field.key)"
                :disabled="isFieldDisabled(field)"
                @update:value="updateField(field.key, $event)"
              >
                <NCheckbox
                  v-for="opt in field.options ?? []"
                  :key="String(opt.value)"
                  :value="toStrNum(opt.value)"
                  :disabled="opt.disabled"
                  :label="opt.label"
                />
              </NCheckboxGroup>
              <NSwitch
                v-else-if="field.type === 'switch'"
                :value="fieldBool(field.key)"
                :disabled="isFieldDisabled(field)"
                @update:value="updateField(field.key, $event)"
              />
              <NDatePicker
                v-else-if="field.type === 'date'"
                type="date"
                :value="fieldNum(field.key)"
                :placeholder="field.placeholder"
                :disabled="isFieldDisabled(field)"
                style="width: 100%"
                @update:value="updateField(field.key, $event)"
              />
              <NDatePicker
                v-else-if="field.type === 'daterange'"
                type="daterange"
                :value="fieldDateRange(field.key)"
                :disabled="isFieldDisabled(field)"
                style="width: 100%"
                @update:value="updateField(field.key, $event)"
              />
              <RCheckButtonGroup
                v-else-if="field.type === 'button-group'"
                :model-value="fieldButtonGroupValue(field.key)"
                :options="resolvedOptions(field)"
                :multiple="!!field.buttonGroupMultiple"
                :disabled="isFieldDisabled(field)"
                :size="size"
                @update:model-value="updateField(field.key, $event)"
              />
              <component
                :is="field.component"
                v-else-if="field.type === 'custom' && field.component"
                :model-value="model[field.key]"
                v-bind="field.componentProps"
                @update:model-value="updateField(field.key, $event)"
              />
            </template>
            <slot name="fieldSuffix" :field="field" />
          </NFormItemGi>
        </NGrid>
      </div>
      <!-- Ungrouped fields -->
      <NGrid v-if="ungroupedFields.length > 0" :cols="cols" :x-gap="16" :y-gap="0">
        <NFormItemGi
          v-for="field in ungroupedFields"
          :key="field.key"
          :label="field.label"
          :path="field.key"
          :span="field.span ?? 1"
        >
          <slot name="fieldPrefix" :field="field" />
          <NInput
            v-if="field.type === 'input'"
            :value="fieldStr(field.key)"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
            :readonly="readonly"
            @update:value="updateField(field.key, $event)"
          />
          <NSelect
            v-else-if="field.type === 'select'"
            :value="fieldStrNum(field.key)"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
            :options="resolvedOptions(field)"
            @update:value="updateField(field.key, $event)"
          />
          <slot name="fieldSuffix" :field="field" />
        </NFormItemGi>
      </NGrid>
    </template>

    <!-- Flat layout (default) -->
    <NGrid v-else :cols="cols" :x-gap="16" :y-gap="0">
      <NFormItemGi
        v-for="field in visibleFields"
        :key="field.key"
        :label="field.label"
        :path="field.key"
        :span="field.span ?? 1"
      >
        <slot name="fieldPrefix" :field="field" />
        <component :is="'span'" v-if="asyncLoadingMap[field.key]" class="r-form-async-hint"
          >Loading...</component
        >
        <template v-else>
          <NInput
            v-if="field.type === 'input'"
            :value="fieldStr(field.key)"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
            :readonly="readonly"
            @update:value="updateField(field.key, $event)"
          />
          <NInput
            v-else-if="field.type === 'textarea'"
            type="textarea"
            :value="fieldStr(field.key)"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
            :readonly="readonly"
            :rows="3"
            @update:value="updateField(field.key, $event)"
          />
          <NInputNumber
            v-else-if="field.type === 'number'"
            :value="fieldNum(field.key)"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
            :readonly="readonly"
            style="width: 100%"
            @update:value="updateField(field.key, $event)"
          />
          <NSelect
            v-else-if="field.type === 'select'"
            :value="fieldStrNum(field.key)"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
            :options="resolvedOptions(field)"
            @update:value="updateField(field.key, $event)"
          />
          <NRadioGroup
            v-else-if="field.type === 'radio'"
            :value="fieldStrNum(field.key)"
            :disabled="isFieldDisabled(field)"
            @update:value="updateField(field.key, $event)"
          >
            <NRadio
              v-for="opt in field.options ?? []"
              :key="String(opt.value)"
              :value="toStrNum(opt.value)"
              :disabled="opt.disabled"
              >{{ opt.label }}</NRadio
            >
          </NRadioGroup>
          <NCheckboxGroup
            v-else-if="field.type === 'checkbox'"
            :value="fieldArr(field.key)"
            :disabled="isFieldDisabled(field)"
            @update:value="updateField(field.key, $event)"
          >
            <NCheckbox
              v-for="opt in field.options ?? []"
              :key="String(opt.value)"
              :value="toStrNum(opt.value)"
              :disabled="opt.disabled"
              :label="opt.label"
            />
          </NCheckboxGroup>
          <NSwitch
            v-else-if="field.type === 'switch'"
            :value="fieldBool(field.key)"
            :disabled="isFieldDisabled(field)"
            @update:value="updateField(field.key, $event)"
          />
          <NDatePicker
            v-else-if="field.type === 'date'"
            type="date"
            :value="fieldNum(field.key)"
            :placeholder="field.placeholder"
            :disabled="isFieldDisabled(field)"
            style="width: 100%"
            @update:value="updateField(field.key, $event)"
          />
          <NDatePicker
            v-else-if="field.type === 'daterange'"
            type="daterange"
            :value="fieldDateRange(field.key)"
            :disabled="isFieldDisabled(field)"
            style="width: 100%"
            @update:value="updateField(field.key, $event)"
          />
          <RCheckButtonGroup
            v-else-if="field.type === 'button-group'"
            :model-value="fieldButtonGroupValue(field.key)"
            :options="resolvedOptions(field)"
            :multiple="!!field.buttonGroupMultiple"
            :disabled="isFieldDisabled(field)"
            :size="size"
            @update:model-value="updateField(field.key, $event)"
          />
          <component
            :is="field.component"
            v-else-if="field.type === 'custom' && field.component"
            :model-value="model[field.key]"
            v-bind="field.componentProps"
            @update:model-value="updateField(field.key, $event)"
          />
        </template>
        <slot name="fieldSuffix" :field="field" />
      </NFormItemGi>
    </NGrid>

    <slot name="actions">
      <NSpace justify="end" style="margin-top: 16px">
        <NButton attr-type="button" @click="handleReset">重置</NButton>
        <NButton type="primary" attr-type="submit">提交</NButton>
      </NSpace>
    </slot>
  </NForm>
</template>

<style scoped>
.r-form-group {
  margin-bottom: var(--ra-spacing-4, 16px);
}
.r-form-group__header {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2, 8px);
  margin-bottom: var(--ra-spacing-3, 12px);
  padding-bottom: var(--ra-spacing-2, 8px);
  border-bottom: 1px solid var(--ra-color-border-light, #f0f0f0);
}
.r-form-group__toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  color: var(--ra-color-text-tertiary, #999);
  font-size: 12px;
}
.r-form-group__arrow {
  display: inline-block;
  transition: transform 0.2s;
}
.r-form-group__arrow.collapsed {
  transform: rotate(-90deg);
}
.r-form-group__title {
  margin: 0;
  font-size: var(--ra-font-size-base, 14px);
  font-weight: 600;
  color: var(--ra-color-text-primary, #333);
}
.r-form-group__desc {
  margin: 0 0 var(--ra-spacing-2, 8px);
  font-size: var(--ra-font-size-xs, 12px);
  color: var(--ra-color-text-tertiary, #999);
}
.r-form-async-hint {
  font-size: var(--ra-font-size-xs, 12px);
  color: var(--ra-color-text-tertiary, #999);
}
</style>
