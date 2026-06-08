import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, LayoutOptions, NodeLayout, ConnectionLayout, DEFAULT_LAYOUT_OPTIONS } from './types'
import { calculateNodeSize, calculateBounds, mergeOptions, getAttachedChildren } from './utils'

export class TimelineSidedHorizontalLayout implements LayoutEngine {
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
    const topChildren = children.filter((_, i) => i % 2 === 0)
    const bottomChildren = children.filter((_, i) => i % 2 === 1)

    let currentX = parent.x + parent.width + options.horizontalSpacing
    const timelineY = parent.y + parent.height / 2

    for (let i = 0; i < topChildren.length; i++) {
      const child = topChildren[i]
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

    currentX = parent.x + parent.width + options.horizontalSpacing
    for (let i = 0; i < bottomChildren.length; i++) {
      const child = bottomChildren[i]
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

export class TimelineThroughVerticalLayout implements LayoutEngine {
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
    const leftChildren = children.filter((_, i) => i % 2 === 0)
    const rightChildren = children.filter((_, i) => i % 2 === 1)

    let currentY = parent.y + parent.height + options.verticalSpacing
    const timelineX = parent.x + parent.width / 2

    for (let i = 0; i < leftChildren.length; i++) {
      const child = leftChildren[i]
      if (!child) continue

      const size = calculateNodeSize(child)
      const childX = timelineX - size.width - options.horizontalSpacing

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
      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${timelineX} ${currentY + size.height / 2} L ${childX + size.width} ${currentY + size.height / 2}`,
        startPoint: { x: timelineX, y: currentY + size.height / 2 },
        endPoint: { x: childX + size.width, y: currentY + size.height / 2 },
        controlPoints: [],
      })

      currentY += size.height + options.verticalSpacing
    }

    currentY = parent.y + parent.height + options.verticalSpacing
    for (let i = 0; i < rightChildren.length; i++) {
      const child = rightChildren[i]
      if (!child) continue

      const size = calculateNodeSize(child)
      const childX = timelineX + options.horizontalSpacing

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
      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${timelineX} ${currentY + size.height / 2} L ${childX} ${currentY + size.height / 2}`,
        startPoint: { x: timelineX, y: currentY + size.height / 2 },
        endPoint: { x: childX, y: currentY + size.height / 2 },
        controlPoints: [],
      })

      currentY += size.height + options.verticalSpacing
    }
  }
}
