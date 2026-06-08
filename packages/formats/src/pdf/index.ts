import { Bounds } from '@y-mindmap/core'
import { ExportOptions } from '../index'

export interface PDFExportOptions extends ExportOptions {
  width?: number
  height?: number
  backgroundColor?: string
  padding?: number
  scale?: number
  orientation?: 'portrait' | 'landscape'
  title?: string
  author?: string
}

export class PDFExporter {
  readonly name = 'pdf'
  readonly extensions = ['.pdf']
  readonly mimeType = 'application/pdf'

  async export(canvas: HTMLCanvasElement, contentBounds: Bounds, options?: PDFExportOptions): Promise<Blob> {
    const { jsPDF } = await import('jspdf')
    
    const padding = options?.padding ?? 40
    const orientation = options?.orientation ?? 'landscape'
    
    const width = options?.width || (contentBounds.width + padding * 2)
    const height = options?.height || (contentBounds.height + padding * 2)
    
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [width, height],
    })

    if (options?.title) {
      pdf.setProperties({ title: options.title })
    }
    if (options?.author) {
      pdf.setProperties({ author: options.author })
    }

    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, width, height)

    return pdf.output('blob')
  }
}
