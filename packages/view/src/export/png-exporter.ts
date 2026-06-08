import { MindMapNode } from '@y-mindmap/state'
import { Bounds } from '@y-mindmap/core'

export interface WatermarkConfig {
  /** 水印类型 */
  type: 'text' | 'image'
  
  /** 文字水印内容 */
  text?: string
  
  /** 文字样式 */
  textStyle?: {
    font?: string
    color?: string
    fontSize?: number
    fontWeight?: string
  }
  
  /** 图片水印 URL */
  imageUrl?: string
  
  /** 图片水印元素 */
  imageElement?: HTMLImageElement
  
  /** 位置 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom'
  
  /** 自定义位置 (position 为 'custom' 时使用) */
  customPosition?: { x: number; y: number }
  
  /** 边距 */
  margin?: number
  
  /** 透明度 (0-1) */
  opacity?: number
  
  /** 旋转角度 (度) */
  rotation?: number
  
  /** 缩放 */
  scale?: number
}

export interface PNGExportOptions {
  width?: number
  height?: number
  backgroundColor?: string
  padding?: number
  scale?: number
  quality?: number
  includeBackground?: boolean
  watermark?: WatermarkConfig
}

const DEFAULT_OPTIONS: PNGExportOptions = {
  padding: 40,
  scale: 2,
  quality: 1,
  backgroundColor: '#ffffff',
  includeBackground: true,
}

const DEFAULT_WATERMARK: Partial<WatermarkConfig> = {
  position: 'bottom-right',
  margin: 20,
  opacity: 0.3,
  scale: 1,
  textStyle: {
    font: 'Arial',
    color: '#999999',
    fontSize: 14,
    fontWeight: 'normal',
  },
}

export class PNGExporter {
  private imageCache: Map<string, HTMLImageElement> = new Map()
  
  async export(
    canvas: HTMLCanvasElement,
    contentBounds: Bounds,
    options?: PNGExportOptions
  ): Promise<Blob> {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    
    const width = opts.width || (contentBounds.width + opts.padding! * 2)
    const height = opts.height || (contentBounds.height + opts.padding! * 2)
    
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = width * opts.scale!
    exportCanvas.height = height * opts.scale!
    
    const ctx = exportCanvas.getContext('2d')!
    ctx.scale(opts.scale!, opts.scale!)
    
    if (opts.includeBackground) {
      ctx.fillStyle = opts.backgroundColor!
      ctx.fillRect(0, 0, width, height)
    }
    
    const sourceX = contentBounds.x - opts.padding!
    const sourceY = contentBounds.y - opts.padding!
    const sourceWidth = contentBounds.width + opts.padding! * 2
    const sourceHeight = contentBounds.height + opts.padding! * 2
    
    ctx.drawImage(
      canvas,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, sourceWidth, sourceHeight
    )
    
    if (opts.watermark) {
      await this.drawWatermark(ctx, width, height, opts.watermark)
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
        opts.quality
      )
    })
  }
  
  async exportAsDataURL(
    canvas: HTMLCanvasElement,
    contentBounds: Bounds,
    options?: PNGExportOptions
  ): Promise<string> {
    const blob = await this.export(canvas, contentBounds, options)
    return URL.createObjectURL(blob)
  }
  
  async download(
    canvas: HTMLCanvasElement,
    contentBounds: Bounds,
    filename: string,
    options?: PNGExportOptions
  ): Promise<void> {
    const blob = await this.export(canvas, contentBounds, options)
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  }
  
  private async drawWatermark(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    config: WatermarkConfig
  ): Promise<void> {
    const mergedConfig = { ...DEFAULT_WATERMARK, ...config }
    
    ctx.save()
    ctx.globalAlpha = mergedConfig.opacity || 0.3
    
    if (config.type === 'text' && config.text) {
      await this.drawTextWatermark(ctx, canvasWidth, canvasHeight, config)
    } else if (config.type === 'image') {
      await this.drawImageWatermark(ctx, canvasWidth, canvasHeight, config)
    }
    
    ctx.restore()
  }
  
  private async drawTextWatermark(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    config: WatermarkConfig
  ): Promise<void> {
    const style = config.textStyle || {}
    const font = `${style.fontWeight || 'normal'} ${style.fontSize || 14}px ${style.font || 'Arial'}`
    
    ctx.font = font
    ctx.fillStyle = style.color || '#999999'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    if (config.rotation) {
      const centerX = canvasWidth / 2
      const centerY = canvasHeight / 2
      ctx.translate(centerX, centerY)
      ctx.rotate((config.rotation * Math.PI) / 180)
      ctx.translate(-centerX, -centerY)
    }
    
    const position = this.calculatePosition(
      config.position || 'bottom-right',
      canvasWidth,
      canvasHeight,
      config.text?.length || 0 * (style.fontSize || 14) * 0.6,
      style.fontSize || 14,
      config.margin || 20,
      config.customPosition
    )
    
    ctx.fillText(config.text || '', position.x, position.y)
  }
  
  private async drawImageWatermark(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    config: WatermarkConfig
  ): Promise<void> {
    let img = config.imageElement
    
    if (!img && config.imageUrl) {
      img = await this.loadImage(config.imageUrl)
    }
    
    if (!img) return
    
    const scale = config.scale || 1
    const imgWidth = img.width * scale
    const imgHeight = img.height * scale
    
    const position = this.calculatePosition(
      config.position || 'bottom-right',
      canvasWidth,
      canvasHeight,
      imgWidth,
      imgHeight,
      config.margin || 20,
      config.customPosition
    )
    
    ctx.drawImage(img, position.x, position.y, imgWidth, imgHeight)
  }
  
  private calculatePosition(
    position: string,
    canvasWidth: number,
    canvasHeight: number,
    elementWidth: number,
    elementHeight: number,
    margin: number,
    customPosition?: { x: number; y: number }
  ): { x: number; y: number } {
    switch (position) {
      case 'top-left':
        return { x: margin, y: margin }
      case 'top-right':
        return { x: canvasWidth - elementWidth - margin, y: margin }
      case 'bottom-left':
        return { x: margin, y: canvasHeight - elementHeight - margin }
      case 'bottom-right':
        return { x: canvasWidth - elementWidth - margin, y: canvasHeight - elementHeight - margin }
      case 'center':
        return {
          x: (canvasWidth - elementWidth) / 2,
          y: (canvasHeight - elementHeight) / 2,
        }
      case 'custom':
        return customPosition || { x: margin, y: margin }
      default:
        return { x: canvasWidth - elementWidth - margin, y: canvasHeight - elementHeight - margin }
    }
  }
  
  private async loadImage(url: string): Promise<HTMLImageElement> {
    const cached = this.imageCache.get(url)
    if (cached) return cached
    
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        this.imageCache.set(url, img)
        resolve(img)
      }
      
      img.onerror = () => {
        reject(new Error(`Failed to load watermark image: ${url}`))
      }
      
      img.src = url
    })
  }
}
