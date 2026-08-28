# RJsonViewer

`RJsonViewer` 是只读 JSON 观察组件，用于后台详情页、日志页和调试面板展示 JSON 字段。

## 定位

- 展示对象、数组、JSON 字符串和普通字符串。
- 自动格式化合法 JSON，提供行号和轻量语法着色。
- 支持复制当前展示内容。
- 支持点击内容区或点击放大按钮进入大弹窗查看。
- 不提供编辑、保存、差异对比和远程加载能力。

## 文件

- 组件：`src/components/json-viewer/RJsonViewer.vue`
- 契约：`src/components/json-viewer/types.ts`
- 导出：`src/components/json-viewer/index.ts`
- 测试：`tests/components/json-viewer.test.ts`

## 基础用法

```vue
<RJsonViewer title="输入快照" :value="record.input_snapshot" :max-height="180" />
```

## Props

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | `unknown` | `undefined` | 原始 JSON 值、JSON 字符串或普通字符串 |
| `title` | `string` | `JSON` | 标题和放大弹窗标题前缀 |
| `size` | `small \| medium \| large` | `medium` | 控制字号和行号列宽 |
| `height` | `number \| string` | `undefined` | 内容区固定高度 |
| `maxHeight` | `number \| string` | `220` | 内容区最大高度 |
| `emptyText` | `string` | `-` | 空值展示 |
| `copyable` | `boolean` | `true` | 是否展示复制按钮 |
| `expandable` | `boolean` | `true` | 是否允许点击放大 |
| `showHeader` | `boolean` | `true` | 是否展示头部标题和操作 |

## 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `copy` | `value: string` | 复制动作完成后触发 |
| `expand` | `value: string` | 进入放大查看时触发 |

## 设计约束

- 只使用 admin-ui 语义 token，不在组件内写业务色值。
- 内容区可横向滚动，避免长 JSON key 撑破父容器。
- 点击放大同时支持键盘 `Enter` / `Space`。
