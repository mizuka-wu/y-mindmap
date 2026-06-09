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
    // TODO: 创建 zoom 控件 DOM
    // TODO: 绑定 zoom 事件

    return () => {
      // TODO: 清理 zoom 控件 DOM
    }
  },
})