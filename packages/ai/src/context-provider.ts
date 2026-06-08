import { EditorState, MindMapNode } from '@y-mindmap/state'
import { TopicType, StructureType } from '@y-mindmap/core'

export interface DocumentContext {
  title: string
  nodeCount: number
  maxDepth: number
  leafCount: number
  branchCount: number
  structureType: string | undefined
}

export interface SelectionContext {
  nodeIds: string[]
  titles: string[]
  count: number
  types: string[]
  hasChildren: boolean
  parentTitles: string[]
}

export interface NodeContext {
  id: string
  title: string
  type: string
  depth: number
  childCount: number
  hasMarkers: boolean
  hasLabels: boolean
  hasNotes: boolean
  hasImage: boolean
  isFolded: boolean
}

export interface FullContext {
  document: DocumentContext
  selection: SelectionContext
  selectedNodes: NodeContext[]
  statistics: StatisticsContext
}

export interface StatisticsContext {
  totalNodes: number
  nodesByType: Record<string, number>
  nodesByDepth: Record<number, number>
  averageChildrenPerNode: number
  maxChildrenNode: { id: string; title: string; childCount: number } | null
  emptyNodes: string[]
}

export class ContextProvider {
  private state: EditorState

  constructor(state: EditorState) {
    this.state = state
  }

  getDocumentContext(): DocumentContext {
    const root = this.state.doc.root
    let nodeCount = 0
    let maxDepth = 0
    let leafCount = 0

    this.traverseTree(root, 0, (node, depth) => {
      nodeCount++
      maxDepth = Math.max(maxDepth, depth)
      if (node.attachedChildren.length === 0) {
        leafCount++
      }
    })

    return {
      title: root.title,
      nodeCount,
      maxDepth,
      leafCount,
      branchCount: root.attachedChildren.length,
      structureType: root.structureClass,
    }
  }

  getSelectionContext(): SelectionContext {
    const selectedIds = this.state.selection.all
    const nodes = selectedIds
      .map(id => this.state.doc.getNodeById(id))
      .filter((n): n is MindMapNode => n !== null)

    return {
      nodeIds: selectedIds,
      titles: nodes.map(n => n.title),
      count: selectedIds.length,
      types: nodes.map(n => n.type),
      hasChildren: nodes.some(n => n.hasChildren),
      parentTitles: nodes.map(n => {
        const parent = this.findParent(n.id)
        return parent?.title || ''
      }).filter(Boolean),
    }
  }

  getSelectedNodesContext(): NodeContext[] {
    return this.state.selection.all
      .map(id => this.getNodeContext(id))
      .filter((n): n is NodeContext => n !== null)
  }

  getNodeContext(nodeId: string): NodeContext | null {
    const node = this.state.doc.getNodeById(nodeId)
    if (!node) return null

    return {
      id: node.id,
      title: node.title,
      type: node.type,
      depth: this.getNodeDepth(nodeId),
      childCount: node.attachedChildren.length,
      hasMarkers: node.markers.length > 0,
      hasLabels: node.labels.length > 0,
      hasNotes: !!node.notes?.plain,
      hasImage: !!node.image,
      isFolded: node.isFolded,
    }
  }

  getStatistics(): StatisticsContext {
    const nodesByType: Record<string, number> = {}
    const nodesByDepth: Record<number, number> = {}
    let totalChildren = 0
    let maxChildrenNode: { id: string; title: string; childCount: number } | null = null
    const emptyNodes: string[] = []

    this.state.doc.root.descendants((node) => {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1

      const depth = this.getNodeDepth(node.id)
      nodesByDepth[depth] = (nodesByDepth[depth] || 0) + 1

      const childCount = node.attachedChildren.length
      totalChildren += childCount

      if (!maxChildrenNode || childCount > maxChildrenNode.childCount) {
        maxChildrenNode = { id: node.id, title: node.title, childCount }
      }

      if (node.title.trim() === '' && node.type !== TopicType.ROOT) {
        emptyNodes.push(node.id)
      }
    })

    let nodeCount = 0
    this.state.doc.root.descendants(() => nodeCount++)

    return {
      totalNodes: nodeCount,
      nodesByType,
      nodesByDepth,
      averageChildrenPerNode: nodeCount > 0 ? totalChildren / nodeCount : 0,
      maxChildrenNode,
      emptyNodes,
    }
  }

  getFullContext(): FullContext {
    return {
      document: this.getDocumentContext(),
      selection: this.getSelectionContext(),
      selectedNodes: this.getSelectedNodesContext(),
      statistics: this.getStatistics(),
    }
  }

  private getNodeDepth(nodeId: string): number {
    let depth = 0
    let current = this.findParent(nodeId)

    while (current) {
      depth++
      current = this.findParent(current.id)
    }

    return depth
  }

  private findParent(nodeId: string): MindMapNode | null {
    let result: MindMapNode | null = null

    this.state.doc.root.descendants((node) => {
      for (const children of Object.values(node.children)) {
        if (children.some(c => c.id === nodeId)) {
          result = node
          return false
        }
      }
      return true
    })

    return result
  }

  private traverseTree(
    node: MindMapNode,
    depth: number,
    callback: (node: MindMapNode, depth: number) => void
  ): void {
    callback(node, depth)
    for (const child of node.attachedChildren) {
      this.traverseTree(child, depth + 1, callback)
    }
  }
}
