import { createExtension } from '@y-mindmap/extension'
import { ZoomControls as ZoomControlsComponent, type ZoomControlsConfig } from '@y-mindmap/view'

export interface ZoomControlsOptions {
  showPercentage?: boolean
  showFit?: boolean
  minZoom?: number
  maxZoom?: number
  zoomStep?: number
}

export const ZoomControls = createExtension<ZoomControlsOptions>({
  name: "extension-zoom-controls",
  type: 'behavior',

  defaultOptions: {
    showPercentage: true,
    showFit: true,
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return

    const dom = ctx.view.getDom()
    const container = document.createElement('div')
    container.style.cssText = 'position:absolute;bottom:12px;right:12px;z-index:10;'
    dom.appendChild(container)

    const zoomControls = new ZoomControlsComponent(container, {
      getZoom: () => ctx.view!.getZoom(),
      zoomTo: (level: number) => ctx.view!.zoomTo(level),
      zoomIn: () => ctx.view!.zoomIn(),
      zoomOut: () => ctx.view!.zoomOut(),
      fitToContent: () => ctx.view!.fitToContent(),
    }, options as ZoomControlsConfig)

    return () => {
      zoomControls.destroy()
      container.remove()
    }
  },
})
