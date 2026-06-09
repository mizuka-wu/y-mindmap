import { createExtension } from '@y-mindmap/extension'
import { PDFExporter } from '@y-mindmap/formats/pdf'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExportPDFOptions {
  // 当前无需配置选项，预留扩展点
}

export const ExportPDF = createExtension<ExportPDFOptions>({
  name: 'export-pdf',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    if (!ctx.view) return

    const exporter = new PDFExporter()

    ctx.registerCommand('exportPDF', (state, dispatch, args) => {
      if (!ctx.view) return false
      
      const canvas = ctx.view.getCanvas()
      const contentBounds = ctx.view.getContentBounds()
      const options = args as { orientation?: 'portrait' | 'landscape'; title?: string } | undefined
      
      exporter.export(canvas, contentBounds, options).then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mindmap.pdf'
        a.click()
        URL.revokeObjectURL(url)
      }).catch((error) => {
        console.error('Failed to export PDF:', error)
      })
      
      return true
    })

    return () => {
      ctx.unregisterCommand('exportPDF')
    }
  },
})
