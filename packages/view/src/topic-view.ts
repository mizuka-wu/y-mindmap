import { Group, Rect, Text, Path, Ellipse, Image as LeaferImage } from 'leafer-ui'
import { MindMapNode } from '@y-mindmap/state'
import { NodeLayout } from '@y-mindmap/layout'
import { 
  DEFAULT_TOPIC_STYLE, MarkerData, ImageData,
  AttributeTitle, AttributeTitleUnit,
  isRichAttributeTitle, getPlainTextFromAttributeTitle,
  StyleData
} from '@y-mindmap/core'
import { ShapeFactory } from './shapes/shape-factory'
import { createWrappedText } from './utils/text-utils'
import { ImageRenderer } from './images/image-renderer'

export class TopicView {
  readonly group: Group
  readonly nodeId: string

  private shape: Rect | Ellipse | Path
  private titleText: Text | Group
  private expandButton: Group | null = null
  private selectBox: Rect | null = null
  private markerViews: Group[] = []
  private imageContainer: Group | null = null
  private imageRenderer: ImageRenderer

  private node: MindMapNode
  private layout: NodeLayout
  private isSelected: boolean = false

  constructor(node: MindMapNode, layout: NodeLayout) {
    this.node = node
    this.layout = layout
    this.nodeId = node.id
    this.imageRenderer = new ImageRenderer()

    this.group = new Group({
      x: layout.x,
      y: layout.y,
      data: { nodeId: node.id },
    })

    this.shape = this.createShape()
    this.titleText = this.createTitle()

    this.group.add(this.shape)
    this.group.add(this.titleText)

    if (node.hasChildren) {
      this.expandButton = this.createExpandButton()
      this.group.add(this.expandButton)
    }

    if (node.markers && node.markers.length > 0) {
      this.renderMarkers()
    }

    if (node.image) {
      this.renderImage()
    }
  }

  private createShape(): Rect | Ellipse | Path {
    const style = this.node.style
    const shapeType = style?.properties?.['shape-class'] || 'roundedRect'
    const bounds = { x: 0, y: 0, width: this.layout.width, height: this.layout.height }

    const shape = ShapeFactory.create(shapeType, bounds)

    if (shape instanceof Rect) {
      shape.fill = style?.properties?.['fill-color'] || DEFAULT_TOPIC_STYLE.fillColor
      shape.stroke = style?.properties?.['border-color'] || DEFAULT_TOPIC_STYLE.borderColor
      shape.strokeWidth = style?.properties?.['border-width'] || DEFAULT_TOPIC_STYLE.borderWidth
    } else if (shape instanceof Ellipse) {
      shape.fill = style?.properties?.['fill-color'] || DEFAULT_TOPIC_STYLE.fillColor
      shape.stroke = style?.properties?.['border-color'] || DEFAULT_TOPIC_STYLE.borderColor
      shape.strokeWidth = style?.properties?.['border-width'] || DEFAULT_TOPIC_STYLE.borderWidth
    } else if (shape instanceof Path) {
      shape.fill = style?.properties?.['fill-color'] || DEFAULT_TOPIC_STYLE.fillColor
      shape.stroke = style?.properties?.['border-color'] || DEFAULT_TOPIC_STYLE.borderColor
      shape.strokeWidth = style?.properties?.['border-width'] || DEFAULT_TOPIC_STYLE.borderWidth
    }

    return shape
  }

  private createTitle(): Text | Group {
    const style = this.node.style
    const hasImage = !!this.node.image
    const titleHeight = hasImage ? this.layout.height - 80 : this.layout.height

    if (this.node.isRichTitle && this.node.attributeTitle) {
      return this.createRichTitle(this.node.attributeTitle, style, titleHeight)
    }

    return this.createPlainTextTitle(this.node.title, style, titleHeight)
  }

  private createPlainTextTitle(
    title: string, 
    style: StyleData | undefined, 
    titleHeight: number
  ): Text {
    return createWrappedText(title, {
      x: 0,
      y: 0,
      width: this.layout.width,
      height: titleHeight,
      fontSize: style?.properties?.['font-size'] || DEFAULT_TOPIC_STYLE.fontSize,
      fontFamily: style?.properties?.['font-family'] || DEFAULT_TOPIC_STYLE.fontFamily,
      fill: style?.properties?.['text-color'] || DEFAULT_TOPIC_STYLE.textColor,
      textAlign: 'center',
      verticalAlign: 'middle',
    })
  }

