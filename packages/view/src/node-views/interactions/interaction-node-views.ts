import { Rect, Path } from 'leafer-ui'
import { NodeView, Size } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'

export enum SelectBoxState {
  HIDDEN = 'hidden',
  HOVER = 'hover',
  ACTIVE = 'active',
  DEFOCUS = 'defocus',
  INTERSECT = 'intersect',
}

export class SelectBoxNodeView extends NodeView {
  private _state: SelectBoxState = SelectBoxState.HIDDEN
  private _strokeColor: string = '#4A90D9'
  private _strokeWidth: number = 2
  private _cornerRadius: number = 8
  private selectBoxElement: Rect | null = null

  constructor(node: MindMapNode) {
    super(node)
    this._isVisible = false
  }

  protected initialize(): void {
    this.selectBoxElement = new Rect({
      x: -2,
      y: -2,
      width: this._size.width + 4,
      height: this._size.height + 4,
      fill: 'none',
      stroke: this._strokeColor,
      strokeWidth: this._strokeWidth,
      cornerRadius: this._cornerRadius,
    })
    this.group.add(this.selectBoxElement)
    this.group.visible = false
  }

  protected calculatePreferredSize(): Size {
    return {
      width: this._size.width + 4,
      height: this._size.height + 4,
    }
  }

  protected applyLayout(): void {
    if (this.selectBoxElement) {
      this.selectBoxElement.width = this._size.width + 4
      this.selectBoxElement.height = this._size.height + 4
    }
  }

  protected applyPaint(): void {
    if (!this.selectBoxElement) return
    
    switch (this._state) {
      case SelectBoxState.HOVER:
        this.selectBoxElement.stroke = '#2ebdff'
        this.selectBoxElement.strokeWidth = this._strokeWidth
        this.selectBoxElement.opacity = 0.5
        this.selectBoxElement.fill = 'none'
        break
      case SelectBoxState.ACTIVE:
        this.selectBoxElement.stroke = '#2ebdff'
        this.selectBoxElement.strokeWidth = this._strokeWidth
        this.selectBoxElement.opacity = 1
        this.selectBoxElement.fill = 'none'
        break
      case SelectBoxState.DEFOCUS:
        this.selectBoxElement.stroke = '#9f9f9f'
        this.selectBoxElement.strokeWidth = this._strokeWidth
        this.selectBoxElement.opacity = 1
        this.selectBoxElement.fill = 'none'
        break
      case SelectBoxState.INTERSECT:
        this.selectBoxElement.stroke = '#2ebdff'
        this.selectBoxElement.strokeWidth = this._strokeWidth
        this.selectBoxElement.opacity = 1
        this.selectBoxElement.fill = 'none'
        break
      default:
        this.selectBoxElement.stroke = this._strokeColor
        this.selectBoxElement.strokeWidth = this._strokeWidth
        this.selectBoxElement.opacity = 1
        this.selectBoxElement.fill = 'none'
        break
    }
    
    this.selectBoxElement.cornerRadius = this._cornerRadius
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  getState(): SelectBoxState {
    return this._state
  }

  setState(state: SelectBoxState): void {
    if (this._state === state) return
    
    this._state = state
    this._isVisible = state !== SelectBoxState.HIDDEN
    this.group.visible = this._isVisible
    this.invalidatePaint()
  }

  show(): void {
    this.setState(SelectBoxState.HOVER)
  }

  hide(): void {
    this.setState(SelectBoxState.HIDDEN)
  }

  hover(): void {
    this.setState(SelectBoxState.HOVER)
  }

  active(): void {
    this.setState(SelectBoxState.ACTIVE)
  }

  defocus(): void {
    this.setState(SelectBoxState.DEFOCUS)
  }

  intersect(): void {
    this.setState(SelectBoxState.INTERSECT)
  }

  setStrokeColor(color: string): void {
    if (this._strokeColor === color) return
    this._strokeColor = color
    this.invalidatePaint()
  }

  setStrokeWidth(width: number): void {
    if (this._strokeWidth === width) return
    this._strokeWidth = width
    this.invalidatePaint()
  }

  setCornerRadius(radius: number): void {
    if (this._cornerRadius === radius) return
    this._cornerRadius = radius
    this.invalidatePaint()
  }
}

export class ResizeBoxNodeView extends NodeView {
  private _handleSize: number = 8
  private _handleColor: string = '#4A90D9'
  private handles: Rect[] = []
  private borderElement: Rect | null = null

  constructor(node: MindMapNode) {
    super(node)
    this._isVisible = false
  }

  protected initialize(): void {
    this.borderElement = new Rect({
      x: 0,
      y: 0,
      width: this._size.width,
      height: this._size.height,
      fill: 'none',
      stroke: this._handleColor,
      strokeWidth: 1,
      dashPattern: [4, 4],
    })
    this.group.add(this.borderElement)

    this.createHandles()
    this.group.visible = false
  }

