import { createExtension } from '@y-mindmap/extension'
import { XMindImporter, XMindExporter } from '@y-mindmap/formats/xmind'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExportXMindOptions {
  // 当前无需配置选项，预留扩展点
}

export const ExportXMind = createExtension<ExportXMindOptions>({
  name: 'export-xmind',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    const importer = new XMindImporter()
    const exporter = new XMindExporter()

    ctx.registerCommand('importXMind', (state, dispatch, args) => {
      const { data } = args as { data: ArrayBuffer }
      
      importer.import(data).then((doc) => {
        const tr = state.tr
        tr.setDoc(doc)
        dispatch(tr)
      }).catch((error) => {
        console.error('Failed to import XMind:', error)
      })
      
      return true
    })

    ctx.registerCommand('exportXMind', (state, dispatch, args) => {
      const doc = state.doc
      
      exporter.export(doc).then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mindmap.xmind'
        a.click()
        URL.revokeObjectURL(url)
      }).catch((error) => {
        console.error('Failed to export XMind:', error)
      })
      
      return true
    })

    return () => {
      ctx.unregisterCommand('importXMind')
      ctx.unregisterCommand('exportXMind')
    }
  },
})
