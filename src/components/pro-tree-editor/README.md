# RProTreeEditor

> Commercial-grade tree viewer/editor component with request-trigger mode, drag-and-drop, batch operations, and domain adapter support.

## When to Use

- Managing hierarchical data (folders, categories, departments)
- CRUD operations on tree structures with backend integration
- Need drag-and-drop reordering and moving
- Need search/filter with path highlighting

## When NOT to Use

- Simple read-only tree display → use Naive UI `NTree`
- Flat list selection → use `NSelect` with tree options
- File browser with preview → custom component

## Quick Start

```vue
<script setup>
import { RProTreeEditor, createArticleFolderAdapter } from '@rong/admin-ui/components/pro-tree-editor'

const adapter = createArticleFolderAdapter({
  httpClient: myHttpClient,
  baseUrl: '/api/v1/article-folders',
})
</script>

<template>
  <RProTreeEditor
    request-mode="auto"
    :request-hooks="adapter.requestHooks"
    :check-delete="adapter.checkDelete"
    :show-counts="true"
    :draggable="true"
    :default-expand-level="2"
    density="default"
  />
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `TreeNodeData[]` | `[]` | Static tree data (when not using requestHooks) |
| `defaultExpandLevel` | `number` | `1` | Auto-expand depth on load |
| `density` | `'compact' \| 'default' \| 'comfortable'` | `'default'` | Visual density |
| `requestMode` | `'auto' \| 'manual'` | `'auto'` | Auto-load on mount or manual control |
| `requestHooks` | `TreeRequestHooks` | `{}` | Backend request functions |
| `checkDelete` | `CheckDeleteFn` | - | Pre-delete constraint checker |
| `selectable` | `boolean` | `false` | Enable batch selection |
| `checkedKeys` | `(string \| number)[]` | `[]` | Batch-selected node IDs (v-model) |
| `selectedKey` | `string \| number \| null` | `null` | Currently selected node (v-model) |
| `optimistic` | `boolean` | `true` | Enable optimistic updates |
| `draggable` | `boolean` | `true` | Enable drag-and-drop |
| `maxDepth` | `number` | `10` | Maximum tree depth |
| `showCounts` | `boolean` | `false` | Show item count badges |
| `showBreadcrumb` | `boolean` | `false` | Show breadcrumb path |
| `icons` | `TreeNodeIcons` | `{}` | Custom icon names |
| `i18n` | `TreeI18n` | `DEFAULT_I18N` | i18n string overrides |
| `batch` | `TreeBatchConfig \| false` | `false` | Batch operations config |
| `lazyLoad` | `boolean` | `false` | Lazy-load children on expand |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:checkedKeys` | `(string \| number)[]` | Batch selection changed |
| `update:selectedKey` | `string \| number \| null` | Selection changed |
| `select` | `TreeNodeData` | Node selected |
| `requestStart` | `TreeRequestEvent` | Request lifecycle |
| `requestSuccess` | `TreeRequestEvent` | Request lifecycle |
| `requestError` | `TreeRequestEvent, TreeError` | Request lifecycle |
| `dataChange` | `TreeDataChangeEvent` | Tree data mutated |

## Expose (ref methods)

| Method | Signature | Description |
|--------|-----------|-------------|
| `reload` | `() => Promise<void>` | Reload entire tree |
| `refreshNode` | `(id) => Promise<void>` | Refresh specific node's children |
| `expandAll` | `() => void` | Expand all nodes |
| `collapseAll` | `() => void` | Collapse all nodes |
| `createNode` | `(parentId?) => void` | Start create flow |
| `renameNode` | `(id) => void` | Start rename flow |
| `deleteNode` | `(id) => Promise<void>` | Delete with confirmation |
| `moveNode` | `(id, newParentId) => Promise<void>` | Move node |
| `setKeyword` | `(keyword) => void` | Set search filter |
| `getTreeData` | `() => TreeNodeData[]` | Get current tree state |

## Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `toolbar` | - | Replace entire toolbar |
| `toolbar-extra` | - | Extra toolbar buttons |
| `node-icon` | `{ node, expanded }` | Custom node icon |
| `node-label` | `{ node }` | Custom node label |
| `node-extra` | `{ node }` | Extra content after label |
| `node-actions` | `{ node }` | Custom inline actions |
| `empty` | - | Empty state |
| `loading` | - | Loading state |

## Request Hooks Contract

```typescript
interface TreeRequestHooks {
  loadTree?: () => Promise<TreeNodeData[]>
  loadChildren?: (parentId: string | number) => Promise<TreeNodeData[]>
  create?: (params: { parentId: string | number | null; name: string }) => Promise<TreeNodeData>
  update?: (params: { id: string | number; name: string }) => Promise<TreeNodeData>
  delete?: (id: string | number) => Promise<void>
  move?: (params: { id: string | number; newParentId: string | number | null }) => Promise<void>
  reorder?: (params: { id: string | number; newOrder: number }) => Promise<void>
}
```

## Article Folder Adapter

Pre-built adapter for `go-yogan-domain-article-folder`:

```typescript
import { createArticleFolderAdapter } from '@rong/admin-ui/components/pro-tree-editor'

const { requestHooks, checkDelete } = createArticleFolderAdapter({
  httpClient: { get, post, put, delete: del },
  baseUrl: '/api/v1/article-folders',
})
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move selection |
| `←` | Collapse or go to parent |
| `→` | Expand or go to first child |
| `Enter` | Toggle expand |
| `F2` | Start rename |
| `Esc` | Cancel edit |
| `Home` / `End` | Jump to first/last |

## Accessibility

- `role="tree"` / `role="treeitem"` / `role="group"`
- `aria-selected`, `aria-expanded`, `aria-disabled`
- Full keyboard navigation
- Focus ring via `--ra-color-focus-ring`

## Interaction States

Every node covers: default, hover, selected, focused, editing, dragging, drop-target (legal/illegal), disabled, error.

## Migration

This is a new component. No migration needed.
