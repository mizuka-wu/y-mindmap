import { Rect, Text, Group, Path } from 'leafer-ui'
import { NodeView, Size } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'

export class MathJaxNodeView extends NodeView {
  private _latex: string = ''
  private _fontSize: number = 14
  private _color: string = '#333333'
  
  private placeholderElement: Rect | null = null
  private textElement: Text | null = null

  constructor(node: MindMapNode, latex: string) {
    super(node)
    this._latex = latex
  }

  protected initialize(): void {
    this.placeholderElement = new Rect({
      fill: '#f8f8f8',
      stroke: '#e0e0e0',
      strokeWidth: 1,
      cornerRadius: 4,
    })
    this.group.add(this.placeholderElement)

    this.textElement = new Text({
      text: this._latex,
      fontSize: this._fontSize,
      fontFamily: 'Cambria Math, STIX, serif',
      fill: this._color,
      textAlign: 'center',
      verticalAlign: 'middle',
    })
    this.group.add(this.textElement)
  }

  protected calculatePreferredSize(): Size {
    const textLength = this._latex.length
    return {
      width: Math.max(50, textLength * 10),
      height: 30,
    }
  }

  protected applyLayout(): void {
    if (this.placeholderElement) {
      this.placeholderElement.width = this._size.width
      this.placeholderElement.height = this._size.height
    }
    if (this.textElement) {
      this.textElement.width = this._size.width
      this.textElement.height = this._size.height
    }
  }

  protected applyPaint(): void {
    if (this.textElement) {
      this.textElement.fill = this._color
      this.textElement.fontSize = this._fontSize
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  getLatex(): string {
    return this._latex
  }

  setLatex(latex: string): void {
    if (this._latex === latex) return
    this._latex = latex
    if (this.textElement) {
      this.textElement.text = latex
    }
    this.invalidateLayout()
  }

  setFontSize(size: number): void {
    if (this._fontSize === size) return
    this._fontSize = size
    this.invalidateLayout()
  }

  setColor(color: string): void {
    if (this._color === color) return
    this._color = color
    this.invalidatePaint()
  }
}

export class PlaceholderTopicNodeView extends NodeView {
  private _text: string = 'Click to add topic'
  private _placeholderColor: string = '#999999'
  private _backgroundColor: string = 'transparent'
  private _borderColor: string = '#cccccc'
  
  private backgroundElement: Rect | null = null
  private textElement: Text | null = null

  constructor(node: MindMapNode) {
    super(node)
  }

  protected initialize(): void {
    this.backgroundElement = new Rect({
      width: this._size.width,
      height: this._size.height,
      fill: this._backgroundColor,
      stroke: this._borderColor,
      strokeWidth: 1,
      strokeDash: [4, 4],
      cornerRadius: 8,
    })
    this.group.add(this.backgroundElement)

    this.textElement = new Text({
      text: this._text,
      fontSize: 14,
      fill: this._placeholderColor,
      textAlign: 'center',
      verticalAlign: 'middle',
      fontStyle: 'italic',
    })
    this.group.add(this.textElement)
  }

  protected calculatePreferredSize(): Size {
    return { width: 150, height: 40 }
  }

  protected applyLayout(): void {
    if (this.backgroundElement) {
      this.backgroundElement.width = this._size.width
      this.backgroundElement.height = this._size.height
    }
    if (this.textElement) {
      this.textElement.width = this._size.width
      this.textElement.height = this._size.height
    }
  }

  protected applyPaint(): void {
    if (this.backgroundElement) {
      this.backgroundElement.fill = this._backgroundColor
      this.backgroundElement.stroke = this._borderColor
    }
    if (this.textElement) {
      this.textElement.fill = this._placeholderColor
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  setText(text: string): void {
    if (this._text === text) return
    this._text = text
    if (this.textElement) {
      this.textElement.text = text
    }
    this.invalidateLayout()
  }

  setPlaceholderColor(color: string): void {
    if (this._placeholderColor === color) return
    this._placeholderColor = color
    this.invalidatePaint()
  }

  setBackgroundColor(color: string): void {
    if (this._backgroundColor === color) return
    this._backgroundColor = color
    this.invalidatePaint()
  }

  setBorderColor(color: string): void {
    if (this._borderColor === color) return
    this._borderColor = color
    this.invalidatePaint()
  }
}

export class SheetNodeView extends NodeView {
  private _backgroundColor: string = '#ffffff'
  private _gridColor: string = '#f0f0f0'
  private _gridSize: number = 20
  private _showGrid: boolean = true
  
  private backgroundElement: Rect | null = null
  private gridGroup: Group | null = null

  constructor(node: MindMapNode) {
    super(node)
  }

  protected initialize(): void {
    this.backgroundElement = new Rect({
      fill: this._backgroundColor,
    })
    this.group.add(this.backgroundElement)

    if (this._showGrid) {
      this.createGrid()
    }
  }

  private createGrid(): void {
    this.gridGroup = new Group()
    this.group.add(this.gridGroup)

    const width = this._size.width || 1000
    const height = this._size.height || 1000

    for (let x = 0; x <= width; x += this._gridSize) {
      const line = new Path({
        path: `M ${x} 0 L ${x} ${height}`,
        stroke: this._gridColor,
        strokeWidth: 0.5,
      })
      this.gridGroup.add(line)
    }

    for (let y = 0; y <= height; y += this._gridSize) {
      const line = new Path({
        path: `M 0 ${y} L ${width} ${y}`,
        stroke: this._gridColor,
        strokeWidth: 0.5,
      })
      this.gridGroup.add(line)
    }
  }

  protected calculatePreferredSize(): Size {
    return { width: 2000, height: 2000 }
  }

  protected applyLayout(): void {
    if (this.backgroundElement) {
      this.backgroundElement.width = this._size.width
      this.backgroundElement.height = this._size.height
    }
    
    if (this._showGrid && this.gridGroup) {
      this.gridGroup.remove()
      this.createGrid()
    }
  }

  protected applyPaint(): void {
    if (this.backgroundElement) {
      this.backgroundElement.fill = this._backgroundColor
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  setBackgroundColor(color: string): void {
    if (this._backgroundColor === color) return
    this._backgroundColor = color
    this.invalidatePaint()
  }

  setGridColor(color: string): void {
    if (this._gridColor === color) return
    this._gridColor = color
    this.invalidateLayout()
  }

  setGridSize(size: number): void {
    if (this._gridSize === size) return
    this._gridSize = size
    this.invalidateLayout()
  }

  setShowGrid(show: boolean): void {
    if (this._showGrid === show) return
    this._showGrid = show
    this.invalidateLayout()
  }
}

export default MathJaxNodeView
