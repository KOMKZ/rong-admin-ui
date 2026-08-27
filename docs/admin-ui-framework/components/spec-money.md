# Money Components

## 目标

`RMoneyText` 和 `RMoneyInput` 统一后台金额展示与输入契约。

后端金额字段使用最小货币单位整数，例如 CNY 两位小数时：

- 后端返回：`123`
- 前端展示：`CNY 1.23`
- 用户输入：`1.23`
- 前端提交：`123`

## 组件

### RMoneyText

用于列表、详情和预览中的只读金额展示。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `number \| null` | `null` | 最小货币单位整数 |
| `currency` | `string` | `CNY` | 币种 |
| `scale` | `number` | `2` | 小数位 |
| `emptyText` | `string` | `-` | 空值显示 |
| `showCurrency` | `boolean` | `true` | 是否显示币种 |
| `currencyPosition` | `prefix \| suffix` | `prefix` | 币种位置 |

### RMoneyInput

用于表单中的金额输入。用户输入小数金额，组件通过 `update:value` 输出最小货币单位整数。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `number \| null` | `null` | 最小货币单位整数 |
| `currency` | `string` | `CNY` | 币种前缀 |
| `scale` | `number` | `2` | 最多允许的小数位 |
| `min` | `number` | `0` | 最小值，单位同 `value` |
| `max` | `number` | - | 最大值，单位同 `value` |
| `placeholder` | `string` | `0.00` | 输入占位 |

## 校验

- 空字符串输出 `null`，由业务表单决定是否必填。
- 非数字、负数、小数位超过 `scale` 时不更新外部 `value`，并展示错误。
- `min` / `max` 使用最小货币单位整数。
