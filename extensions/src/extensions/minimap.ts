import { createExtension } from '@y-mindmap/extension'

export interface MinimapOptions {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  width?: number
  height?: number
  autoHide?: boolean
}

export const Minimap = createExtension<MinimapOptions>({
  name: 'minimap',
  type: 'behavior',

  defaultOptions: {
    position: 'bottom-right',
    width: 200,
    height: 150,
    autoHide: true,
    enabled: true,
  },

  setup(ctx, options) {
    // TODO: Minimap 需要额外实现，当前 EditorView 已有 Minimap 支持
    // 但通过 options 配置而非扩展方式，后续可通过 view._createMiniMap 对接
    if (!ctx.view) return

    return () => {
      // TODO: 清理 minimap DOM
    }
  },
})