import { Path, Rect, Text } from 'leafer-ui'
import { NodeView, Size, Position } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'

export class FishBoneHeadLineNodeView extends NodeView {
  private _bodyWidth: number = 100
  private _lineColor: string = '#666666'
  private _lineWidth: number = 2
  private _direction: 'right' | 'left' = 'right'
  private _linePattern: string = 'solid'
  
  private pathElement: Path | null = null

  constructor(node: MindMapNode) {
    super(node)
  }

  protected initialize(): void {
    this.pathElement = new Path({
      path: this.calculatePath(),
      fill: 'none',
      stroke: this._lineColor,
      strokeWidth: this._lineWidth,
      dashPattern: this.getDashPattern(),
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
    const width = this._size.width || this._bodyWidth
    const height = this._size.height || 50
    
    if (this._direction === 'right') {
      return `M 0 ${height / 2} L ${width} ${height / 2}`
    } else {
      return `M ${width} ${height / 2} L 0 ${height / 2}`
    }
  }

  protected calculatePreferredSize(): Size {
    return { width: this._bodyWidth, height: 50 }
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

  setBodyWidth(width: number): void {
    if (this._bodyWidth === width) return
    this._bodyWidth = width
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

  setDirection(direction: 'right' | 'left'): void {
    if (this._direction === direction) return
    this._direction = direction
    this.invalidateLayout()
  }

  setLinePattern(pattern: string): void {
    if (this._linePattern === pattern) return
    this._linePattern = pattern
    this.invalidatePaint()
  }
}

export class FishBoneMainLineNodeView extends NodeView {
  private _length: number = 200
  private _lineColor: string = '#666666'
  private _lineWidth: number = 3
  private _direction: 'up' | 'down' = 'up'
  
  private pathElement: Path | null = null

  constructor(node: MindMapNode) {
    super(node)
  }

  protected initialize(): void {
    this.pathElement = new Path({
      path: this.calculatePath(),
      fill: 'none',
      stroke: this._lineColor,
      strokeWidth: this._lineWidth,
    })
    this.group.add(this.pathElement)
  }

  private calculatePath(): string {
    const length = this._size.width || this._length
    const height = this._size.height || 30
    
    if (this._direction === 'up') {
      return `M 0 ${height} L ${length} 0`
    } else {
      return `M 0 0 L ${length} ${height}`
    }
  }

  protected calculatePreferredSize(): Size {
    return { width: this._length, height: 30 }
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
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  setLength(length: number): void {
    if (this._length === length) return
    this._length = length
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

  setDirection(direction: 'up' | 'down'): void {
    if (this._direction === direction) return
    this._direction = direction
    this.invalidateLayout()
  }
}

export class TimelineMainLineNodeView extends NodeView {
  private _length: number = 300
  private _lineColor: string = '#4A90D9'
  private _lineWidth: number = 3
  private _orientation: 'horizontal' | 'vertical' = 'horizontal'
  
  private pathElement: Path | null = null
  private dots: Path[] = []

  constructor(node: MindMapNode) {
    super(node)
  }

  protected initialize(): void {
    this.pathElement = new Path({
      path: this.calculatePath(),
      fill: 'none',
      stroke: this._lineColor,
      strokeWidth: this._lineWidth,
    })
    this.group.add(this.pathElement)

    this.createDots()
  }

  private calculatePath(): string {
    const length = this._size.width || this._length
    
    if (this._orientation === 'horizontal') {
      return `M 0 15 L ${length} 15`
    } else {
      return `M 15 0 L 15 ${length}`
    }
  }

  private createDots(): void {
    const length = this._size.width || this._length
    const dotCount = 5
    const spacing = length / (dotCount - 1)
    
    for (let i = 0; i < dotCount; i++) {
      const x = this._orientation === 'horizontal' ? i * spacing : 15
      const y = this._orientation === 'horizontal' ? 15 : i * spacing
      
      const dot = new Path({
        path: `M ${x} ${y} m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`,
        fill: this._lineColor,
        stroke: 'none',
      })
      this.dots.push(dot)
      this.group.add(dot)
    }
  }

  protected calculatePreferredSize(): Size {
    if (this._orientation === 'horizontal') {
      return { width: this._length, height: 30 }
    } else {
      return { width: 30, height: this._length }
    }
  }

  protected applyLayout(): void {
    if (this.pathElement) {
      this.pathElement.path = this.calculatePath()
    }
    
    const length = this._size.width || this._length
    const dotCount = this.dots.length
    const spacing = length / (dotCount - 1)
    
    for (let i = 0; i < this.dots.length; i++) {
      const x = this._orientation === 'horizontal' ? i * spacing : 15
      const y = this._orientation === 'horizontal' ? 15 : i * spacing
      this.dots[i].path = `M ${x} ${y} m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0`
    }
  }

  protected applyPaint(): void {
    if (this.pathElement) {
      this.pathElement.stroke = this._lineColor
      this.pathElement.strokeWidth = this._lineWidth
    }
    for (const dot of this.dots) {
      dot.fill = this._lineColor
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  setLength(length: number): void {
    if (this._length === length) return
    this._length = length
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

  setOrientation(orientation: 'horizontal' | 'vertical'): void {
    if (this._orientation === orientation) return
    this._orientation = orientation
    this.invalidateLayout()
  }
}

export default FishBoneHeadLineNodeView
