import { Group, Rect, Ellipse, Path, Text } from 'leafer-ui'
import type { MindMapNode } from '@y-mindmap/state'
import { StyleKey, DEFAULT_TOPIC_STYLE } from '@y-mindmap/core'
import type { StyleData } from '@y-mindmap/core'
import { NodeView, Size, Bounds } from '../core/node-view'
import { styleManager } from '../core/style-manager'
import { ShapeFactory } from '../shapes/shape-factory'
import { createWrappedText } from '../utils/text-utils'

export class TopicNodeView extends NodeView {
  private shape: Rect | Ellipse | Path | null = null
  private titleText: Text | Group | null = null
  private expandButton: Group | null = null
  private selectBox: Rect | null = null
  private markerViews: Group[] = []
  private imageContainer: Group | null = null

  protected initialize(): void {
    this.shape = this.createShape()
    this.titleText = this.createTitle()
    
    this.group.add(this.shape)
    this.group.add(this.titleText)
    
    if (this._node.hasChildren) {
      this.expandButton = this.createExpandButton()
      this.group.add(this.expandButton)
    }
    
    if (this._node.markers && this._node.markers.length > 0) {
      this.renderMarkers()
    }
    
    if (this._node.image) {
      this.renderImage()
    }
  }
  
  protected calculatePreferredSize(): Size {
    const style = this._node.style
    const fontSize = 14
    const fontFamily = 'Arial'
    
    const titleSize = this.measureText(this._node.title, fontSize, fontFamily)
    const padding = this.getShapePadding()
    
    return {
      width: titleSize.width + padding.left + padding.right,
      height: titleSize.height + padding.top + padding.bottom,
    }
  }
  
  protected applyLayout(): void {
    if (!this.shape) return
    
    const width = this._size.width
    const height = this._size.height
    
    if (this.shape instanceof Rect) {
      this.shape.width = width
      this.shape.height = height
    } else if (this.shape instanceof Ellipse) {
      this.shape.x = width / 2
      this.shape.y = height / 2
      this.shape.radiusX = width / 2
      this.shape.radiusY = height / 2
    }
    
    if (this.titleText) {
      this.titleText.remove()
      this.titleText = this.createTitle()
      this.group.add(this.titleText)
    }
    
    if (this.expandButton) {
      this.expandButton.x = width - 15
      this.expandButton.y = height / 2 - 8
    }
    
    if (this.selectBox) {
      this.selectBox.width = width + 4
      this.selectBox.height = height + 4
    }
    
    if (this._node.image) {
      this.renderImage()
    }
  }
  
  protected applyPaint(): void {
    if (!this.shape) return
    
    // Read styles from parent BranchNodeView via StyleManager (Snowbrush behavior)
    const fillColor = styleManager.getStyleValueOrDefault(this, StyleKey.FILL_COLOR, DEFAULT_TOPIC_STYLE.fillColor)
    const borderColor = styleManager.getStyleValueOrDefault(this, StyleKey.BORDER_COLOR, DEFAULT_TOPIC_STYLE.borderColor)
    const borderWidth = styleManager.getStyleValueOrDefault(this, StyleKey.BORDER_WIDTH, DEFAULT_TOPIC_STYLE.borderWidth)
    
    if (this.shape instanceof Rect || this.shape instanceof Ellipse || this.shape instanceof Path) {
      this.shape.fill = fillColor
      this.shape.stroke = borderColor
      this.shape.strokeWidth = borderWidth
    }
    
    if (this._isSelected) {
      this.showSelectBox()
    } else {
      this.hideSelectBox()
    }
  }
  
  protected updateStyle(): void {
    this.invalidatePaint()
  }

  refreshColorStyles(): void {
    this.invalidatePaint()
  }
  
  private createShape(): Rect | Ellipse | Path {
    const shapeType = styleManager.getStyleValueOrDefault(this, StyleKey.SHAPE_CLASS, 'roundedRect')
    const bounds = { x: 0, y: 0, width: this._size.width, height: this._size.height }
    
    return ShapeFactory.create(shapeType, bounds)
  }
  
  private createTitle(): Text | Group {
    const hasImage = !!this._node.image
    const titleHeight = hasImage ? this._size.height - 80 : this._size.height
    const textColor = styleManager.getStyleValueOrDefault(this, StyleKey.TEXT_COLOR, DEFAULT_TOPIC_STYLE.textColor)
    
    return createWrappedText(this._node.title, {
      x: 0,
      y: 0,
      width: this._size.width,
      height: titleHeight,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: textColor,
      textAlign: 'center',
      verticalAlign: 'middle',
    })
  }
  
