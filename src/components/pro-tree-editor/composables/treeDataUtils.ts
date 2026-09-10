import type { TreeError, TreeErrorCode, TreeNodeData } from '../types'

export function cloneTree(nodes: TreeNodeData[]): TreeNodeData[] {
  return nodes.map((n) => ({
    ...n,
    children: n.children ? cloneTree(n.children) : undefined,
  }))
}

export function flattenTree(nodes: TreeNodeData[]): TreeNodeData[] {
  const result: TreeNodeData[] = []
  const walk = (items: TreeNodeData[]): void => {
    for (const n of items) {
      result.push(n)
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return result
}

export function findNode(nodes: TreeNodeData[], id: string | number): TreeNodeData | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

export function findParentList(nodes: TreeNodeData[], id: string | number): TreeNodeData[] | null {
  for (const n of nodes) {
    if (n.id === id) return nodes
    if (n.children) {
      const found = findParentList(n.children, id)
      if (found) return found
    }
  }
  return null
}

export function removeNode(nodes: TreeNodeData[], id: string | number): boolean {
  const idx = nodes.findIndex((n) => n.id === id)
  if (idx >= 0) {
    nodes.splice(idx, 1)
    return true
  }
  for (const n of nodes) {
    if (n.children && removeNode(n.children, id)) return true
  }
  return false
}

export function isDescendantOf(
  nodes: TreeNodeData[],
  nodeId: string | number,
  ancestorId: string | number,
): boolean {
  const ancestor = findNode(nodes, ancestorId)
  if (!ancestor?.children) return false
  return !!findNode(ancestor.children, nodeId)
}

function extractErrorMessage(err: unknown): string {
  if (err === null || err === undefined) {
    return '未知错误'
  }

  if (typeof err === 'string') {
    return err || '未知错误'
  }

  if (err instanceof Error) {
    return err.message || '未知错误'
  }

  if (typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (e.responseBody && typeof e.responseBody === 'object') {
      const rb = e.responseBody as Record<string, unknown>
      if (typeof rb.msg === 'string' && rb.msg) return rb.msg
      if (typeof rb.message === 'string' && rb.message) return rb.message
      if (typeof rb.error === 'string' && rb.error) return rb.error
    }
    if (typeof e.message === 'string' && e.message) return e.message
    if (typeof e.msg === 'string' && e.msg) return e.msg
    if (typeof e.error === 'string' && e.error) return e.error
  }

  return '未知错误'
}

export function parseTreeError(err: unknown): TreeError {
  const msg = extractErrorMessage(err)
  const codeMap: Record<string, TreeErrorCode> = {
    'folder name already exists': 'DUPLICATE_NAME',
    'invalid folder name': 'INVALID_NAME',
    'parent folder not found': 'PARENT_NOT_FOUND',
    'cannot move folder to its own descendant': 'CIRCULAR_REFERENCE',
    'max folder depth exceeded': 'MAX_DEPTH_EXCEEDED',
    'cannot delete folder with children': 'HAS_CHILDREN',
    'folder has articles': 'FOLDER_HAS_ARTICLES',
    'folder not found': 'NOT_FOUND',
  }
  let code: TreeErrorCode = 'UNKNOWN'
  for (const [pattern, c] of Object.entries(codeMap)) {
    if (msg.toLowerCase().includes(pattern.toLowerCase())) {
      code = c
      break
    }
  }
  if (
    code === 'UNKNOWN' &&
    (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch'))
  ) {
    code = 'NETWORK_ERROR'
  }
  return { code, message: msg, raw: err }
}