  private createRichTitle(
    attributeTitle: AttributeTitle,
    style: StyleData | undefined,
    titleHeight: number
  ): Group {
    const titleGroup = new Group({
      x: 0,
      y: 0,
      width: this.layout.width,
      height: titleHeight,
    })

    const baseFontSize = style?.properties?.['font-size'] || DEFAULT_TOPIC_STYLE.fontSize
    const baseFontFamily = style?.properties?.['font-family'] || DEFAULT_TOPIC_STYLE.fontFamily
    const baseColor = style?.properties?.['text-color'] || DEFAULT_TOPIC_STYLE.textColor

    let offsetX = 0
    const offsetY = titleHeight / 2

    for (const unit of attributeTitle) {
      const text = new Text({
        x: offsetX,
        y: offsetY,
        text: unit.text,
        fontSize: this.parseFontSize(unit['fo:font-size'] || baseFontSize),
        fontFamily: unit['fo:font-family'] || baseFontFamily,
        fontWeight: unit['fo:font-weight'] || 'normal',
        fontStyle: unit['fo:font-style'] || 'normal',
        fill: unit['fo:color'] || baseColor,
        textDecoration: unit['fo:text-decoration'] || 'none',
        textAlign: 'left',
        verticalAlign: 'middle',
      })

      titleGroup.add(text)
      offsetX += text.width || 0
    }

    return titleGroup
  }

  private parseFontSize(fontSize: string | number | undefined): number {
    if (typeof fontSize === 'number') return fontSize
    if (typeof fontSize === 'string') {
      const parsed = parseInt(fontSize, 10)
      return isNaN(parsed) ? 14 : parsed
    }
    return 14
  }

  private createExpandButton(): Group {
    const button = new Group({
      x: this.layout.width - 15,
      y: this.layout.height / 2 - 8,
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
      text: this.node.isFolded ? '+' : '-',
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

    if (!this.node.markers) return

    let offsetX = 8
    const offsetY = 8

    for (const marker of this.node.markers) {
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

  private createMarkerView(marker: MarkerData): Group | null {
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

    if (!this.node.image) return

    this.imageContainer = new Group({
      x: 10,
      y: this.layout.height - 70,
    })

    const imageBounds = {
      x: 0,
      y: 0,
      width: this.layout.width - 20,
      height: 60,
    }

    this.imageRenderer.render(this.imageContainer, this.node.image, imageBounds, {
      fit: 'contain',
      align: 'center',
      valign: 'center',
      borderRadius: 4,
    })

    this.group.add(this.imageContainer)
  }

  updateLayout(layout: NodeLayout): void {
    this.layout = layout
    this.group.x = layout.x
    this.group.y = layout.y

    if (this.shape instanceof Rect) {
      this.shape.width = layout.width
      this.shape.height = layout.height
    } else if (this.shape instanceof Ellipse) {
      this.shape.x = layout.width / 2
      this.shape.y = layout.height / 2
    }

    if (this.titleText) {
      this.titleText.remove()
    }
    this.titleText = this.createTitle()
    this.group.add(this.titleText)

    if (this.expandButton) {
      this.expandButton.x = layout.width - 15
      this.expandButton.y = layout.height / 2 - 8
    }

    if (this.selectBox) {
      this.selectBox.width = layout.width + 4
      this.selectBox.height = layout.height + 4
    }

    if (this.node.image) {
      this.renderImage()
    }
  }

  updateNode(node: MindMapNode): void {
    this.node = node

    const style = node.style
    if (this.shape instanceof Rect || this.shape instanceof Ellipse || this.shape instanceof Path) {
      this.shape.fill = style?.properties?.['fill-color'] || DEFAULT_TOPIC_STYLE.fillColor
      this.shape.stroke = style?.properties?.['border-color'] || DEFAULT_TOPIC_STYLE.borderColor
      this.shape.strokeWidth = style?.properties?.['border-width'] || DEFAULT_TOPIC_STYLE.borderWidth
    }

    if (this.titleText) {
      this.titleText.remove()
    }
    this.titleText = this.createTitle()
    this.group.add(this.titleText)

    if (node.markers && node.markers.length > 0) {
      this.renderMarkers()
    }

    if (node.image) {
      this.renderImage()
    } else if (this.imageContainer) {
      this.imageContainer.remove()
      this.imageContainer = null
    }
  }

  setSelected(selected: boolean): void {
    if (this.isSelected === selected) return

    this.isSelected = selected

    if (selected) {
      this.selectBox = new Rect({
        x: -2,
        y: -2,
        width: this.layout.width + 4,
        height: this.layout.height + 4,
        fill: 'none',
        stroke: '#4A90D9',
        strokeWidth: 2,
        cornerRadius: (this.node.style?.properties?.['corner-radius'] || DEFAULT_TOPIC_STYLE.cornerRadius) + 2,
      })
      this.group.add(this.selectBox)
    } else {
      if (this.selectBox) {
        this.selectBox.remove()
        this.selectBox = null
      }
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

    this.group.remove()
  }
}
