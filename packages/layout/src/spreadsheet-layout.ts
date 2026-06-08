import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, LayoutOptions, NodeLayout, ConnectionLayout, DEFAULT_LAYOUT_OPTIONS } from './types'
import { calculateNodeSize, calculateBounds, mergeOptions, getAttachedChildren } from './utils'

export class SpreadsheetLayout implements LayoutEngine {
  private direction: 'row' | 'column' = 'row'

  constructor(direction: 'row' | 'column' = 'row') {
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
    if (this.direction === 'row') {
      this.layoutByRow(parent, children, options, nodes, connections)
    } else {
      this.layoutByColumn(parent, children, options, nodes, connections)
    }
  }

  private layoutByRow(
    parent: NodeLayout,
    children: MindMapNode[],
    options: LayoutOptions,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>
  ): void {
    const validChildren = children.filter((c): c is MindMapNode => !!c)
    const cellWidth = Math.max(...validChildren.map(c => calculateNodeSize(c).width)) + options.horizontalSpacing
    const cellHeight = Math.max(...validChildren.map(c => calculateNodeSize(c).height)) + options.verticalSpacing

    const cols = Math.ceil(Math.sqrt(validChildren.length))
    const startX = parent.x + parent.width + options.horizontalSpacing
    const startY = parent.y

    for (let i = 0; i < validChildren.length; i++) {
      const child = validChildren[i]
      if (!child) continue
      
      const size = calculateNodeSize(child)
      const col = i % cols
      const row = Math.floor(i / cols)

      const childX = startX + col * cellWidth
      const childY = startY + row * cellHeight + (cellHeight - size.height) / 2

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

  private layoutByColumn(
    parent: NodeLayout,
    children: MindMapNode[],
    options: LayoutOptions,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>
  ): void {
    const validChildren = children.filter((c): c is MindMapNode => !!c)
    const cellWidth = Math.max(...validChildren.map(c => calculateNodeSize(c).width)) + options.horizontalSpacing
    const cellHeight = Math.max(...validChildren.map(c => calculateNodeSize(c).height)) + options.verticalSpacing

    const rows = Math.ceil(Math.sqrt(validChildren.length))
    const startX = parent.x + parent.width + options.horizontalSpacing
    const startY = parent.y

    for (let i = 0; i < validChildren.length; i++) {
      const child = validChildren[i]
      if (!child) continue
      
      const size = calculateNodeSize(child)
      const row = i % rows
      const col = Math.floor(i / rows)

      const childX = startX + col * cellWidth + (cellWidth - size.width) / 2
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
