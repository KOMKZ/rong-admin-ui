import { describe, it, expect, vi } from 'vitest'
import {
  primitiveColors,
  colorVar,
  spacingVar,
  radiusVar,
  shadowVar,
  fontSizeVar,
  transitionVar,
  resolveToken,
} from '../../src/theme/tokens'

describe('primitiveColors', () => {
  it('has all color scales', () => {
    expect(primitiveColors.blue).toHaveLength(10)
    expect(primitiveColors.neutral).toHaveLength(12)
    expect(primitiveColors.green).toHaveLength(10)
    expect(primitiveColors.amber).toHaveLength(10)
    expect(primitiveColors.red).toHaveLength(10)
    expect(primitiveColors.teal).toHaveLength(10)
  })

  it('values start with # (hex)', () => {
    for (const scale of Object.values(primitiveColors)) {
      for (const v of scale) {
        expect(v).toMatch(/^#[0-9a-f]{6}$/i)
      }
    }
  })
})

describe('CSS variable helpers', () => {
  it('colorVar returns var(--ra-color-<token>)', () => {
    expect(colorVar('brand-primary')).toBe('var(--ra-color-brand-primary)')
    expect(colorVar('bg-page')).toBe('var(--ra-color-bg-page)')
    expect(colorVar('danger')).toBe('var(--ra-color-danger)')
  })

  it('spacingVar returns var(--ra-spacing-<token>)', () => {
    expect(spacingVar('4')).toBe('var(--ra-spacing-4)')
    expect(spacingVar('12')).toBe('var(--ra-spacing-12)')
  })

  it('radiusVar returns var(--ra-radius-<token>)', () => {
    expect(radiusVar('sm')).toBe('var(--ra-radius-sm)')
    expect(radiusVar('full')).toBe('var(--ra-radius-full)')
  })

  it('shadowVar returns var(--ra-shadow-<token>)', () => {
    expect(shadowVar('lg')).toBe('var(--ra-shadow-lg)')
  })

  it('fontSizeVar returns var(--ra-font-size-<token>)', () => {
    expect(fontSizeVar('base')).toBe('var(--ra-font-size-base)')
    expect(fontSizeVar('2xl')).toBe('var(--ra-font-size-2xl)')
  })

  it('transitionVar returns var(--ra-transition-<token>)', () => {
    expect(transitionVar('fast')).toBe('var(--ra-transition-fast)')
  })
})

describe('resolveToken', () => {
  it('returns empty string when document is undefined', () => {
    const originalDoc = globalThis.document
    // @ts-expect-error testing SSR scenario
    delete globalThis.document
    expect(resolveToken('--ra-color-brand-primary')).toBe('')
    globalThis.document = originalDoc
  })

  it('reads computed style from documentElement', () => {
    const spy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '  #2080f0  ',
    } as unknown as CSSStyleDeclaration)

    expect(resolveToken('--ra-color-brand-primary')).toBe('#2080f0')
    spy.mockRestore()
  })
})
