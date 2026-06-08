import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, LayoutOptions, NodeLayout, ConnectionLayout, DEFAULT_LAYOUT_OPTIONS } from './types'
import { calculateNodeSize, calculateBounds, mergeOptions, getAttachedChildren } from './utils'

export class FishboneLayout implements LayoutEngine {
  private direction: 'left' | 'right' = 'left'

  constructor(direction: 'left' | 'right' = 'left') {
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
    const topChildren: MindMapNode[] = []
    const bottomChildren: MindMapNode[] = []

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue
      if (i % 2 === 0) {
        topChildren.push(child)
      } else {
        bottomChildren.push(child)
      }
    }

    const spacing = options.verticalSpacing * 3
    const angle = Math.PI / 6

    let currentTopY = -spacing
    for (const child of topChildren) {
      const size = calculateNodeSize(child)
      const distance = Math.abs(currentTopY)
      const offsetX = distance * Math.tan(angle)

      const childX = this.direction === 'left'
        ? parent.x - offsetX - size.width - options.horizontalSpacing
        : parent.x + parent.width + offsetX + options.horizontalSpacing
      const childY = currentTopY - size.height / 2

      const nodeLayout: NodeLayout = {
        id: child.id,
        x: childX,
        y: childY,
        width: size.width,
        height: size.height,
        childrenBounds: { x: childX, y: childY, width: size.width, height: size.height },
      }
      nodes.set(child.id, nodeLayout)

      const connectionId = `${parent.id}-${child.id}`
      const startX = this.direction === 'left' ? parent.x : parent.x + parent.width
      const startY = parent.y + parent.height / 2
      const endX = this.direction === 'left' ? childX + size.width : childX
      const endY = childY + size.height / 2

      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${startX} ${startY} L ${endX} ${endY}`,
        startPoint: { x: startX, y: startY },
        endPoint: { x: endX, y: endY },
        controlPoints: [],
      })

      currentTopY -= size.height + spacing / children.length
    }

    let currentBottomY = spacing
    for (const child of bottomChildren) {
      const size = calculateNodeSize(child)
      const distance = Math.abs(currentBottomY)
      const offsetX = distance * Math.tan(angle)

      const childX = this.direction === 'left'
        ? parent.x - offsetX - size.width - options.horizontalSpacing
        : parent.x + parent.width + offsetX + options.horizontalSpacing
      const childY = currentBottomY - size.height / 2

      const nodeLayout: NodeLayout = {
        id: child.id,
        x: childX,
        y: childY,
        width: size.width,
        height: size.height,
        childrenBounds: { x: childX, y: childY, width: size.width, height: size.height },
      }
      nodes.set(child.id, nodeLayout)

      const connectionId = `${parent.id}-${child.id}`
      const startX = this.direction === 'left' ? parent.x : parent.x + parent.width
      const startY = parent.y + parent.height / 2
      const endX = this.direction === 'left' ? childX + size.width : childX
      const endY = childY + size.height / 2

      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${startX} ${startY} L ${endX} ${endY}`,
        startPoint: { x: startX, y: startY },
        endPoint: { x: endX, y: endY },
        controlPoints: [],
      })

      currentBottomY += size.height + spacing / children.length
    }
  }
}
