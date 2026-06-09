import { Rect, Text, Group } from 'leafer-ui'
import { NodeView, Size } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'

export class LabelNodeView extends NodeView {
  private _text: string
  private _backgroundColor: string = '#E8F4FD'
  private _textColor: string = '#4A90D9'
  private _borderRadius: number = 10
  private backgroundElement: Rect | null = null
  private textElement: Text | null = null

  constructor(node: MindMapNode, text: string) {
    super(node)
    this._text = text
  }

  protected initialize(): void {
    this.backgroundElement = new Rect({
      fill: this._backgroundColor,
      cornerRadius: this._borderRadius,
    })
    this.group.add(this.backgroundElement)

    this.textElement = new Text({
      text: this._text,
      fontSize: 12,
      fill: this._textColor,
      textAlign: 'center',
      verticalAlign: 'middle',
    })
    this.group.add(this.textElement)
  }

  protected calculatePreferredSize(): Size {
    if (!this.textElement) return { width: 0, height: 0 }
    
    const textWidth = this.textElement.width || this._text.length * 7
    const textHeight = this.textElement.height || 16
    
    return {
      width: textWidth + 16,
      height: textHeight + 8,
    }
  }

  protected applyLayout(): void {
    if (this.backgroundElement) {
      this.backgroundElement.width = this._size.width
      this.backgroundElement.height = this._size.height
    }
    if (this.textElement) {
      this.textElement.width = this._size.width - 16
      this.textElement.height = this._size.height - 8
    }
  }

  protected applyPaint(): void {
    if (this.backgroundElement) {
      this.backgroundElement.fill = this._backgroundColor
      this.backgroundElement.cornerRadius = this._borderRadius
    }
    if (this.textElement) {
      this.textElement.fill = this._textColor
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

  setBackgroundColor(color: string): void {
    if (this._backgroundColor === color) return
    this._backgroundColor = color
    this.invalidatePaint()
  }

  setTextColor(color: string): void {
    if (this._textColor === color) return
    this._textColor = color
    this.invalidatePaint()
  }

  setBorderRadius(radius: number): void {
    if (this._borderRadius === radius) return
    this._borderRadius = radius
    this.invalidatePaint()
  }
}

export class LabelsNodeView extends NodeView {
  private labelViews: LabelNodeView[] = []
  private _labels: string[] = []
  private _spacing: number = 4

  constructor(node: MindMapNode, labels: string[]) {
    super(node)
    this._labels = labels
  }

  protected initialize(): void {
    this.createLabelViews()
  }

  private createLabelViews(): void {
    for (const view of this.labelViews) {
      view.destroy()
    }
    this.labelViews = []

    let offsetX = 0
    for (const label of this._labels) {
      const view = new LabelNodeView(this._node, label)
      view.setPosition({ x: offsetX, y: 0 })
      this.addChild(view)
      this.labelViews.push(view)
      offsetX += view.getPreferredSize().width + this._spacing
    }
  }

  protected calculatePreferredSize(): Size {
    let totalWidth = 0
    let maxHeight = 0
    
    for (const view of this.labelViews) {
      const size = view.getPreferredSize()
      totalWidth += size.width + this._spacing
      maxHeight = Math.max(maxHeight, size.height)
    }
    
    if (this.labelViews.length > 0) {
      totalWidth -= this._spacing
    }
    
    return { width: totalWidth, height: maxHeight }
  }

  protected applyLayout(): void {
    let offsetX = 0
    for (const view of this.labelViews) {
      const size = view.getPreferredSize()
      view.setPosition({ x: offsetX, y: 0 })
      view.setSize(size)
      offsetX += size.width + this._spacing
    }
  }

  protected applyPaint(): void {
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  setLabels(labels: string[]): void {
    this._labels = labels
    this.createLabelViews()
    this.invalidateLayout()
  }

  getLabels(): string[] {
    return [...this._labels]
  }

  setSpacing(spacing: number): void {
    if (this._spacing === spacing) return
    this._spacing = spacing
    this.invalidateLayout()
  }
}

export default LabelNodeView
