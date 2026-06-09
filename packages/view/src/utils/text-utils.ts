import { Text, Group } from 'leafer-ui'

export interface TextOptions {
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  fill: string
  textAlign: string
  verticalAlign: string
}

export function createWrappedText(text: string, options: TextOptions): Text {
  return new Text({
    x: options.x,
    y: options.y,
    width: options.width,
    height: options.height,
    text,
    fontSize: options.fontSize,
    fontFamily: options.fontFamily,
    fill: options.fill,
    textAlign: options.textAlign as any,
    verticalAlign: options.verticalAlign as any,
    wrap: 'break',
  })
}

export function measureText(text: string, fontSize: number, fontFamily: string): { width: number; height: number } {
  const tempText = new Text({
    text,
    fontSize,
    fontFamily,
  })
  
  return {
    width: tempText.width || text.length * fontSize * 0.6,
    height: tempText.height || fontSize * 1.2,
  }
}

export function truncateText(text: string, maxWidth: number, fontSize: number): string {
  const avgCharWidth = fontSize * 0.6
  const maxChars = Math.floor(maxWidth / avgCharWidth)
  
  if (text.length <= maxChars) {
    return text
  }
  
  return text.substring(0, maxChars - 3) + '...'
}

export default {
  createWrappedText,
  measureText,
  truncateText,
}
