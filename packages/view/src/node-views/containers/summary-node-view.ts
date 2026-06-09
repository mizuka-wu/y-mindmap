import { Path, Rect } from 'leafer-ui'
import { NodeView, Size, Bounds } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'

/**
 * SummaryNodeView - 视图 for summary annotations.
 * 
 * Summary 是对一组子节点的概括性标注，在 Snowbrush 中由 SummaryView 管理。
 * 这里提供骨架实现，后续完善。
 */
export class SummaryNodeView extends NodeView {
  private _lineColor: string = '#999999'
  private _fillColor: string = 'transparent'
  private _borderWidth: number = 1
  private _linePattern: string = 'solid'
  private _shapeClass: string = 'roundedRect'
  
  private summaryElement: Path | Rect | null = null

  /** 关联的 summary topic node id */
  private _topicId: string

  constructor(node: MindMapNode) {
    super(node)
    // summary data 中的 topicId 指向关联的 summary topic
    this._topicId = (node as any).topicId || node.id
  }

  protected initialize(): void {
    this.summaryElement = new Rect({
      width: this._size.width,
      height: this._size.height,
      fill: this._fillColor,
      stroke: this._lineColor,
      strokeWidth: this._borderWidth,
      cornerRadius: 4,
      dashPattern: this.getDashPattern(),
    })
    this.group.add(this.summaryElement)
  }

  private getDashPattern(): number[] {
    switch (this._linePattern) {
      case 'dashed':
        return [5, 5]
      case 'dotted':
        return [2, 2]
      case 'dash-dot':
        return [5, 2, 2, 2]
      default:
        return []
    }
  }

  protected calculatePreferredSize(): Size {
    return { width: 100, height: 40 }
  }

  protected applyLayout(): void {
    if (this.summaryElement) {
      if (this.summaryElement instanceof Rect) {
        this.summaryElement.width = this._size.width
        this.summaryElement.height = this._size.height
      }
    }
  }

  protected applyPaint(): void {
    if (this.summaryElement) {
      if (this.summaryElement instanceof Rect) {
        this.summaryElement.stroke = this._lineColor
        this.summaryElement.fill = this._fillColor
        this.summaryElement.strokeWidth = this._borderWidth
        this.summaryElement.dashPattern = this.getDashPattern()
      }
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  /** 获取关联的 summary topic node id */
  getTopicId(): string {
    return this._topicId
  }

  setLineColor(color: string): void {
    if (this._lineColor === color) return
    this._lineColor = color
    this.invalidatePaint()
  }

  setFillColor(color: string): void {
    if (this._fillColor === color) return
    this._fillColor = color
    this.invalidatePaint()
  }

  setBorderWidth(width: number): void {
    if (this._borderWidth === width) return
    this._borderWidth = width
    this.invalidateLayout()
  }

  setLinePattern(pattern: string): void {
    if (this._linePattern === pattern) return
    this._linePattern = pattern
    this.invalidatePaint()
  }

  setShapeClass(shapeClass: string): void {
    if (this._shapeClass === shapeClass) return
    this._shapeClass = shapeClass
    this.invalidateLayout()
  }

  setSummaryShapeSize(size: Size): void {
    this.setSize(size)
  }
}

export default SummaryNodeView
