import { Group, Ellipse, Text } from 'leafer-ui'
import { NodeView, Size } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'

export class InformationNodeView extends NodeView {
  private _iconType: string = 'info'
  private _color: string = '#4A90D9'
  private circleElement: Ellipse | null = null
  private iconElement: Text | null = null

  constructor(node: MindMapNode, iconType: string = 'info') {
    super(node)
    this._iconType = iconType
  }

  protected initialize(): void {
    this.circleElement = new Ellipse({
      radiusX: 10,
      radiusY: 10,
      fill: this._color,
      stroke: 'none',
    })
    this.group.add(this.circleElement)

    this.iconElement = new Text({
      text: this.getIconSymbol(),
      fontSize: 12,
      fill: '#ffffff',
      textAlign: 'center',
      verticalAlign: 'middle',
    })
    this.group.add(this.iconElement)
  }

  private getIconSymbol(): string {
    switch (this._iconType) {
      case 'info':
        return 'i'
      case 'warning':
        return '!'
      case 'error':
        return '×'
      case 'note':
        return 'N'
      case 'link':
        return '🔗'
      default:
        return 'i'
    }
  }

  protected calculatePreferredSize(): Size {
    return { width: 20, height: 20 }
  }

  protected applyLayout(): void {
  }

  protected applyPaint(): void {
    if (this.circleElement) {
      this.circleElement.fill = this._color
    }
    if (this.iconElement) {
      this.iconElement.text = this.getIconSymbol()
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  getIconType(): string {
    return this._iconType
  }

  setIconType(type: string): void {
    if (this._iconType === type) return
    this._iconType = type
    this.invalidatePaint()
  }

  setColor(color: string): void {
    if (this._color === color) return
    this._color = color
    this.invalidatePaint()
  }
}

export default InformationNodeView
