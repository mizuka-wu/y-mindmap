import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, LayoutOptions, NodeLayout, ConnectionLayout, DEFAULT_LAYOUT_OPTIONS } from './types'
import { calculateNodeSize, calculateBounds, createConnectionPath, mergeOptions, getAttachedChildren } from './utils'

export class MapLayout implements LayoutEngine {
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
    return createConnectionPath(from, to, 'curve')
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
      const { rightChildren, leftChildren } = this.splitChildren(children)
      const rightBounds = this.layoutChildren(
        nodeLayout,
        rightChildren,
        'right',
        options,
        nodes,
        connections
      )
      const leftBounds = this.layoutChildren(
        nodeLayout,
        leftChildren,
        'left',
        options,
        nodes,
        connections
      )

      const totalBounds = this.mergeBounds(rightBounds, leftBounds)
      nodeLayout.childrenBounds = totalBounds
    }

    nodes.set(node.id, nodeLayout)
  }

  private splitChildren(children: MindMapNode[]): {
    rightChildren: MindMapNode[]
    leftChildren: MindMapNode[]
  } {
    const half = Math.ceil(children.length / 2)
    return {
      rightChildren: children.slice(0, half),
      leftChildren: children.slice(half),
    }
  }

  private layoutChildren(
    parent: NodeLayout,
    children: MindMapNode[],
    side: 'left' | 'right',
    options: LayoutOptions,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>
  ): import('@y-mindmap/core').Bounds {
    if (children.length === 0) {
      return { x: parent.x, y: parent.y, width: parent.width, height: parent.height }
    }

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

      const childX = side === 'right'
        ? parent.x + parent.width + options.horizontalSpacing
        : parent.x - size.width - options.horizontalSpacing

      this.layoutNode(child, childX, currentY, options, nodes, connections)

      const fromLayout = parent
      const toLayout = nodes.get(child.id)
      if (toLayout) {
        const connectionId = `${parent.id}-${child.id}`
        connections.set(connectionId, {
          id: connectionId,
          fromId: parent.id,
          toId: child.id,
          path: this.calculateConnectionPath(fromLayout, toLayout),
          startPoint: { x: parent.x + parent.width, y: parent.y + parent.height / 2 },
          endPoint: { x: toLayout.x, y: toLayout.y + toLayout.height / 2 },
          controlPoints: [],
        })
      }

      currentY += size.height + options.verticalSpacing
    }

    return {
      x: Math.min(parent.x, ...children.map((_, i) => {
        const size = childSizes[i]
        return side === 'right' ? parent.x + parent.width + options.horizontalSpacing : parent.x - (size?.width ?? 0) - options.horizontalSpacing
      })),
      y: startY,
      width: Math.max(parent.width, ...childSizes.map(s => s?.width ?? 0)) + options.horizontalSpacing * 2,
      height: totalHeight,
    }
  }

  private mergeBounds(
    bounds1: import('@y-mindmap/core').Bounds,
    bounds2: import('@y-mindmap/core').Bounds
  ): import('@y-mindmap/core').Bounds {
    const minX = Math.min(bounds1.x, bounds2.x)
    const minY = Math.min(bounds1.y, bounds2.y)
    const maxX = Math.max(bounds1.x + bounds1.width, bounds2.x + bounds2.width)
    const maxY = Math.max(bounds1.y + bounds1.height, bounds2.y + bounds2.height)

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }
}
