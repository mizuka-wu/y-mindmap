import { AttributeTitle, AttributeTitleUnit, AttributeTitleStyle, StyleData } from '@y-mindmap/core'
import { StyleResolver, ResolvedStyle, StyleContext, getStyleResolver } from './style-resolver'

export interface Size {
  width: number
  height: number
}

export interface TextStyle {
  fontFamily?: string
  fontSize?: string | number
  fontWeight?: string | number
  fontStyle?: string
  letterSpacing?: string
  lineHeight?: string | number
}

export interface MeasureOptions {
  maxWidth?: number
  padding?: { top: number; right: number; bottom: number; left: number }
  styleContext?: StyleContext
}

export class MeasureEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private cache: Map<string, Size> = new Map()
  private styleResolver: StyleResolver

  constructor(styleResolver?: StyleResolver) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = 1
    this.canvas.height = 1
    this.ctx = this.canvas.getContext('2d')!
    this.styleResolver = styleResolver || getStyleResolver()
  }

  measureText(text: string, style: TextStyle = {}): Size {
    const cacheKey = this.getCacheKey(text, style)
    const cached = this.cache.get(cacheKey)
    if (cached) return cached

    this.applyStyle(style)

    const metrics = this.ctx.measureText(text)
    const fontSize = this.parseFontSize(style.fontSize)
    const lineHeight = this.parseLineHeight(style.lineHeight, fontSize)

    const size: Size = {
      width: metrics.width,
      height: lineHeight,
    }

    this.cache.set(cacheKey, size)
    return size
  }

  measureAttributeTitle(title: AttributeTitle, options: MeasureOptions = {}): Size {
    if (!title || title.length === 0) {
      return { width: 0, height: 0 }
    }

    const padding = options.padding || { top: 0, right: 0, bottom: 0, left: 0 }
    const context = options.styleContext || {}
    let totalWidth = 0
    let maxHeight = 0
    let currentLineWidth = 0

    for (const unit of title) {
      const resolvedStyle = this.styleResolver.resolveUnit(unit, context)
      const style = this.resolvedToTextStyle(resolvedStyle)
      const lines = unit.text.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!
        
        if (i > 0) {
          totalWidth = Math.max(totalWidth, currentLineWidth)
          currentLineWidth = 0
        }

        if (line) {
          const size = this.measureText(line, style)
          currentLineWidth += size.width
          maxHeight = Math.max(maxHeight, size.height)
        }
      }
    }

    totalWidth = Math.max(totalWidth, currentLineWidth)

    return {
      width: totalWidth + padding.left + padding.right,
      height: maxHeight + padding.top + padding.bottom,
    }
  }

  measureMultilineAttributeTitle(
    title: AttributeTitle,
    maxWidth: number,
    options: MeasureOptions = {}
  ): Size {
    if (!title || title.length === 0) {
      return { width: 0, height: 0 }
    }

    const padding = options.padding || { top: 0, right: 0, bottom: 0, left: 0 }
    const context = options.styleContext || {}
    const effectiveMaxWidth = maxWidth - padding.left - padding.right

    let totalWidth = 0
    let totalHeight = 0
    let currentLineWidth = 0
    let currentLineHeight = 0

    for (const unit of title) {
      const resolvedStyle = this.styleResolver.resolveUnit(unit, context)
      const style = this.resolvedToTextStyle(resolvedStyle)
      const chars = unit.text.split('')

      for (const char of chars) {
        if (char === '\n') {
          totalWidth = Math.max(totalWidth, currentLineWidth)
          totalHeight += currentLineHeight
          currentLineWidth = 0
          currentLineHeight = 0
          continue
        }

        const charSize = this.measureText(char, style)
        
        if (currentLineWidth + charSize.width > effectiveMaxWidth && currentLineWidth > 0) {
          totalWidth = Math.max(totalWidth, currentLineWidth)
          totalHeight += currentLineHeight
          currentLineWidth = 0
          currentLineHeight = 0
        }

        currentLineWidth += charSize.width
        currentLineHeight = Math.max(currentLineHeight, charSize.height)
      }
    }

    if (currentLineWidth > 0) {
      totalWidth = Math.max(totalWidth, currentLineWidth)
      totalHeight += currentLineHeight
    }

    return {
      width: totalWidth + padding.left + padding.right,
      height: totalHeight + padding.top + padding.bottom,
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  private resolvedToTextStyle(resolved: ResolvedStyle): TextStyle {
    return {
      fontFamily: resolved['fo:font-family'],
      fontSize: resolved['fo:font-size'],
      fontWeight: resolved['fo:font-weight'],
      fontStyle: resolved['fo:font-style'],
    }
  }

  private applyStyle(style: TextStyle): void {
    const fontFamily = style.fontFamily || 'Arial'
    const fontSize = this.parseFontSize(style.fontSize)
    const fontWeight = style.fontWeight || 'normal'
    const fontStyle = style.fontStyle || 'normal'

    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
  }

  private parseFontSize(fontSize: string | number | undefined): number {
    if (typeof fontSize === 'number') return fontSize
    if (typeof fontSize === 'string') {
      const parsed = parseInt(fontSize, 10)
      return isNaN(parsed) ? 14 : parsed
    }
    return 14
  }

  private parseLineHeight(lineHeight: string | number | undefined, fontSize: number): number {
    if (typeof lineHeight === 'number') return lineHeight * fontSize
    if (typeof lineHeight === 'string') {
      const parsed = parseFloat(lineHeight)
      return isNaN(parsed) ? fontSize * 1.2 : parsed
    }
    return fontSize * 1.2
  }

  private getCacheKey(text: string, style: TextStyle): string {
    return `${text}|${style.fontFamily}|${style.fontSize}|${style.fontWeight}|${style.fontStyle}`
  }
}

let globalMeasureEngine: MeasureEngine | null = null

export function getMeasureEngine(styleResolver?: StyleResolver): MeasureEngine {
  if (!globalMeasureEngine) {
    globalMeasureEngine = new MeasureEngine(styleResolver)
  }
  return globalMeasureEngine
}
