import { Text } from 'leafer-ui'

export interface TextOptions {
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  fill: string
  textAlign: 'left' | 'center' | 'right'
  verticalAlign: 'top' | 'middle' | 'bottom'
}

export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string
): string[] {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return [text]

  ctx.font = `${fontSize}px ${fontFamily}`

  const words = text.split('')
  const lines: string[] = []
  let currentLine = ''

  for (const char of words) {
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

  return lines
}

export function calculateTextSize(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string
): { width: number; height: number } {
  const lines = wrapText(text, maxWidth, fontSize, fontFamily)
  const lineHeight = fontSize * 1.4

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return { width: maxWidth, height: lineHeight * lines.length }

  ctx.font = `${fontSize}px ${fontFamily}`

  let maxLineWidth = 0
  for (const line of lines) {
    const metrics = ctx.measureText(line)
    maxLineWidth = Math.max(maxLineWidth, metrics.width)
  }

  return {
    width: Math.min(maxLineWidth + 20, maxWidth),
    height: lineHeight * lines.length + 16,
  }
}

export function createWrappedText(
  text: string,
  options: TextOptions
): Text {
  const lines = wrapText(text, options.width - 20, options.fontSize, options.fontFamily)
  const lineHeight = options.fontSize * 1.4
  const totalHeight = lineHeight * lines.length

  let startY = options.y + 8
  if (options.verticalAlign === 'middle') {
    startY = options.y + (options.height - totalHeight) / 2
  } else if (options.verticalAlign === 'bottom') {
    startY = options.y + options.height - totalHeight - 8
  }

  return new Text({
    x: options.x + 10,
    y: startY,
    text: lines.join('\n'),
    width: options.width - 20,
    fontSize: options.fontSize,
    fontFamily: options.fontFamily,
    fill: options.fill,
    textAlign: options.textAlign,
  })
}
