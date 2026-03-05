<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { NDrawer, NDrawerContent, NButton, NSpace, NSpin } from 'naive-ui'
import type { FormFieldSchema } from '../form-renderer/types'
import type { DrawerPlacement, DrawerWidth, DrawerFormError } from './types'
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
    retryText?: string
    showFooter?: boolean
    closeOnMaskClick?: boolean
    labelWidth?: number
    labelPlacement?: 'left' | 'top'
    asyncValidator?: (model: Record<string, unknown>) => Promise<DrawerFormError[]>
  }>(),
  {
    placement: 'right',
    width: 'medium',
    loading: false,
    submitText: 'Submit',
    cancelText: 'Cancel',
    retryText: 'Retry',
    showFooter: true,
    closeOnMaskClick: true,
    labelWidth: 100,
    labelPlacement: 'left',
    asyncValidator: undefined,
  },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:model': [value: Record<string, unknown>]
  submit: [model: Record<string, unknown>]
  cancel: []
  retry: []
}>()

const formRef = ref<InstanceType<typeof RFormRenderer> | null>(null)
const submitting = ref(false)
const submitErrors = ref<DrawerFormError[]>([])
const hasSubmitFailed = ref(false)

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
  if (submitErrors.value.length > 0) {
    submitErrors.value = []
  }
  emit('update:model', newModel)
}

function clearErrors(): void {
  submitErrors.value = []
  hasSubmitFailed.value = false
}

async function handleSubmit(): Promise<void> {
  if (!formRef.value) return

  submitErrors.value = []
  submitting.value = true
  try {
    const isValid = await formRef.value.validate()
    if (!isValid) return

    if (props.asyncValidator) {
      const errors = await props.asyncValidator(props.model)
      if (errors.length > 0) {
        submitErrors.value = errors
        hasSubmitFailed.value = true
        return
      }
    }

    hasSubmitFailed.value = false
    emit('submit', props.model)
  } catch (err) {
    hasSubmitFailed.value = true
    submitErrors.value = [
      { message: err instanceof Error ? err.message : 'Submission failed. Please try again.' },
    ]
  } finally {
    submitting.value = false
  }
}

async function handleRetry(): Promise<void> {
  emit('retry')
  await handleSubmit()
}

function validate(): Promise<boolean> {
  return formRef.value?.validate() ?? Promise.resolve(false)
}

function resetFields(): void {
  formRef.value?.resetFields()
  clearErrors()
}

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      submitting.value = false
      submitErrors.value = []
      hasSubmitFailed.value = false
    }
  },
)

defineExpose({
  validate,
  resetFields,
  clearErrors,
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
        <div
          v-if="submitErrors.length > 0"
          class="r-drawer-form__error-summary"
          role="alert"
          data-testid="drawer-form-errors"
        >
          <div class="r-drawer-form__error-header">
            <RIcon name="alert-circle" size="sm" />
            <span
              >{{ submitErrors.length }} error{{
                submitErrors.length > 1 ? 's' : ''
              }}
              occurred</span
            >
          </div>
          <ul class="r-drawer-form__error-list">
            <li v-for="(error, idx) in submitErrors" :key="idx" class="r-drawer-form__error-item">
              <strong v-if="error.field">{{ error.field }}:</strong>
              {{ error.message }}
            </li>
          </ul>
        </div>

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
            <NButton :disabled="submitting" data-testid="drawer-form-cancel" @click="handleClose">
              <template #icon>
                <RIcon name="x" size="sm" />
              </template>
              {{ cancelText }}
            </NButton>
            <NButton
              v-if="hasSubmitFailed"
              type="warning"
              :loading="submitting"
              :disabled="loading"
              data-testid="drawer-form-retry"
              @click="handleRetry"
            >
              <template #icon>
                <RIcon name="refresh-cw" size="sm" />
              </template>
              {{ retryText }}
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

.r-drawer-form__error-summary {
  margin-bottom: var(--ra-spacing-4);
  padding: var(--ra-spacing-3) var(--ra-spacing-4);
  background: var(--ra-color-danger-bg);
  border: 1px solid var(--ra-color-danger);
  border-radius: var(--ra-radius-md);
}

.r-drawer-form__error-header {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  color: var(--ra-color-danger-text);
  font-weight: var(--ra-font-weight-semibold);
  font-size: var(--ra-font-size-sm);
  margin-bottom: var(--ra-spacing-2);
}

.r-drawer-form__error-list {
  margin: 0;
  padding-left: var(--ra-spacing-5);
  list-style-type: disc;
}

.r-drawer-form__error-item {
  font-size: var(--ra-font-size-sm);
  color: var(--ra-color-danger-text);
  line-height: var(--ra-line-height-relaxed);
}

.r-drawer-form__footer {
  padding-top: var(--ra-spacing-2);
  border-top: 1px solid var(--ra-color-border-light);
}
</style>
