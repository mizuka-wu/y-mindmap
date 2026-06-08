import { Path } from 'leafer-ui'
import { ConnectionLayout } from '@y-mindmap/layout'

export class ConnectionView {
  readonly path: Path
  readonly connectionId: string

  private layout: ConnectionLayout

  constructor(layout: ConnectionLayout) {
    this.layout = layout
    this.connectionId = layout.id

    this.path = new Path({
      path: layout.path,
      stroke: '#999999',
      strokeWidth: 2,
      fill: 'none',
    })
  }

  updateLayout(layout: ConnectionLayout): void {
    this.layout = layout
    this.path.path = layout.path
  }

  setStyle(style: { color?: string; width?: number }): void {
    if (style.color) {
      this.path.stroke = style.color
    }
    if (style.width) {
      this.path.strokeWidth = style.width
    }
  }

  destroy(): void {
    this.path.remove()
  }
}
