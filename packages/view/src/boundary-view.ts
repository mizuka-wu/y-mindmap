import { Rect, Text, Group, Path } from 'leafer-ui'
import { Boundary } from '@y-mindmap/state'
import { NodeLayout } from '@y-mindmap/layout'
import { Bounds } from '@y-mindmap/core'

export class BoundaryView {
  readonly group: Group
  readonly boundaryId: string

  private rect: Rect
  private titleText: Text | null = null
  private boundary: Boundary
  private childBounds: Bounds[]

  constructor(boundary: Boundary, childBounds: Bounds[]) {
    this.boundary = boundary
    this.childBounds = childBounds
    this.boundaryId = boundary.id

    this.group = new Group({
      data: { boundaryId: boundary.id },
    })

    const bounds = this.calculateBoundaryBounds()
    this.rect = new Rect({
      x: bounds.x - 10,
      y: bounds.y - 10,
      width: bounds.width + 20,
      height: bounds.height + 20,
      fill: 'rgba(74, 144, 217, 0.1)',
      stroke: '#4A90D9',
      strokeWidth: 1,
      cornerRadius: 8,
    })

    this.group.add(this.rect)

    if (boundary.title) {
      this.titleText = new Text({
        x: bounds.x - 10,
        y: bounds.y - 25,
        text: boundary.title,
        fontSize: 12,
        fill: '#666666',
      })
      this.group.add(this.titleText)
    }
  }

  private calculateBoundaryBounds(): Bounds {
    if (this.childBounds.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const bounds of this.childBounds) {
      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      maxY = Math.max(maxY, bounds.y + bounds.height)
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  updateBounds(childBounds: Bounds[]): void {
    this.childBounds = childBounds
    const bounds = this.calculateBoundaryBounds()

    this.rect.x = bounds.x - 10
    this.rect.y = bounds.y - 10
    this.rect.width = bounds.width + 20
    this.rect.height = bounds.height + 20

    if (this.titleText) {
      this.titleText.x = bounds.x - 10
      this.titleText.y = bounds.y - 25
    }
  }

  setSelected(selected: boolean): void {
    if (selected) {
      this.rect.stroke = '#FF6B6B'
      this.rect.strokeWidth = 2
    } else {
      this.rect.stroke = '#4A90D9'
      this.rect.strokeWidth = 1
    }
  }

  destroy(): void {
    this.group.remove()
  }
}
