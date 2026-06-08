import { MindMapNode } from '@y-mindmap/state'
import { Bounds } from '@y-mindmap/core'
import { PNGExporter, PNGExportOptions } from './png-exporter'

export type ExportFormat = 'png'

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  png?: PNGExportOptions
}

export class ExportManager {
  private canvas: HTMLCanvasElement
  private contentBounds: Bounds
  private pngExporter: PNGExporter

  constructor(canvas: HTMLCanvasElement, contentBounds: Bounds) {
    this.canvas = canvas
    this.contentBounds = contentBounds
    this.pngExporter = new PNGExporter()
  }

  async export(options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'png':
        return this.pngExporter.export(this.canvas, this.contentBounds, options.png)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  async exportAsDataURL(options: ExportOptions): Promise<string> {
    switch (options.format) {
      case 'png':
        return this.pngExporter.exportAsDataURL(this.canvas, this.contentBounds, options.png)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  async download(options: ExportOptions): Promise<void> {
    const filename = options.filename || `mindmap.${options.format}`
    
    switch (options.format) {
      case 'png':
        return this.pngExporter.download(this.canvas, this.contentBounds, filename, options.png)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  updateContentBounds(bounds: Bounds): void {
    this.contentBounds = bounds
  }

  getSupportedFormats(): ExportFormat[] {
    return ['png']
  }
}
