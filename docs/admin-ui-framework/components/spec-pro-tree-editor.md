# RProTreeEditor 组件规格

## 定位

商业级树结构编辑器，支持请求触发模式、拖拽排序、批量操作、领域适配器。适用于文件夹管理、分类管理、部门组织架构等层级数据场景。

## 架构

```
RProTreeEditor (主容器)
├── RTreeToolbar (搜索、工具栏、批量操作栏)
├── RTreeNodeRecursive (递归渲染层)
│   └── RTreeNode (单节点渲染、编辑、拖拽)
└── RTreeContextMenu (右键菜单)

composables/
├── useTreeData    (数据管理、CRUD、乐观更新、错误解析)
├── useTreeSearch  (搜索过滤、路径高亮)
├── useTreeDnd     (拖拽验证、状态管理)
└── useTreeKeyboard (键盘导航)

adapters/
└── articleFolderAdapter (文章分类领域适配器)
```

## Props 契约

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| data | TreeNodeData[] | [] | 静态数据 |
| defaultExpandLevel | number | 1 | 自动展开层级 |
| density | 'compact' \| 'default' \| 'comfortable' | 'default' | 视觉密度 |
| requestMode | 'auto' \| 'manual' | 'auto' | 请求触发模式 |
| requestHooks | TreeRequestHooks | {} | 后端请求钩子 |
| checkDelete | CheckDeleteFn | - | 删除前约束检查 |
| selectable | boolean | false | 是否启用批量选择 |
| checkedKeys | (string \| number)[] | [] | 批量选中的 ID (v-model) |
| selectedKey | string \| number \| null | null | 当前选中节点 (v-model) |
| optimistic | boolean | true | 乐观更新 |
| draggable | boolean | true | 拖拽排序 |
| maxDepth | number | 10 | 最大层级深度 |
| showCounts | boolean | false | 显示计数徽章 |
| showBreadcrumb | boolean | false | 显示面包屑 |
| icons | TreeNodeIcons | {} | 自定义图标 |
| i18n | TreeI18n | DEFAULT_I18N | 国际化覆盖 |
| batch | TreeBatchConfig \| false | false | 批量操作配置 |
| lazyLoad | boolean | false | 懒加载子节点 |

## 事件契约

| 事件 | 载荷 | 说明 |
|------|------|------|
| update:checkedKeys | (string \| number)[] | 批量选择变更 |
| update:selectedKey | string \| number \| null | 选择变更 |
| select | TreeNodeData | 节点选中 |
| requestStart | TreeRequestEvent | 请求开始 |
| requestSuccess | TreeRequestEvent | 请求成功 |
| requestError | TreeRequestEvent, TreeError | 请求失败 |
| dataChange | TreeDataChangeEvent | 数据变更 |

## 暴露方法

| 方法 | 签名 | 说明 |
|------|------|------|
| reload | () => Promise\<void\> | 重新加载 |
| refreshNode | (id) => Promise\<void\> | 刷新节点子项 |
| expandAll / collapseAll | () => void | 展开/折叠全部 |
| createNode | (parentId?) => void | 创建节点 |
| renameNode | (id) => void | 重命名节点 |
| deleteNode | (id) => Promise\<void\> | 删除节点 |
| moveNode | (id, newParentId) => Promise\<void\> | 移动节点 |
| setKeyword | (keyword) => void | 设置搜索关键词 |
| getTreeData | () => TreeNodeData[] | 获取当前数据 |

## 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| toolbar | - | 替换整个工具栏 |
| toolbar-extra | - | 额外工具栏按钮 |
| node-icon | { node, expanded } | 自定义节点图标 |
| node-label | { node } | 自定义节点标签 |
| node-extra | { node } | 标签后额外内容 |
| node-actions | { node } | 自定义行内操作 |
| empty | - | 空态 |
| loading | - | 加载态 |

## 状态机

每个节点覆盖 10 种状态：default / hover / selected / focused / editing / dragging / drop-target / drop-target-invalid / disabled / error

## 错误码映射

| 领域错误 | TreeErrorCode | 用户提示 |
|----------|---------------|----------|
| folder name already exists | DUPLICATE_NAME | 文件夹名称已存在 |
| invalid folder name | INVALID_NAME | 无效的文件夹名称 |
| parent not found | PARENT_NOT_FOUND | 父文件夹不存在 |
| circular reference | CIRCULAR_REFERENCE | 不能移动到自身子级 |
| max depth exceeded | MAX_DEPTH_EXCEEDED | 超过最大层级深度 |
| has children | HAS_CHILDREN | 请先删除子文件夹 |
| has articles | FOLDER_HAS_ARTICLES | 请先移走文章 |
| not found | NOT_FOUND | 文件夹不存在 |
| network/fetch | NETWORK_ERROR | 网络错误 |

## 可访问性

- `role="tree"` / `role="treeitem"` / `role="group"` 语义结构
- `aria-selected` / `aria-expanded` / `aria-disabled` 状态
- 完整键盘导航（方向键、Home/End、Enter、F2、Esc）
- Focus ring 通过 `--ra-color-focus-ring` token
- 展开/折叠按钮为 `<button>` 元素

## CSS Token 合规

所有颜色、间距、圆角、字号均使用 `--ra-*` 语义 token，无硬编码值。

## 适配器模式

通过 `createArticleFolderAdapter(options)` 工厂函数创建领域适配器，包含：
- `requestHooks`: 完整的 CRUD + move + reorder 钩子
- `checkDelete`: 删除前约束检查
- DTO 到 TreeNodeData 的自动映射
- 后端错误到 TreeErrorCode 的自动映射
