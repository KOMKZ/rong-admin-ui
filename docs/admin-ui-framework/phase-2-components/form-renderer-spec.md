# 组件规格：FormRenderer

## 1. 基本信息

- 组件名：RFormRenderer
- 组件层级：business-neutral
- 目标场景：后台管理的 CRUD 表单，基于 schema 驱动渲染
- 非目标场景：复杂动态表单（嵌套、联动规则复杂的场景需扩展）

## 2. 契约定义

### Props

| 名称 | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| schema | `FormFieldSchema[]` | - | ✅ | 表单字段定义 |
| model | `Record<string, unknown>` | - | ✅ | 表单数据 |
| labelWidth | `number \| string` | 'auto' | - | 标签宽度 |
| labelPlacement | `'left' \| 'top'` | 'left' | - | 标签位置 |
| cols | `number` | 1 | - | 列数 |
| disabled | `boolean` | false | - | 全局禁用 |
| readonly | `boolean` | false | - | 全局只读 |
| size | `'small' \| 'medium' \| 'large'` | 'medium' | - | 尺寸 |

### Emits

| 事件名 | Payload | 触发时机 | 说明 |
|--------|---------|----------|------|
| update:model | `Record<string, unknown>` | 字段值变化 | 双向绑定 |
| submit | `Record<string, unknown>` | 表单提交 | 验证通过后 |
| reset | - | 表单重置 | 恢复默认值 |

### Slots

| 名称 | 参数 | 必填 | 回退行为 |
|------|------|------|----------|
| actions | - | - | 默认提交/重置按钮 |
| fieldPrefix | `{ field }` | - | 不显示 |
| fieldSuffix | `{ field }` | - | 不显示 |

## 3. 状态与交互

- 正常态：表单字段可输入
- 加载态：字段显示骨架屏
- 空态：不适用
- 错误态：字段红框 + 错误提示文本
- 禁用态：所有字段禁用

## 4. 可访问性

- 键盘路径：Tab 遍历字段 → Enter 提交
- ARIA 语义：`<form>`, `<label>` + for 关联, `aria-invalid`, `aria-describedby`
- 对比度要求：WCAG AA

## 5. 性能预算

- 首次渲染：20 字段 < 30ms
- 交互响应：验证反馈 < 50ms
- 重渲染阈值：仅变化字段更新

## 6. 测试要求

- 单元测试：字段渲染、验证规则、值绑定
- 契约测试：schema 类型验证
- E2E 场景：填写 → 验证失败 → 修正 → 提交成功
- a11y 检查：标签关联、错误提示

## 7. 验收标准

- [x] 契约完整（types.ts）
- [ ] 组件实现
- [ ] 文档与示例可运行
- [ ] 测试通过
- [ ] rong-admin-web 至少 1 个真实调用
