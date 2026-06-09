import { createExtension } from '@y-mindmap/extension'

export interface ZoomControlsOptions {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  showFitButton?: boolean
  showPercentage?: boolean
}

export const ZoomControls = createExtension<ZoomControlsOptions>({
  name: 'zoom-controls',
  type: 'behavior',

  defaultOptions: {
    position: 'bottom-right',
    showFitButton: true,
    showPercentage: true,
    enabled: true,
  },

  setup(ctx, options) {
    // TODO: ZoomControls 需要额外实现，当前 EditorView 已有 ZoomControls 支持
    // 但通过 options 配置而非扩展方式，后续可通过 view._createZoomControls 对接
    if (!ctx.view) return

    return () => {
      // TODO: 清理 zoom 控件 DOM
    }
  },
})