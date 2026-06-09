import { Path, Rect } from 'leafer-ui'
import { NodeView, Size, Bounds } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'
import { styleManager } from '../../core/style-manager'
import { StyleKey } from '@y-mindmap/core'

const TITLE_HIDDEN_SHAPES = ['polygon', 'roundedPolygon', 'newBoundary1']

export class BoundaryNodeView extends NodeView {
  private _lineColor: string = '#999999'
  private _fillColor: string = 'transparent'
  private _borderWidth: number = 1
  private _linePattern: string = 'solid'
  private _fillOpacity: number = 0.3
  private _shapeClass: string = 'roundedRect'
  
  private boundaryElement: Path | Rect | null = null

  constructor(node: MindMapNode) {
    super(node)
  }

  protected initialize(): void {
    this.boundaryElement = new Rect({
      width: this._size.width,
      height: this._size.height,
      fill: this._fillColor,
      stroke: this._lineColor,
      strokeWidth: this._borderWidth,
      cornerRadius: 8,
      dashPattern: this.getDashPattern(),
      opacity: this._fillOpacity,
    })
    this.group.add(this.boundaryElement)
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
    return { width: 200, height: 100 }
  }

  protected applyLayout(): void {
    if (this.boundaryElement) {
      if (this.boundaryElement instanceof Rect) {
        this.boundaryElement.width = this._size.width
        this.boundaryElement.height = this._size.height
      }
    }
  }

  protected applyPaint(): void {
    if (this.boundaryElement) {
      if (this.boundaryElement instanceof Rect) {
        this.boundaryElement.stroke = this._lineColor
        this.boundaryElement.fill = this._fillColor
        this.boundaryElement.strokeWidth = this._borderWidth
        this.boundaryElement.dashPattern = this.getDashPattern()
        this.boundaryElement.opacity = this._fillOpacity
      }
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
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

  setFillOpacity(opacity: number): void {
    if (this._fillOpacity === opacity) return
    this._fillOpacity = opacity
    this.invalidatePaint()
  }

  setShapeClass(shapeClass: string): void {
    if (this._shapeClass === shapeClass) return
    this._shapeClass = shapeClass
    this.invalidateLayout()
  }

  setBoundaryShapeSize(size: Size): void {
    this.setSize(size)
  }

  setBoundaryPath(path: string): void {
    if (!this.boundaryElement || !(this.boundaryElement instanceof Path)) {
      this.boundaryElement?.remove()
      this.boundaryElement = new Path({
        path,
        fill: this._fillColor,
        stroke: this._lineColor,
        strokeWidth: this._borderWidth,
        opacity: this._fillOpacity,
      })
      this.group.add(this.boundaryElement)
    } else {
      this.boundaryElement.path = path
    }
    this.invalidatePaint()
  }

  shouldPreventTitle(): boolean {
    const shapeClass = styleManager.getStyleValueOrDefault(
      this,
      StyleKey.SHAPE_CLASS,
      this._shapeClass
    )
    return TITLE_HIDDEN_SHAPES.includes(shapeClass)
  }
}

export default BoundaryNodeView
