/**
 * TypeScript token registry — mirrors the CSS custom properties in
 * primitives.css and semantic.css so that consumers can reference
 * tokens programmatically (e.g. for inline styles or Naive UI overrides).
 *
 * Components MUST use semantic tokens only.
 */

/* ──────────────────────── Primitive Scales ──────────────────────── */

export const primitiveColors = {
  blue: ['#f0f7ff', '#d6eaff', '#aed4ff', '#7ab8ff', '#4a9cff', '#2080f0', '#1a6dd4', '#155ab8', '#0f4899', '#0a3577'],
  neutral: ['#ffffff', '#fafbfc', '#f5f6f7', '#eef0f2', '#dde1e5', '#c2c8ce', '#99a1ab', '#6b7785', '#4a5568', '#2d3748', '#1a202c', '#0f1419'],
  green: ['#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#18a058', '#158a4d', '#117340', '#0d5d33', '#094727'],
  amber: ['#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f0a020', '#d4891a', '#b87315', '#925a0f', '#6b420b'],
  red: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#d03050', '#b52a46', '#99233c', '#7d1d31', '#611727'],
  teal: ['#f0fdfa', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0f9688', '#0d7a6f', '#0a5e55', '#07423c'],
} as const

/* ──────────────────────── Semantic Token Keys ──────────────────────── */

export type SemanticColorToken =
  | 'bg-page' | 'bg-surface' | 'bg-elevated' | 'bg-overlay' | 'bg-muted' | 'bg-code'
  | 'text-primary' | 'text-secondary' | 'text-tertiary' | 'text-inverse' | 'text-code'
  | 'border-default' | 'border-light' | 'border-strong'
  | 'brand-primary' | 'brand-hover' | 'brand-active' | 'brand-light'
  | 'success' | 'success-bg' | 'success-text' | 'success-border'
  | 'warning' | 'warning-bg' | 'warning-text' | 'warning-border'
  | 'danger' | 'danger-bg' | 'danger-text' | 'danger-border'
  | 'focus-ring'

export type SpacingToken = '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12'

export type RadiusToken = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export type ShadowToken = 'sm' | 'md' | 'lg' | 'xl'

export type FontSizeToken = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl'

export type TransitionToken = 'fast' | 'base' | 'slow'

/* ──────────────────────── CSS Variable Resolvers ──────────────────────── */

/** Returns `var(--ra-color-{token})` */
export function colorVar(token: SemanticColorToken): string {
  return `var(--ra-color-${token})`
}

/** Returns `var(--ra-spacing-{token})` */
export function spacingVar(token: SpacingToken): string {
  return `var(--ra-spacing-${token})`
}

/** Returns `var(--ra-radius-{token})` */
export function radiusVar(token: RadiusToken): string {
  return `var(--ra-radius-${token})`
}

/** Returns `var(--ra-shadow-{token})` */
export function shadowVar(token: ShadowToken): string {
  return `var(--ra-shadow-${token})`
}

/** Returns `var(--ra-font-size-{token})` */
export function fontSizeVar(token: FontSizeToken): string {
  return `var(--ra-font-size-${token})`
}

/** Returns `var(--ra-transition-{token})` */
export function transitionVar(token: TransitionToken): string {
  return `var(--ra-transition-${token})`
}

/* ──────────────────────── Runtime Computed Value ──────────────────────── */

/**
 * Reads the computed value of a CSS custom property from the root element.
 * Returns empty string if unavailable (e.g. SSR).
 */
export function resolveToken(property: string): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim()
}
