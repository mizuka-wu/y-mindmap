import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, LayoutOptions, NodeLayout, ConnectionLayout, DEFAULT_LAYOUT_OPTIONS } from './types'
import { calculateNodeSize, calculateBounds, mergeOptions, getAttachedChildren } from './utils'

export class BraceLayout implements LayoutEngine {
  private direction: 'left' | 'right' | 'both' = 'right'

  constructor(direction: 'left' | 'right' | 'both' = 'right') {
    this.direction = direction
  }

  calculate(root: MindMapNode, options?: Partial<LayoutOptions>): LayoutResult {
    const opts = mergeOptions(options)
    const nodes = new Map<string, NodeLayout>()
    const connections = new Map<string, ConnectionLayout>()

    const rootSize = calculateNodeSize(root)
    const rootNode: NodeLayout = {
      id: root.id,
      x: 0,
      y: 0,
      width: rootSize.width,
      height: rootSize.height,
      childrenBounds: { x: 0, y: 0, width: rootSize.width, height: rootSize.height },
    }
    nodes.set(root.id, rootNode)

    const children = getAttachedChildren(root)
    if (children.length > 0) {
      this.layoutChildren(rootNode, children, opts, nodes, connections)
    }

    const bounds = calculateBounds(nodes)
    return { nodes, connections, bounds }
  }

  calculateNodeSize(node: MindMapNode): import('@y-mindmap/core').Size {
    return calculateNodeSize(node)
  }

  calculateConnectionPath(_from: NodeLayout, _to: NodeLayout): string {
    return ''
  }

  private layoutChildren(
    parent: NodeLayout,
    children: MindMapNode[],
    options: LayoutOptions,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>
  ): void {
    let totalHeight = 0
    const childSizes: import('@y-mindmap/core').Size[] = []

    for (const child of children) {
      const size = calculateNodeSize(child)
      childSizes.push(size)
      totalHeight += size.height
    }

    totalHeight += (children.length - 1) * options.verticalSpacing

    const startY = parent.y + parent.height / 2 - totalHeight / 2
    let currentY = startY

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue
      const size = childSizes[i]
      if (!size) continue

      const childX = this.direction === 'right'
        ? parent.x + parent.width + options.horizontalSpacing * 2
        : parent.x - size.width - options.horizontalSpacing * 2

      const nodeLayout: NodeLayout = {
        id: child.id,
        x: childX,
        y: currentY,
        width: size.width,
        height: size.height,
        childrenBounds: { x: childX, y: currentY, width: size.width, height: size.height },
      }
      nodes.set(child.id, nodeLayout)

      const connectionId = `${parent.id}-${child.id}`
      const braceX = this.direction === 'right'
        ? parent.x + parent.width + options.horizontalSpacing
        : parent.x - options.horizontalSpacing
      const childCenterY = currentY + size.height / 2

      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${braceX} ${childCenterY} L ${this.direction === 'right' ? childX : childX + size.width} ${childCenterY}`,
        startPoint: { x: braceX, y: childCenterY },
        endPoint: { x: this.direction === 'right' ? childX : childX + size.width, y: childCenterY },
        controlPoints: [],
      })

      currentY += size.height + options.verticalSpacing
    }
  }
}
