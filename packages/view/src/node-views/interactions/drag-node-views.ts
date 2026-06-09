import { Group, Rect, Line, Path } from 'leafer-ui'
import { NodeView, Size, Position } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'

export enum DropPosition {
  NONE = 'none',
  BEFORE = 'before',
  AFTER = 'after',
  INSIDE = 'inside',
}

export interface DropTarget {
  nodeId: string
  position: DropPosition
  bounds: { x: number; y: number; width: number; height: number }
}

export class DragPreviewView extends NodeView {
  private previewElement: Rect | null = null
  private _previewOpacity: number = 0.7
  private _originalWidth: number = 0
  private _originalHeight: number = 0

  constructor(node: MindMapNode) {
    super(node)
    this._isVisible = false
  }

  protected initialize(): void {
    this.previewElement = new Rect({
      x: 0,
      y: 0,
      width: this._size.width,
      height: this._size.height,
      fill: '#E3F2FD',
      stroke: '#2196F3',
      strokeWidth: 2,
      cornerRadius: 8,
      opacity: this._previewOpacity,
    })
    this.group.add(this.previewElement)
    this.group.visible = false
  }

  protected calculatePreferredSize(): Size {
    return {
      width: this._originalWidth,
      height: this._originalHeight,
    }
  }

  protected applyLayout(): void {
    if (this.previewElement) {
      this.previewElement.width = this._size.width
      this.previewElement.height = this._size.height
    }
  }

  protected applyPaint(): void {
    if (this.previewElement) {
      this.previewElement.opacity = this._previewOpacity
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  show(originalWidth: number, originalHeight: number): void {
    this._originalWidth = originalWidth
    this._originalHeight = originalHeight
    this._isVisible = true
    this.group.visible = true
    this.invalidateLayout()
  }

  hide(): void {
    this._isVisible = false
    this.group.visible = false
  }

  setPosition(position: Position): void {
    super.setPosition(position)
  }

  setPreviewOpacity(opacity: number): void {
    this._previewOpacity = opacity
    this.invalidatePaint()
  }
}

export class DropIndicatorView extends NodeView {
  private indicatorElement: Rect | null = null
  private highlightElement: Rect | null = null
  private _dropPosition: DropPosition = DropPosition.NONE
  private _targetBounds: { x: number; y: number; width: number; height: number } | null = null

  constructor(node: MindMapNode) {
    super(node)
    this._isVisible = false
  }

  protected initialize(): void {
    this.indicatorElement = new Rect({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      fill: 'none',
      stroke: '#2196F3',
      strokeWidth: 2,
      dashPattern: [6, 3],
      cornerRadius: 4,
    })
    this.group.add(this.indicatorElement)

    this.highlightElement = new Rect({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      fill: '#2196F3',
      opacity: 0.2,
      cornerRadius: 4,
    })
    this.group.add(this.highlightElement)
    this.group.visible = false
  }

  protected calculatePreferredSize(): Size {
    return { width: 0, height: 0 }
  }

  protected applyLayout(): void {
    if (!this._targetBounds) return

    const { x, y, width, height } = this._targetBounds

    if (this.indicatorElement) {
      switch (this._dropPosition) {
        case DropPosition.BEFORE:
          this.indicatorElement.x = x
          this.indicatorElement.y = y - 4
          this.indicatorElement.width = width
          this.indicatorElement.height = 4
          break
        case DropPosition.AFTER:
          this.indicatorElement.x = x
          this.indicatorElement.y = y + height
          this.indicatorElement.width = width
          this.indicatorElement.height = 4
          break
        case DropPosition.INSIDE:
          this.indicatorElement.x = x - 2
          this.indicatorElement.y = y - 2
          this.indicatorElement.width = width + 4
          this.indicatorElement.height = height + 4
          break
        default:
          this.indicatorElement.width = 0
          this.indicatorElement.height = 0
      }
    }

    if (this.highlightElement) {
      if (this._dropPosition === DropPosition.INSIDE) {
        this.highlightElement.x = x
        this.highlightElement.y = y
        this.highlightElement.width = width
        this.highlightElement.height = height
        this.highlightElement.visible = true
      } else {
        this.highlightElement.visible = false
      }
    }
  }

  protected applyPaint(): void {
    if (this.indicatorElement) {
      this.indicatorElement.stroke = '#2196F3'
      this.indicatorElement.strokeWidth = 2
    }
    if (this.highlightElement) {
      this.highlightElement.fill = '#2196F3'
      this.highlightElement.opacity = 0.2
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  showDropTarget(target: DropTarget): void {
    this._dropPosition = target.position
    this._targetBounds = target.bounds
    this._isVisible = true
    this.group.visible = true
    this.invalidateLayout()
  }

  hide(): void {
    this._dropPosition = DropPosition.NONE
    this._targetBounds = null
    this._isVisible = false
    this.group.visible = false
  }

  getDropPosition(): DropPosition {
    return this._dropPosition
  }
}

export class DragGhostView extends NodeView {
  private ghostElement: Rect | null = null
  private _titleText: string = ''

  constructor(node: MindMapNode) {
    super(node)
    this._isVisible = false
  }

  protected initialize(): void {
    this.ghostElement = new Rect({
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      fill: '#ffffff',
      stroke: '#2196F3',
      strokeWidth: 1,
      cornerRadius: 6,
      shadow: {
        x: 2,
        y: 2,
        blur: 8,
        color: 'rgba(0,0,0,0.2)',
      },
    })
    this.group.add(this.ghostElement)
    this.group.visible = false
  }

  protected calculatePreferredSize(): Size {
    return { width: 120, height: 40 }
  }

  protected applyLayout(): void {
  }

  protected applyPaint(): void {
    if (this.ghostElement) {
      this.ghostElement.fill = '#ffffff'
      this.ghostElement.stroke = '#2196F3'
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  show(title: string): void {
    this._titleText = title
    this._isVisible = true
    this.group.visible = true
    this.invalidateLayout()
  }

  hide(): void {
    this._isVisible = false
    this.group.visible = false
  }

  setPosition(position: Position): void {
    super.setPosition(position)
  }
}

export default DragPreviewView
