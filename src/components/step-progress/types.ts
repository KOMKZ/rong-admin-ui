export type StepStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface StepItem {
  label: string
  status: StepStatus
  durationMs?: number
}

export interface StepProgressProps {
  steps: StepItem[]
  currentStep?: number
  totalSteps?: number
  compact?: boolean
}

/** Alias to avoid clashing with StepStatus from step-form. */
export type StepProgressStatus = StepStatus
