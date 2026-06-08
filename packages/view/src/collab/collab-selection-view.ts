import { Group, Rect } from 'leafer-ui'

export interface RemoteSelection {
  clientId: number
  user: { name: string; color: string }
  nodeIds: string[]
}

export interface NodeBounds {
  x: number
  y: number
  width: number
  height: number
}

export class CollabSelectionView {
  private selections: Map<number, Map<string, Rect>> = new Map()
  private container: Group
  private getNodeBounds: (nodeId: string) => NodeBounds | null

  constructor(container: Group, getNodeBounds: (nodeId: string) => NodeBounds | null) {
    this.container = container
    this.getNodeBounds = getNodeBounds
  }

  updateSelections(selections: Map<number, RemoteSelection>): void {
    const existingIds = new Set(this.selections.keys())
    const newIds = new Set(selections.keys())

    for (const id of existingIds) {
      if (!newIds.has(id)) {
        this.removeSelection(id)
      }
    }

    for (const [clientId, selection] of selections) {
      this.updateSelection(clientId, selection)
    }
  }

  private updateSelection(clientId: number, selection: RemoteSelection): void {
    const existingRects = this.selections.get(clientId) || new Map()
    const newNodeIds = new Set(selection.nodeIds)

    for (const [nodeId, rect] of existingRects) {
      if (!newNodeIds.has(nodeId)) {
        rect.remove()
        existingRects.delete(nodeId)
      }
    }

    for (const nodeId of selection.nodeIds) {
      if (!existingRects.has(nodeId)) {
        const bounds = this.getNodeBounds(nodeId)
        if (bounds) {
          const rect = this.createSelectionRect(bounds, selection.user.color)
          this.container.add(rect)
          existingRects.set(nodeId, rect)
        }
      }
    }

    this.selections.set(clientId, existingRects)
  }

  private createSelectionRect(bounds: NodeBounds, color: string): Rect {
    return new Rect({
      x: bounds.x - 3,
      y: bounds.y - 3,
      width: bounds.width + 6,
      height: bounds.height + 6,
      fill: `${color}20`,
      stroke: color,
      strokeWidth: 2,
      cornerRadius: 4,
    })
  }

  private removeSelection(clientId: number): void {
    const rects = this.selections.get(clientId)
    if (rects) {
      for (const rect of rects.values()) {
        rect.remove()
      }
      this.selections.delete(clientId)
    }
  }

  destroy(): void {
    for (const clientId of this.selections.keys()) {
      this.removeSelection(clientId)
    }
  }
}
