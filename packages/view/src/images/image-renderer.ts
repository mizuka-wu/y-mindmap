import { Group, Rect, Text, Image as LeaferImage } from 'leafer-ui'
import { Bounds, Size, ImageData } from '@y-mindmap/core'

export type ImageFit = 'contain' | 'cover' | 'fill' | 'none'

export interface ImageRenderOptions {
  fit?: ImageFit
  align?: 'left' | 'center' | 'right'
  valign?: 'top' | 'center' | 'bottom'
  placeholder?: boolean
  borderRadius?: number
}

const DEFAULT_OPTIONS: ImageRenderOptions = {
  fit: 'contain',
  align: 'center',
  valign: 'center',
  placeholder: true,
  borderRadius: 0,
}

export class ImageRenderer {
  private cache: Map<string, HTMLImageElement> = new Map()
  private loadingSet: Set<string> = new Set()

  async render(
    container: Group,
    imageData: ImageData,
    bounds: Bounds,
    options?: ImageRenderOptions
  ): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options }

    this.renderPlaceholder(container, bounds, opts)

    try {
      const img = await this.loadImage(imageData.src)
      container.clear()

      const imgSize = { width: img.naturalWidth, height: img.naturalHeight }
      const fitSize = this.calcFitSize(imgSize, bounds, opts.fit!)
      const position = this.calcPosition(fitSize, bounds, opts.align!, opts.valign!)

      const imageEl = new LeaferImage({
        url: imageData.src,
        x: position.x,
        y: position.y,
        width: fitSize.width,
        height: fitSize.height,
      })

      container.add(imageEl)
    } catch (error) {
      container.clear()
      this.renderError(container, bounds)
    }
  }

  private async loadImage(src: string): Promise<HTMLImageElement> {
    const cached = this.cache.get(src)
    if (cached) return cached

    if (this.loadingSet.has(src)) {
      return new Promise((resolve, reject) => {
        const check = () => {
          const img = this.cache.get(src)
          if (img) {
            resolve(img)
          } else if (!this.loadingSet.has(src)) {
            reject(new Error('Image loading failed'))
          } else {
            setTimeout(check, 50)
          }
        }
        check()
      })
    }

    this.loadingSet.add(src)

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        this.cache.set(src, img)
        this.loadingSet.delete(src)
        resolve(img)
      }

      img.onerror = () => {
        this.loadingSet.delete(src)
        reject(new Error(`Failed to load image: ${src}`))
      }

      img.src = src
    })
  }

  private calcFitSize(imgSize: Size, bounds: Bounds, fit: ImageFit): Size {
    switch (fit) {
      case 'contain': {
        const ratio = Math.min(
          bounds.width / imgSize.width,
          bounds.height / imgSize.height
        )
        return {
          width: imgSize.width * ratio,
          height: imgSize.height * ratio,
        }
      }

      case 'cover': {
        const ratio = Math.max(
          bounds.width / imgSize.width,
          bounds.height / imgSize.height
        )
        return {
          width: imgSize.width * ratio,
          height: imgSize.height * ratio,
        }
      }

      case 'fill':
        return {
          width: bounds.width,
          height: bounds.height,
        }

      case 'none':
        return imgSize

      default:
        return {
          width: bounds.width,
          height: bounds.height,
        }
    }
  }

  private calcPosition(
    imgSize: Size,
    bounds: Bounds,
    align: string,
    valign: string
  ): { x: number; y: number } {
    let x = bounds.x
    let y = bounds.y

    switch (align) {
      case 'center':
        x = bounds.x + (bounds.width - imgSize.width) / 2
        break
      case 'right':
        x = bounds.x + bounds.width - imgSize.width
        break
    }

    switch (valign) {
      case 'center':
        y = bounds.y + (bounds.height - imgSize.height) / 2
        break
      case 'bottom':
        y = bounds.y + bounds.height - imgSize.height
        break
    }

    return { x, y }
  }

  private renderPlaceholder(container: Group, bounds: Bounds, options: ImageRenderOptions): void {
    if (!options.placeholder) return

    const placeholder = new Rect({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      fill: '#f0f0f0',
      cornerRadius: options.borderRadius || 0,
    })
    container.add(placeholder)

    const icon = new Text({
      text: '🖼',
      x: bounds.x + bounds.width / 2 - 12,
      y: bounds.y + bounds.height / 2 - 12,
      fontSize: 24,
    })
    container.add(icon)
  }

  private renderError(container: Group, bounds: Bounds): void {
    const bg = new Rect({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      fill: '#fff0f0',
      stroke: '#ffcccc',
      strokeWidth: 1,
      cornerRadius: 4,
    })
    container.add(bg)

    const icon = new Text({
      text: '⚠️',
      x: bounds.x + bounds.width / 2 - 10,
      y: bounds.y + bounds.height / 2 - 10,
      fontSize: 20,
    })
    container.add(icon)
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }
}
