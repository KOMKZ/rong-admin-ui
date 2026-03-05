export interface CodeVerifyProps {
  modelValue: string
  codeLength?: number
  countdown?: number
  sendLabel?: string
  sendingLabel?: string
  resendLabel?: string
  placeholder?: string
  disabled?: boolean
  sending?: boolean
  size?: 'small' | 'medium' | 'large'
  inputWidth?: number | string
  autoFocus?: boolean
}

export interface CodeVerifyEmits {
  'update:modelValue': [value: string]
  send: []
  complete: [code: string]
}

export interface CodeVerifyExpose {
  startCountdown: () => void
  resetCountdown: () => void
  focus: () => void
  clear: () => void
  getRemaining: () => number
}
