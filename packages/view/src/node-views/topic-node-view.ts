import { Group, Rect, Ellipse, Path, Text } from 'leafer-ui'
import type { MindMapNode } from '@y-mindmap/state'
import { StyleKey, DEFAULT_TOPIC_STYLE } from '@y-mindmap/core'
import type { StyleData, MarkerData, GradientData, PatternData } from '@y-mindmap/core'
import { TitleableView } from '../core/titleable-view'
import type { Size, Bounds } from '../core/node-view'
import { NodeView } from '../core/node-view'
import { styleManager } from '../core/style-manager'
import { ShapeFactory } from '../shapes/shape-factory'
import { createWrappedText } from '../utils/text-utils'
import type { BranchNodeView } from './containers/branch-node-view'
import { MarkerNodeView, MarkersNodeView } from './components/marker-node-view'
import { LabelNodeView, LabelsNodeView } from './components/label-node-view'

export class TopicNodeView extends TitleableView {
  private shape: Rect | Ellipse | Path | null = null
  private titleText: Text | Group | null = null
  private expandButton: Group | null = null
  private selectBox: Rect | null = null
  private markerViews: NodeView[] = []
  private labelsView: LabelsNodeView | null = null
  private imageContainer: Group | null = null
  private _owningBranch: BranchNodeView | null = null
  private _shapeClass: string = 'roundedRect'

  protected initialize(): void {
    this._shapeClass = styleManager.getStyleValueOrDefault(this, StyleKey.SHAPE_CLASS, 'roundedRect')
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
    
    this._initLabels()
  }

  protected getStyledNode(): NodeView {
    return this._owningBranch || this
  }

  setOwningBranch(branch: BranchNodeView | null): void {
    this._owningBranch = branch
  }

  getOwningBranch(): BranchNodeView | null {
    return this._owningBranch
  }
  
