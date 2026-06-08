import { Path, Text, Group } from 'leafer-ui'
import { Summary } from '@y-mindmap/state'
import { Bounds } from '@y-mindmap/core'

export class SummaryView {
  readonly group: Group
  readonly summaryId: string

  private path: Path
  private titleText: Text | null = null
  private summary: Summary
  private childBounds: Bounds[]

  constructor(summary: Summary, childBounds: Bounds[]) {
    this.summary = summary
    this.childBounds = childBounds
    this.summaryId = summary.id

    this.group = new Group({
      data: { summaryId: summary.id },
    })

    const pathData = this.calculatePath()
    this.path = new Path({
      path: pathData,
      stroke: '#999999',
      strokeWidth: 2,
      fill: 'none',
    })

    this.group.add(this.path)
  }

  private calculatePath(): string {
    if (this.childBounds.length === 0) return ''

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

    const startX = maxX + 20
    const startY = minY
    const endX = maxX + 20
    const endY = maxY
    const midX = maxX + 40
    const midY = (startY + endY) / 2

    return `M ${startX} ${startY} Q ${midX} ${startY} ${midX} ${midY} Q ${midX} ${endY} ${endX} ${endY}`
  }

  updateBounds(childBounds: Bounds[]): void {
    this.childBounds = childBounds
    const pathData = this.calculatePath()
    this.path.path = pathData
  }

  setSelected(selected: boolean): void {
    if (selected) {
      this.path.stroke = '#FF6B6B'
      this.path.strokeWidth = 3
    } else {
      this.path.stroke = '#999999'
      this.path.strokeWidth = 2
    }
  }

  destroy(): void {
    this.group.remove()
  }
}
