<template>
  <div class="r-workflow-designer" :style="designerStyle" data-testid="workflow-designer">
    <aside class="r-workflow-panel r-workflow-panel--palette">
      <div class="r-workflow-panel__title">节点库</div>
      <div class="r-workflow-palette-list">
        <button
          v-for="template in nodeTemplates"
          :key="template.type"
          class="r-workflow-palette-item"
          :draggable="!readonly"
          @dragstart="handlePaletteDragStart($event, template.type)"
          @click="addNodeAtViewportCenter(template.type)"
        >
          <strong>{{ template.label }}</strong>
          <span>{{ template.hint }}</span>
        </button>
      </div>
      <p class="r-workflow-tip">拖拽到画布，或点击快速插入。</p>
    </aside>

    <div
      v-if="panelResizable"
      class="r-workflow-resizer"
      role="separator"
      aria-label="调整左侧面板宽度"
      @mousedown="startPanelResize($event, 'left')"
    />

    <section class="r-workflow-canvas-wrap">
      <div class="r-workflow-toolbar">
        <button class="r-workflow-btn" :disabled="readonly" @click="autoLayout">自动布局</button>
        <button class="r-workflow-btn" :disabled="readonly" @click="clearEdges">清空连线</button>
        <button class="r-workflow-btn" @click="runValidation">校验流程</button>
        <span v-if="linkSourceID" class="r-workflow-linking-hint">连线模式：请选择目标节点</span>
      </div>

      <div
        ref="canvasRef"
        class="r-workflow-canvas"
        @dragover.prevent
        @drop="handleCanvasDrop"
      >
        <svg class="r-workflow-edges" aria-hidden="true">
          <path
            v-for="edge in edgePaths"
            :key="edge.id"
            class="r-workflow-edge"
            :d="edge.path"
            marker-end="url(#r-workflow-arrow)"
          />
          <defs>
            <marker
              id="r-workflow-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
            </marker>
          </defs>
        </svg>

        <div
          v-for="node in localGraph.nodes"
          :key="node.id"
          class="r-workflow-node"
          :class="[
            `node-${node.type}`,
            {
              'is-selected': selectedNodeID === node.id,
              'is-link-source': linkSourceID === node.id,
            },
          ]"
          :style="{ left: `${node.x}px`, top: `${node.y}px` }"
          @mousedown="startNodeDrag($event, node.id)"
          @click.stop="handleNodeClick(node.id)"
        >
          <div class="r-workflow-node__title">{{ node.label }}</div>
          <div class="r-workflow-node__meta">{{ node.type }}</div>
          <div class="r-workflow-node__actions">
            <button class="r-workflow-inline-btn" :disabled="readonly" @click.stop="beginLink(node.id)">
              连线
            </button>
            <button class="r-workflow-inline-btn danger" :disabled="readonly" @click.stop="removeNode(node.id)">
              删除
            </button>
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="panelResizable"
      class="r-workflow-resizer"
      role="separator"
      aria-label="调整右侧面板宽度"
      @mousedown="startPanelResize($event, 'right')"
    />

    <aside class="r-workflow-panel r-workflow-panel--inspector">
      <div class="r-workflow-panel__title">操作面板</div>

      <div class="r-workflow-inspector-tabs">
        <button
          class="r-workflow-tab"
          :class="{ 'is-active': inspectorTab === 'global' }"
          @click="inspectorTab = 'global'"
        >
          全局设置
        </button>
        <button
          class="r-workflow-tab"
          :class="{ 'is-active': inspectorTab === 'node' }"
          @click="inspectorTab = 'node'"
        >
          节点属性
        </button>
        <button
          class="r-workflow-tab"
          :class="{ 'is-active': inspectorTab === 'validate' }"
          @click="inspectorTab = 'validate'"
        >
          校验结果
        </button>
      </div>

      <div v-if="inspectorTab === 'global'" class="r-workflow-inspector-section">
        <label class="r-workflow-field">
          <span>流程描述</span>
          <textarea
            :value="readGlobalMetaText('description')"
            :disabled="readonly"
            placeholder="例如：采购申请审批主流程"
            @input="updateGlobalMetaText('description', ($event.target as HTMLTextAreaElement).value)"
          />
        </label>

        <div class="r-workflow-field">
          <span>发起表单（全局）</span>
          <div class="r-workflow-form-field-head">
            <span>字段 Key</span>
            <span>标题</span>
            <span>类型</span>
            <span>必填</span>
            <span>占位/选项</span>
            <span>操作</span>
          </div>
          <div
            v-for="(field, index) in readGlobalFormFields()"
            :key="`global-form-field-${index}`"
            class="r-workflow-form-field-row"
          >
            <input
              :value="field.key"
              :disabled="readonly"
              placeholder="amount"
              @input="updateGlobalFormField(index, 'key', ($event.target as HTMLInputElement).value)"
            />
            <input
              :value="field.label"
              :disabled="readonly"
              placeholder="申请金额"
              @input="updateGlobalFormField(index, 'label', ($event.target as HTMLInputElement).value)"
            />
            <select
              :value="field.type"
              :disabled="readonly"
              @change="updateGlobalFormField(index, 'type', ($event.target as HTMLSelectElement).value)"
            >
              <option value="text">文本</option>
              <option value="number">数字</option>
              <option value="textarea">多行文本</option>
              <option value="date">日期</option>
              <option value="select">下拉选择</option>
            </select>
            <label class="r-workflow-checkbox-cell">
              <input
                type="checkbox"
                :checked="Boolean(field.required)"
                :disabled="readonly"
                @change="updateGlobalFormField(index, 'required', ($event.target as HTMLInputElement).checked)"
              />
              <span>必填</span>
            </label>
            <input
              v-if="field.type !== 'select'"
              :value="field.placeholder || ''"
              :disabled="readonly"
              placeholder="请输入占位说明"
              @input="updateGlobalFormField(index, 'placeholder', ($event.target as HTMLInputElement).value)"
            />
            <input
              v-else
              :value="readGlobalFieldOptionsText(field)"
              :disabled="readonly"
              placeholder="选项1,选项2"
              @input="updateGlobalFormFieldOptions(index, ($event.target as HTMLInputElement).value)"
            />
            <button class="r-workflow-inline-btn danger" :disabled="readonly" @click="removeGlobalFormField(index)">
              删除
            </button>
          </div>

          <button class="r-workflow-inline-btn" :disabled="readonly" @click="appendGlobalFormField">新增字段</button>
          <p class="r-workflow-field__hint">
            全局表单 schema 会随流程定义保存，可供发起页面动态渲染输入表单。
          </p>
        </div>
      </div>

      <div v-else-if="inspectorTab === 'node'" class="r-workflow-inspector-section">
        <template v-if="selectedNode">
          <label class="r-workflow-field">
            <span>节点标题</span>
            <input
              :value="selectedNode.label"
              :disabled="readonly"
              @input="updateSelectedNodeLabel(($event.target as HTMLInputElement).value)"
            />
          </label>

          <label class="r-workflow-field">
            <span>节点类型</span>
            <input :value="selectedNode.type" disabled />
          </label>

          <label v-if="selectedNode.type === 'approval'" class="r-workflow-field">
            <span>审批人选择器模式</span>
            <select
              :value="readConfigText('selector_mode') || 'users'"
              :disabled="readonly"
              @change="updateSelectedNodeConfig('selector_mode', ($event.target as HTMLSelectElement).value)"
            >
              <option value="users">指定人员</option>
              <option value="role">按角色</option>
              <option value="department">按部门</option>
              <option value="supervisor">发起人上级</option>
            </select>
          </label>

          <label v-if="selectedNode.type === 'approval' && readConfigText('selector_mode') === 'users'" class="r-workflow-field">
            <span>指定审批人</span>
            <select
              class="r-workflow-multiple-select"
              multiple
              :disabled="readonly"
              :value="readConfigIDStringList('user_ids')"
              @change="updateSelectedNodeIDListConfig('user_ids', $event)"
            >
              <option v-for="user in approverUsers" :key="user.id" :value="String(user.id)">
                {{ user.name }} (#{{ user.id }})
              </option>
            </select>
            <p v-if="approverUsers.length === 0" class="r-workflow-field__hint">暂无可选用户，请先配置数据源</p>
          </label>

          <label v-if="selectedNode.type === 'approval' && readConfigText('selector_mode') === 'role'" class="r-workflow-field">
            <span>按角色分配</span>
            <select
              class="r-workflow-multiple-select"
              multiple
              :disabled="readonly"
              :value="readConfigIDStringList('role_ids')"
              @change="updateSelectedNodeIDListConfig('role_ids', $event)"
            >
              <option v-for="role in approverRoles" :key="role.id" :value="String(role.id)">
                {{ role.name }} (#{{ role.id }})
              </option>
            </select>
            <p v-if="approverRoles.length === 0" class="r-workflow-field__hint">暂无可选角色，请先配置数据源</p>
          </label>

          <label v-if="selectedNode.type === 'approval' && readConfigText('selector_mode') === 'department'" class="r-workflow-field">
            <span>按部门分配</span>
            <select
              class="r-workflow-multiple-select"
              multiple
              :disabled="readonly"
              :value="readConfigIDStringList('department_ids')"
              @change="updateSelectedNodeIDListConfig('department_ids', $event)"
            >
              <option v-for="department in approverDepartments" :key="department.id" :value="String(department.id)">
                {{ department.name }} (#{{ department.id }})
              </option>
            </select>
            <p v-if="approverDepartments.length === 0" class="r-workflow-field__hint">暂无可选部门，请先配置数据源</p>
          </label>

          <label v-if="selectedNode.type === 'approval'" class="r-workflow-field">
            <span>多人审批策略</span>
            <select
              :value="readConfigText('approval_strategy') || 'all'"
              :disabled="readonly"
              @change="updateSelectedNodeConfig('approval_strategy', ($event.target as HTMLSelectElement).value)"
            >
              <option value="all">全部通过</option>
              <option value="any">任意一人通过</option>
            </select>
          </label>

          <label v-if="selectedNode.type === 'cc'" class="r-workflow-field">
            <span>抄送对象（用户 ID）</span>
            <input
              :value="readConfigText('ccUsers')"
              :disabled="readonly"
              @input="updateSelectedNodeListConfig('ccUsers', ($event.target as HTMLInputElement).value)"
            />
          </label>

          <label v-if="selectedNode.type === 'condition'" class="r-workflow-field">
            <span>条件规则（可视化）</span>
            <div class="r-workflow-rule-list">
              <div
                v-for="(rule, index) in readConditionRules()"
                :key="`condition-rule-${index}`"
                class="r-workflow-rule-row"
              >
                <input
                  :value="rule.field"
                  :disabled="readonly"
                  placeholder="字段名，例如 amount"
                  @input="updateConditionRule(index, 'field', ($event.target as HTMLInputElement).value)"
                />
                <select
                  :value="rule.operator"
                  :disabled="readonly"
                  @change="updateConditionRule(index, 'operator', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="eq">=</option>
                  <option value="neq">!=</option>
                  <option value="gt">&gt;</option>
                  <option value="gte">&gt;=</option>
                  <option value="lt">&lt;</option>
                  <option value="lte">&lt;=</option>
                  <option value="contains">包含</option>
                </select>
                <input
                  :value="rule.value"
                  :disabled="readonly"
                  placeholder="比较值"
                  @input="updateConditionRule(index, 'value', ($event.target as HTMLInputElement).value)"
                />
                <select
                  :value="rule.target_node_id"
                  :disabled="readonly"
                  @change="updateConditionRule(index, 'target_node_id', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">选择流向节点</option>
                  <option v-for="candidate in conditionTargetOptions" :key="candidate.id" :value="candidate.id">
                    {{ candidate.label }}
                  </option>
                </select>
                <button class="r-workflow-inline-btn danger" :disabled="readonly" @click="removeConditionRule(index)">
                  删除
                </button>
              </div>
              <button class="r-workflow-inline-btn" :disabled="readonly" @click="appendConditionRule">
                新增规则
              </button>
            </div>
          </label>

          <label v-if="selectedNode.type === 'parallel'" class="r-workflow-field">
            <span>并行分支数</span>
            <input
              type="number"
              min="2"
              max="10"
              :value="readConfigNumber('branchCount', 2)"
              :disabled="readonly"
              @input="updateSelectedNodeNumberConfig('branchCount', ($event.target as HTMLInputElement).value)"
            />
          </label>

          <div class="r-workflow-field">
            <span>流出连线</span>
            <div class="r-workflow-edge-list">
              <div v-for="edge in selectedOutgoingEdges" :key="edge.id" class="r-workflow-edge-item">
                <div class="r-workflow-edge-item__meta">
                  <span>{{ edge.source }} -> {{ edge.target }}</span>
                  <input
                    :value="edge.label || ''"
                    :disabled="readonly"
                    placeholder="连线标签"
                    @input="updateEdgeLabel(edge.id, ($event.target as HTMLInputElement).value)"
                  />
                </div>
                <button class="r-workflow-inline-btn danger" :disabled="readonly" @click="removeEdge(edge.id)">删除</button>
              </div>
              <p v-if="selectedOutgoingEdges.length === 0" class="r-workflow-empty">暂无流出连线</p>
            </div>
          </div>
        </template>
        <p v-else class="r-workflow-empty">请选择一个节点查看属性</p>
      </div>

      <div v-else class="r-workflow-validation">
        <ul v-if="issues.length" class="r-workflow-issues">
          <li v-for="issue in issues" :key="`${issue.code}:${issue.message}`" :class="`is-${issue.level}`">
            {{ issue.message }}
          </li>
        </ul>
        <p v-else class="r-workflow-empty">暂无校验问题</p>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type {
  RWorkflowDesignerEmits,
  RWorkflowDesignerProps,
  WorkflowFormFieldSchema,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
  WorkflowNodeTemplate,
  WorkflowNodeType,
  WorkflowValidationIssue,
} from './types'
import {
  cloneGraph,
  createDefaultGraph,
  nextEdgeID,
  nextNodeID,
  validateWorkflowGraph,
  withAutoLayout,
} from './utils'

const props = withDefaults(defineProps<RWorkflowDesignerProps>(), {
  readonly: false,
  height: '760px',
  panelResizable: true,
  approverDataSource: () => ({
    roles: [],
    departments: [],
    users: [],
  }),
})

const emit = defineEmits<RWorkflowDesignerEmits>()

const NODE_WIDTH = 190
const NODE_HEIGHT = 96
const PANEL_MIN_WIDTH = 200
const PANEL_MAX_WIDTH = 500

const nodeTemplates: WorkflowNodeTemplate[] = [
  { type: 'start', label: '开始节点', hint: '流程入口，通常仅一个' },
  { type: 'approval', label: '审批节点', hint: '指定审批人后流转' },
  { type: 'condition', label: '条件分支', hint: '按表达式决定流向' },
  { type: 'parallel', label: '并行节点', hint: '并发多个审批支路' },
  { type: 'cc', label: '抄送节点', hint: '通知相关人员' },
  { type: 'end', label: '结束节点', hint: '流程终点，可多个' },
]

const canvasRef = ref<HTMLElement | null>(null)
const localGraph = ref<WorkflowGraph>(cloneGraph(props.modelValue?.nodes?.length ? props.modelValue : createDefaultGraph()))
const selectedNodeID = ref<string>('')
const linkSourceID = ref<string>('')
const issues = ref<WorkflowValidationIssue[]>([])
const inspectorTab = ref<'global' | 'node' | 'validate'>('node')

const paletteWidth = ref(220)
const inspectorWidth = ref(320)
const panelResizeState = ref<{
  side: 'left' | 'right'
  startX: number
  startWidth: number
} | null>(null)

const panelResizable = computed(() => props.panelResizable !== false)

const designerStyle = computed<Record<string, string>>(() => {
  return {
    height: props.height,
    '--r-workflow-palette-width': `${paletteWidth.value}px`,
    '--r-workflow-inspector-width': `${inspectorWidth.value}px`,
  }
})

const approverRoles = computed(() => props.approverDataSource.roles || [])
const approverDepartments = computed(() => props.approverDataSource.departments || [])
const approverUsers = computed(() => props.approverDataSource.users || [])

const draggingState = ref<{
  nodeID: string
  startX: number
  startY: number
  originalX: number
  originalY: number
} | null>(null)

const selectedNode = computed<WorkflowNode | undefined>(() => {
  return localGraph.value.nodes.find((node) => node.id === selectedNodeID.value)
})

const selectedOutgoingEdges = computed<WorkflowEdge[]>(() => {
  if (!selectedNode.value) return []
  return localGraph.value.edges.filter((edge) => edge.source === selectedNode.value?.id)
})

const conditionTargetOptions = computed<Array<{ id: string; label: string }>>(() => {
  if (!selectedNode.value) return []

  const nodeMap = new Map(localGraph.value.nodes.map((node) => [node.id, node]))
  return selectedOutgoingEdges.value
    .map((edge) => {
      const target = nodeMap.get(edge.target)
      if (!target) return null
      return {
        id: target.id,
        label: `${target.label} (${target.type})`,
      }
    })
    .filter((item): item is { id: string; label: string } => Boolean(item))
})

const edgePaths = computed(() => {
  const nodeMap = new Map(localGraph.value.nodes.map((node) => [node.id, node]))

  return localGraph.value.edges
    .map((edge) => {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)
      if (!source || !target) return null

      const sourceX = source.x + NODE_WIDTH / 2
      const sourceY = source.y + NODE_HEIGHT / 2
      const targetX = target.x + NODE_WIDTH / 2
      const targetY = target.y + NODE_HEIGHT / 2
      const offset = Math.max(Math.abs(targetX - sourceX) * 0.35, 90)

      return {
        id: edge.id,
        path: `M ${sourceX} ${sourceY} C ${sourceX + offset} ${sourceY}, ${targetX - offset} ${targetY}, ${targetX} ${targetY}`,
      }
    })
    .filter((item): item is { id: string; path: string } => Boolean(item))
})

watch(
  () => props.modelValue,
  (graph) => {
    if (!graph) return
    localGraph.value = cloneGraph(graph)
  },
  { deep: true },
)

function commitGraphChange(): void {
  const cloned = cloneGraph(localGraph.value)
  emit('update:modelValue', cloned)
  emit('change', cloned)
}

function runValidation(): void {
  issues.value = validateWorkflowGraph(localGraph.value)
  emit('validate', issues.value)
}

function clearEdges(): void {
  if (props.readonly) return
  localGraph.value.edges = []
  commitGraphChange()
  runValidation()
}

function autoLayout(): void {
  if (props.readonly) return
  localGraph.value = withAutoLayout(localGraph.value)
  commitGraphChange()
}

function handlePaletteDragStart(event: DragEvent, type: WorkflowNodeType): void {
  if (!event.dataTransfer || props.readonly) return
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/r-workflow-node-type', type)
}

function addNodeAtViewportCenter(type: WorkflowNodeType): void {
  if (props.readonly) return
  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return

  addNode(type, canvasRect.width / 2 - NODE_WIDTH / 2, canvasRect.height / 2 - NODE_HEIGHT / 2)
}

function handleCanvasDrop(event: DragEvent): void {
  if (props.readonly) return
  const type = event.dataTransfer?.getData('application/r-workflow-node-type') as WorkflowNodeType
  if (!type) return

  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect) return

  const x = event.clientX - canvasRect.left - NODE_WIDTH / 2
  const y = event.clientY - canvasRect.top - NODE_HEIGHT / 2
  addNode(type, x, y)
}

function addNode(type: WorkflowNodeType, x: number, y: number): void {
  const node = {
    id: nextNodeID(type),
    type,
    label: defaultNodeLabel(type, localGraph.value.nodes.length + 1),
    x: Math.max(24, x),
    y: Math.max(24, y),
    config: defaultNodeConfig(type),
  } satisfies WorkflowNode

  localGraph.value.nodes.push(node)
  selectedNodeID.value = node.id
  inspectorTab.value = 'node'
  commitGraphChange()
  runValidation()
}

function removeNode(nodeID: string): void {
  if (props.readonly) return

  localGraph.value.nodes = localGraph.value.nodes.filter((node) => node.id !== nodeID)
  localGraph.value.edges = localGraph.value.edges.filter((edge) => edge.source !== nodeID && edge.target !== nodeID)
  if (selectedNodeID.value === nodeID) {
    selectedNodeID.value = ''
  }
  if (linkSourceID.value === nodeID) {
    linkSourceID.value = ''
  }
  commitGraphChange()
  runValidation()
}

function beginLink(nodeID: string): void {
  if (props.readonly) return
  linkSourceID.value = linkSourceID.value === nodeID ? '' : nodeID
}

function handleNodeClick(nodeID: string): void {
  selectedNodeID.value = nodeID
  inspectorTab.value = 'node'
  if (!linkSourceID.value || linkSourceID.value === nodeID || props.readonly) return

  const duplicated = localGraph.value.edges.some(
    (edge) => edge.source === linkSourceID.value && edge.target === nodeID,
  )
  if (!duplicated) {
    localGraph.value.edges.push({
      id: nextEdgeID(),
      source: linkSourceID.value,
      target: nodeID,
    })
    commitGraphChange()
    runValidation()
  }
  linkSourceID.value = ''
}

function startPanelResize(event: MouseEvent, side: 'left' | 'right'): void {
  if (!panelResizable.value) return
  panelResizeState.value = {
    side,
    startX: event.clientX,
    startWidth: side === 'left' ? paletteWidth.value : inspectorWidth.value,
  }
  window.addEventListener('mousemove', handlePanelResizeMove)
  window.addEventListener('mouseup', stopPanelResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function handlePanelResizeMove(event: MouseEvent): void {
  if (!panelResizeState.value) return
  const deltaX = event.clientX - panelResizeState.value.startX

  if (panelResizeState.value.side === 'left') {
    paletteWidth.value = Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, panelResizeState.value.startWidth + deltaX))
    return
  }
  inspectorWidth.value = Math.max(PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, panelResizeState.value.startWidth - deltaX))
}

