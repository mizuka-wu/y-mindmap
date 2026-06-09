import { createExtension } from '@y-mindmap/extension'
import { SVGExporter } from '@y-mindmap/formats/svg'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExportSVGOptions {
  // 当前无需配置选项，预留扩展点
}

export const ExportSVG = createExtension<ExportSVGOptions>({
  name: 'export-svg',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    const exporter = new SVGExporter()

    ctx.registerCommand('exportSVG', (state, dispatch, args) => {
      const doc = state.doc
      const options = args as { width?: number; height?: number; backgroundColor?: string } | undefined
      
      exporter.export(doc, options).then((svgString) => {
        const blob = new Blob([svgString], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mindmap.svg'
        a.click()
        URL.revokeObjectURL(url)
      }).catch((error) => {
        console.error('Failed to export SVG:', error)
      })
      
      return true
    })

    return () => {
      ctx.unregisterCommand('exportSVG')
    }
  },
})
