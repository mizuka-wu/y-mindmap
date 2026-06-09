import { Path, Text, Group } from 'leafer-ui'
import { NodeView, Size, Bounds, Position } from '../../core/node-view'
import type { MindMapNode, RelationshipData } from '@y-mindmap/state'
import type { StyleData } from '@y-mindmap/core'
import { DEFAULT_TOPIC_STYLE } from '@y-mindmap/core'

export class RelationshipNodeView extends NodeView {
  private _relationshipData: RelationshipData
  private _lineColor: string = '#999999'
  private _lineWidth: number = 2
  private _linePattern: string = 'solid'
  
  private pathElement: Path | null = null
  private startPoint: Position = { x: 0, y: 0 }
  private endPoint: Position = { x: 100, y: 100 }

  constructor(node: MindMapNode, relationshipData: RelationshipData) {
    super(node)
    this._relationshipData = relationshipData
  }

  protected initialize(): void {
    this.pathElement = new Path({
      path: this.calculatePath(),
      fill: 'none',
      stroke: this._lineColor,
      strokeWidth: this._lineWidth,
      dashPattern: this.getDashPattern(),
      endArrow: {
        type: 'path',
        path: 'M 0 0 L 8 4 L 8 -4 Z',
        fill: this._lineColor,
      },
    })
    this.group.add(this.pathElement)
  }

  private getDashPattern(): number[] {
    switch (this._linePattern) {
      case 'dashed':
        return [5, 5]
      case 'dotted':
        return [2, 2]
      default:
        return []
    }
  }

  private calculatePath(): string {
    const sx = this.startPoint.x
    const sy = this.startPoint.y
    const ex = this.endPoint.x
    const ey = this.endPoint.y
    
    const midX = (sx + ex) / 2
    const midY = (sy + ey) / 2
    
    const controlOffset = Math.min(Math.abs(ex - sx), Math.abs(ey - sy)) * 0.3
    
    return `M ${sx} ${sy} C ${sx + controlOffset} ${sy}, ${ex - controlOffset} ${ey}, ${ex} ${ey}`
  }

  protected calculatePreferredSize(): Size {
    return {
      width: Math.abs(this.endPoint.x - this.startPoint.x),
      height: Math.abs(this.endPoint.y - this.startPoint.y),
    }
  }

  protected applyLayout(): void {
    if (this.pathElement) {
      this.pathElement.path = this.calculatePath()
    }
  }

  protected applyPaint(): void {
    if (this.pathElement) {
      this.pathElement.stroke = this._lineColor
      this.pathElement.strokeWidth = this._lineWidth
      this.pathElement.dashPattern = this.getDashPattern()
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  setStartPoint(point: Position): void {
    this.startPoint = point
    this.invalidateLayout()
  }

  setEndPoint(point: Position): void {
    this.endPoint = point
    this.invalidateLayout()
  }

  setLineColor(color: string): void {
    if (this._lineColor === color) return
    this._lineColor = color
    this.invalidatePaint()
  }

  setLineWidth(width: number): void {
    if (this._lineWidth === width) return
    this._lineWidth = width
    this.invalidatePaint()
  }

  setLinePattern(pattern: string): void {
    if (this._linePattern === pattern) return
    this._linePattern = pattern
    this.invalidatePaint()
  }

  getRelationshipData(): RelationshipData {
    return this._relationshipData
  }
}

export class RelationshipTitleNodeView extends NodeView {
  private _text: string
  private _textColor: string = '#666666'
  private _fontSize: number = 12
  
  private textElement: Text | null = null

  constructor(node: MindMapNode, text: string) {
    super(node)
    this._text = text
  }

  protected initialize(): void {
    this.textElement = new Text({
      text: this._text,
      fontSize: this._fontSize,
      fill: this._textColor,
      textAlign: 'center',
      verticalAlign: 'middle',
    })
    this.group.add(this.textElement)
  }

  protected calculatePreferredSize(): Size {
    if (!this.textElement) return { width: 0, height: 0 }
    
    return {
      width: this.textElement.width || this._text.length * 7,
      height: this.textElement.height || 16,
    }
  }

  protected applyLayout(): void {
    if (this.textElement) {
      this.textElement.width = this._size.width
      this.textElement.height = this._size.height
    }
  }

  protected applyPaint(): void {
    if (this.textElement) {
      this.textElement.fill = this._textColor
      this.textElement.fontSize = this._fontSize
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  getText(): string {
    return this._text
  }

  setText(text: string): void {
    if (this._text === text) return
    this._text = text
    if (this.textElement) {
      this.textElement.text = text
    }
    this.invalidateLayout()
  }

  setTextColor(color: string): void {
    if (this._textColor === color) return
    this._textColor = color
    this.invalidatePaint()
  }

  setFontSize(size: number): void {
    if (this._fontSize === size) return
    this._fontSize = size
    this.invalidateLayout()
  }
}

export default RelationshipNodeView
