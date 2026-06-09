import { createExtension } from '@y-mindmap/extension'

export interface ContextMenuOptions {
  items?: Array<{
    id: string
    label: string
    icon?: string
    shortcut?: string
    action: (nodeId?: string) => void
  }>
}

export const ContextMenu = createExtension<ContextMenuOptions>({
  name: 'context-menu',
  type: 'behavior',

  defaultOptions: {
    items: [],
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return

    ctx.view.initContextMenu()

    return () => {
      ctx.view?.destroyContextMenu()
    }
  },
})