<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { NDrawer, NDrawerContent, NButton, NSpace, NSpin } from 'naive-ui'
import type { FormFieldSchema } from '../form-renderer/types'
import type { DrawerPlacement, DrawerWidth } from './types'
import { RFormRenderer } from '../form-renderer'
import { RIcon } from '../icon'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title: string
    schema: FormFieldSchema[]
    model: Record<string, unknown>
    placement?: DrawerPlacement
    width?: DrawerWidth
    loading?: boolean
    submitText?: string
    cancelText?: string
    showFooter?: boolean
    closeOnMaskClick?: boolean
    labelWidth?: number
    labelPlacement?: 'left' | 'top'
  }>(),
  {
    placement: 'right',
    width: 'medium',
    loading: false,
    submitText: 'Submit',
    cancelText: 'Cancel',
    showFooter: true,
    closeOnMaskClick: true,
    labelWidth: 100,
    labelPlacement: 'left',
  },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:model': [value: Record<string, unknown>]
  submit: [model: Record<string, unknown>]
  cancel: []
}>()

const formRef = ref<InstanceType<typeof RFormRenderer> | null>(null)
const submitting = ref(false)

const widthMap: Record<string, string> = {
  small: '400px',
  medium: '560px',
  large: '720px',
  full: '100%',
}

const computedWidth = computed(() => {
  if (typeof props.width === 'number') {
    return `${props.width}px`
  }
  return widthMap[props.width] ?? '560px'
})

function handleClose(): void {
  emit('update:visible', false)
  emit('cancel')
}

function handleMaskClick(): void {
  if (props.closeOnMaskClick && !submitting.value) {
    handleClose()
  }
}

function handleModelChange(newModel: Record<string, unknown>): void {
  emit('update:model', newModel)
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  
  submitting.value = true
  try {
    const isValid = await formRef.value.validate()
    if (isValid) {
      emit('submit', props.model)
    }
  } finally {
    submitting.value = false
  }
}

function validate(): Promise<boolean> {
  return formRef.value?.validate() ?? Promise.resolve(false)
}

function resetFields(): void {
  formRef.value?.resetFields()
}

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      submitting.value = false
    }
  },
)

defineExpose({
  validate,
  resetFields,
})
</script>

<template>
  <NDrawer
    :show="visible"
    :width="computedWidth"
    :placement="placement"
    :mask-closable="closeOnMaskClick"
    :close-on-esc="!submitting"
    @update:show="emit('update:visible', $event)"
    @mask-click="handleMaskClick"
  >
    <NDrawerContent :closable="!submitting" @close="handleClose">
      <template #header>
        <div class="r-drawer-form__header" data-testid="drawer-form-header">
          <h3 class="r-drawer-form__title">{{ title }}</h3>
        </div>
      </template>

      <div class="r-drawer-form__body" data-testid="drawer-form-body">
        <NSpin :show="loading">
          <RFormRenderer
            ref="formRef"
            :schema="schema"
            :model="model"
            :label-width="labelWidth"
            :label-placement="labelPlacement"
            @update:model="handleModelChange"
          />
          <slot />
        </NSpin>
      </div>

      <template v-if="showFooter" #footer>
        <div class="r-drawer-form__footer" data-testid="drawer-form-footer">
          <NSpace justify="end">
            <NButton
              :disabled="submitting"
              data-testid="drawer-form-cancel"
              @click="handleClose"
            >
              <template #icon>
                <RIcon name="x" size="sm" />
              </template>
              {{ cancelText }}
            </NButton>
            <NButton
              type="primary"
              :loading="submitting"
              :disabled="loading"
              data-testid="drawer-form-submit"
              @click="handleSubmit"
            >
              <template #icon>
                <RIcon name="check" size="sm" />
              </template>
              {{ submitText }}
            </NButton>
          </NSpace>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.r-drawer-form__header {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-3);
}

.r-drawer-form__title {
  margin: 0;
  font-size: var(--ra-font-size-lg);
  font-weight: var(--ra-font-weight-semibold);
  color: var(--ra-color-text-primary);
}

.r-drawer-form__body {
  padding: var(--ra-spacing-2) 0;
}

.r-drawer-form__footer {
  padding-top: var(--ra-spacing-2);
  border-top: 1px solid var(--ra-color-border-light);
}
</style>
