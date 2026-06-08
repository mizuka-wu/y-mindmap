import { Bounds, Point, Size } from '@y-mindmap/core'
import { MindMapNode } from '@y-mindmap/state'
import { NodeLayout, ConnectionLayout, LayoutOptions, DEFAULT_LAYOUT_OPTIONS } from './types'

export function calculateNodeSize(node: MindMapNode): Size {
  const titleLength = node.title.length
  const baseWidth = Math.max(120, titleLength * 8 + 40)
  const baseHeight = 40
  return { width: baseWidth, height: baseHeight }
}

export function calculateBounds(nodes: Map<string, NodeLayout>): Bounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const node of nodes.values()) {
    minX = Math.min(minX, node.x)
    minY = Math.min(minY, node.y)
    maxX = Math.max(maxX, node.x + node.width)
    maxY = Math.max(maxY, node.y + node.height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function createConnectionPath(
  from: NodeLayout,
  to: NodeLayout,
  style: 'curve' | 'straight' | 'elbow' = 'curve'
): string {
  const startX = from.x + from.width
  const startY = from.y + from.height / 2
  const endX = to.x
  const endY = to.y + to.height / 2

  switch (style) {
    case 'straight':
      return `M ${startX} ${startY} L ${endX} ${endY}`
    case 'elbow':
      const midX = (startX + endX) / 2
      return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`
    case 'curve':
    default:
      const ctrlX = (startX + endX) / 2
      return `M ${startX} ${startY} C ${ctrlX} ${startY} ${ctrlX} ${endY} ${endX} ${endY}`
  }
}

export function centerBounds(bounds: Bounds, container: Bounds): Bounds {
  return {
    x: container.x + (container.width - bounds.width) / 2,
    y: container.y + (container.height - bounds.height) / 2,
    width: bounds.width,
    height: bounds.height,
  }
}

export function mergeBounds(bounds1: Bounds, bounds2: Bounds): Bounds {
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

export function addPadding(bounds: Bounds, padding: number): Bounds {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  }
}

export function getNodeCenter(node: NodeLayout): Point {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  }
}

export function getAttachedChildren(node: MindMapNode): MindMapNode[] {
  return node.children['attached'] || []
}

export function getDetachedChildren(node: MindMapNode): MindMapNode[] {
  return node.children['detached'] || []
}

export function mergeOptions(options?: Partial<LayoutOptions>): LayoutOptions {
  return { ...DEFAULT_LAYOUT_OPTIONS, ...options }
}
