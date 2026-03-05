<script lang="ts" setup>
import { ref, computed, type PropType } from 'vue'
import { NButton, NSpace, NSteps, NStep } from 'naive-ui'
import RFormRenderer from '../form-renderer/RFormRenderer.vue'
import RIcon from '../icon/RIcon.vue'
import type { StepDefinition, StepStatus, StepFormExpose } from './types'

const props = defineProps({
  steps: { type: Array as PropType<StepDefinition[]>, required: true },
  modelValue: { type: Object as PropType<Record<string, unknown>>, required: true },
  currentStep: { type: Number, default: 0 },
  finishButtonLabel: { type: String, default: '完成' },
  nextButtonLabel: { type: String, default: '下一步' },
  prevButtonLabel: { type: String, default: '上一步' },
  submitButtonLabel: { type: String, default: '提交' },
  showStepDescription: { type: Boolean, default: true },
  labelWidth: { type: [Number, String] as PropType<number | string>, default: 100 },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits<{
  'update:modelValue': [values: Record<string, unknown>]
  'update:currentStep': [step: number]
  next: [step: number, values: Record<string, unknown>]
  prev: [step: number]
  finish: [values: Record<string, unknown>]
  stepValidateError: [step: number, error: string]
}>()

const localStep = ref(props.currentStep)
const validating = ref(false)
const stepErrors = ref<Map<number, string>>(new Map())
const localModel = ref<Record<string, unknown>>({ ...props.modelValue })
const finished = ref(false)

const isFirst = computed(() => localStep.value === 0)
const isLast = computed(() => localStep.value === props.steps.length - 1)
const currentStepDef = computed(() => props.steps[localStep.value])

function getStepStatus(index: number): StepStatus {
  if (stepErrors.value.has(index)) return 'error'
  if (index < localStep.value) return 'finish'
  if (index === localStep.value) return 'process'
  return 'wait'
}

function handleModelUpdate(values: Record<string, unknown>): void {
  localModel.value = { ...localModel.value, ...values }
  emit('update:modelValue', { ...localModel.value })
}

async function validateCurrentStep(): Promise<boolean> {
  const step = currentStepDef.value
  if (!step.validate) return true

  validating.value = true
  try {
    const result = await step.validate(localModel.value)
    if (result === true) {
      stepErrors.value.delete(localStep.value)
      return true
    }
    const errorMsg = typeof result === 'string' ? result : '校验失败'
    stepErrors.value.set(localStep.value, errorMsg)
    emit('stepValidateError', localStep.value, errorMsg)
    return false
  } catch (err) {
    const msg = err instanceof Error ? err.message : '校验异常'
    stepErrors.value.set(localStep.value, msg)
    emit('stepValidateError', localStep.value, msg)
    return false
  } finally {
    validating.value = false
  }
}

async function next(): Promise<boolean> {
  const valid = await validateCurrentStep()
  if (!valid) return false

  if (isLast.value) {
    return submit()
  }

  localStep.value++
  emit('update:currentStep', localStep.value)
  emit('next', localStep.value, { ...localModel.value })
  return true
}

function prev(): void {
  if (isFirst.value) return
  localStep.value--
  emit('update:currentStep', localStep.value)
  emit('prev', localStep.value)
}

async function submit(): Promise<boolean> {
  const valid = await validateCurrentStep()
  if (!valid) return false

  finished.value = true
  emit('finish', { ...localModel.value })
  return true
}

function reset(): void {
  localStep.value = 0
  stepErrors.value.clear()
  finished.value = false
  const empty: Record<string, unknown> = {}
  props.steps.forEach((s) => {
    s.schema?.forEach((f) => {
      empty[f.key] = undefined
    })
  })
  localModel.value = empty
  emit('update:modelValue', empty)
  emit('update:currentStep', 0)
}

function goTo(step: number): void {
  if (step < 0 || step >= props.steps.length) return
  if (step > localStep.value) return
  localStep.value = step
  emit('update:currentStep', step)
}

function getCurrentValues(): Record<string, unknown> {
  return { ...localModel.value }
}

const expose: StepFormExpose = { next, prev, reset, submit, goTo, getCurrentValues }
defineExpose(expose)
</script>

<template>
  <div class="r-step-form" data-testid="step-form">
    <!-- Steps indicator -->
    <div class="r-step-form__steps" data-testid="step-indicators">
      <NSteps :current="localStep + 1" size="small">
        <NStep
          v-for="(step, idx) in steps"
          :key="step.key"
          :title="step.title"
          :description="showStepDescription ? step.description : undefined"
          :status="getStepStatus(idx)"
          :data-testid="`step-indicator-${idx}`"
        />
      </NSteps>
    </div>

    <!-- Step error message -->
    <div v-if="stepErrors.has(localStep)" class="r-step-form__error" data-testid="step-error">
      <RIcon name="alert-circle" :size="16" />
      <span>{{ stepErrors.get(localStep) }}</span>
    </div>

    <!-- Step content -->
    <div class="r-step-form__content" data-testid="step-content">
      <template v-if="finished">
        <slot name="finishResult" :values="localModel">
          <div class="r-step-form__finish" data-testid="step-finish">
            <RIcon name="check-circle" :size="48" />
            <h3>提交成功</h3>
            <NButton type="primary" @click="reset">重新填写</NButton>
          </div>
        </slot>
      </template>
      <template v-else>
        <slot
          :name="`step-${currentStepDef.key}`"
          :step="currentStepDef"
          :values="localModel"
          :is-last="isLast"
        >
          <RFormRenderer
            v-if="currentStepDef.schema"
            :schema="currentStepDef.schema"
            :model="localModel"
            :label-width="Number(labelWidth)"
            :disabled="disabled"
            @update:model="handleModelUpdate"
          />
        </slot>
      </template>
    </div>

    <!-- Actions -->
    <div v-if="!finished" class="r-step-form__actions" data-testid="step-actions">
      <slot
        name="actions"
        :current-step="localStep"
        :is-first="isFirst"
        :is-last="isLast"
        :next="next"
        :prev="prev"
        :submit="submit"
      >
        <NSpace>
          <NButton v-if="!isFirst" :disabled="disabled" data-testid="step-prev-btn" @click="prev">
            <template #icon><RIcon name="arrow-left" :size="14" /></template>
            {{ prevButtonLabel }}
          </NButton>
          <NButton
            v-if="!isLast"
            type="primary"
            :loading="validating"
            :disabled="disabled"
            data-testid="step-next-btn"
            @click="next"
          >
            {{ nextButtonLabel }}
            <template #icon><RIcon name="arrow-right" :size="14" /></template>
          </NButton>
          <NButton
            v-if="isLast"
            type="primary"
            :loading="validating"
            :disabled="disabled"
            data-testid="step-submit-btn"
            @click="submit"
          >
            <template #icon><RIcon name="check" :size="14" /></template>
            {{ submitButtonLabel }}
          </NButton>
        </NSpace>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.r-step-form {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-6);
}
.r-step-form__steps {
  padding: var(--ra-spacing-4) var(--ra-spacing-6);
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
}
.r-step-form__error {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
  padding: var(--ra-spacing-3) var(--ra-spacing-4);
  background: var(--ra-color-danger-bg, #fef2f2);
  color: var(--ra-color-danger);
  border-radius: var(--ra-radius-md);
  font-size: var(--ra-font-size-sm);
}
.r-step-form__content {
  min-height: 200px;
  padding: var(--ra-spacing-6);
  background: var(--ra-color-bg-surface);
  border: 1px solid var(--ra-color-border-default);
  border-radius: var(--ra-radius-lg);
}
.r-step-form__actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--ra-spacing-4);
  border-top: 1px solid var(--ra-color-border-default);
}
.r-step-form__finish {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ra-spacing-4);
  padding: var(--ra-spacing-8) 0;
  color: var(--ra-color-success);
}
.r-step-form__finish h3 {
  color: var(--ra-color-text-primary);
  font-size: var(--ra-font-size-lg);
  margin: 0;
}
</style>
