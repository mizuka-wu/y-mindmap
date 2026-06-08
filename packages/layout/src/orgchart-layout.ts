import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, LayoutOptions, NodeLayout, ConnectionLayout, DEFAULT_LAYOUT_OPTIONS } from './types'
import { calculateNodeSize, calculateBounds, createConnectionPath, mergeOptions, getAttachedChildren } from './utils'

export class OrgChartLayout implements LayoutEngine {
  private direction: 'down' | 'up' = 'down'

  constructor(direction: 'down' | 'up' = 'down') {
    this.direction = direction
  }

  calculate(root: MindMapNode, options?: Partial<LayoutOptions>): LayoutResult {
    const opts = mergeOptions(options)
    const nodes = new Map<string, NodeLayout>()
    const connections = new Map<string, ConnectionLayout>()

    this.layoutNode(root, 0, 0, opts, nodes, connections)

    const bounds = calculateBounds(nodes)

    return { nodes, connections, bounds }
  }

  calculateNodeSize(node: MindMapNode): import('@y-mindmap/core').Size {
    return calculateNodeSize(node)
  }

  calculateConnectionPath(from: NodeLayout, to: NodeLayout): string {
    const startX = from.x + from.width / 2
    const startY = this.direction === 'down' ? from.y + from.height : from.y
    const endX = to.x + to.width / 2
    const endY = this.direction === 'down' ? to.y : to.y + to.height
    const midY = (startY + endY) / 2

    return `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`
  }

  private layoutNode(
    node: MindMapNode,
    x: number,
    y: number,
    options: LayoutOptions,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>
  ): void {
    const size = calculateNodeSize(node)
    const nodeLayout: NodeLayout = {
      id: node.id,
      x,
      y,
      width: size.width,
      height: size.height,
      childrenBounds: { x, y, width: size.width, height: size.height },
    }

    const children = getAttachedChildren(node)
    if (children.length > 0) {
      const childrenBounds = this.layoutChildren(
        nodeLayout,
        children,
        options,
        nodes,
        connections
      )
      nodeLayout.childrenBounds = childrenBounds
    }

    nodes.set(node.id, nodeLayout)
  }

  private layoutChildren(
    parent: NodeLayout,
    children: MindMapNode[],
    options: LayoutOptions,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>
  ): import('@y-mindmap/core').Bounds {
    if (children.length === 0) {
      return { x: parent.x, y: parent.y, width: parent.width, height: parent.height }
    }

    let totalWidth = 0
    const childSizes: import('@y-mindmap/core').Size[] = []

    for (const child of children) {
      const size = calculateNodeSize(child)
      childSizes.push(size)
      totalWidth += size.width
    }

    totalWidth += (children.length - 1) * options.horizontalSpacing

    const startX = parent.x + parent.width / 2 - totalWidth / 2
    let currentX = startX

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue
      
      const size = childSizes[i]
      if (!size) continue

      const childY = this.direction === 'down'
        ? parent.y + parent.height + options.verticalSpacing
        : parent.y - size.height - options.verticalSpacing

      this.layoutNode(child, currentX, childY, options, nodes, connections)

      const fromLayout = parent
      const toLayout = nodes.get(child.id)
      if (toLayout) {
        const connectionId = `${parent.id}-${child.id}`
        connections.set(connectionId, {
          id: connectionId,
          fromId: parent.id,
          toId: child.id,
          path: this.calculateConnectionPath(fromLayout, toLayout),
          startPoint: this.direction === 'down'
            ? { x: parent.x + parent.width / 2, y: parent.y + parent.height }
            : { x: parent.x + parent.width / 2, y: parent.y },
          endPoint: this.direction === 'down'
            ? { x: toLayout.x + toLayout.width / 2, y: toLayout.y }
            : { x: toLayout.x + toLayout.width / 2, y: toLayout.y + toLayout.height },
          controlPoints: [],
        })
      }

      currentX += size.width + options.horizontalSpacing
    }

    return {
      x: startX,
      y: this.direction === 'down'
        ? parent.y
        : Math.min(parent.y, ...children.map((_, i) => {
            const size = childSizes[i]
            return parent.y - (size?.height ?? 0) - options.verticalSpacing
          })),
      width: totalWidth,
      height: Math.max(parent.height, ...childSizes.map(s => s?.height ?? 0)) + options.verticalSpacing * 2,
    }
  }
}
