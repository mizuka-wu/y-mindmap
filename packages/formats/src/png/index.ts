import { Bounds } from '@y-mindmap/core'
import { ExportOptions } from '../index'

export interface PNGExportOptions extends ExportOptions {
  width?: number
  height?: number
  backgroundColor?: string
  padding?: number
  scale?: number
  quality?: number
  watermark?: WatermarkConfig
}

export interface WatermarkConfig {
  type: 'text' | 'image'
  text?: string
  textStyle?: {
    font?: string
    color?: string
    fontSize?: number
  }
  imageUrl?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity?: number
  margin?: number
}

export class PNGExporter {
  readonly name = 'png'
  readonly extensions = ['.png']
  readonly mimeType = 'image/png'

  async export(canvas: HTMLCanvasElement, contentBounds: Bounds, options?: PNGExportOptions): Promise<Blob> {
    const padding = options?.padding ?? 40
    const scale = options?.scale ?? 2
    const quality = options?.quality ?? 1
    const backgroundColor = options?.backgroundColor ?? '#ffffff'
    
    const width = options?.width || (contentBounds.width + padding * 2)
    const height = options?.height || (contentBounds.height + padding * 2)
    
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = width * scale
    exportCanvas.height = height * scale
    
    const ctx = exportCanvas.getContext('2d')!
    ctx.scale(scale, scale)
    
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)
    
    const sourceX = contentBounds.x - padding
    const sourceY = contentBounds.y - padding
    const sourceWidth = contentBounds.width + padding * 2
    const sourceHeight = contentBounds.height + padding * 2
    
    ctx.drawImage(
      canvas,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, sourceWidth, sourceHeight
    )
    
    if (options?.watermark) {
      this.drawWatermark(ctx, width, height, options.watermark)
    }
    
    return new Promise((resolve, reject) => {
      exportCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to export PNG'))
          }
        },
        'image/png',
        quality
      )
    })
  }

  private drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number, config: WatermarkConfig): void {
    ctx.save()
    ctx.globalAlpha = config.opacity || 0.3
    
    if (config.type === 'text' && config.text) {
      const style = config.textStyle || {}
      ctx.font = `${style.fontSize || 14}px ${style.font || 'Arial'}`
      ctx.fillStyle = style.color || '#999999'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const margin = config.margin || 20
      const textWidth = ctx.measureText(config.text).width
      let x = width / 2
      let y = height / 2
      
      if (config.position === 'bottom-right') {
        x = width - textWidth / 2 - margin
        y = height - margin
      } else if (config.position === 'bottom-left') {
        x = textWidth / 2 + margin
        y = height - margin
      } else if (config.position === 'top-right') {
        x = width - textWidth / 2 - margin
        y = margin + (style.fontSize || 14)
      } else if (config.position === 'top-left') {
        x = textWidth / 2 + margin
        y = margin + (style.fontSize || 14)
      }
      
      ctx.fillText(config.text, x, y)
    }
    
    ctx.restore()
  }
}
