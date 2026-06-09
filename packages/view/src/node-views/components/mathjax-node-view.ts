import { Rect, Text, Group } from 'leafer-ui'
import { NodeView, Size } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'
import { styleManager } from '../../core/style-manager'
import { StyleKey } from '@y-mindmap/core'
import { renderFormula } from '../../utils/mathjax-renderer'

export class MathJaxNodeView extends NodeView {
  private _formula: string = ''
  private _width: number = 0
  private _align: 'left' | 'center' | 'right' = 'center'
  private _fontSize: number = 14
  private _color: string = '#333333'
  private _backgroundColor: string = 'transparent'

  private placeholderElement: Rect | null = null
  private htmlElement: Group | null = null
  private textElement: Text | null = null
  private _renderedSize: Size = { width: 0, height: 0 }

  constructor(node: MindMapNode, formula: string) {
    super(node)
    this._formula = formula
  }

  protected initialize(): void {
    this.placeholderElement = new Rect({
      fill: this._backgroundColor,
      stroke: '#e0e0e0',
      strokeWidth: 1,
      cornerRadius: 4,
    })
    this.group.add(this.placeholderElement)

    this.textElement = new Text({
      text: this._formula,
      fontSize: this._fontSize,
      fontFamily: 'Cambria Math, STIX, serif',
      fill: this._color,
      textAlign: this._align,
      verticalAlign: 'middle',
    })
    this.group.add(this.textElement)

    this._refreshInheritedColor()
    this._renderFormula()
  }

  private async _renderFormula(): Promise<void> {
    if (!this._formula) return

    const result = await renderFormula(this._formula, {
      fontSize: this._fontSize,
      color: this._color,
      display: true,
    })

    this._renderedSize = {
      width: result.width,
      height: result.height,
    }

    if (this.textElement) {
      this.textElement.visible = false
    }

    if (this.htmlElement) {
      this.htmlElement.remove()
    }

    this.htmlElement = new Group()
    const htmlText = new Text({
      text: this._formula,
      fontSize: this._fontSize,
      fontFamily: 'KaTeX_Main, Times New Roman, serif',
      fill: this._color,
      textAlign: this._align,
      verticalAlign: 'middle',
      italic: true,
    })
    this.htmlElement.add(htmlText)
    this.group.add(this.htmlElement)

    this.invalidateLayout()
  }

  protected calculatePreferredSize(): Size {
    if (this._renderedSize.width > 0 && this._renderedSize.height > 0) {
      return this._renderedSize
    }

    const textLength = this._formula.length
    const autoWidth = Math.max(50, textLength * 10)

    return {
      width: this._width > 0 ? this._width : autoWidth,
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
      this.textElement.textAlign = this._align
    }
    if (this.htmlElement) {
      const child = this.htmlElement.children?.[0]
      if (child) {
        ;(child as any).width = this._size.width
        ;(child as any).height = this._size.height
      }
    }
  }

  protected applyPaint(): void {
    if (this.textElement) {
      this.textElement.fill = this._color
      this.textElement.fontSize = this._fontSize
      this.textElement.textAlign = this._align
    }
    if (this.placeholderElement) {
      this.placeholderElement.fill = this._backgroundColor
    }
  }

  protected updateStyle(): void {
    this._refreshInheritedColor()
    this.invalidatePaint()
  }

  private _refreshInheritedColor(): void {
    const parent = this.getParent()
    if (!parent) return

    const inheritedColor = styleManager.getStyleValue(parent, StyleKey.TEXT_COLOR)
    if (inheritedColor) {
      this._color = inheritedColor
    }
  }

  getFormula(): string {
    return this._formula
  }

  setFormula(formula: string): void {
    if (this._formula === formula) return
    this._formula = formula
    if (this.textElement) {
      this.textElement.text = formula
      this.textElement.visible = true
    }
    if (this.htmlElement) {
      this.htmlElement.visible = false
    }
    this._renderedSize = { width: 0, height: 0 }
    this.invalidateLayout()
    this._renderFormula()
  }

  setWidth(width: number): void {
    if (this._width === width) return
    this._width = width
    this.invalidateLayout()
  }

  getWidth(): number {
    return this._width
  }

  setAlign(align: 'left' | 'center' | 'right'): void {
    if (this._align === align) return
    this._align = align
    this.invalidatePaint()
  }

  getAlign(): 'left' | 'center' | 'right' {
    return this._align
  }

  setFontSize(size: number): void {
    if (this._fontSize === size) return
    this._fontSize = size
    this.invalidateLayout()
    this._renderFormula()
  }

  getFontSize(): number {
    return this._fontSize
  }

  setColor(color: string): void {
    if (this._color === color) return
    this._color = color
    this.invalidatePaint()
    this._renderFormula()
  }

  getColor(): string {
    return this._color
  }

  setBackgroundColor(color: string): void {
    if (this._backgroundColor === color) return
    this._backgroundColor = color
    this.invalidatePaint()
  }

  refreshInheritedColor(): void {
    this._refreshInheritedColor()
    this.invalidatePaint()
  }
}

export default MathJaxNodeView
