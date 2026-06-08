import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, LayoutOptions, NodeLayout, ConnectionLayout, DEFAULT_LAYOUT_OPTIONS } from './types'
import { calculateNodeSize, calculateBounds, mergeOptions, getAttachedChildren } from './utils'

export class TreeTableLayout implements LayoutEngine {
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

      const grandchildren = getAttachedChildren(child)
      if (grandchildren.length > 0) {
        this.layoutChildren(nodeLayout, grandchildren, options, nodes, connections)
      }

      currentY += cellHeight
    }
  }
}
