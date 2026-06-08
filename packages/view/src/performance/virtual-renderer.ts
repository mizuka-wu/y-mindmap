import { Bounds } from '@y-mindmap/core'

export interface VirtualNode {
  id: string
  bounds: Bounds
  visible: boolean
  rendered: boolean
}

export class VirtualRenderer {
  private viewport: Bounds = { x: 0, y: 0, width: 0, height: 0 }
  private nodes: Map<string, VirtualNode> = new Map()
  private padding: number = 100
  private onVisibilityChange: ((visibleIds: string[], hiddenIds: string[]) => void) | null = null

  constructor(padding: number = 100) {
    this.padding = padding
  }

  setViewport(viewport: Bounds): void {
    this.viewport = viewport
    this.updateVisibility()
  }

  updateViewport(x: number, y: number, width: number, height: number): void {
    this.viewport = { x, y, width, height }
    this.updateVisibility()
  }

  registerNode(id: string, bounds: Bounds): void {
    this.nodes.set(id, {
      id,
      bounds,
      visible: this.isVisible(bounds),
      rendered: false,
    })
  }

  unregisterNode(id: string): void {
    this.nodes.delete(id)
  }

  updateNodeBounds(id: string, bounds: Bounds): void {
    const node = this.nodes.get(id)
    if (node) {
      node.bounds = bounds
      node.visible = this.isVisible(bounds)
    }
  }

  private isVisible(bounds: Bounds): boolean {
    const expandedViewport = {
      x: this.viewport.x - this.padding,
      y: this.viewport.y - this.padding,
      width: this.viewport.width + this.padding * 2,
      height: this.viewport.height + this.padding * 2,
    }

    return !(
      bounds.x + bounds.width < expandedViewport.x ||
      bounds.x > expandedViewport.x + expandedViewport.width ||
      bounds.y + bounds.height < expandedViewport.y ||
      bounds.y > expandedViewport.y + expandedViewport.height
    )
  }

  private updateVisibility(): void {
    const visibleIds: string[] = []
    const hiddenIds: string[] = []

    for (const [id, node] of this.nodes) {
      const wasVisible = node.visible
      node.visible = this.isVisible(node.bounds)

      if (node.visible && !wasVisible) {
        visibleIds.push(id)
      } else if (!node.visible && wasVisible) {
        hiddenIds.push(id)
      }
    }

    if (visibleIds.length > 0 || hiddenIds.length > 0) {
      this.onVisibilityChange?.(visibleIds, hiddenIds)
    }
  }

  getVisibleNodes(): string[] {
    const visible: string[] = []
    for (const [id, node] of this.nodes) {
      if (node.visible) {
        visible.push(id)
      }
    }
    return visible
  }

  getHiddenNodes(): string[] {
    const hidden: string[] = []
    for (const [id, node] of this.nodes) {
      if (!node.visible) {
        hidden.push(id)
      }
    }
    return hidden
  }

  isNodeVisible(id: string): boolean {
    return this.nodes.get(id)?.visible ?? false
  }

  setOnVisibilityChange(callback: (visibleIds: string[], hiddenIds: string[]) => void): void {
    this.onVisibilityChange = callback
  }

  destroy(): void {
    this.nodes.clear()
    this.onVisibilityChange = null
  }
}
