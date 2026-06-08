import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, LayoutOptions, NodeLayout, ConnectionLayout } from './types'
import { calculateNodeSize, calculateBounds, mergeOptions, getAttachedChildren } from './utils'

export class MapFloatingClockwiseLayout implements LayoutEngine {
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
      this.layoutChildren(rootNode, children, opts, nodes, connections, true)
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

  protected layoutChildren(
    parent: NodeLayout,
    children: MindMapNode[],
    options: LayoutOptions,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
    clockwise: boolean
  ): void {
    const half = Math.ceil(children.length / 2)
    const rightChildren = clockwise ? children.slice(0, half) : children.slice(half)
    const leftChildren = clockwise ? children.slice(half) : children.slice(0, half)

    this.layoutSide(parent, rightChildren, 'right', options, nodes, connections)
    this.layoutSide(parent, leftChildren, 'left', options, nodes, connections)
  }

  protected layoutSide(
    parent: NodeLayout,
    children: MindMapNode[],
    side: 'left' | 'right',
    options: LayoutOptions,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>
  ): void {
    if (children.length === 0) return

    let totalHeight = 0
    const childSizes: import('@y-mindmap/core').Size[] = []

    for (const child of children) {
      const size = calculateNodeSize(child)
      childSizes.push(size)
      totalHeight += size.height + options.verticalSpacing
    }
    totalHeight -= options.verticalSpacing

    const startY = parent.y + parent.height / 2 - totalHeight / 2
    let currentY = startY

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue
      const size = childSizes[i]
      if (!size) continue

      const childX = side === 'right'
        ? parent.x + parent.width + options.horizontalSpacing
        : parent.x - size.width - options.horizontalSpacing

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
      const startX = side === 'right' ? parent.x + parent.width : parent.x
      const startYConn = parent.y + parent.height / 2
      const endX = side === 'right' ? childX : childX + size.width
      const endY = currentY + size.height / 2

      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${startX} ${startYConn} L ${endX} ${endY}`,
        startPoint: { x: startX, y: startYConn },
        endPoint: { x: endX, y: endY },
        controlPoints: [],
      })

      currentY += size.height + options.verticalSpacing
    }
  }
}

export class MapFloatingAnticlockwiseLayout extends MapFloatingClockwiseLayout {
  protected layoutChildren(
    parent: NodeLayout,
    children: MindMapNode[],
    options: LayoutOptions,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
    clockwise: boolean
  ): void {
    const half = Math.ceil(children.length / 2)
    const leftChildren = children.slice(0, half)
    const rightChildren = children.slice(half)

    this.layoutSide(parent, leftChildren, 'left', options, nodes, connections)
    this.layoutSide(parent, rightChildren, 'right', options, nodes, connections)
  }
}

export class ColumnSpreadsheetLayout implements LayoutEngine {
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
    const validChildren = children.filter((c): c is MindMapNode => !!c)
    const cellHeight = Math.max(...validChildren.map(c => calculateNodeSize(c).height)) + options.verticalSpacing
    const cellWidth = Math.max(...validChildren.map(c => calculateNodeSize(c).width)) + options.horizontalSpacing

    const cols = Math.ceil(Math.sqrt(validChildren.length))
    const startX = parent.x + parent.width + options.horizontalSpacing
    const startY = parent.y

    for (let i = 0; i < validChildren.length; i++) {
      const child = validChildren[i]
      if (!child) continue

      const size = calculateNodeSize(child)
      const row = Math.floor(i / cols)
      const col = i % cols

      const childX = startX + col * cellWidth
      const childY = startY + row * cellHeight

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
      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${parent.x + parent.width} ${parent.y + parent.height / 2} L ${childX} ${childY + size.height / 2}`,
        startPoint: { x: parent.x + parent.width, y: parent.y + parent.height / 2 },
        endPoint: { x: childX, y: childY + size.height / 2 },
        controlPoints: [],
      })
    }
  }
}
