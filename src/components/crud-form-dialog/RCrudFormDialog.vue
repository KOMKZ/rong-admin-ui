<script lang="ts" setup>
import { ref, computed, type PropType } from 'vue'
import { default as RModalDialog } from '../modal-dialog/RModalDialog.vue'
import { default as RFormRenderer } from '../form-renderer/RFormRenderer.vue'
import type { FormFieldSchema, FormRendererExpose } from '../form-renderer/types'
import type { CrudMode, CrudFormDialogExpose } from './types'

const props = defineProps({
  visible: { type: Boolean, required: true },
  mode: { type: String as PropType<CrudMode>, default: 'create' },
  schema: { type: Array as PropType<FormFieldSchema[]>, required: true },
  model: { type: Object as PropType<Record<string, unknown>>, required: true },
  title: { type: String, default: undefined },
  width: { type: [Number, String] as PropType<number | string>, default: 560 },
  loading: { type: Boolean, default: false },
  labelWidth: { type: [Number, String] as PropType<number | string>, default: 'auto' },
  cols: { type: Number, default: 1 },
})

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'update:model': [model: Record<string, unknown>]
  submit: [model: Record<string, unknown>, mode: CrudMode]
  cancel: []
}>()

const formRef = ref<FormRendererExpose | null>(null)

const modeLabels: Record<CrudMode, string> = {
  create: '新增',
  edit: '编辑',
  view: '查看',
}

const dialogTitle = computed(() => props.title ?? modeLabels[props.mode])

const isReadonly = computed(() => props.mode === 'view')

const positiveText = computed(() =>
  isReadonly.value ? undefined : props.mode === 'create' ? '创建' : '保存',
)

async function handleConfirm(): Promise<void> {
  if (isReadonly.value) {
    emit('update:visible', false)
    return
  }
  const valid = await formRef.value?.validate()
  if (valid) {
    emit('submit', { ...props.model }, props.mode)
  }
}

function handleCancel(): void {
  emit('update:visible', false)
  emit('cancel')
}

const expose: CrudFormDialogExpose = {
  open: (_mode: CrudMode, model?: Record<string, unknown>) => {
    if (model) emit('update:model', { ...model })
    emit('update:visible', true)
  },
  close: () => {
    emit('update:visible', false)
  },
  validate: async () => {
    return (await formRef.value?.validate()) ?? false
  },
  getFormRef: () => formRef.value,
}

defineExpose(expose)
</script>

<template>
  <RModalDialog
    :visible="visible"
    :title="dialogTitle"
    :width="width"
    :loading="loading"
    :positive-text="positiveText ?? '确认'"
    :negative-text="isReadonly ? '关闭' : '取消'"
    :show-footer="true"
    @update:visible="(v: boolean) => emit('update:visible', v)"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <RFormRenderer
      ref="formRef"
      :schema="schema"
      :model="model"
      :disabled="isReadonly"
      :label-width="labelWidth"
      :cols="cols"
      @update:model="(m: Record<string, unknown>) => emit('update:model', m)"
    >
      <template #actions><span /></template>
    </RFormRenderer>
  </RModalDialog>
</template>
