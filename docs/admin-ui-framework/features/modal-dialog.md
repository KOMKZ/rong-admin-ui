# ModalDialog — 对话框能力

## 背景

后台管理中的确认操作、表单编辑、信息展示需要统一的对话框组件。

## 输入

- `visible: boolean` — 显隐控制（v-model）
- `title: string` — 标题
- `loading: boolean` — 确认按钮加载态
- `closable / maskClosable / closeOnEsc` — 关闭方式控制
- `trapFocus: boolean` — 焦点陷阱（a11y）

## 输出

- `update:visible` — 显隐双向绑定
- `confirm` — 确认
- `cancel` — 取消
- `afterOpen` / `afterClose` — 动画生命周期

## 约束

- 基于 Naive UI NModal + NCard 封装
- 默认渲染 role="dialog" + aria-modal + aria-label
- loading 状态下确认按钮禁用并显示 spinner
- 支持 header / footer / icon / default 四个插槽

## 示例

```vue
<RModalDialog v-model:visible="showDialog" title="确认删除" :loading="isDeleting" @confirm="handleDelete">
  <p>确定要删除选中的记录吗？</p>
</RModalDialog>
```