  private createHandles(): void {
    const positions = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]

    for (const pos of positions) {
      const handle = new Rect({
        x: pos.x * (this._size.width / 2) - this._handleSize / 2,
        y: pos.y * (this._size.height / 2) - this._handleSize / 2,
        width: this._handleSize,
        height: this._handleSize,
        fill: '#ffffff',
        stroke: this._handleColor,
        strokeWidth: 1,
        cursor: this.getCursor(pos.x, pos.y),
      })
      this.handles.push(handle)
      this.group.add(handle)
    }
  }

  private getCursor(x: number, y: number): string {
    if (x === 0 && y === 0) return 'nw-resize'
    if (x === 1 && y === 0) return 'n-resize'
    if (x === 2 && y === 0) return 'ne-resize'
    if (x === 0 && y === 1) return 'w-resize'
    if (x === 2 && y === 1) return 'e-resize'
    if (x === 0 && y === 2) return 'sw-resize'
    if (x === 1 && y === 2) return 's-resize'
    if (x === 2 && y === 2) return 'se-resize'
    return 'default'
  }

  protected calculatePreferredSize(): Size {
    return {
      width: this._size.width,
      height: this._size.height,
    }
  }

  protected applyLayout(): void {
    if (this.borderElement) {
      this.borderElement.width = this._size.width
      this.borderElement.height = this._size.height
    }

    const positions = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ]

    for (let i = 0; i < this.handles.length; i++) {
      const pos = positions[i]
      this.handles[i]!.x = pos!.x * (this._size.width / 2) - this._handleSize / 2
      this.handles[i]!.y = pos!.y * (this._size.height / 2) - this._handleSize / 2
    }
  }

  protected applyPaint(): void {
    if (this.borderElement) {
      this.borderElement.stroke = this._handleColor
    }
    for (const handle of this.handles) {
      handle.stroke = this._handleColor
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  show(): void {
    this._isVisible = true
    this.group.visible = true
    this.invalidateLayout()
  }

  hide(): void {
    this._isVisible = false
    this.group.visible = false
  }

  setHandleSize(size: number): void {
    if (this._handleSize === size) return
    this._handleSize = size
    this.invalidateLayout()
  }

  setHandleColor(color: string): void {
    if (this._handleColor === color) return
    this._handleColor = color
    this.invalidatePaint()
  }
}

export class CollapseExpandNodeView extends NodeView {
  private _isCollapsed: boolean = false
  private _lineColor: string = '#999999'
  private _backgroundColor: string = '#ffffff'
  private _fillColor: string = '#4A90D9'
  
  private circleElement: Path | null = null
  private iconElement: Path | null = null

  constructor(node: MindMapNode) {
    super(node)
  }

  protected initialize(): void {
    this.circleElement = new Path({
      path: 'M 8 0 A 8 8 0 1 1 8 16 A 8 8 0 1 1 8 0 Z',
      fill: this._backgroundColor,
      stroke: this._lineColor,
      strokeWidth: 1,
    })
    this.group.add(this.circleElement)

    this.iconElement = new Path({
      path: this._isCollapsed
        ? 'M 5 8 L 11 8 M 8 5 L 8 11'
        : 'M 5 8 L 11 8',
      stroke: this._fillColor,
      strokeWidth: 2,
      fill: 'none',
    })
    this.group.add(this.iconElement)
  }

  protected calculatePreferredSize(): Size {
    return { width: 16, height: 16 }
  }

  protected applyLayout(): void {
  }

  protected applyPaint(): void {
    if (this.iconElement) {
      this.iconElement.path = this._isCollapsed
        ? 'M 5 8 L 11 8 M 8 5 L 8 11'
        : 'M 5 8 L 11 8'
      this.iconElement.stroke = this._fillColor
    }
    if (this.circleElement) {
      this.circleElement.fill = this._backgroundColor
      this.circleElement.stroke = this._lineColor
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  isCollapsed(): boolean {
    return this._isCollapsed
  }

  setCollapsed(collapsed: boolean): void {
    if (this._isCollapsed === collapsed) return
    this._isCollapsed = collapsed
    this.invalidatePaint()
  }

  setLineColor(color: string): void {
    if (this._lineColor === color) return
    this._lineColor = color
    this.invalidatePaint()
  }

  setBackgroundColor(color: string): void {
    if (this._backgroundColor === color) return
    this._backgroundColor = color
    this.invalidatePaint()
  }

  setFillColor(color: string): void {
    if (this._fillColor === color) return
    this._fillColor = color
    this.invalidatePaint()
  }
}

export default SelectBoxNodeView
