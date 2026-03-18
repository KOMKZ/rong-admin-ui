import type {
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowValidationIssue,
} from './types'

const START_X = 160
const START_Y = 90
const STEP_Y = 150

let sequenceSeed = 0

export function nextNodeID(type: WorkflowNodeType): string {
  sequenceSeed += 1
  return `${type}_${Date.now()}_${sequenceSeed}`
}

export function nextEdgeID(): string {
  sequenceSeed += 1
  return `edge_${Date.now()}_${sequenceSeed}`
}

export function cloneGraph(graph: WorkflowGraph): WorkflowGraph {
  const cloneValue = <T>(value: T): T => {
    if (value == null) return value
    return JSON.parse(JSON.stringify(value)) as T
  }

  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      config: node.config ? cloneValue(node.config) : undefined,
    })),
    edges: graph.edges.map((edge) => ({ ...edge })),
    meta: graph.meta ? cloneValue(graph.meta) : undefined,
  }
}

export function createDefaultGraph(): WorkflowGraph {
  const startID = nextNodeID('start')
  const endID = nextNodeID('end')

  return {
    nodes: [
      { id: startID, type: 'start', label: '开始', x: START_X, y: START_Y },
      { id: endID, type: 'end', label: '结束', x: START_X, y: START_Y + STEP_Y },
    ],
    edges: [
      {
        id: nextEdgeID(),
        source: startID,
        target: endID,
      },
    ],
    meta: {
      form_fields: [],
      description: '',
    },
  }
}

export function withAutoLayout(graph: WorkflowGraph): WorkflowGraph {
  const cloned = cloneGraph(graph)
  const ordered = [...cloned.nodes].sort((a, b) => {
    if (a.type === 'start') return -1
    if (b.type === 'start') return 1
    if (a.type === 'end') return 1
    if (b.type === 'end') return -1
    return a.y - b.y
  })

  ordered.forEach((node, index) => {
    node.x = START_X + (index % 2) * 260
    node.y = START_Y + Math.floor(index / 2) * STEP_Y
  })

  return cloned
}

export function validateWorkflowGraph(graph: WorkflowGraph): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = []

  if (!graph.nodes.length) {
    issues.push({ code: 'NODE_EMPTY', message: '流程中至少需要一个节点', level: 'error' })
    return issues
  }

  const nodeByID = new Map<string, WorkflowNode>()
  graph.nodes.forEach((node) => {
    nodeByID.set(node.id, node)
  })

  const startNodes = graph.nodes.filter((node) => node.type === 'start')
  const endNodes = graph.nodes.filter((node) => node.type === 'end')

  if (startNodes.length !== 1) {
    issues.push({ code: 'START_COUNT', message: '必须且只能有一个开始节点', level: 'error' })
  }
  if (endNodes.length < 1) {
    issues.push({ code: 'END_MISSING', message: '至少需要一个结束节点', level: 'error' })
  }

  const outboundMap = new Map<string, WorkflowEdge[]>()
  graph.nodes.forEach((node) => {
    outboundMap.set(node.id, [])
  })

  for (const edge of graph.edges) {
    if (!nodeByID.has(edge.source) || !nodeByID.has(edge.target)) {
      issues.push({ code: 'EDGE_BROKEN', message: '存在连接到不存在节点的连线', level: 'error' })
      continue
    }

    outboundMap.get(edge.source)?.push(edge)
  }

  for (const node of graph.nodes) {
    if (node.type === 'end') continue
    if ((outboundMap.get(node.id) ?? []).length === 0) {
      issues.push({ code: 'NODE_DANGLING', message: `节点「${node.label}」缺少流出连线`, level: 'warning' })
    }
  }

  if (startNodes.length === 1 && endNodes.length > 0) {
    const visited = walkReachable(startNodes[0].id, outboundMap)
    const hasReachableEnd = endNodes.some((node) => visited.has(node.id))
    if (!hasReachableEnd) {
      issues.push({ code: 'END_UNREACHABLE', message: '开始节点无法到达任何结束节点', level: 'error' })
    }
  }

  const rawFields = graph.meta?.form_fields
  if (Array.isArray(rawFields)) {
    const keySet = new Set<string>()
    for (const row of rawFields) {
      if (!row || typeof row !== 'object') continue
      const field = row as Record<string, unknown>
      const key = String(field.key || '').trim()
      const label = String(field.label || '').trim()
      if (!key || !label) {
        issues.push({ code: 'FORM_FIELD_INVALID', message: '发起表单字段必须填写字段 key 和标题', level: 'warning' })
        continue
      }
      if (keySet.has(key)) {
        issues.push({ code: 'FORM_FIELD_DUPLICATED', message: `发起表单字段 key 重复：${key}`, level: 'error' })
        continue
      }
      keySet.add(key)
    }
  }

  return issues
}

function walkReachable(startID: string, outboundMap: Map<string, WorkflowEdge[]>): Set<string> {
  const visited = new Set<string>()
  const queue: string[] = [startID]

  while (queue.length > 0) {
    const current = queue.shift() as string
    if (visited.has(current)) continue
    visited.add(current)

    const edges = outboundMap.get(current) ?? []
    for (const edge of edges) {
      if (!visited.has(edge.target)) {
        queue.push(edge.target)
      }
    }
  }

  return visited
}
