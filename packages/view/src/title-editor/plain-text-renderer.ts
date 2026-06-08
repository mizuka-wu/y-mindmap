import { Text } from 'leafer-ui'
import { TitleRenderer, TitleStyle, RenderResult, Size } from './types'

export class PlainTextRenderer implements TitleRenderer {
  readonly type = 'plain' as const
  
  private measureCanvas: HTMLCanvasElement | null = null
  private measureCtx: CanvasRenderingContext2D | null = null
  
  render(content: string, bounds: { x: number; y: number; width: number; height: number }, style: TitleStyle): RenderResult {
    const lines = this.wrapText(content, bounds.width - 20, style)
    const lineHeight = style.fontSize * style.lineHeight
    const totalHeight = lines.length * lineHeight
    
    let startY = bounds.y + 8
    if (style.textAlign === 'center') {
      startY = bounds.y + (bounds.height - totalHeight) / 2
    }
    
    const element = new Text({
      x: bounds.x + 10,
      y: startY,
      text: lines.join('\n'),
      width: bounds.width - 20,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight as any,
      fontStyle: style.fontStyle as any,
      fill: style.color,
      textAlign: style.textAlign,
    })
    
    return {
      element,
      size: {
        width: bounds.width,
        height: Math.max(bounds.height, totalHeight + 16),
      },
      truncated: lines.join('\n') !== content,
      truncatedContent: lines.join('\n'),
    }
  }
  
  measure(content: string, maxWidth: number, style: TitleStyle): Size {
    const lines = this.wrapText(content, maxWidth, style)
    const lineHeight = style.fontSize * style.lineHeight
    
    return {
      width: maxWidth,
      height: lines.length * lineHeight,
    }
  }
  
  destroy(): void {
    this.measureCanvas = null
    this.measureCtx = null
  }
  
  private wrapText(text: string, maxWidth: number, style: TitleStyle): string[] {
    const ctx = this.getMeasureContext()
    ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
    
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
      const metrics = ctx.measureText(testLine)
      
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
  
  private getMeasureContext(): CanvasRenderingContext2D {
    if (!this.measureCanvas) {
      this.measureCanvas = document.createElement('canvas')
      this.measureCtx = this.measureCanvas.getContext('2d')!
    }
    return this.measureCtx!
  }
}
