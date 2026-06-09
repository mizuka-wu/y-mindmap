import { Text } from 'leafer-ui'
import { TitleNodeView, TitleStyle } from './title-node-view'
import type { MindMapNode } from '@y-mindmap/state'
import { Size } from '../../core/node-view'

export class NumberingNodeView extends TitleNodeView {
  private _numberingStyle: string = '1'
  private _numberingLevel: number = 0

  constructor(node: MindMapNode, text: string, level: number = 0) {
    super(node, text)
    this._numberingLevel = level
  }

  protected initialize(): void {
    this.textElement = new Text({
      text: this._text,
      fontSize: this._titleStyle.fontSize,
      fontFamily: this._titleStyle.fontFamily,
      fill: this._titleStyle.textColor,
      textAlign: 'left',
      verticalAlign: 'middle',
    })
    this.group.add(this.textElement)
  }

  setNumberingStyle(style: string): void {
    if (this._numberingStyle === style) return
    this._numberingStyle = style
    this.invalidatePaint()
  }

  getNumberingStyle(): string {
    return this._numberingStyle
  }

  setNumberingLevel(level: number): void {
    if (this._numberingLevel === level) return
    this._numberingLevel = level
    this.invalidatePaint()
  }

  getNumberingLevel(): number {
    return this._numberingLevel
  }

  getFormattedNumber(): string {
    switch (this._numberingStyle) {
      case '1':
        return `${this._numberingLevel + 1}.`
      case 'a':
        return `${String.fromCharCode(97 + this._numberingLevel)}.`
      case 'A':
        return `${String.fromCharCode(65 + this._numberingLevel)}.`
      case 'i':
        return this.toRoman(this._numberingLevel + 1).toLowerCase() + '.'
      case 'I':
        return this.toRoman(this._numberingLevel + 1) + '.'
      default:
        return `${this._numberingLevel + 1}.`
    }
  }

  private toRoman(num: number): string {
    const romanNumerals = [
      [1000, 'M'],
      [900, 'CM'],
      [500, 'D'],
      [400, 'CD'],
      [100, 'C'],
      [90, 'XC'],
      [50, 'L'],
      [40, 'XL'],
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
    ]
    
    let result = ''
    let remaining = num
    
    for (const [value, symbol] of romanNumerals) {
      while (remaining >= value) {
        result += symbol
        remaining -= value
      }
    }
    
    return result
  }
}

export default NumberingNodeView
