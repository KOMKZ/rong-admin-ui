import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import {
  decimalMoneyToMinor,
  formatMinorMoney,
  isValidDecimalMoney,
  minorMoneyToDecimal,
  RMoneyInput,
  RMoneyText,
} from '@/components/money'

describe('money components', () => {
  it('formats minor-unit integer as decimal money text', () => {
    expect(formatMinorMoney(123, { currency: 'CNY', scale: 2 })).toBe('CNY 1.23')
    expect(formatMinorMoney(1000, { currency: 'USD', scale: 2, currencyPosition: 'suffix' })).toBe(
      '10.00 USD',
    )
    expect(formatMinorMoney(null)).toBe('-')
  })

  it('converts decimal input to minor-unit integer', () => {
    expect(decimalMoneyToMinor('1.23', 2)).toBe(123)
    expect(decimalMoneyToMinor('1', 2)).toBe(100)
    expect(decimalMoneyToMinor('1.2', 2)).toBe(120)
    expect(decimalMoneyToMinor('1.234', 2)).toBeNull()
    expect(minorMoneyToDecimal(123, 2)).toBe('1.23')
    expect(isValidDecimalMoney('0.01', 2)).toBe(true)
  })

  it('renders money text component', () => {
    const wrapper = mount(RMoneyText, {
      props: { value: 123, currency: 'CNY', scale: 2 },
    })
    expect(wrapper.find('[data-testid="money-text"]').text()).toBe('CNY 1.23')
  })

  it('emits integer minor-unit value from decimal input', async () => {
    const wrapper = mount(RMoneyInput, {
      props: { value: 100, currency: 'CNY', scale: 2 },
    })
    const input = wrapper.find('input')
    await input.setValue('12.34')
    await nextTick()
    expect(wrapper.emitted('update:value')?.at(-1)?.[0]).toBe(1234)
  })

  it('keeps previous model value when decimal input is invalid', async () => {
    const wrapper = mount(RMoneyInput, {
      props: { value: 100, currency: 'CNY', scale: 2 },
    })
    const input = wrapper.find('input')
    await input.setValue('12.345')
    await nextTick()
    expect(wrapper.text()).toContain('请输入最多 2 位小数的金额')
    expect(wrapper.emitted('update:value')).toBeUndefined()
  })
})