function stopPanelResize(): void {
  panelResizeState.value = null
  window.removeEventListener('mousemove', handlePanelResizeMove)
  window.removeEventListener('mouseup', stopPanelResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function ensureGraphMeta(): Record<string, unknown> {
  const current = localGraph.value.meta
  if (current && typeof current === 'object' && !Array.isArray(current)) {
    return current
  }
  localGraph.value.meta = {}
  return localGraph.value.meta
}

function readGlobalMetaText(key: string): string {
  const meta = ensureGraphMeta()
  const value = meta[key]
  return typeof value === 'string' ? value : ''
}

function updateGlobalMetaText(key: string, value: string): void {
  const meta = ensureGraphMeta()
  meta[key] = value.trim()
  commitGraphChange()
}

function readGlobalFormFields(): WorkflowFormFieldSchema[] {
  const meta = ensureGraphMeta()
  const raw = meta.form_fields
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map((item) => {
    const row = (item || {}) as Record<string, unknown>
    const typeRaw = String(row.type || 'text')
    const type = ['text', 'number', 'textarea', 'select', 'date'].includes(typeRaw) ? typeRaw : 'text'
    const result: WorkflowFormFieldSchema = {
      key: String(row.key || ''),
      label: String(row.label || ''),
      type: type as WorkflowFormFieldSchema['type'],
      required: Boolean(row.required),
      placeholder: String(row.placeholder || ''),
    }

    if (Array.isArray(row.options)) {
      result.options = row.options
        .map((entry) => {
          const option = (entry || {}) as Record<string, unknown>
          const label = String(option.label || '')
          const value = String(option.value || '')
          if (!label && !value) return null
          return {
            label: label || value,
            value: value || label,
          }
        })
        .filter((option): option is { label: string; value: string } => Boolean(option))
    }

    return result
  })
}

function writeGlobalFormFields(fields: WorkflowFormFieldSchema[]): void {
  const meta = ensureGraphMeta()
  meta.form_fields = fields
  commitGraphChange()
}

function appendGlobalFormField(): void {
  if (props.readonly) return
  const fields = readGlobalFormFields()
  fields.push({
    key: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
  })
  writeGlobalFormFields(fields)
}

function removeGlobalFormField(index: number): void {
  if (props.readonly) return
  const fields = readGlobalFormFields()
  fields.splice(index, 1)
  writeGlobalFormFields(fields)
}

function updateGlobalFormField(index: number, key: keyof WorkflowFormFieldSchema, value: unknown): void {
  if (props.readonly) return
  const fields = readGlobalFormFields()
  if (!fields[index]) return

  if (key === 'required') {
    fields[index].required = Boolean(value)
  } else if (key === 'type') {
    const typed = String(value || 'text')
    fields[index].type = ['text', 'number', 'textarea', 'select', 'date'].includes(typed)
      ? (typed as WorkflowFormFieldSchema['type'])
      : 'text'
    if (fields[index].type !== 'select') {
      fields[index].options = []
    }
  } else {
    fields[index][key] = String(value || '').trim() as never
  }

  writeGlobalFormFields(fields)
}

function readGlobalFieldOptionsText(field: WorkflowFormFieldSchema): string {
  const options = field.options || []
  return options.map((option) => option.label || option.value).join(', ')
}

function updateGlobalFormFieldOptions(index: number, raw: string): void {
  if (props.readonly) return
  const fields = readGlobalFormFields()
  if (!fields[index]) return

  const options = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({ label: item, value: item }))
  fields[index].options = options
  writeGlobalFormFields(fields)
}

function removeEdge(edgeID: string): void {
  if (props.readonly) return
  localGraph.value.edges = localGraph.value.edges.filter((edge) => edge.id !== edgeID)
  commitGraphChange()
  runValidation()
}

function updateEdgeLabel(edgeID: string, label: string): void {
  if (props.readonly) return
  const edge = localGraph.value.edges.find((item) => item.id === edgeID)
  if (!edge) return
  edge.label = label.trim()
  commitGraphChange()
}

function startNodeDrag(event: MouseEvent, nodeID: string): void {
  if (props.readonly) return
  if ((event.target as HTMLElement).closest('.r-workflow-node__actions')) return

  const node = localGraph.value.nodes.find((item) => item.id === nodeID)
  if (!node) return

  draggingState.value = {
    nodeID,
    startX: event.clientX,
    startY: event.clientY,
    originalX: node.x,
    originalY: node.y,
  }

  window.addEventListener('mousemove', handleNodeDragMove)
  window.addEventListener('mouseup', stopNodeDrag)
}

function handleNodeDragMove(event: MouseEvent): void {
  if (!draggingState.value) return
  const node = localGraph.value.nodes.find((item) => item.id === draggingState.value?.nodeID)
  if (!node) return

  const deltaX = event.clientX - draggingState.value.startX
  const deltaY = event.clientY - draggingState.value.startY
  node.x = Math.max(16, draggingState.value.originalX + deltaX)
  node.y = Math.max(16, draggingState.value.originalY + deltaY)
}

function stopNodeDrag(): void {
  if (draggingState.value) {
    commitGraphChange()
  }
  draggingState.value = null
  window.removeEventListener('mousemove', handleNodeDragMove)
  window.removeEventListener('mouseup', stopNodeDrag)
}

function updateSelectedNodeLabel(label: string): void {
  if (!selectedNode.value || props.readonly) return
  selectedNode.value.label = label.trim() || selectedNode.value.label
  commitGraphChange()
}

function updateSelectedNodeConfig(key: string, value: string): void {
  if (!selectedNode.value || props.readonly) return
  selectedNode.value.config = {
    ...(selectedNode.value.config || {}),
    [key]: value,
  }
  commitGraphChange()
}

function updateSelectedNodeNumberConfig(key: string, value: string): void {
  if (!selectedNode.value || props.readonly) return
  const parsed = Number(value)
  selectedNode.value.config = {
    ...(selectedNode.value.config || {}),
    [key]: Number.isFinite(parsed) ? parsed : 2,
  }
  commitGraphChange()
}

function updateSelectedNodeListConfig(key: string, raw: string): void {
  if (!selectedNode.value || props.readonly) return
  const list = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const numeric = Number(item)
      if (Number.isFinite(numeric) && !Number.isNaN(numeric)) {
        return numeric
      }
      return item
    })
  selectedNode.value.config = {
    ...(selectedNode.value.config || {}),
    [key]: list,
  }
  commitGraphChange()
}

