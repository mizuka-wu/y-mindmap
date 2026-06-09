import { createExtension } from '../types'

export interface DragDropOptions {
  indicatorColor?: string
  previewOpacity?: number
}

export const DragDrop = createExtension<DragDropOptions>({
  name: 'drag-drop',
  type: 'behavior',

  defaultOptions: {
    indicatorColor: '#2196F3',
    previewOpacity: 0.5,
    enabled: true,
  },

  setup(ctx, options) {
    // TODO: 绑定拖拽事件
    // TODO: 创建拖拽预览和放置指示器

    return () => {
      // TODO: 清理拖拽相关 DOM 和事件监听
    }
  },
})
