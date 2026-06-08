import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, LayoutOptions, NodeLayout, ConnectionLayout } from './types'
import { calculateNodeSize, calculateBounds, mergeOptions, getAttachedChildren } from './utils'

export class TimelineHorizontalUpLayout implements LayoutEngine {
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
    const totalWidth = children.reduce((sum, child) => {
      return sum + calculateNodeSize(child).width
    }, 0) + (children.length - 1) * options.horizontalSpacing

    let currentX = parent.x + parent.width / 2 - totalWidth / 2
    const timelineY = parent.y

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue

      const size = calculateNodeSize(child)
      const childY = timelineY - size.height - options.verticalSpacing

      const nodeLayout: NodeLayout = {
        id: child.id,
        x: currentX,
        y: childY,
        width: size.width,
        height: size.height,
        childrenBounds: { x: currentX, y: childY, width: size.width, height: size.height },
      }
      nodes.set(child.id, nodeLayout)

      const connectionId = `${parent.id}-${child.id}`
      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${currentX + size.width / 2} ${timelineY} L ${currentX + size.width / 2} ${childY + size.height}`,
        startPoint: { x: currentX + size.width / 2, y: timelineY },
        endPoint: { x: currentX + size.width / 2, y: childY + size.height },
        controlPoints: [],
      })

      currentX += size.width + options.horizontalSpacing
    }
  }
}

export class TimelineHorizontalDownLayout implements LayoutEngine {
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
    const totalWidth = children.reduce((sum, child) => {
      return sum + calculateNodeSize(child).width
    }, 0) + (children.length - 1) * options.horizontalSpacing

    let currentX = parent.x + parent.width / 2 - totalWidth / 2
    const timelineY = parent.y + parent.height

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue

      const size = calculateNodeSize(child)
      const childY = timelineY + options.verticalSpacing

      const nodeLayout: NodeLayout = {
        id: child.id,
        x: currentX,
        y: childY,
        width: size.width,
        height: size.height,
        childrenBounds: { x: currentX, y: childY, width: size.width, height: size.height },
      }
      nodes.set(child.id, nodeLayout)

      const connectionId = `${parent.id}-${child.id}`
      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${currentX + size.width / 2} ${timelineY} L ${currentX + size.width / 2} ${childY}`,
        startPoint: { x: currentX + size.width / 2, y: timelineY },
        endPoint: { x: currentX + size.width / 2, y: childY },
        controlPoints: [],
      })

      currentX += size.width + options.horizontalSpacing
    }
  }
}

export class MapFloatingLayout implements LayoutEngine {
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
    const half = Math.ceil(children.length / 2)
    const rightChildren = children.slice(0, half)
    const leftChildren = children.slice(half)

    this.layoutSide(parent, rightChildren, 'right', options, nodes, connections)
    this.layoutSide(parent, leftChildren, 'left', options, nodes, connections)
  }

  private layoutSide(
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

export class TopTitleTreeTableLayout implements LayoutEngine {
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
    const cellHeight = Math.max(...children.map(c => calculateNodeSize(c).height)) + options.verticalSpacing
    const startX = parent.x + parent.width + options.horizontalSpacing
    let currentY = parent.y

    for (const child of children) {
      if (!child) continue
      const size = calculateNodeSize(child)

      const nodeLayout: NodeLayout = {
        id: child.id,
        x: startX,
        y: currentY,
        width: size.width,
        height: size.height,
        childrenBounds: { x: startX, y: currentY, width: size.width, height: size.height },
      }
      nodes.set(child.id, nodeLayout)

      const connectionId = `${parent.id}-${child.id}`
      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${parent.x + parent.width} ${parent.y + parent.height / 2} L ${startX} ${currentY + size.height / 2}`,
        startPoint: { x: parent.x + parent.width, y: parent.y + parent.height / 2 },
        endPoint: { x: startX, y: currentY + size.height / 2 },
        controlPoints: [],
      })

      const grandchildren = child.getAllChildren ? child.getAllChildren() : []
      if (grandchildren.length > 0) {
        const grandchildX = startX + size.width + options.horizontalSpacing
        let grandchildY = currentY
        
        for (const grandchild of grandchildren) {
          if (!grandchild) continue
          const gcSize = calculateNodeSize(grandchild)
          
          const gcNodeLayout: NodeLayout = {
            id: grandchild.id,
            x: grandchildX,
            y: grandchildY,
            width: gcSize.width,
            height: gcSize.height,
            childrenBounds: { x: grandchildX, y: grandchildY, width: gcSize.width, height: gcSize.height },
          }
          nodes.set(grandchild.id, gcNodeLayout)

          grandchildY += gcSize.height + options.verticalSpacing
        }
      }

      currentY += cellHeight
    }
  }
}
