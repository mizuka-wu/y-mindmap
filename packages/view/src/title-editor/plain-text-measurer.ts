import { Size } from '@y-mindmap/core'
import { TitleMeasurer, TitleStyle, MeasureConstraints, MeasureResult } from './measurer'

export class PlainTextMeasurer implements TitleMeasurer {
  readonly type = 'plain' as const
  
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  
  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
  }
  
  measure(text: string, style: TitleStyle, constraints?: MeasureConstraints): MeasureResult {
    const maxWidth = constraints?.maxWidth || 300
    const maxLines = constraints?.maxLines || Infinity
    
    this.ctx.font = this.getFontString(style)
    
    const lines = this.wrapText(text, maxWidth, style)
    const truncatedLines = lines.slice(0, maxLines)
    const truncated = truncatedLines.length < lines.length
    
    let maxLineWidth = 0
    for (const line of truncatedLines) {
      const metrics = this.ctx.measureText(line)
      maxLineWidth = Math.max(maxLineWidth, metrics.width)
    }
    
    const lineHeight = this.getLineHeight(style)
    const height = truncatedLines.length * lineHeight
    
    return {
      width: Math.ceil(maxLineWidth),
      height: Math.ceil(height),
      lineCount: truncatedLines.length,
      lines: truncatedLines,
      truncated,
      actualFontSize: style.fontSize,
    }
  }
  
  getLineHeight(style: TitleStyle): number {
    return style.fontSize * (style.lineHeight || 1.2)
  }
  
  measureWidth(text: string, style: TitleStyle): number {
    this.ctx.font = this.getFontString(style)
    return this.ctx.measureText(text).width
  }
  
  wrapText(text: string, maxWidth: number, style: TitleStyle): string[] {
    this.ctx.font = this.getFontString(style)
    
    const chars = text.split('')
    const lines: string[] = []
    let currentLine = ''
    
    for (const char of chars) {
      if (char === '\n') {
        lines.push(currentLine)
        currentLine = ''
        continue
      }
      
      const testLine = currentLine + char
      const metrics = this.ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine)
    }
    
    return lines.length > 0 ? lines : ['']
  }
  
  destroy(): void {
    this.canvas = null as any
    this.ctx = null as any
  }
  
  private getFontString(style: TitleStyle): string {
    return `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
  }
}
