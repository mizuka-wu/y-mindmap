import { createExtension } from '@y-mindmap/extension'

export const BoxSelect = createExtension({
  name: 'box-select',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    if (!ctx.view) return

    ctx.view.initBoxSelect()

    return () => {
      ctx.view?.destroyBoxSelect()
    }
  },
})