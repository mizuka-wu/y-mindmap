import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, LayoutOptions, NodeLayout, ConnectionLayout, DEFAULT_LAYOUT_OPTIONS } from './types'
import { calculateNodeSize, calculateBounds, mergeOptions, getAttachedChildren } from './utils'

export class IncrementalLayoutEngine {
  private baseEngine: LayoutEngine
  private cache: Map<string, LayoutResult> = new Map()

  constructor(baseEngine: LayoutEngine) {
    this.baseEngine = baseEngine
  }

  calculate(root: MindMapNode, options?: Partial<LayoutOptions>): LayoutResult {
    return this.baseEngine.calculate(root, options as LayoutOptions)
  }

  calculateIncremental(
    root: MindMapNode,
    changedNodes: Set<string>,
    previousResult: LayoutResult,
    options?: Partial<LayoutOptions>
  ): LayoutResult {
    const opts = mergeOptions(options as LayoutOptions)
    const affectedNodes = this.getAffectedNodes(root, changedNodes)

    const newPositions = new Map(previousResult.nodes)
    const newConnections = new Map(previousResult.connections)

    for (const nodeId of affectedNodes) {
      const node = this.findNode(root, nodeId)
      if (!node) continue

      const parent = this.findParent(root, nodeId)
      if (!parent) continue

      const layout = this.calculateSingleNode(node, parent, opts)
      newPositions.set(nodeId, layout)
    }

    for (const nodeId of affectedNodes) {
      const nodeLayout = newPositions.get(nodeId)
      if (!nodeLayout) continue

      const node = this.findNode(root, nodeId)
      if (!node) continue

      const children = getAttachedChildren(node)
      for (const child of children) {
        const childLayout = newPositions.get(child.id)
        if (childLayout) {
          const connectionId = `${nodeId}-${child.id}`
          newConnections.set(connectionId, {
            id: connectionId,
            fromId: nodeId,
            toId: child.id,
            path: this.calculateConnectionPath(nodeLayout, childLayout),
            startPoint: { x: nodeLayout.x + nodeLayout.width, y: nodeLayout.y + nodeLayout.height / 2 },
            endPoint: { x: childLayout.x, y: childLayout.y + childLayout.height / 2 },
            controlPoints: [],
          })
        }
      }
    }

    const bounds = calculateBounds(newPositions)

    return {
      nodes: newPositions,
      connections: newConnections,
      bounds,
    }
  }

  private getAffectedNodes(root: MindMapNode, changedNodes: Set<string>): Set<string> {
    const affected = new Set<string>()

    for (const nodeId of changedNodes) {
      affected.add(nodeId)

      let current = this.findParent(root, nodeId)
      while (current) {
        affected.add(current.id)
        current = this.findParent(root, current.id)
      }

      const node = this.findNode(root, nodeId)
      if (node) {
        node.descendants(child => {
          affected.add(child.id)
        })
      }
    }

    return affected
  }

  private findNode(root: MindMapNode, nodeId: string): MindMapNode | null {
    if (root.id === nodeId) return root

    for (const child of root.getAllChildren()) {
      const found = this.findNode(child, nodeId)
      if (found) return found
    }

    return null
  }

  private findParent(root: MindMapNode, childId: string): MindMapNode | null {
    for (const children of Object.values(root.children)) {
      for (const child of children) {
        if (child.id === childId) return root
        const found = this.findParent(child, childId)
        if (found) return found
      }
    }
    return null
  }

  private calculateSingleNode(
    node: MindMapNode,
    parent: MindMapNode,
    options: LayoutOptions
  ): NodeLayout {
    const size = calculateNodeSize(node)
    const siblings = getAttachedChildren(parent)
    const validSiblings = siblings.filter((s): s is MindMapNode => !!s)
    const index = validSiblings.findIndex(c => c.id === node.id)

    const parentSize = calculateNodeSize(parent)
    let totalHeight = 0
    for (const sibling of validSiblings) {
      totalHeight += calculateNodeSize(sibling).height + options.verticalSpacing
    }
    totalHeight -= options.verticalSpacing

    const startY = -totalHeight / 2
    let currentY = startY

    for (let i = 0; i < index; i++) {
      const sibling = validSiblings[i]
      if (sibling) {
        currentY += calculateNodeSize(sibling).height + options.verticalSpacing
      }
    }

    return {
      id: node.id,
      x: parentSize.width + options.horizontalSpacing,
      y: currentY,
      width: size.width,
      height: size.height,
      childrenBounds: {
        x: parentSize.width + options.horizontalSpacing,
        y: currentY,
        width: size.width,
        height: size.height,
      },
    }
  }

  private calculateConnectionPath(from: NodeLayout, to: NodeLayout): string {
    const startX = from.x + from.width
    const startY = from.y + from.height / 2
    const endX = to.x
    const endY = to.y + to.height / 2
    const ctrlX = (startX + endX) / 2

    return `M ${startX} ${startY} C ${ctrlX} ${startY} ${ctrlX} ${endY} ${endX} ${endY}`
  }

  clearCache(): void {
    this.cache.clear()
  }

  invalidateNode(nodeId: string): void {
    this.cache.delete(nodeId)
  }
}
