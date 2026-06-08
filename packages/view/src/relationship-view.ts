import { Path, Text, Group } from 'leafer-ui'
import { Relationship } from '@y-mindmap/state'
import { NodeLayout } from '@y-mindmap/layout'
import { Point } from '@y-mindmap/core'
import { ConnectionStyleFactory } from './connections/connection-styles'

export class RelationshipView {
  readonly group: Group
  readonly relationshipId: string

  private path: Path
  private titleText: Text | null = null
  private relationship: Relationship
  private fromLayout: NodeLayout
  private toLayout: NodeLayout

  constructor(relationship: Relationship, fromLayout: NodeLayout, toLayout: NodeLayout) {
    this.relationship = relationship
    this.fromLayout = fromLayout
    this.toLayout = toLayout
    this.relationshipId = relationship.id

    this.group = new Group({
      data: { relationshipId: relationship.id },
    })

    const pathData = this.calculatePath()
    this.path = new Path({
      path: pathData,
      stroke: relationship.style?.properties?.['line-color'] || '#999999',
      strokeWidth: relationship.style?.properties?.['line-width'] || 2,
      fill: 'none',
    })

    this.group.add(this.path)

    if (relationship.title) {
      this.renderTitle()
    }
  }

  private calculatePath(): string {
    const start = this.getAnchorPoint(this.fromLayout, 'right')
    const end = this.getAnchorPoint(this.toLayout, 'left')

    const cp1 = this.relationship.controlPoints[1]
    const cp2 = this.relationship.controlPoints[2]

    const ctrl1 = cp1.x !== 0 || cp1.y !== 0
      ? cp1
      : { x: (start.x + end.x) / 2, y: start.y }

    const ctrl2 = cp2.x !== 0 || cp2.y !== 0
      ? cp2
      : { x: (start.x + end.x) / 2, y: end.y }

    return `M ${start.x} ${start.y} C ${ctrl1.x} ${ctrl1.y} ${ctrl2.x} ${ctrl2.y} ${end.x} ${end.y}`
  }

  private getAnchorPoint(layout: NodeLayout, side: string): Point {
    switch (side) {
      case 'left':
        return { x: layout.x, y: layout.y + layout.height / 2 }
      case 'right':
        return { x: layout.x + layout.width, y: layout.y + layout.height / 2 }
      case 'top':
        return { x: layout.x + layout.width / 2, y: layout.y }
      case 'bottom':
        return { x: layout.x + layout.width / 2, y: layout.y + layout.height }
      default:
        return { x: layout.x + layout.width / 2, y: layout.y + layout.height / 2 }
    }
  }

  private renderTitle(): void {
    const pathData = this.path.path
    const midX = (this.fromLayout.x + this.fromLayout.width + this.toLayout.x) / 2
    const midY = (this.fromLayout.y + this.fromLayout.height / 2 + this.toLayout.y + this.toLayout.height / 2) / 2

    this.titleText = new Text({
      x: midX,
      y: midY - 10,
      text: this.relationship.title,
      fontSize: 12,
      fill: '#666666',
      textAlign: 'center',
    })

    this.group.add(this.titleText)
  }

  updateLayout(fromLayout: NodeLayout, toLayout: NodeLayout): void {
    this.fromLayout = fromLayout
    this.toLayout = toLayout

    const pathData = this.calculatePath()
    this.path.path = pathData

    if (this.titleText) {
      const midX = (fromLayout.x + fromLayout.width + toLayout.x) / 2
      const midY = (fromLayout.y + fromLayout.height / 2 + toLayout.y + toLayout.height / 2) / 2
      this.titleText.x = midX
      this.titleText.y = midY - 10
    }
  }

  setStyle(style: { color?: string; width?: number }): void {
    if (style.color) {
      this.path.stroke = style.color
    }
    if (style.width) {
      this.path.strokeWidth = style.width
    }
  }

  setSelected(selected: boolean): void {
    if (selected) {
      this.path.stroke = '#4A90D9'
      this.path.strokeWidth = 3
    } else {
      this.path.stroke = this.relationship.style?.properties?.['line-color'] || '#999999'
      this.path.strokeWidth = this.relationship.style?.properties?.['line-width'] || 2
    }
  }

  destroy(): void {
    this.group.remove()
  }
}
