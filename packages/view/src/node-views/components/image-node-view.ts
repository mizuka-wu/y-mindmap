import { Rect, Image as LeaferImage, Group } from 'leafer-ui'
import { NodeView, Size, Bounds } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'
import type { ImageData } from '@y-mindmap/core'
import type { StyleData } from '@y-mindmap/core'
import { DEFAULT_TOPIC_STYLE } from '@y-mindmap/core'

export class ImageNodeView extends NodeView {
  private _imageData: ImageData
  private imageElement: LeaferImage | null = null
  private placeholderElement: Rect | null = null
  private _originalSize: Size = { width: 0, height: 0 }
  private _borderColor: string = '#cccccc'
  private _borderWidth: number = 1
  private _borderRadius: number = 4
  private _shadowVisible: boolean = false

  constructor(node: MindMapNode, imageData: ImageData) {
    super(node)
    this._imageData = imageData
  }

  protected initialize(): void {
    this.placeholderElement = new Rect({
      width: 100,
      height: 80,
      fill: '#f5f5f5',
      stroke: this._borderColor,
      strokeWidth: this._borderWidth,
      cornerRadius: this._borderRadius,
    })
    this.group.add(this.placeholderElement)

    if (this._imageData.src) {
      this.loadImage()
    }
  }

  private loadImage(): void {
    this.imageElement = new LeaferImage({
      url: this._imageData.src,
      width: this._size.width || 100,
      height: this._size.height || 80,
      cornerRadius: this._borderRadius,
    })
    this.group.add(this.imageElement)

    if (this.placeholderElement) {
      this.placeholderElement.visible = false
    }
  }

  protected calculatePreferredSize(): Size {
    if (this._originalSize.width > 0 && this._originalSize.height > 0) {
      return this._originalSize
    }
    return { width: 100, height: 80 }
  }

  protected applyLayout(): void {
    if (this.imageElement) {
      this.imageElement.width = this._size.width
      this.imageElement.height = this._size.height
    }
    if (this.placeholderElement) {
      this.placeholderElement.width = this._size.width
      this.placeholderElement.height = this._size.height
    }
  }

  protected applyPaint(): void {
    if (this.placeholderElement) {
      this.placeholderElement.stroke = this._borderColor
      this.placeholderElement.strokeWidth = this._borderWidth
      this.placeholderElement.cornerRadius = this._borderRadius
    }
    if (this.imageElement) {
      this.imageElement.cornerRadius = this._borderRadius
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  getImageData(): ImageData {
    return this._imageData
  }

  setImageData(imageData: ImageData): void {
    if (this._imageData.src === imageData.src) return
    this._imageData = imageData
    this.loadImage()
    this.invalidateLayout()
  }

  setOriginalSize(size: Size): void {
    this._originalSize = { ...size }
    this.invalidateLayout()
  }

  setBorderColor(color: string): void {
    if (this._borderColor === color) return
    this._borderColor = color
    this.invalidatePaint()
  }

  setBorderWidth(width: number): void {
    if (this._borderWidth === width) return
    this._borderWidth = width
    this.invalidateLayout()
  }

  setBorderRadius(radius: number): void {
    if (this._borderRadius === radius) return
    this._borderRadius = radius
    this.invalidateLayout()
  }

  setShadowVisible(visible: boolean): void {
    if (this._shadowVisible === visible) return
    this._shadowVisible = visible
    this.invalidatePaint()
  }
}

export default ImageNodeView
