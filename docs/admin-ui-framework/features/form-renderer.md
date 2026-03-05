# FormRenderer — Schema 驱动表单引擎

## 背景

后台 CRUD 表单需要统一的 schema 驱动渲染、校验、提交机制。

## 输入

- `schema: FormFieldSchema[]` — 字段定义（key/label/type/rules/options）
- `model: Record<string, unknown>` — 表单数据（双向绑定）
- 支持字段类型：input / textarea / number / select / radio / checkbox / switch / date / daterange / custom

## 输出

- `update:model` — 字段值变化
- `submit` — 验证通过后提交
- `reset` — 表单重置

## Expose API

| 方法 | 返回值 | 说明 |
|------|--------|------|
| validate() | Promise\<boolean\> | 触发全表单验证 |
| resetFields() | void | 重置到默认值 |
| getValues() | Record\<string, unknown\> | 获取当前值 |
| setValues(values) | void | 批量设置值 |
| clearValidate(keys?) | void | 清除验证状态 |

## 约束

- 基于 Naive UI NForm + NGrid 封装
- hidden 字段支持函数式条件隐藏
- disabled 字段支持函数式条件禁用
- 自定义字段通过 `type: 'custom'` + `component` prop 注入

## 示例

```vue
<RFormRenderer
  :schema="schema"
  :model="formData"
  :label-width="80"
  label-placement="left"
  @update:model="formData = $event"
  @submit="handleSubmit"
/>
```
