# Round-3 Extension Components API 文档

> 日期: 2026-03-05 | 分支: feature/v0.6-modernization

---

## 1. RFormTable（表单表格）

批量录入结构化数据，支持新增/删除行、逐行校验、整体提交。

### 何时使用
- 批量导入用户、商品、权限等场景
- 需要动态行数 + 行级校验的结构化表单

### Props

| Prop | Type | Default | 说明 |
|------|------|---------|------|
| columns | `FormTableColumn[]` | **required** | 列定义，含 schema |
| modelValue | `FormTableRow[]` | **required** | 行数据 |
| maxRows | `number` | Infinity | 最大行数 |
| minRows | `number` | 0 | 最少行数 |
| addable | `boolean` | true | 显示添加按钮 |
| removable | `boolean` | true | 显示删除按钮 |
| addLabel | `string` | '+ 添加一行' | 添加按钮文案 |
| disabled | `boolean` | false | 禁用 |
| showIndex | `boolean` | true | 显示行号 |
| size | `'small' \| 'medium' \| 'large'` | 'medium' | 尺寸 |

### Emits

| Event | Payload | 说明 |
|-------|---------|------|
| update:modelValue | `FormTableRow[]` | 行数据变更 |
| add | — | 添加行 |
| remove | `index, row` | 删除行 |
| validate | `FormTableValidateResult[]` | 校验完成 |

### Expose

- `validate()` → `Promise<FormTableValidateResult[]>`
- `addRow(defaults?)` — 添加行
- `removeRow(index)` — 删除行
- `getRows()` → `FormTableRow[]`
- `clearAll()` — 清空所有行
- `resetRow(index)` — 重置指定行

---

## 2. RPasswordStrength（密码强度）

实时密码强度评估，带规则提示和等级可视化。

### 何时使用
- 注册、重置密码、账户安全设置

### Props

| Prop | Type | Default | 说明 |
|------|------|---------|------|
| modelValue | `string` | **required** | 密码值 |
| rules | `PasswordRule[]` | 内置 5 规则 | 自定义规则 |
| showRules | `boolean` | true | 显示规则列表 |
| showScore | `boolean` | false | 显示分数 |
| showLevel | `boolean` | true | 显示等级文案 |
| minLength | `number` | 6 | 最小长度 |
| maxLength | `number` | 64 | 最大长度 |
| disabled | `boolean` | false | 禁用 |

### Emits

| Event | Payload | 说明 |
|-------|---------|------|
| update:modelValue | `string` | 输入变更 |
| levelChange | `level, score` | 等级变化 |

### Expose

- `getLevel()` → `PasswordStrengthLevel`
- `getScore()` → `number`
- `getPassedRules()` → `string[]`
- `focus()` — 聚焦输入框

---

## 3. RCheckCardGroup（可选卡片组）

卡片形式的单选/多选，适用于方案/模板/套餐选择。

### Props

| Prop | Type | Default | 说明 |
|------|------|---------|------|
| options | `CheckCardOption[]` | **required** | 选项 |
| modelValue | `array \| string \| number \| null` | null | 选中值 |
| multiple | `boolean` | false | 多选 |
| columns | `number \| 'auto'` | 'auto' | 列数 |
| cardMinWidth | `number` | 200 | 自动布局最小宽度 |
| disabled | `boolean` | false | 全部禁用 |

### Emits

- `update:modelValue` / `change`

### Expose

- `selectAll()` / `clearAll()` / `getSelected()`

---

## 4. RCheckButtonGroup（可选按钮组）

按钮形式的单选/多选，适用于维度切换、快捷筛选。

### Props

| Prop | Type | Default | 说明 |
|------|------|---------|------|
| options | `CheckButtonOption[]` | **required** | 选项 |
| modelValue | `array \| string \| number \| null` | null | 选中值 |
| multiple | `boolean` | false | 多选 |
| block | `boolean` | false | 撑满容器 |
| disabled | `boolean` | false | 禁用 |

### Emits

- `update:modelValue` / `change`

### Expose

- `selectAll()` / `clearAll()` / `getSelected()`

---

## 5. RCodeVerify（验证码）

短信/邮箱验证码输入，内置倒计时和防重复发送。

### Props

| Prop | Type | Default | 说明 |
|------|------|---------|------|
| modelValue | `string` | **required** | 验证码值 |
| codeLength | `number` | 6 | 验证码位数 |
| countdown | `number` | 60 | 倒计时秒数 |
| sendLabel | `string` | '获取验证码' | 发送按钮文案 |
| sending | `boolean` | false | 发送中状态 |
| disabled | `boolean` | false | 禁用 |

### Emits

| Event | Payload | 说明 |
|-------|---------|------|
| update:modelValue | `string` | 输入变更 |
| send | — | 点击发送 |
| complete | `string` | 输入完整验证码 |

### Expose

- `startCountdown()` / `resetCountdown()` / `focus()` / `clear()` / `getRemaining()`

---

## 6. RIconButton（图标按钮）

统一图标按钮风格，支持 tooltip、loading、danger、多种尺寸。

### Props

| Prop | Type | Default | 说明 |
|------|------|---------|------|
| icon | `string` | **required** | 图标名 |
| tooltip | `string` | '' | 悬停提示 |
| size | `'tiny' \| 'small' \| 'medium' \| 'large'` | 'small' | 尺寸 |
| type | `'default' \| 'primary' \| ...` | 'default' | 类型 |
| danger | `boolean` | false | 危险态 |
| loading | `boolean` | false | 加载中 |
| disabled | `boolean` | false | 禁用 |
| circle | `boolean` | true | 圆形 |
| ariaLabel | `string` | '' | 无障碍标签 |

### Emits

- `click: [MouseEvent]`

---

## A11y 通用规范

- 所有可交互组件使用 `<button>` 语义标签
- 支持 `aria-pressed`（CheckCard/CheckButton）
- 支持 `aria-label`（IconButton/FormTable remove）
- 支持键盘 focus-visible 高亮

## 性能

- 所有组件纯 CSS 动画，无 JS 动画库依赖
- RFormTable 行粒度更新，不整表重渲染
- RCheckCardGroup 使用 CSS Grid auto-fill