function readConfigIDStringList(key: string): string[] {
  if (!selectedNode.value?.config) return []
  const raw = selectedNode.value.config[key]
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0)
    .map((item) => String(item))
}

function updateSelectedNodeIDListConfig(key: string, event: Event): void {
  if (!selectedNode.value || props.readonly) return
  const target = event.target as HTMLSelectElement
  const selected = Array.from(target.selectedOptions)
    .map((option) => Number(option.value))
    .filter((item) => Number.isFinite(item) && item > 0)

  selectedNode.value.config = {
    ...(selectedNode.value.config || {}),
    [key]: selected,
  }
  commitGraphChange()
}

function readConditionRules(): Array<{
  field: string
  operator: string
  value: string
  target_node_id: string
}> {
  const raw = selectedNode.value?.config?.rules
  if (!Array.isArray(raw)) return []

  return raw.map((item) => {
    const rule = (item || {}) as Record<string, unknown>
    return {
      field: String(rule.field || ''),
      operator: String(rule.operator || 'eq'),
      value: String(rule.value || ''),
      target_node_id: String(rule.target_node_id || ''),
    }
  })
}

function appendConditionRule(): void {
  if (!selectedNode.value || props.readonly) return
  const rules = readConditionRules()
  const fallbackTarget = conditionTargetOptions.value[0]?.id || ''
  rules.push({ field: '', operator: 'eq', value: '', target_node_id: fallbackTarget })
  selectedNode.value.config = {
    ...(selectedNode.value.config || {}),
    rules,
  }
  commitGraphChange()
}

