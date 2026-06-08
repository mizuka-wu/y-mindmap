import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, LayoutOptions, NodeLayout, ConnectionLayout, DEFAULT_LAYOUT_OPTIONS } from './types'
import { calculateNodeSize, calculateBounds, mergeOptions, getAttachedChildren } from './utils'

export class TimelineLayout implements LayoutEngine {
  private direction: 'horizontal' | 'vertical' = 'horizontal'

  constructor(direction: 'horizontal' | 'vertical' = 'horizontal') {
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
    if (this.direction === 'horizontal') {
      this.layoutHorizontal(parent, children, options, nodes, connections)
    } else {
      this.layoutVertical(parent, children, options, nodes, connections)
    }
  }

  private layoutHorizontal(
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
    const timelineY = parent.y + parent.height + options.verticalSpacing * 2

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue
      
      const size = calculateNodeSize(child)

      const isAbove = i % 2 === 0
      const childY = isAbove
        ? timelineY - size.height - options.verticalSpacing
        : timelineY + options.verticalSpacing

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
      const timelinePointX = currentX + size.width / 2
      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${timelinePointX} ${timelineY} L ${timelinePointX} ${isAbove ? childY + size.height : childY}`,
        startPoint: { x: timelinePointX, y: timelineY },
        endPoint: { x: timelinePointX, y: isAbove ? childY + size.height : childY },
        controlPoints: [],
      })

      currentX += size.width + options.horizontalSpacing
    }
  }

  private layoutVertical(
    parent: NodeLayout,
    children: MindMapNode[],
    options: LayoutOptions,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>
  ): void {
    const totalHeight = children.reduce((sum, child) => {
      return sum + calculateNodeSize(child).height
    }, 0) + (children.length - 1) * options.verticalSpacing

    let currentY = parent.y + parent.height / 2 - totalHeight / 2
    const timelineX = parent.x + parent.width + options.horizontalSpacing * 2

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child) continue
      
      const size = calculateNodeSize(child)

      const isLeft = i % 2 === 0
      const childX = isLeft
        ? timelineX - size.width - options.horizontalSpacing
        : timelineX + options.horizontalSpacing

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
      const timelinePointY = currentY + size.height / 2
      connections.set(connectionId, {
        id: connectionId,
        fromId: parent.id,
        toId: child.id,
        path: `M ${timelineX} ${timelinePointY} L ${isLeft ? childX + size.width : childX} ${timelinePointY}`,
        startPoint: { x: timelineX, y: timelinePointY },
        endPoint: { x: isLeft ? childX + size.width : childX, y: timelinePointY },
        controlPoints: [],
      })

      currentY += size.height + options.verticalSpacing
    }
  }
}
