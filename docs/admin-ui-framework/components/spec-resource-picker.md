# RResourcePickerDialog

`RResourcePickerDialog` 是管理端通用资源选择弹窗。它只抽象选择器交互，不包含任何资源库业务字段。

## 适用场景

- 表单选择一个服务端资源 id。
- 弹窗内按资源类型分 tab。
- 每个资源类型通过后端分页和关键词搜索加载。
- 不同资源类型需要不同卡片渲染和动作。

## 边界

组件负责：

- dialog。
- 资源类型 tab。
- 用户触发 tab 后加载数据。
- 搜索、刷新、分页。
- 加载、空态、错误、重试。
- 选中态和确认事件。
- 卡片网格和 slot。

组件不负责：

- 不调用业务 API。
- 不保存业务设置。
- 不内置播放、预览、编辑、创建逻辑。
- 不理解 `person_voice_id`、TTS、书籍、图片等领域字段。

## 懒加载策略

默认 `loadOnOpen=false`。打开弹窗时不会加载资源数据，也不会默认激活第一个 tab。

数据加载只发生在：

- 用户点击某个资源类型 tab。
- 用户点击搜索。
- 用户点击刷新。
- 调用方显式设置 `loadOnOpen=true`。

## 基础用法

```vue
<RResourcePickerDialog
  v-model:visible="visible"
  v-model="selected"
  :tabs="tabs"
  @confirm="handleConfirm"
>
  <template #card="{ item, selected, select }">
    <button type="button" @click.stop="select">
      {{ item.title }} {{ selected ? "已选择" : "选择" }}
    </button>
  </template>
</RResourcePickerDialog>
```

## Props

| 属性 | 说明 | 默认 |
| --- | --- | --- |
| `visible` | 弹窗显隐 | 必填 |
| `modelValue` | 当前已确认选中资源 | `null` |
| `tabs` | 资源类型配置 | 必填 |
| `title` | 弹窗标题 | `选择资源` |
| `width` | 弹窗宽度 | `1040` |
| `loadOnOpen` | 打开时是否立即加载 | `false` |
| `initialActiveKey` | 初始激活 tab | 空 |
| `cardMinWidth` | 卡片最小宽度 | `220` |

## Events

| 事件 | 说明 |
| --- | --- |
| `update:modelValue` | 确认后更新选中项 |
| `confirm` | 确认选择，payload 为 `{ item, tabKey }` |
| `cancel` | 取消 |
| `select` | 弹窗内临时选择项 |
| `activate` | 用户激活资源类型 tab |
| `loadError` | tab loader 报错 |

## Slots

| slot | 说明 |
| --- | --- |
| `card` | 资源卡片渲染，参数 `{ item, tab, selected, disabled, select }` |
| `toolbar` | 搜索栏右侧扩展，参数 `{ tab, keyword, loading, loaded, reload }` |

## 应用接入要求

业务应用必须在 adapter 中把后端 DTO 映射成 `ResourcePickerItem`，页面只消费归一化协议。大列表必须后端搜索和分页，禁止打开弹窗全量拉取后在浏览器过滤。