  private createExpandButton(): Group {
    const button = new Group({
      x: this._size.width - 15,
      y: this._size.height / 2 - 8,
      cursor: 'pointer',
    })
    
    const circle = new Ellipse({
      x: 0,
      y: 0,
      radiusX: 8,
      radiusY: 8,
      fill: '#ffffff',
      stroke: '#999999',
      strokeWidth: 1,
    })
    
    const text = new Text({
      x: 0,
      y: 0,
      text: this._node.isFolded ? '+' : '-',
      fontSize: 12,
      fill: '#999999',
      textAlign: 'center',
      verticalAlign: 'middle',
    })
    
    button.add(circle)
    button.add(text)
    
    return button
  }
  
  private renderMarkers(): void {
    for (const view of this.markerViews) {
      view.remove()
    }
    this.markerViews = []
    
    if (!this._node.markers) return
    
    let offsetX = 8
    const offsetY = 8
    
    for (const marker of this._node.markers) {
      const markerView = this.createMarkerView(marker)
      if (markerView) {
        markerView.x = offsetX
        markerView.y = offsetY
        this.group.add(markerView)
        this.markerViews.push(markerView)
        offsetX += 24
      }
    }
  }
  
  private createMarkerView(marker: any): Group | null {
    const view = new Group()
    const icon = new Text({
      text: this.getMarkerIcon(marker.markerId),
      fontSize: 16,
    })
    view.add(icon)
    return view
  }
  
  private getMarkerIcon(markerId: string): string {
    const icons: Record<string, string> = {
      'priority-1': '🔴',
      'priority-2': '🟡',
      'priority-3': '🟢',
      'flag': '🚩',
      'star': '⭐',
      'smile': '😊',
    }
    return icons[markerId] || '•'
  }
  
  private renderImage(): void {
    if (this.imageContainer) {
      this.imageContainer.remove()
      this.imageContainer = null
    }
    
    if (!this._node.image) return
    
    this.imageContainer = new Group({
      x: 10,
      y: this._size.height - 70,
    })
    
    const imageBounds = {
      x: 0,
      y: 0,
      width: this._size.width - 20,
      height: 60,
    }
    
    const image = new Rect({
      x: imageBounds.x,
      y: imageBounds.y,
      width: imageBounds.width,
      height: imageBounds.height,
      fill: '#f0f0f0',
      cornerRadius: 4,
    })
    
    this.imageContainer.add(image)
    this.group.add(this.imageContainer)
  }
  
  private showSelectBox(): void {
    if (this.selectBox) return
    
    this.selectBox = new Rect({
      x: -2,
      y: -2,
      width: this._size.width + 4,
      height: this._size.height + 4,
      fill: 'none',
      stroke: '#4A90D9',
      strokeWidth: 2,
      cornerRadius: 10,
    })
    this.group.add(this.selectBox)
  }
  
  private hideSelectBox(): void {
    if (!this.selectBox) return
    
    this.selectBox.remove()
    this.selectBox = null
  }
  
  private measureText(text: string, fontSize: number, fontFamily: string): Size {
    const tempText = new Text({
      text,
      fontSize,
      fontFamily,
    })
    
    const width = tempText.width || text.length * fontSize * 0.6
    const height = tempText.height || fontSize * 1.2
    
    return { width, height }
  }
  
  private getShapePadding(): { top: number; right: number; bottom: number; left: number } {
    const shapeClass = styleManager.getStyleValueOrDefault(this, StyleKey.SHAPE_CLASS, 'roundedRect')
    
    switch (shapeClass) {
      case 'roundedRect':
        return { top: 12, right: 16, bottom: 12, left: 16 }
      case 'ellipse':
        return { top: 20, right: 24, bottom: 20, left: 24 }
      case 'cloud':
        return { top: 24, right: 28, bottom: 24, left: 28 }
      default:
        return { top: 12, right: 16, bottom: 12, left: 16 }
    }
  }
  
  destroy(): void {
    for (const view of this.markerViews) {
      view.remove()
    }
    this.markerViews = []
    
    if (this.imageContainer) {
      this.imageContainer.remove()
      this.imageContainer = null
    }
    
    super.destroy()
  }
}

export default TopicNodeView
