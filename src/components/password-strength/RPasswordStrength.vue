<script lang="ts">
import type { PasswordRule } from './types'

const DEFAULT_RULES: PasswordRule[] = [
  { key: 'length', label: '至少 8 个字符', test: (v) => v.length >= 8 },
  { key: 'uppercase', label: '包含大写字母', test: (v) => /[A-Z]/.test(v) },
  { key: 'lowercase', label: '包含小写字母', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: '包含数字', test: (v) => /\d/.test(v) },
  { key: 'special', label: '包含特殊字符', test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
]
</script>

<script lang="ts" setup>
import { computed, ref, type PropType } from 'vue'
import { NInput } from 'naive-ui'
import { RIcon } from '../icon'
import type { PasswordStrengthLevel } from './types'

const inputRef = ref<InstanceType<typeof NInput> | null>(null)

const props = defineProps({
  modelValue: { type: String, required: true },
  rules: { type: Array as PropType<PasswordRule[]>, default: () => DEFAULT_RULES },
  showRules: { type: Boolean, default: true },
  showScore: { type: Boolean, default: false },
  showLevel: { type: Boolean, default: true },
  minLength: { type: Number, default: 6 },
  maxLength: { type: Number, default: 64 },
  placeholder: { type: String, default: '请输入密码' },
  disabled: { type: Boolean, default: false },
  size: { type: String as PropType<'small' | 'medium' | 'large'>, default: 'medium' },
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  levelChange: [level: PasswordStrengthLevel, score: number]
}>()

const passedRules = computed(() => props.rules.filter((r) => r.test(props.modelValue)))
const score = computed(() => {
  if (!props.modelValue) return 0
  return Math.round((passedRules.value.length / props.rules.length) * 100)
})

const level = computed<PasswordStrengthLevel>(() => {
  const s = score.value
  if (s <= 0) return 'weak'
  if (s <= 25) return 'weak'
  if (s <= 50) return 'fair'
  if (s <= 75) return 'good'
  if (s < 100) return 'strong'
  return 'excellent'
})

const levelLabels: Record<PasswordStrengthLevel, string> = {
  weak: '弱',
  fair: '一般',
  good: '良好',
  strong: '强',
  excellent: '极强',
}

function handleUpdate(value: string): void {
  emit('update:modelValue', value)
  const newScore = props.rules.filter((r) => r.test(value)).length
  const pct = Math.round((newScore / props.rules.length) * 100)
  const lv: PasswordStrengthLevel =
    pct <= 0
      ? 'weak'
      : pct <= 25
        ? 'weak'
        : pct <= 50
          ? 'fair'
          : pct <= 75
            ? 'good'
            : pct < 100
              ? 'strong'
              : 'excellent'
  emit('levelChange', lv, pct)
}

defineExpose({
  getLevel: () => level.value,
  getScore: () => score.value,
  getPassedRules: () => passedRules.value.map((r) => r.key),
  focus: () => {
    inputRef.value?.focus()
  },
})
</script>

<template>
  <div class="r-password-strength" data-testid="password-strength">
    <NInput
      ref="inputRef"
      type="password"
      show-password-on="click"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :size="size"
      :minlength="minLength"
      :maxlength="maxLength"
      data-testid="password-input"
      @update:value="handleUpdate"
    />

    <div v-if="modelValue" class="r-password-strength__bar" data-testid="strength-bar">
      <div class="r-password-strength__track">
        <div
          class="r-password-strength__fill"
          :class="`r-password-strength__fill--${level}`"
          :style="{ width: `${score}%` }"
        />
      </div>
      <span
        v-if="showLevel"
        class="r-password-strength__level"
        :class="`r-password-strength__level--${level}`"
        data-testid="strength-level"
      >
        {{ levelLabels[level] }}
      </span>
      <span v-if="showScore" class="r-password-strength__score" data-testid="strength-score">
        {{ score }}%
      </span>
    </div>

    <ul
      v-if="showRules && modelValue"
      class="r-password-strength__rules"
      data-testid="strength-rules"
    >
      <li
        v-for="rule in rules"
        :key="rule.key"
        class="r-password-strength__rule"
        :class="{ 'r-password-strength__rule--pass': rule.test(modelValue) }"
      >
        <RIcon :name="rule.test(modelValue) ? 'check-circle' : 'circle'" size="xs" />
        <span>{{ rule.label }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.r-password-strength {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-2);
}
.r-password-strength__bar {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-2);
}
.r-password-strength__track {
  flex: 1;
  height: 4px;
  background: var(--ra-color-bg-muted);
  border-radius: var(--ra-radius-full);
  overflow: hidden;
}
.r-password-strength__fill {
  height: 100%;
  border-radius: var(--ra-radius-full);
  transition:
    width var(--ra-transition-normal),
    background var(--ra-transition-normal);
}
.r-password-strength__fill--weak {
  background: var(--ra-color-danger-text);
}
.r-password-strength__fill--fair {
  background: var(--ra-color-warning-text);
}
.r-password-strength__fill--good {
  background: var(--ra-color-brand-primary);
}
.r-password-strength__fill--strong {
  background: var(--ra-color-success-text);
}
.r-password-strength__fill--excellent {
  background: var(--ra-color-success-text);
}
.r-password-strength__level {
  font-size: var(--ra-font-size-xs);
  font-weight: var(--ra-font-weight-medium);
  white-space: nowrap;
}
.r-password-strength__level--weak {
  color: var(--ra-color-danger-text);
}
.r-password-strength__level--fair {
  color: var(--ra-color-warning-text);
}
.r-password-strength__level--good {
  color: var(--ra-color-brand-primary);
}
.r-password-strength__level--strong {
  color: var(--ra-color-success-text);
}
.r-password-strength__level--excellent {
  color: var(--ra-color-success-text);
}
.r-password-strength__score {
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-tertiary);
}
.r-password-strength__rules {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-1);
}
.r-password-strength__rule {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-1);
  font-size: var(--ra-font-size-xs);
  color: var(--ra-color-text-tertiary);
  transition: color var(--ra-transition-fast);
}
.r-password-strength__rule--pass {
  color: var(--ra-color-success-text);
}
</style>
