import { Text, Group } from 'leafer-ui'
import { NodeView, Size, Bounds } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'

export interface TitleStyle {
  textColor: string
  fontSize: number
  fontFamily: string
  fontWeight: string
  fontStyle: string
  textDecoration: string
  textAlign: string
  textTransform: string
}

export class TitleNodeView extends NodeView {
  protected textElement: Text | null = null
  protected _text: string = ''
  protected _titleStyle: TitleStyle = {
    textColor: '#333333',
    fontSize: 14,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center',
    textTransform: 'none',
  }

  constructor(node: MindMapNode, text: string) {
    super(node)
    this._text = text
  }

  protected initialize(): void {
    this.textElement = new Text({
      text: this._text,
      fontSize: this._titleStyle.fontSize,
      fontFamily: this._titleStyle.fontFamily,
      fontWeight: this._titleStyle.fontWeight,
      fontStyle: this._titleStyle.fontStyle,
      fill: this._titleStyle.textColor,
      textAlign: this._titleStyle.textAlign as any,
      verticalAlign: 'middle',
    })
    this.group.add(this.textElement)
  }

  protected calculatePreferredSize(): Size {
    if (!this.textElement) return { width: 0, height: 0 }
    
    return {
      width: this.textElement.width || 0,
      height: this.textElement.height || 0,
    }
  }

  protected applyLayout(): void {
    if (!this.textElement) return
    
    this.textElement.width = this._size.width
    this.textElement.height = this._size.height
  }

  protected applyPaint(): void {
    if (!this.textElement) return
    
    this.textElement.fill = this._titleStyle.textColor
    this.textElement.fontSize = this._titleStyle.fontSize
    this.textElement.fontFamily = this._titleStyle.fontFamily
    this.textElement.fontWeight = this._titleStyle.fontWeight
    this.textElement.fontStyle = this._titleStyle.fontStyle
    this.textElement.textDecoration = this._titleStyle.textDecoration as any
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

  getText(): string {
    return this._text
  }

  setTextColor(color: string): void {
    if (this._titleStyle.textColor === color) return
    this._titleStyle.textColor = color
    this.invalidatePaint()
  }

  setFontSize(fontSize: number): void {
    if (this._titleStyle.fontSize === fontSize) return
    this._titleStyle.fontSize = fontSize
    this.invalidateLayout()
  }

  setFontFamily(fontFamily: string): void {
    if (this._titleStyle.fontFamily === fontFamily) return
    this._titleStyle.fontFamily = fontFamily
    this.invalidateLayout()
  }

  setFontWeight(fontWeight: string): void {
    if (this._titleStyle.fontWeight === fontWeight) return
    this._titleStyle.fontWeight = fontWeight
    this.invalidatePaint()
  }

  setFontStyle(fontStyle: string): void {
    if (this._titleStyle.fontStyle === fontStyle) return
    this._titleStyle.fontStyle = fontStyle
    this.invalidatePaint()
  }

  setTextDecoration(textDecoration: string): void {
    if (this._titleStyle.textDecoration === textDecoration) return
    this._titleStyle.textDecoration = textDecoration
    this.invalidatePaint()
  }

  setTextAlign(textAlign: string): void {
    if (this._titleStyle.textAlign === textAlign) return
    this._titleStyle.textAlign = textAlign
    this.invalidatePaint()
  }

  setTextTransform(textTransform: string): void {
    if (this._titleStyle.textTransform === textTransform) return
    this._titleStyle.textTransform = textTransform
    this.invalidatePaint()
  }

  getTitleStyle(): TitleStyle {
    return { ...this._titleStyle }
  }
}

export default TitleNodeView