  protected calculatePreferredSize(): Size {
    const style = this._node.style
    const fontSize = 14
    const fontFamily = 'Arial'
    
    const titleSize = this.measureText(this._node.title, fontSize, fontFamily)
    const padding = this.getShapePadding()
    
    const preferredWidth = titleSize.width + padding.left + padding.right
    const customWidth = (this._node as any).customWidth
    
    return {
      width: customWidth && customWidth > 0 ? customWidth : preferredWidth,
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
    } else if (this.shape instanceof Path) {
      this.shape.remove()
      this.shape = ShapeFactory.create(this._shapeClass, { x: 0, y: 0, width, height })
      this.group.add(this.shape)
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
    
    this.refreshMarkerSizes()
    
    if (this.labelsView) {
      this.labelsView.setPosition({ x: 8, y: height + 4 })
    }
  }
  
  protected applyPaint(): void {
    if (!this.shape) return
    
    const fillColor = styleManager.getStyleValueOrDefault(this, StyleKey.FILL_COLOR, DEFAULT_TOPIC_STYLE.fillColor)
    const borderColor = styleManager.getStyleValueOrDefault(this, StyleKey.BORDER_COLOR, DEFAULT_TOPIC_STYLE.borderColor)
    const borderWidth = styleManager.getStyleValueOrDefault(this, StyleKey.BORDER_WIDTH, DEFAULT_TOPIC_STYLE.borderWidth)
    const borderLinePattern = styleManager.getStyleValue(this, StyleKey.BORDER_PATTERN) as string | undefined
    const fillPattern = styleManager.getStyleValue(this, StyleKey.FILL_PATTERN) as PatternData | undefined
    const fillGradient = styleManager.getStyleValue(this, StyleKey.FILL_GRADIENT) as GradientData | undefined
    const visualFillColor = styleManager.computeVisualFillColor(this)
    
    if (this.shape instanceof Rect || this.shape instanceof Ellipse || this.shape instanceof Path) {
      if (fillPattern && fillPattern.src) {
        this.shape.setAttr('fill', {
          type: 'image',
          url: fillPattern.src,
          mode: fillPattern.repeat || 'repeat',
        })
      } else if (fillGradient) {
        this.shape.fill = this.createGradientFill(fillGradient)
      } else {
        this.shape.fill = visualFillColor || fillColor
      }
      
      this.shape.stroke = borderColor
      this.shape.strokeWidth = borderWidth
      this.shape.dashPattern = this.getDashPattern(borderLinePattern)
    }
    
    if (this._isSelected) {
      this.showSelectBox()
    } else {
      this.hideSelectBox()
    }

    this.refreshMarkerSizes()
  }

  private getDashPattern(pattern?: string): number[] {
    switch (pattern) {
      case 'dashed':
        return [6, 4]
      case 'dotted':
        return [2, 3]
      case 'dash-dot':
        return [6, 2, 2, 2]
      default:
        return []
    }
  }

  private refreshMarkerSizes(): void {
    for (const view of this.markerViews) {
      if (view instanceof MarkersNodeView) {
        view.invalidateLayout()
      }
    }
  }
  
  private createGradientFill(gradient: GradientData): any {
    if (gradient.type === 'linear') {
      const angle = gradient.angle || 0
      const rad = (angle * Math.PI) / 180
      return {
        type: 'linear',
        from: { x: 0.5 - Math.cos(rad) * 0.5, y: 0.5 - Math.sin(rad) * 0.5 },
        to: { x: 0.5 + Math.cos(rad) * 0.5, y: 0.5 + Math.sin(rad) * 0.5 },
        stops: gradient.stops.map(stop => ({
          offset: stop.offset,
          color: stop.color,
        })),
      }
    } else if (gradient.type === 'radial') {
      return {
        type: 'radial',
        stops: gradient.stops.map(stop => ({
          offset: stop.offset,
          color: stop.color,
        })),
      }
    }
    return gradient.stops[0]?.color || '#000000'
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
    const textTransform = styleManager.getStyleValueOrDefault(this, StyleKey.TEXT_TRANSFORM, DEFAULT_TOPIC_STYLE.textTransform)
    
    let displayText = this._node.title
    if (textTransform === 'uppercase') {
      displayText = displayText.toUpperCase()
    } else if (textTransform === 'lowercase') {
      displayText = displayText.toLowerCase()
    } else if (textTransform === 'capitalize') {
      displayText = displayText.replace(/\b\w/g, char => char.toUpperCase())
    }
    
    return createWrappedText(displayText, {
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
    
    const isCollapsed = this._node.isFolded
    const children = this._node.children
    const descendantCount = Array.isArray(children) ? children.length : 0
    
    let displayText: string
    if (isCollapsed) {
      displayText = descendantCount > 99 ? '···' : String(descendantCount)
    } else {
      displayText = '-'
    }
    
    const text = new Text({
      x: 0,
      y: 0,
      text: displayText,
      fontSize: isCollapsed ? 10 : 12,
      fontWeight: isCollapsed ? 300 : 400,
      fill: '#999999',
      textAlign: 'center',
      verticalAlign: 'middle',
    })
    
    button.add(circle)
    button.add(text)
    
    return button
  }
  
  private _initLabels(): void {
    if (this.labelsView) {
      this.labelsView.group.remove()
      this.labelsView = null
    }
    
    if (this._shapeClass === 'matrixMain') {
      return
    }
    
    const labels = this._node.labels
    if (labels && labels.length > 0) {
      this.labelsView = new LabelsNodeView(this._node, labels)
      this.labelsView.setPosition({ x: 8, y: this._size.height + 4 })
      this.group.add(this.labelsView)
    }
  }
  
  refreshLabelViewState(): void {
    if (this._shapeClass === 'matrixMain') {
      if (this.labelsView) {
        this.labelsView.group.remove()
        this.labelsView = null
      }
    } else {
      const labels = this._node.labels
      if (labels && labels.length > 0) {
        if (!this.labelsView) {
          this.labelsView = new LabelsNodeView(this._node, labels)
          this.labelsView.setPosition({ x: 8, y: this._size.height + 4 })
          this.group.add(this.labelsView)
        } else {
          this.labelsView.setLabels(labels)
        }
      }
    }
    this.invalidateLayout()
  }
  
  private renderMarkers(): void {
    for (const view of this.markerViews) {
      view.group.remove()
    }
    this.markerViews = []
    
    if (!this._node.markers || this._node.markers.length === 0) return
    
    const markersNodeView = new MarkersNodeView(this._node, this._node.markers)
    markersNodeView.setPosition({ x: 8, y: 8 })
    this.group.add(markersNodeView)
    this.markerViews.push(markersNodeView)
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

  protected _applyTextColor(color: string): void {
    if (this.titleText) {
      if (this.titleText instanceof Text) {
        this.titleText.fill = color
      }
    }
  }

  protected _applyTextDecoration(decoration: string): void {
    if (this.titleText instanceof Text) {
      this.titleText.textDecoration = decoration as any
    }
  }

  protected _applyTextAlign(align: string): void {
    if (this.titleText instanceof Text) {
      this.titleText.textAlign = align as any
    }
  }

  protected _applyFontSize(size: number): void {
    if (this.titleText instanceof Text) {
      this.titleText.fontSize = size
    }
  }

  protected _applyFontFamily(family: string): void {
    if (this.titleText instanceof Text) {
      this.titleText.fontFamily = family
    }
  }

  protected _applyFontStyle(style: string): void {
    if (this.titleText instanceof Text) {
      this.titleText.italic = style === 'italic'
    }
  }

  protected _applyFontWeight(weight: string | number): void {
    if (this.titleText instanceof Text) {
      this.titleText.fontWeight = weight as any
    }
  }
  
  getTitleBounds(): { x: number; y: number; width: number; height: number } {
    const padding = this.getShapePadding()
    const hasImage = !!this._node.image
    const titleHeight = hasImage ? this._size.height - 80 : this._size.height

    return {
      x: padding.left,
      y: padding.top,
      width: this._size.width - padding.left - padding.right,
      height: titleHeight - padding.top - padding.bottom,
    }
  }

  getTitleStyle(): {
    fontSize: number
    fontFamily: string
    color: string
    fontWeight: string | number
    fontStyle: string
    textAlign: string
  } {
    const fontSize = styleManager.getStyleValueOrDefault(this, StyleKey.FONT_SIZE, 14) as number
    const fontFamily = styleManager.getStyleValueOrDefault(this, StyleKey.FONT_FAMILY, 'Arial') as string
    const color = styleManager.getStyleValueOrDefault(this, StyleKey.TEXT_COLOR, DEFAULT_TOPIC_STYLE.textColor) as string
    const fontWeight = styleManager.getStyleValueOrDefault(this, StyleKey.FONT_WEIGHT, DEFAULT_TOPIC_STYLE.fontWeight)
    const fontStyle = styleManager.getStyleValueOrDefault(this, StyleKey.FONT_STYLE, DEFAULT_TOPIC_STYLE.fontStyle) as string
    const textAlign = styleManager.getStyleValueOrDefault(this, StyleKey.TEXT_ALIGN, 'center') as string

    return { fontSize, fontFamily, color, fontWeight, fontStyle, textAlign }
  }

  private getShapePadding(): { top: number; right: number; bottom: number; left: number } {
    const shapeClass = styleManager.getStyleValueOrDefault(this, StyleKey.SHAPE_CLASS, 'roundedRect')
    
    switch (shapeClass) {
      case 'roundedRect':
      case 'rectangle':
        return { top: 12, right: 16, bottom: 12, left: 16 }
      case 'ellipse':
      case 'circle':
        return { top: 20, right: 24, bottom: 20, left: 24 }
      case 'cloud':
        return { top: 24, right: 28, bottom: 24, left: 28 }
      case 'hexagon':
      case 'parallelogram':
      case 'diamond':
      case 'triangle':
      case 'star':
        return { top: 18, right: 22, bottom: 18, left: 22 }
      case 'capsule':
      case 'barrel':
      case 'paranCallout':
        return { top: 14, right: 18, bottom: 14, left: 18 }
      default:
        return { top: 12, right: 16, bottom: 12, left: 16 }
    }
  }
  
  destroy(): void {
    for (const view of this.markerViews) {
      view.group.remove()
    }
    this.markerViews = []
    
    if (this.labelsView) {
      this.labelsView.group.remove()
      this.labelsView = null
    }
    
    if (this.imageContainer) {
      this.imageContainer.remove()
      this.imageContainer = null
    }
    
    super.destroy()
  }
}

export default TopicNodeView
