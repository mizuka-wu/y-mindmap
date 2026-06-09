import { createExtension } from '@y-mindmap/extension'
import { JSONImporter, JSONExporter } from '@y-mindmap/formats/json'
import { MindMapDocument } from '@y-mindmap/state'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExportJSONOptions {
  // 当前无需配置选项，预留扩展点
}

export const ExportJSON = createExtension<ExportJSONOptions>({
  name: 'export-json',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    const importer = new JSONImporter()
    const exporter = new JSONExporter()

    ctx.registerCommand('importJSON', (state, dispatch, args) => {
      const { text } = args as { text: string }
      
      importer.import(text).then((node) => {
        const tr = state.tr
        tr.setDoc(MindMapDocument.fromJSON(node.toJSON()))
        dispatch(tr)
      }).catch((error) => {
        console.error('Failed to import JSON:', error)
      })
      
      return true
    })

    ctx.registerCommand('exportJSON', (state, dispatch, args) => {
      const doc = state.doc.root
      const options = args as { spaces?: number } | undefined
      
      exporter.export(doc, options).then((text) => {
        const blob = new Blob([text], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mindmap.json'
        a.click()
        URL.revokeObjectURL(url)
      }).catch((error) => {
        console.error('Failed to export JSON:', error)
      })
      
      return true
    })

    return () => {
      ctx.unregisterCommand('importJSON')
      ctx.unregisterCommand('exportJSON')
    }
  },
})
