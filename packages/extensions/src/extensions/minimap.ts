import { createExtension } from '../types'

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
    // TODO: 创建 minimap DOM
    // TODO: 监听 view 变化更新 minimap

    return () => {
      // TODO: 清理 minimap DOM
    }
  },
})
