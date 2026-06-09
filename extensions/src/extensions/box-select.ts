import { createExtension } from '@y-mindmap/extension'

export const BoxSelect = createExtension({
  name: 'box-select',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    if (!ctx.view) return

    const view = ctx.view as any
    if (typeof view.initBoxSelect === 'function') {
      view.initBoxSelect()
    }

    return () => {
      if (typeof view.destroyBoxSelect === 'function') {
        view.destroyBoxSelect()
      }
    }
  },
})