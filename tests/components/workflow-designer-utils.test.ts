import { describe, expect, it } from 'vitest'
import {
  createDefaultGraph,
  validateWorkflowGraph,
  withAutoLayout,
} from '../../src/components/workflow-designer'

describe('workflow-designer utils', () => {
  it('creates a default graph with start and end', () => {
    const graph = createDefaultGraph()
    expect(graph.nodes).toHaveLength(2)
    expect(graph.nodes.some((node) => node.type === 'start')).toBe(true)
    expect(graph.nodes.some((node) => node.type === 'end')).toBe(true)
    expect(graph.edges).toHaveLength(1)
  })

  it('reports validation error when start node missing', () => {
    const graph = createDefaultGraph()
    graph.nodes = graph.nodes.filter((node) => node.type !== 'start')
    graph.edges = []

    const issues = validateWorkflowGraph(graph)
    expect(issues.some((issue) => issue.code === 'START_COUNT')).toBe(true)
  })

  it('auto-layout keeps same node count', () => {
    const graph = createDefaultGraph()
    graph.nodes.push({
      id: 'approval_1',
      type: 'approval',
      label: '审批',
      x: 500,
      y: 500,
      config: { approvers: ['u1'] },
    })

    const next = withAutoLayout(graph)
    expect(next.nodes).toHaveLength(graph.nodes.length)
    expect(next.nodes.find((node) => node.id === 'approval_1')?.x).not.toBe(500)
  })
})
