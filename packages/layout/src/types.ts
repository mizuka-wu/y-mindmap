import { Point, Bounds, Size } from '@y-mindmap/core'
import { MindMapNode } from '@y-mindmap/state'

export interface LayoutOptions {
  horizontalSpacing: number
  verticalSpacing: number
  padding: number
  alignment: 'start' | 'center' | 'end'
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  horizontalSpacing: 40,
  verticalSpacing: 20,
  padding: 20,
  alignment: 'center',
}

export interface NodeLayout {
  id: string
  x: number
  y: number
  width: number
  height: number
  childrenBounds: Bounds
}

export interface ConnectionLayout {
  id: string
  fromId: string
  toId: string
  path: string
  startPoint: Point
  endPoint: Point
  controlPoints: Point[]
}

export interface LayoutResult {
  nodes: Map<string, NodeLayout>
  connections: Map<string, ConnectionLayout>
  bounds: Bounds
}

export interface LayoutEngine {
  calculate(root: MindMapNode, options?: LayoutOptions): LayoutResult
  calculateNodeSize(node: MindMapNode): Size
  calculateConnectionPath(from: NodeLayout, to: NodeLayout): string
}
