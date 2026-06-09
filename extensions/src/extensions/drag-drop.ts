import { createExtension } from '@y-mindmap/extension'

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
    if (!ctx.view) return

    const view = ctx.view as any
    if (typeof view.initDragDrop === 'function') {
      view.initDragDrop()
    }

    return () => {
      if (typeof view.destroyDragDrop === 'function') {
        view.destroyDragDrop()
      }
    }
  },
})