# RCodeGeneratorDialog

通用编码生成弹框。组件只负责选择目标类型、选择生成策略、输入来源文本、预览和确认填充；具体策略由业务应用通过 props 注入。

## Props

- `show`：弹框显隐。
- `targetTypes`：可生成的目标类型，例如属性集编码、属性编码、值编码。
- `strategies`：生成策略列表，组件不内置业务策略。
- `targetType`：当前目标类型。
- `sourceText`：生成来源文本。
- `currentValue`：当前字段值，用于策略判断或回显。
- `extra`：调用方透传上下文。

## Emits

- `update:show`：关闭或打开弹框。
- `update:targetType`：目标类型变更。
- `apply`：用户确认使用预览值。

## 状态

- 无可用策略时禁用确认按钮并显示空态说明。
- 预览为空时禁用确认按钮。
- `disabled=true` 时禁止修改和确认。

## 边界

- 组件不校验业务唯一性。
- 组件不访问接口。
- 组件不硬编码业务常量。
