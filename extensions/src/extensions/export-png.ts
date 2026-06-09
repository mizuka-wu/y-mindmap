import { createExtension } from '@y-mindmap/extension'
import { PNGExporter } from '@y-mindmap/formats/png'

export interface ExportPNGOptions {
  quality?: number
  pixelRatio?: number
}

export const ExportPNG = createExtension<ExportPNGOptions>({
  name: 'export-png',
  type: 'behavior',

  defaultOptions: {
    quality: 1,
    pixelRatio: 2,
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return

    const exporter = new PNGExporter()

    ctx.registerCommand('exportPNG', (state, dispatch, args) => {
      if (!ctx.view) return false
      
      const canvas = ctx.view.getCanvas()
      const contentBounds = ctx.view.getContentBounds()
      const exportOptions = args as { quality?: number; pixelRatio?: number } | undefined
      
      exporter.export(canvas, contentBounds, {
        quality: exportOptions?.quality ?? options.quality,
        scale: exportOptions?.pixelRatio ?? options.pixelRatio,
      }).then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mindmap.png'
        a.click()
        URL.revokeObjectURL(url)
      }).catch((error) => {
        console.error('Failed to export PNG:', error)
      })
      
      return true
    })

    return () => {
      ctx.unregisterCommand('exportPNG')
    }
  },
})