function removeConditionRule(index: number): void {
  if (!selectedNode.value || props.readonly) return
  const rules = readConditionRules()
  rules.splice(index, 1)
  selectedNode.value.config = {
    ...(selectedNode.value.config || {}),
    rules,
  }
  commitGraphChange()
}

function updateConditionRule(
  index: number,
  key: 'field' | 'operator' | 'value' | 'target_node_id',
  value: string,
): void {
  if (!selectedNode.value || props.readonly) return
  const rules = readConditionRules()
  if (!rules[index]) return
  rules[index][key] = value
  selectedNode.value.config = {
    ...(selectedNode.value.config || {}),
    rules,
  }
  commitGraphChange()
}

function readConfigText(key: string): string {
  if (!selectedNode.value?.config) return ''
  const value = selectedNode.value.config[key]
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ')
  }
  return typeof value === 'string' ? value : ''
}

function readConfigNumber(key: string, fallback: number): number {
  if (!selectedNode.value?.config) return fallback
  const raw = selectedNode.value.config[key]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback
}

function defaultNodeLabel(type: WorkflowNodeType, seq: number): string {
  if (type === 'start') return '开始'
  if (type === 'end') return '结束'
  if (type === 'approval') return `审批节点 ${seq}`
  if (type === 'condition') return `条件分支 ${seq}`
  if (type === 'parallel') return `并行节点 ${seq}`
  return `抄送节点 ${seq}`
}

