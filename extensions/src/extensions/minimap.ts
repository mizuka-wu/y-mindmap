import { createExtension } from '@y-mindmap/extension'
import { Minimap as MinimapComponent, type MinimapConfig } from '@y-mindmap/view'

export interface MinimapOptions {
  width?: number
  height?: number
  backgroundColor?: string
  nodeColor?: string
  selectedNodeColor?: string
  viewportBorderColor?: string
  viewportFillColor?: string
  padding?: number
}

export const Minimap = createExtension<MinimapOptions>({
  name: "extension-minimap",
  type: 'behavior',

  defaultOptions: {
    width: 200,
    height: 150,
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return

    const dom = ctx.view.getDom()
    const container = document.createElement('div')
    container.style.cssText = 'position:absolute;bottom:12px;right:12px;z-index:10;'
    dom.appendChild(container)

    const minimap = new MinimapComponent(container, {
      getDocument: () => ctx.state?.doc.root ?? null,
      getNodeBounds: (nodeId: string) => ctx.view!.getNodeBounds(nodeId),
      getSelectedNodeIds: () => ctx.state?.selection.all ?? [],
      getViewportBounds: () => ctx.view!.getViewportBounds(),
      getZoom: () => ctx.view!.getZoom(),
      panTo: (x: number, y: number) => ctx.view!.panTo(x, y),
      zoomTo: (level: number) => ctx.view!.zoomTo(level),
    }, options as MinimapConfig)

    return () => {
      minimap.destroy()
      container.remove()
    }
  },
})