function defaultNodeConfig(type: WorkflowNodeType): Record<string, unknown> | undefined {
  if (type === 'approval') {
    return { selector_mode: 'users', user_ids: [], approval_strategy: 'all' }
  }
  if (type === 'cc') {
    return { ccUsers: [] }
  }
  if (type === 'condition') {
    return { rules: [] }
  }
  if (type === 'parallel') {
    return { branchCount: 2 }
  }
  return undefined
}

onBeforeUnmount(() => {
  stopPanelResize()
  stopNodeDrag()
})
</script>

<style scoped>
.r-workflow-designer {
  display: grid;
  grid-template-columns: var(--r-workflow-palette-width) 8px minmax(0, 1fr) 8px var(--r-workflow-inspector-width);
  gap: 12px;
}

.r-workflow-resizer {
  position: relative;
  cursor: col-resize;
  border-radius: 6px;
  background: linear-gradient(180deg, transparent 0%, rgba(148, 163, 184, 0.34) 50%, transparent 100%);
}

.r-workflow-resizer::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: 2px;
  height: 100%;
  background: rgba(100, 116, 139, 0.26);
}

.r-workflow-resizer:hover::after {
  background: rgba(37, 99, 235, 0.45);
}

.r-workflow-panel {
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: var(--ra-radius-lg, 10px);
  background: var(--ra-color-surface, #fff);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.r-workflow-panel__title {
  font-size: var(--ra-font-size-sm, 13px);
  font-weight: 600;
  padding: 12px;
  border-bottom: 1px solid var(--ra-color-border, #e5e7eb);
}

.r-workflow-panel--palette,
.r-workflow-panel--inspector {
  overflow: auto;
}

.r-workflow-inspector-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 10px;
  border-bottom: 1px solid var(--ra-color-border, #e5e7eb);
}

.r-workflow-tab {
  border: 1px solid var(--ra-color-border, #d1d5db);
  border-radius: 6px;
  background: #fff;
  padding: 5px 8px;
  font-size: 12px;
  cursor: pointer;
}

.r-workflow-tab.is-active {
  border-color: #2563eb;
  color: #1d4ed8;
  background: #eff6ff;
}

.r-workflow-inspector-section {
  min-height: 0;
}

.r-workflow-palette-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.r-workflow-palette-item {
  border: 1px solid var(--ra-color-border, #d1d5db);
  border-radius: 8px;
  background: var(--ra-color-surface, #fff);
  cursor: pointer;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
}

.r-workflow-palette-item span {
  font-size: 12px;
  color: var(--ra-color-text-tertiary, #6b7280);
}

.r-workflow-tip {
  padding: 0 12px 12px;
  margin: 0;
  font-size: 12px;
  color: var(--ra-color-text-tertiary, #6b7280);
}

.r-workflow-canvas-wrap {
  min-width: 0;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: var(--ra-radius-lg, 10px);
  background: linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.r-workflow-toolbar {
  border-bottom: 1px solid var(--ra-color-border, #d1d5db);
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.86);
}

.r-workflow-btn {
  border: 1px solid var(--ra-color-border, #d1d5db);
  background: #fff;
  color: var(--ra-color-text-secondary, #374151);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.r-workflow-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.r-workflow-linking-hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--ra-color-primary, #2563eb);
}

.r-workflow-canvas {
  position: relative;
  flex: 1;
  overflow: auto;
  min-height: 0;
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.18) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.18) 1px, transparent 1px);
  background-size: 26px 26px;
}

.r-workflow-edges {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  color: #64748b;
}

.r-workflow-edge {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.r-workflow-node {
  position: absolute;
  width: 190px;
  min-height: 96px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  cursor: move;
  user-select: none;
}

.r-workflow-node.is-selected {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.16);
}

.r-workflow-node.is-link-source {
  border-color: #d97706;
  box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
}

.r-workflow-node.node-start {
  background: #ecfeff;
}

.r-workflow-node.node-end {
  background: #ecfdf5;
}

.r-workflow-node.node-condition {
  background: #fff7ed;
}

.r-workflow-node__title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.r-workflow-node__meta {
  margin-top: 4px;
  font-size: 11px;
  text-transform: uppercase;
  color: #64748b;
}

.r-workflow-node__actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.r-workflow-inline-btn {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}

.r-workflow-inline-btn.danger {
  color: #b91c1c;
}

.r-workflow-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px dashed var(--ra-color-border, #e5e7eb);
}

.r-workflow-field span {
  font-size: 12px;
  color: var(--ra-color-text-tertiary, #6b7280);
}

.r-workflow-field input,
.r-workflow-field select,
.r-workflow-field textarea {
  border: 1px solid var(--ra-color-border, #d1d5db);
  border-radius: 6px;
  padding: 8px;
  font-size: 13px;
  color: #0f172a;
}

.r-workflow-field textarea {
  min-height: 72px;
  resize: vertical;
}

.r-workflow-field__hint {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.r-workflow-form-field-head,
.r-workflow-form-field-row {
  display: grid;
  grid-template-columns: 100px 100px 84px 74px 1fr auto;
  gap: 6px;
  align-items: center;
}

.r-workflow-form-field-head {
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
}

.r-workflow-form-field-row {
  margin-bottom: 8px;
}

.r-workflow-checkbox-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.r-workflow-checkbox-cell input {
  margin: 0;
}

.r-workflow-multiple-select {
  min-height: 110px;
}

.r-workflow-edge-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.r-workflow-edge-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--ra-color-border, #e5e7eb);
  border-radius: 6px;
  font-size: 12px;
}

.r-workflow-edge-item__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.r-workflow-edge-item__meta input {
  border: 1px solid var(--ra-color-border, #d1d5db);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
}

.r-workflow-rule-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.r-workflow-rule-row {
  display: grid;
  grid-template-columns: 1fr 80px 1fr 1fr auto;
  gap: 6px;
}

.r-workflow-rule-row input,
.r-workflow-rule-row select {
  border: 1px solid var(--ra-color-border, #d1d5db);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
}

.r-workflow-validation {
  padding-bottom: 10px;
}

.r-workflow-issues {
  margin: 0;
  padding: 8px 12px 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.r-workflow-issues li {
  font-size: 12px;
  border-radius: 6px;
  padding: 6px 8px;
}

.r-workflow-issues .is-error {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.r-workflow-issues .is-warning {
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.r-workflow-empty {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  color: var(--ra-color-text-tertiary, #6b7280);
}

@media (max-width: 1280px) {
  .r-workflow-designer {
    grid-template-columns: 1fr;
    height: auto !important;
  }

  .r-workflow-resizer {
    display: none;
  }

  .r-workflow-panel--palette,
  .r-workflow-panel--inspector {
    max-height: 320px;
  }

  .r-workflow-canvas-wrap {
    min-height: 640px;
  }
}
</style>
